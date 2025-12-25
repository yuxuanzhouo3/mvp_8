import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db as cloudbaseDB } from '@/lib/database/cloudbase-client'

/**
 * 查询微信支付订单状态
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const outTradeNo = searchParams.get('outTradeNo')

    if (!outTradeNo) {
      return NextResponse.json({ error: 'Missing outTradeNo' }, { status: 400 })
    }

    // 初始化Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let status = 'pending'

    // 1. 先从腾讯云查询（国内用户主要存储地）
    try {
      const tcbResult = await cloudbaseDB
        .collection('web_payment_transactions')
        .where({ transaction_id: outTradeNo })
        .get()

      if (tcbResult.data && tcbResult.data.length > 0) {
        status = tcbResult.data[0].status
      } else {
        // 2. 如果腾讯云没有，从 Supabase 查询
        const { data: supabaseData } = await supabase
          .from('web_payment_transactions')
          .select('status')
          .eq('transaction_id', outTradeNo)
          .single()

        if (supabaseData) {
          status = supabaseData.status
        }
      }
    } catch (error) {
      console.error('❌ 查询订单状态失败:', error)
    }

    return NextResponse.json({
      success: true,
      status, // 'pending', 'completed', 'failed'
    })
  } catch (error: any) {
    console.error('❌ 查询微信支付状态失败:', error)
    return NextResponse.json(
      { error: '查询失败', message: error.message },
      { status: 500 }
    )
  }
}
