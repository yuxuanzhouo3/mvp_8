import { NextRequest, NextResponse } from 'next/server'
import { Client, Environment, OrdersController } from '@paypal/paypal-server-sdk'
import { createClient } from '@supabase/supabase-js'

// 初始化PayPal客户端
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  environment: process.env.PAYPAL_MODE === 'production'
    ? Environment.Production
    : Environment.Sandbox,
})

const ordersController = new OrdersController(client)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { orderId, planType, userEmail, billingCycle } = await req.json()

    console.log('🟡 PayPal capture request:', { orderId, planType, userEmail, billingCycle })

    if (!orderId || !planType || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, planType, userEmail' },
        { status: 400 }
      )
    }

    // 捕获PayPal支付
    const request = {
      id: orderId,
      body: {},
    }

    console.log('📤 Calling PayPal captureOrder API...')
    const { body: order } = await ordersController.captureOrder(request)
    console.log('📥 PayPal capture response:', { id: order.id, status: order.status })

    // 验证支付状态
    if (order.status !== 'COMPLETED') {
      console.error('❌ PayPal order status not COMPLETED:', order.status)
      return NextResponse.json(
        { error: 'Payment not completed', status: order.status },
        { status: 400 }
      )
    }

    // 计算订阅到期时间（优先使用 billingCycle，兼容旧数据）
    const now = new Date()
    const expireTime = new Date(now)
    const cycle = billingCycle || planType // 兼容旧数据

    if (cycle === 'yearly' || planType === 'yearly') {
      expireTime.setFullYear(expireTime.getFullYear() + 1)
    } else {
      expireTime.setMonth(expireTime.getMonth() + 1)
    }

    console.log('📅 Subscription period:', {
      startTime: now.toISOString(),
      expireTime: expireTime.toISOString(),
      billingCycle: cycle
    })

    // 更新Supabase订阅状态
    const { error } = await supabase.from('subscriptions').upsert({
      user_email: userEmail,
      platform: 'web',
      payment_method: 'paypal',
      plan_type: planType,
      billing_cycle: billingCycle || 'monthly', // 保存计费周期
      status: 'active',
      start_time: now.toISOString(),
      expire_time: expireTime.toISOString(),
      paypal_order_id: orderId,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_email'
    })

    if (error) {
      console.error('Failed to update subscription:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('✅ PayPal subscription activated:', userEmail, planType)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    })
  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
