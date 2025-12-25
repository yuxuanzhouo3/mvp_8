'use client'

import { useState } from 'react'
import { Check, Globe, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useGeo } from '@/contexts/geo-context'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { WechatPayQR } from '@/components/wechat-pay-qr'
import { paymentTranslationsZh } from '@/lib/i18n/payment-zh'
import { paymentTranslationsEn } from '@/lib/i18n/payment-en'

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [loadingPayPal, setLoadingPayPal] = useState(false)
  const [loadingAlipay, setLoadingAlipay] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [wechatPayData, setWechatPayData] = useState<{ qrCodeUrl: string, outTradeNo: string, amount: number } | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'alipay' | 'wechat'>('stripe')
  const { location, loading: geoLoading, isChina, isEurope } = useGeo()
  const { language } = useLanguage()
  const { user } = useAuth()
  const t = language === 'zh' ? paymentTranslationsZh : paymentTranslationsEn

  // Europe blocking - GDPR compliance
  if (isEurope) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center border border-white/20">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Service Not Available in Europe
          </h1>
          <p className="text-lg text-white/80 mb-6 leading-relaxed">
            Due to regulatory requirements (GDPR), we are currently unable to offer payment services in European countries.
          </p>
          <p className="text-sm text-white/60 mb-8">
            We apologize for any inconvenience. You can still browse our content as a guest.
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.open('mailto:mornscience@gmail.com?subject=Inquiry from Europe', '_blank')}
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Us
          </Button>
        </div>
      </div>
    )
  }

  // 汇率配置（固定汇率）
  const USD_TO_CNY_RATE = 7.2

  // 定价方案 - 根据IP显示不同货币
  const pricingPlans = isChina ? {
    // 国内价格（人民币）
    pro: {
      name: t.plans.pro.name,
      monthlyPrice: (0.50 * USD_TO_CNY_RATE).toFixed(2), // ¥3.60/月
      yearlyPrice: (168 * USD_TO_CNY_RATE).toFixed(2),   // ¥1209.60/年
      currency: '¥',
      currencyCode: 'CNY',
      description: t.plans.pro.description,
      features: t.plans.pro.features,
      isPopular: true,
      buttonText: t.buttons.subscribe,
      buttonVariant: 'default' as const
    },
    team: {
      name: language === 'zh' ? 'Team 会员' : 'Team',
      monthlyPrice: (1.00 * USD_TO_CNY_RATE).toFixed(2), // ¥7.20/月
      yearlyPrice: (2520 * USD_TO_CNY_RATE).toFixed(2),  // ¥18144/年
      currency: '¥',
      currencyCode: 'CNY',
      description: language === 'zh' ? '适合团队和组织' : 'For teams and organizations',
      features: language === 'zh' ? [
        '包含 Pro 的所有功能',
        '无限团队成员',
        '团队协作工具',
        'API 接口访问',
        '高级数据分析',
        '自定义域名',
        '专属客户经理',
        'SLA 保证',
        '优先功能开发'
      ] : [
        'Everything in Pro',
        'Unlimited team members',
        'Team collaboration tools',
        'API access',
        'Advanced analytics',
        'Custom domain',
        'Dedicated account manager',
        'SLA guarantee',
        'Priority feature development'
      ],
      isPopular: false,
      buttonText: t.buttons.subscribe,
      buttonVariant: 'default' as const
    }
  } : {
    // 海外价格（美元）
    pro: {
      name: t.plans.pro.name,
      monthlyPrice: '19.99', // $19.99/月
      yearlyPrice: '168',   // $168/年
      currency: '$',
      currencyCode: 'USD',
      description: t.plans.pro.description,
      features: t.plans.pro.features,
      isPopular: true,
      buttonText: t.buttons.subscribe,
      buttonVariant: 'default' as const
    },
    team: {
      name: language === 'zh' ? 'Team 会员' : 'Team',
      monthlyPrice: '299.99',  // $299.99/月
      yearlyPrice: '2520',   // $2520/年
      currency: '$',
      currencyCode: 'USD',
      description: language === 'zh' ? '适合团队和组织' : 'For teams and organizations',
      features: language === 'zh' ? [
        '包含 Pro 的所有功能',
        '无限团队成员',
        '团队协作工具',
        'API 接口访问',
        '高级数据分析',
        '自定义域名',
        '专属客户经理',
        'SLA 保证',
        '优先功能开发'
      ] : [
        'Everything in Pro',
        'Unlimited team members',
        'Team collaboration tools',
        'API access',
        'Advanced analytics',
        'Custom domain',
        'Dedicated account manager',
        'SLA guarantee',
        'Priority feature development'
      ],
      isPopular: false,
      buttonText: t.buttons.subscribe,
      buttonVariant: 'default' as const
    }
  }

  const handleStripeCheckout = async () => {
    if (!userEmail) {
      alert(t.email.required)
      return
    }

    setLoadingStripe(true)
    try {
      const response = await fetch('/api/payment/stripe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          billingCycle: billingCycle,
          userEmail,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // 跳转到Stripe支付页面
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'No checkout URL received')
      }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      alert(t.errors.paymentFailed)
    } finally {
      setLoadingStripe(false)
    }
  }

  const handlePayPalCheckout = async () => {
    if (!userEmail) {
      alert(t.email.required)
      return
    }

    setLoadingPayPal(true)
    try {
      const response = await fetch('/api/payment/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          billingCycle: billingCycle,
          userEmail,
        }),
      })

      const data = await response.json()

      if (data.approvalUrl) {
        // 💾 保存支付信息到 localStorage，用于回调时 capture
        localStorage.setItem('paypal_payment_info', JSON.stringify({
          planType: selectedPlan,
          billingCycle: billingCycle,
          userEmail: userEmail,
          orderId: data.orderId,
          timestamp: Date.now()
        }))

        console.log('✅ PayPal payment info saved to localStorage:', {
          planType: selectedPlan,
          userEmail: userEmail,
          orderId: data.orderId
        })

        // 跳转到PayPal支付页面
        window.location.href = data.approvalUrl
      } else {
        throw new Error(data.error || 'No approval URL received')
      }
    } catch (error) {
      console.error('PayPal checkout error:', error)
      alert(t.errors.paymentFailed)
    } finally {
      setLoadingPayPal(false)
    }
  }

  const handleWeChatCheckout = async () => {
    if (!userEmail) {
      alert(t.email.required)
      return
    }

    setLoadingAlipay(true) // 暂时复用loading状态
    try {
      const response = await fetch('/api/payment/wechat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          billingCycle: billingCycle,
          userEmail,
        }),
      })

      const data = await response.json()

      if (data.qrCodeUrl) {
        setWechatPayData({
          qrCodeUrl: data.qrCodeUrl,
          outTradeNo: data.outTradeNo,
          amount: data.amountInCents || (selectedPlan === 'pro' ? (billingCycle === 'monthly' ? 19.99 : 168) : (billingCycle === 'monthly' ? 299.99 : 2520)) * 7.2 * 100
        })
      } else {
        throw new Error(data.error || 'No QR code received')
      }
    } catch (error) {
      console.error('WeChat Pay checkout error:', error)
      alert(t.errors.paymentFailed)
    } finally {
      setLoadingAlipay(false)
    }
  }

  const handleAlipayCheckout = async () => {
    if (!userEmail) {
      alert(t.email.required)
      return
    }

    setLoadingAlipay(true)
    try {
      const response = await fetch('/api/payment/alipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          billingCycle: billingCycle,
          userEmail,
          userId: user.id, // 添加用户ID
        }),
      })

      const data = await response.json()

      if (data.paymentUrl) {
        // 支付宝返回的是HTML表单，需要插入页面并自动提交
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = data.paymentUrl
        tempDiv.style.display = 'none'
        document.body.appendChild(tempDiv)

        // 找到表单并自动提交
        const form = tempDiv.querySelector('form')
        if (form) {
          form.submit()
        } else {
          // 如果找不到表单，直接跳转（兼容其他情况）
          window.location.href = data.paymentUrl
        }
      } else {
        throw new Error(data.error || 'No payment URL received')
      }
    } catch (error) {
      console.error('Alipay checkout error:', error)
      alert(t.errors.paymentFailed)
    } finally {
      setLoadingAlipay(false)
    }
  }

  const cycleButtonClass = (cycle: 'monthly' | 'yearly') =>
    billingCycle === cycle
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600'
      : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50 hover:text-blue-600'

  const planCardClass = (plan: 'pro' | 'team') =>
    `shadow-lg border transition-all duration-200 ${
      selectedPlan === plan
        ? 'border-blue-500 ring-2 ring-blue-200 shadow-blue-200'
        : 'border-slate-200 hover:border-blue-200'
    } bg-white`

  const planButtonClass = (plan: 'pro' | 'team') =>
    selectedPlan === plan
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">
            {t.title}
          </h1>
          <p className="text-base text-slate-600">
            {t.subtitle}
          </p>

          {/* Location Badge */}
          {!geoLoading && location && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs border-slate-400 text-slate-700 bg-white">
                <Globe className="w-3 h-3 mr-1" />
                {location.city ? `${location.city}, ${location.country}` : location.country}
              </Badge>
              <Badge className="text-xs bg-blue-600 text-white">
                {location.currency}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr] items-start">
          <div className="space-y-3">
            {/* Billing Cycle Toggle */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <Button
                variant="outline"
                onClick={() => setBillingCycle('monthly')}
                className={`w-28 h-9 text-sm ${cycleButtonClass('monthly')}`}
              >
                {t.planSelector.monthly}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBillingCycle('yearly')}
                className={`w-28 h-9 text-sm relative ${cycleButtonClass('yearly')}`}
              >
                {t.planSelector.yearly}
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {t.planSelector.save.replace('{amount}', '30%')}
                </span>
              </Button>
            </div>

            {/* Pricing Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Pro Plan */}
              <Card className={`${planCardClass('pro')} relative`}>
                {pricingPlans.pro.isPopular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs">
                    {language === 'zh' ? '最受欢迎' : 'Most Popular'}
                  </Badge>
                )}
                <CardHeader className="text-center pt-6 pb-3">
                  <CardTitle className="text-xl mb-1 text-slate-900">{pricingPlans.pro.name}</CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    {pricingPlans.pro.description}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold text-blue-600">
                      ${billingCycle === 'monthly' ? pricingPlans.pro.monthlyPrice : (Number(pricingPlans.pro.yearlyPrice) / 12).toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-sm">{t.planSelector.perMonth}</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs text-green-600 mt-0.5">
                        ${pricingPlans.pro.yearlyPrice}{t.planSelector.perYear}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="py-3">
                  <ul className="space-y-1.5">
                    {pricingPlans.pro.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-3">
                  <Button
                    variant="default"
                    className={`w-full ${planButtonClass('pro')} transition-all h-9 text-sm`}
                    onClick={() => setSelectedPlan('pro')}
                  >
                    {pricingPlans.pro.buttonText}
                  </Button>
                </CardFooter>
              </Card>

              {/* Team Plan */}
              <Card className={`${planCardClass('team')}`}>
                <CardHeader className="text-center pt-6 pb-3">
                  <CardTitle className="text-xl mb-1 text-slate-900">{pricingPlans.team.name}</CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    {pricingPlans.team.description}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold text-slate-900">
                      ${billingCycle === 'monthly' ? pricingPlans.team.monthlyPrice : (Number(pricingPlans.team.yearlyPrice) / 12).toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-sm">{t.planSelector.perMonth}</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs text-green-600 mt-0.5">
                        ${pricingPlans.team.yearlyPrice}{t.planSelector.perYear}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="py-3">
                  <ul className="space-y-1.5">
                    {pricingPlans.team.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-3">
                  <Button
                    variant="default"
                    className={`w-full ${planButtonClass('team')} transition-all h-9 text-sm`}
                    onClick={() => setSelectedPlan('team')}
                  >
                    {pricingPlans.team.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Selected Plan Checkout */}
          <Card className="shadow-xl border border-purple-400 bg-slate-800 lg:sticky lg:top-4">
            <CardHeader className="text-center py-4">
              <CardTitle className="text-lg text-white">
                {language === 'zh' ? `完成 ${pricingPlans[selectedPlan].name} 购买` : `Complete Your ${pricingPlans[selectedPlan].name} Plan`}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-4 py-2">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                  {t.email.label}
                </label>
                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={t.email.placeholder}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-400"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 px-4 py-3 w-full">
              {/* 支付方式选择标题 */}
              <div className="w-full">
                <h3 className="text-xs font-semibold text-white mb-1.5">{t.paymentMethod.title}</h3>

                {/* 支付方式选择卡片 */}
                <div className="grid gap-1.5">
                  {/* 根据地理位置显示不同支付方式 */}
                  {isChina ? (
                    <>
                      {/* 中国用户: 微信支付 + 支付宝 */}
                      <button
                        onClick={() => setSelectedPaymentMethod('wechat' as any)}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'wechat'
                            ? 'border-green-500 bg-green-500/20 ring-2 ring-green-400'
                            : 'border-slate-600 bg-slate-700/50 hover:border-green-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === 'wechat' ? 'border-green-500' : 'border-slate-500'
                            }`}>
                              {selectedPaymentMethod === 'wechat' && (
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                            <span className="text-white text-sm font-medium">微信支付 (WeChat Pay)</span>
                          </div>
                          <Badge className="bg-green-500 text-xs">{language === 'zh' ? '推荐' : 'Recommended'}</Badge>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('alipay')}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'alipay'
                            ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-400'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'alipay' ? 'border-blue-500' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'alipay' && (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                          <span className="text-white font-medium">支付宝支付 (Alipay)</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* 国际用户: Stripe/PayPal 优先 */}
                      <button
                        onClick={() => setSelectedPaymentMethod('stripe')}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'stripe'
                            ? 'border-blue-600 bg-blue-600/20 ring-2 ring-blue-500'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === 'stripe' ? 'border-blue-600' : 'border-slate-500'
                            }`}>
                              {selectedPaymentMethod === 'stripe' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                            <span className="text-white text-sm font-medium">Credit Card (Stripe)</span>
                          </div>
                          <Badge className="bg-green-500 text-xs">{language === 'zh' ? '推荐' : 'Recommended'}</Badge>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'paypal'
                            ? 'border-blue-400 bg-blue-400/20 ring-2 ring-blue-300'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'paypal' ? 'border-blue-400' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'paypal' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                            )}
                          </div>
                          <span className="text-white text-sm font-medium">PayPal</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('alipay')}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'alipay'
                            ? 'border-blue-300 bg-blue-300/20 ring-2 ring-blue-200'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'alipay' ? 'border-blue-300' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'alipay' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-300"></div>
                            )}
                          </div>
                          <span className="text-white text-sm font-medium">支付宝支付 (Alipay)</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 统一的确认支付按钮 */}
              <Button
                onClick={() => {
                  if (selectedPaymentMethod === 'wechat') handleWeChatCheckout()
                  else if (selectedPaymentMethod === 'stripe') handleStripeCheckout()
                  else if (selectedPaymentMethod === 'paypal') handlePayPalCheckout()
                  else if (selectedPaymentMethod === 'alipay') handleAlipayCheckout()
                }}
                disabled={loadingAlipay || loadingStripe || loadingPayPal || !userEmail}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base py-3"
              >
                {(loadingStripe || loadingPayPal || loadingAlipay) ? t.buttons.subscribing : t.buttons.subscribe}
              </Button>

              <p className="text-xs text-slate-400 text-center mt-1">
                {language === 'zh'
                  ? `继续即表示您同意我们的服务条款和隐私政策。安全支付由 ${isChina ? '微信支付、支付宝' : 'Stripe、PayPal 或支付宝'} 处理。`
                  : `By continuing, you agree to our Terms of Service and Privacy Policy. Secure payment processed by ${isChina ? 'WeChat Pay or Alipay' : 'Stripe, PayPal, or Alipay'}.`}
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ */}
        <div className="text-center text-sm text-slate-400">
          <p>
            {language === 'zh' ? '需要帮助？联系我们：' : 'Need help? Contact us at'}{' '}
            <a href="mailto:mornscience@gmail.com" className="text-purple-400 hover:text-purple-300 hover:underline">
              mornscience@gmail.com
            </a>
          </p>
        </div>
      </div>
      {/* WeChat Pay Modal */}
      {wechatPayData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full">
            <WechatPayQR 
              qrCodeUrl={wechatPayData.qrCodeUrl}
              outTradeNo={wechatPayData.outTradeNo}
              amount={wechatPayData.amount}
              onSuccess={() => {
                setWechatPayData(null)
                window.location.href = '/dashboard?payment=success'
              }}
              onCancel={() => setWechatPayData(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
