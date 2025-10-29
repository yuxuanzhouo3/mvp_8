'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const paypalToken = searchParams.get('token') // PayPal 返回的 order ID
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (sessionId) {
      // ===== Stripe 支付验证 =====
      console.log('🔵 Stripe payment verification...')
      fetch(`/api/payment/stripe/check?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'paid') {
            console.log('✅ Stripe payment verified')
            setSuccess(true)
          } else {
            console.error('❌ Stripe payment not completed:', data)
            setErrorMessage('Payment verification failed')
          }
        })
        .catch((error) => {
          console.error('❌ Stripe verification error:', error)
          setErrorMessage('Payment verification error')
        })
        .finally(() => {
          setVerifying(false)
        })
    } else if (paypalToken) {
      // ===== PayPal 支付捕获 =====
      console.log('🟡 PayPal payment capture...')

      // 从 localStorage 获取支付信息
      const paymentInfoStr = localStorage.getItem('paypal_payment_info')
      if (!paymentInfoStr) {
        console.error('❌ No payment info found in localStorage')
        setErrorMessage('Payment info not found. Please contact support.')
        setVerifying(false)
        return
      }

      const paymentInfo = JSON.parse(paymentInfoStr)
      console.log('📦 Retrieved payment info:', paymentInfo)

      // 验证 orderId 是否匹配
      if (paymentInfo.orderId !== paypalToken) {
        console.warn('⚠️ Order ID mismatch:', {
          stored: paymentInfo.orderId,
          returned: paypalToken
        })
      }

      // 调用 capture API 完成支付
      fetch('/api/payment/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: paypalToken,
          planType: paymentInfo.planType,
          billingCycle: paymentInfo.billingCycle,
          userEmail: paymentInfo.userEmail
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.status === 'COMPLETED') {
            console.log('✅ PayPal payment captured successfully:', data)
            setSuccess(true)
            // 清除 localStorage
            localStorage.removeItem('paypal_payment_info')
          } else {
            console.error('❌ PayPal capture failed:', data)
            setErrorMessage(data.error || 'Payment capture failed')
          }
        })
        .catch((error) => {
          console.error('❌ PayPal capture error:', error)
          setErrorMessage('Payment capture error. Please contact support.')
        })
        .finally(() => {
          setVerifying(false)
        })
    } else {
      // 没有 session_id 也没有 token，可能是用户直接访问
      console.warn('⚠️ No payment parameters found')
      setSuccess(true)
      setVerifying(false)
    }
  }, [sessionId, paypalToken])

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Payment...</CardTitle>
            <CardDescription>Please wait while we confirm your payment</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 显示错误信息
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-2 border-red-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-red-700">Payment Error</CardTitle>
            <CardDescription className="text-lg text-red-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                What should I do?
              </p>
              <p className="text-red-700 text-sm">
                Please contact our support team at{' '}
                <a href="mailto:support@mornhub.help" className="underline">
                  support@mornhub.help
                </a>
                {' '}with your payment details.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link href="/payment">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full" size="lg">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Welcome to SiteHub Pro
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-2">
              ✅ Your subscription is now active
            </p>
            <p className="text-green-700 text-sm">
              You now have access to all premium features. Enjoy your enhanced browsing experience!
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-900">What's next?</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Access unlimited websites without ads</li>
              <li>• Sync your favorites across devices</li>
              <li>• Use advanced search filters</li>
              <li>• Get priority customer support</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link href="/">
              <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full" size="lg">
                Manage Subscription
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            A confirmation email has been sent to your inbox.
            <br />
            If you have any questions, contact{' '}
            <a href="mailto:support@mornhub.help" className="text-purple-600 hover:underline">
              support@mornhub.help
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
