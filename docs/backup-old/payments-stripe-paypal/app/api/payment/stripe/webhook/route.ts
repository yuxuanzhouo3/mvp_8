import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  // 处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const { planType, billingCycle, userEmail } = session.metadata || {}

    if (!planType || !billingCycle || !userEmail) {
      console.error('Missing metadata in session:', { planType, billingCycle, userEmail })
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 计算订阅到期时间（使用 billingCycle）
    const now = new Date()
    const expireTime = new Date(now)
    if (billingCycle === 'yearly') {
      expireTime.setFullYear(expireTime.getFullYear() + 1)
    } else {
      expireTime.setMonth(expireTime.getMonth() + 1)
    }

    console.log('📅 Stripe subscription period:', {
      planType,
      billingCycle,
      startTime: now.toISOString(),
      expireTime: expireTime.toISOString()
    })

    // 更新Supabase订阅状态
    const { error } = await supabase.from('subscriptions').upsert({
      user_email: userEmail,
      platform: 'web',
      payment_method: 'stripe',
      plan_type: planType,
      billing_cycle: billingCycle,
      status: 'active',
      start_time: now.toISOString(),
      expire_time: expireTime.toISOString(),
      stripe_session_id: session.id,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_email'
    })

    if (error) {
      console.error('Failed to update subscription:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('✅ Subscription activated:', userEmail, planType)
  }

  return NextResponse.json({ received: true })
}
