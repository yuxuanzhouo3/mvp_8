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

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      )
    }

    // 查询Stripe会话状态
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    console.log('🔵 Stripe session check:', {
      sessionId,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      metadata: session.metadata
    })

    // ✅ 如果支付成功且未激活订阅，则激活订阅
    if (session.payment_status === 'paid') {
      const { planType, billingCycle, userEmail } = session.metadata || {}

      if (planType && billingCycle && userEmail) {
        // 检查订阅是否已存在（避免重复激活）
        const { data: existingSub } = await supabase
          .from('web_subscriptions')
          .select('id, stripe_session_id')
          .eq('user_email', userEmail)
          .eq('stripe_session_id', sessionId)
          .maybeSingle()

        if (!existingSub) {
          console.log('🎯 Activating subscription for:', userEmail)

          // 计算订阅到期时间
          const now = new Date()
          const expireTime = new Date(now)
          if (billingCycle === 'yearly') {
            expireTime.setFullYear(expireTime.getFullYear() + 1)
          } else {
            expireTime.setMonth(expireTime.getMonth() + 1)
          }

          console.log('📅 Subscription period:', {
            planType,
            billingCycle,
            startTime: now.toISOString(),
            expireTime: expireTime.toISOString()
          })

          // 获取支付金额
          const amountTotal = session.amount_total || 0
          const amountInCents = amountTotal

          // 激活订阅
          const { data: subscriptionRows, error: subError } = await supabase
            .from('web_subscriptions')
            .upsert({
              user_email: userEmail,
              platform: 'web',
              payment_method: 'stripe',
              plan_type: planType,
              billing_cycle: billingCycle,
              status: 'active',
              start_time: now.toISOString(),
              expire_time: expireTime.toISOString(),
              stripe_session_id: sessionId,
              auto_renew: false,
              next_billing_date: expireTime.toISOString(),
              updated_at: now.toISOString(),
            }, {
              onConflict: 'user_email'
            })
            .select()
            .maybeSingle()

          if (subError) {
            console.error('❌ Failed to activate subscription:', subError)
          } else {
            console.log('✅ Subscription activated successfully')

            // 记录支付交易
            const paymentFee = Math.round(amountInCents * 0.029 + 30) // Stripe 2.9% + $0.30
            const netAmount = amountInCents - paymentFee

            const { error: txError } = await supabase
              .from('web_payment_transactions')
              .insert({
                subscription_id: subscriptionRows?.id ?? null,
                user_email: userEmail,
                product_name: 'sitehub',
                plan_type: planType,
                billing_cycle: billingCycle,
                payment_method: 'stripe',
                payment_status: 'completed',
                transaction_type: 'purchase',
                currency: 'USD',
                gross_amount: amountInCents,
                payment_fee: paymentFee,
                net_amount: netAmount,
                service_cost: 0,
                profit: netAmount,
                stripe_session_id: sessionId,
                stripe_payment_intent_id: (session.payment_intent as string) || null,
                payment_time: now.toISOString(),
                metadata: {
                  planType,
                  billingCycle,
                  paymentIntent: session.payment_intent,
                  checkoutMode: session.mode
                }
              })

            if (txError) {
              console.error('❌ Failed to record transaction:', txError)
            } else {
              console.log('✅ Transaction recorded successfully')
            }
          }
        } else {
          console.log('ℹ️ Subscription already activated for session:', sessionId)
        }
      } else {
        console.warn('⚠️ Missing metadata:', { planType, billingCycle, userEmail })
      }
    }

    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error('Failed to check session:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
