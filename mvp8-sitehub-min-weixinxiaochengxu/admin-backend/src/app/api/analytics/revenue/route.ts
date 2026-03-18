// admin-backend/src/app/api/analytics/revenue/route.ts
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'monthly' // daily, weekly, monthly, yearly

    // 构建日期查询条件
    const dateQuery: any = {}
    if (startDate) {
      dateQuery.start_date = db.command.gte(new Date(startDate))
    }
    if (endDate) {
      dateQuery.start_date = db.command.lte(new Date(endDate))
    }

    // 获取订阅数据
    const subscriptions = await db.collection('sitehub_subscriptions')
      .where({
        status: 'active',
        ...dateQuery
      })
      .get()

    // 获取支付数据
    const payments = await db.collection('sitehub_payments')
      .where({
        payment_status: 'success',
        ...dateQuery
      })
      .get()

    // 计算收入统计
    const revenueStats = calculateRevenueStats(subscriptions.data, payments.data, period)

    return NextResponse.json({
      success: true,
      data: revenueStats
    })

  } catch (error) {
    console.error('❌ [API] 获取收入统计失败:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateRevenueStats(subscriptions: any[], payments: any[], period: string) {
  const stats = {
    totalRevenue: 0,
    totalSubscriptions: subscriptions.length,
    revenueByPlan: {} as Record<string, number>,
    revenueByPeriod: {} as Record<string, number>,
    monthlyRevenue: [] as Array<{ month: string; revenue: number; subscriptions: number }>,
    topPlans: [] as Array<{ plan: string; revenue: number; count: number }>
  }

  // 计算总收入
  payments.forEach(payment => {
    stats.totalRevenue += payment.amount
  })

  // 按套餐类型统计
  subscriptions.forEach(sub => {
    const planKey = `${sub.plan_type}_${sub.billing_cycle}`
    stats.revenueByPlan[planKey] = (stats.revenueByPlan[planKey] || 0) + sub.amount
    
    // 按计费周期统计
    stats.revenueByPeriod[sub.billing_cycle] = (stats.revenueByPeriod[sub.billing_cycle] || 0) + sub.amount
  })

  // 生成月度收入数据
  const monthlyData = generateMonthlyData(subscriptions, period)
  stats.monthlyRevenue = monthlyData

  // 生成热门套餐数据
  stats.topPlans = Object.entries(stats.revenueByPlan)
    .map(([plan, revenue]) => ({
      plan,
      revenue,
      count: subscriptions.filter(s => `${s.plan_type}_${s.billing_cycle}` === plan).length
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return stats
}

function generateMonthlyData(subscriptions: any[], period: string) {
  const monthlyMap = new Map<string, { revenue: number; subscriptions: number }>()

  subscriptions.forEach(sub => {
    const date = new Date(sub.created_at)
    let key: string

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0]
        break
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'yearly':
        key = date.getFullYear().toString()
        break
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    const existing = monthlyMap.get(key) || { revenue: 0, subscriptions: 0 }
    monthlyMap.set(key, {
      revenue: existing.revenue + sub.amount,
      subscriptions: existing.subscriptions + 1
    })
  })

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}






