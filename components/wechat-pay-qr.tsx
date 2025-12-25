"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WechatPayQRProps {
  qrCodeUrl: string
  outTradeNo: string
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

export function WechatPayQR({ qrCodeUrl, outTradeNo, amount, onSuccess, onCancel }: WechatPayQRProps) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending')
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!polling) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payment/wechat/status?outTradeNo=${outTradeNo}`)
        const data = await response.json()

        if (data.status === 'completed') {
          setStatus('completed')
          setPolling(false)
          setTimeout(onSuccess, 2000)
        } else if (data.status === 'failed') {
          setStatus('failed')
          setPolling(false)
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }

    const interval = setInterval(checkStatus, 3000) // 每3秒查询一次

    // 10分钟后停止轮询
    const timeout = setTimeout(() => {
      setPolling(false)
      if (status === 'pending') setStatus('failed')
    }, 600000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [outTradeNo, polling, status, onSuccess])

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-white rounded-xl text-slate-900">
      <div className="text-center">
        <h3 className="text-lg font-bold">微信支付</h3>
        <p className="text-sm text-slate-500">请使用微信扫码完成支付</p>
      </div>

      <div className="relative p-4 bg-white border-2 border-slate-100 rounded-lg shadow-sm">
        {status === 'pending' ? (
          <QRCodeSVG value={qrCodeUrl} size={200} />
        ) : status === 'completed' ? (
          <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-green-500">
            <CheckCircle2 className="w-16 h-16 mb-2" />
            <span className="font-bold">支付成功</span>
          </div>
        ) : (
          <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-red-500">
            <XCircle className="w-16 h-16 mb-2" />
            <span className="font-bold">支付失败或超时</span>
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          ¥{(amount / 100).toFixed(2)}
        </div>
        <p className="text-xs text-slate-400 mt-1">订单号: {outTradeNo}</p>
      </div>

      {status === 'pending' && (
        <div className="flex items-center text-sm text-slate-500 animate-pulse">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          正在等待支付结果...
        </div>
      )}

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onCancel}
        className="text-slate-400 hover:text-slate-600"
      >
        取消支付
      </Button>
    </div>
  )
}
