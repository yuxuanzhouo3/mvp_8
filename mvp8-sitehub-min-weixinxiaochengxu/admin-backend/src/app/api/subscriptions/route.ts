// admin-backend/src/app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const planType = searchParams.get('planType')
    const search = searchParams.get('search')

    // 构建查询条件
    const where: any = {}
    if (status) where.status = status
    if (planType) where.plan_type = planType

    // 获取订阅列表
    const subscriptions = await db.collection('sitehub_subscriptions')
      .where(where)
      .orderBy('created_at', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()

    // 获取总数
    const total = await db.collection('sitehub_subscriptions')
      .where(where)
      .count()

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions.data,
        pagination: {
          page,
          limit,
          total: total.total,
          totalPages: Math.ceil(total.total / limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ [API] 获取订阅列表失败:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, planType, billingCycle, amount } = body

    // 创建新订阅
    const subscription = await db.collection('sitehub_subscriptions').add({
      data: {
        user_id: userId,
        plan_type: planType,
        billing_cycle: billingCycle,
        status: 'active',
        auto_renew: true,
        amount: amount,
        currency: 'CNY',
        start_date: new Date(),
        current_period_end: calculatePeriodEnd(new Date(), billingCycle),
        cancel_at_period_end: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    // 记录历史
    await db.collection('sitehub_subscription_history').add({
      data: {
        subscription_id: subscription.id,
        user_id: userId,
        action: 'created',
        amount: amount,
        notes: 'Created by admin',
        created_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: subscription
    })

  } catch (error) {
    console.error('❌ [API] 创建订阅失败:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
  const date = new Date(startDate)
  
  if (billingCycle === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  } else if (billingCycle === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  }
  
  return date
}






