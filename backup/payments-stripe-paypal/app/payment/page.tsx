'use client'

import { useState } from 'react'
import { Check, Globe, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useGeo } from '@/contexts/geo-context'
import { Badge } from '@/components/ui/badge'
import { paymentTranslationsZh } from '@/lib/i18n/payment-zh'
import { paymentTranslationsEn } from '@/lib/i18n/payment-en'

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [loadingPayPal, setLoadingPayPal] = useState(false)
  const [loadingAlipay, setLoadingAlipay] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'alipay'>('stripe')
  const { location, loading: geoLoading, isChina, isEurope, languageCode } = useGeo()
  const t = languageCode === 'zh' ? paymentTranslationsZh : paymentTranslationsEn

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

  // 定价方案 (Pro / Team) - 月付测试价格
  const pricingPlans = {
    pro: {
      name: t.plans.pro.name,
      monthlyPrice: 0.50, // 测试价格 $0.50/月 (Stripe 最低限制)
      yearlyPrice: 168, // 正式价格 $168/年
      description: t.plans.pro.description,
      features: t.plans.pro.features,
      isPopular: true,
      buttonText: t.buttons.subscribe,
      buttonVariant: 'default' as const
    },
    team: {
      name: languageCode === 'zh' ? 'Team 会员' : 'Team',
      monthlyPrice: 1.00, // 测试价格 $1.00/月
      yearlyPrice: 2520, // 正式价格 $2520/年
      description: languageCode === 'zh' ? '适合团队和组织' : 'For teams and organizations',
      features: languageCode === 'zh' ? [
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
        }),
      })

      const data = await response.json()

      if (data.paymentUrl) {
        // 跳转到支付宝支付页面
        window.location.href = data.paymentUrl
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-slate-600">
            {t.subtitle}
          </p>

          {/* Location Badge */}
          {!geoLoading && location && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm border-slate-400 text-slate-700 bg-white">
                <Globe className="w-3 h-3 mr-1" />
                {location.city ? `${location.city}, ${location.country}` : location.country}
              </Badge>
              <Badge className="text-sm bg-blue-600 text-white">
                {location.currency}
              </Badge>
            </div>
          )}
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center gap-4 mb-12">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setBillingCycle('monthly')}
            className="w-40"
          >
            {t.planSelector.monthly}
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setBillingCycle('yearly')}
            className="w-40 relative"
          >
            {t.planSelector.yearly}
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {t.planSelector.save.replace('{amount}', '30%')}
            </span>
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
          {/* Pro Plan */}
          <Card className={`shadow-lg border-2 ${selectedPlan === 'pro' ? 'border-blue-600 shadow-blue-300 ring-2 ring-blue-200' : 'border-slate-300'} bg-white transition-all hover:shadow-xl relative`}>
            {pricingPlans.pro.isPopular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                {languageCode === 'zh' ? '最受欢迎' : 'Most Popular'}
              </Badge>
            )}
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl mb-2 text-slate-900">{pricingPlans.pro.name}</CardTitle>
              <CardDescription className="text-slate-600 min-h-[48px]">
                {pricingPlans.pro.description}
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-blue-600">
                  ${billingCycle === 'monthly' ? pricingPlans.pro.monthlyPrice : (pricingPlans.pro.yearlyPrice / 12).toFixed(2)}
                </span>
                <span className="text-slate-500">{t.planSelector.perMonth}</span>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600 mt-1">
                    ${pricingPlans.pro.yearlyPrice}{t.planSelector.perYear} ({t.planSelector.billedYearly})
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <ul className="space-y-3">
                {pricingPlans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                variant={pricingPlans.pro.buttonVariant}
                className={`w-full ${selectedPlan === 'pro' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'} hover:bg-blue-700 transition-all`}
                size="lg"
                onClick={() => setSelectedPlan('pro')}
              >
                {pricingPlans.pro.buttonText}
              </Button>
            </CardFooter>
          </Card>

          {/* Team Plan */}
          <Card className={`shadow-lg border-2 ${selectedPlan === 'team' ? 'border-blue-600 shadow-blue-300 ring-2 ring-blue-200' : 'border-slate-300'} bg-white transition-all hover:shadow-xl`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2 text-slate-900">{pricingPlans.team.name}</CardTitle>
              <CardDescription className="text-slate-600 min-h-[48px]">
                {pricingPlans.team.description}
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-slate-900">
                  ${billingCycle === 'monthly' ? pricingPlans.team.monthlyPrice : (pricingPlans.team.yearlyPrice / 12).toFixed(2)}
                </span>
                <span className="text-slate-500">{t.planSelector.perMonth}</span>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600 mt-1">
                    ${pricingPlans.team.yearlyPrice}{t.planSelector.perYear} ({t.planSelector.billedYearly})
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <ul className="space-y-3">
                {pricingPlans.team.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                variant="outline"
                className={`w-full border-2 transition-all ${
                  selectedPlan === 'team'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
                size="lg"
                onClick={() => setSelectedPlan('team')}
              >
                {pricingPlans.team.buttonText}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Selected Plan Checkout */}
        <Card className="mb-8 shadow-xl border-2 border-purple-500 bg-slate-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                {languageCode === 'zh' ? `完成 ${pricingPlans[selectedPlan].name} 购买` : `Complete Your ${pricingPlans[selectedPlan].name} Plan Purchase`}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 max-w-2xl mx-auto">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  {t.email.label}
                </label>
                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={t.email.placeholder}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-400"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
              {/* 支付方式选择标题 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold text-white mb-3">{t.paymentMethod.title}</h3>

                {/* 支付方式选择卡片 */}
                <div className="grid gap-3">
                  {/* 根据地理位置智能排序支付方式 */}
                  {isChina ? (
                    <>
                      {/* 中国用户: 支付宝优先 */}
                      <button
                        onClick={() => setSelectedPaymentMethod('alipay')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'alipay'
                            ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-400'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
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
                          <Badge className="bg-green-500">{languageCode === 'zh' ? '推荐' : 'Recommended'}</Badge>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('stripe')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'stripe'
                            ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-400'
                            : 'border-slate-600 bg-slate-700/50 hover:border-purple-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'stripe' ? 'border-purple-500' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'stripe' && (
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                          <span className="text-white font-medium">Credit Card (Stripe)</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'paypal'
                            ? 'border-blue-400 bg-blue-400/20 ring-2 ring-blue-300'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'paypal' ? 'border-blue-400' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'paypal' && (
                              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            )}
                          </div>
                          <span className="text-white font-medium">PayPal</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* 国际用户: Stripe/PayPal 优先 */}
                      <button
                        onClick={() => setSelectedPaymentMethod('stripe')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'stripe'
                            ? 'border-blue-600 bg-blue-600/20 ring-2 ring-blue-500'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === 'stripe' ? 'border-blue-600' : 'border-slate-500'
                            }`}>
                              {selectedPaymentMethod === 'stripe' && (
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                            <span className="text-white font-medium">Credit Card (Stripe)</span>
                          </div>
                          <Badge className="bg-green-500">{languageCode === 'zh' ? '推荐' : 'Recommended'}</Badge>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'paypal'
                            ? 'border-blue-400 bg-blue-400/20 ring-2 ring-blue-300'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'paypal' ? 'border-blue-400' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'paypal' && (
                              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            )}
                          </div>
                          <span className="text-white font-medium">PayPal</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('alipay')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === 'alipay'
                            ? 'border-blue-300 bg-blue-300/20 ring-2 ring-blue-200'
                            : 'border-slate-600 bg-slate-700/50 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'alipay' ? 'border-blue-300' : 'border-slate-500'
                          }`}>
                            {selectedPaymentMethod === 'alipay' && (
                              <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                            )}
                          </div>
                          <span className="text-white font-medium">支付宝支付 (Alipay)</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 统一的确认支付按钮 */}
              <Button
                onClick={() => {
                  if (selectedPaymentMethod === 'stripe') handleStripeCheckout()
                  else if (selectedPaymentMethod === 'paypal') handlePayPalCheckout()
                  else if (selectedPaymentMethod === 'alipay') handleAlipayCheckout()
                }}
                disabled={loadingAlipay || loadingStripe || loadingPayPal || !userEmail}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
                size="lg"
              >
                {(loadingStripe || loadingPayPal || loadingAlipay) ? t.buttons.subscribing : t.buttons.subscribe}
              </Button>

              <p className="text-xs text-slate-400 text-center mt-2">
                {languageCode === 'zh'
                  ? '继续即表示您同意我们的服务条款和隐私政策。安全支付由 Stripe、PayPal 或支付宝处理。'
                  : 'By continuing, you agree to our Terms of Service and Privacy Policy. Secure payment processed by Stripe, PayPal, or Alipay.'}
              </p>
            </CardFooter>
          </Card>

        {/* FAQ */}
        <div className="text-center text-sm text-slate-400">
          <p>
            {languageCode === 'zh' ? '需要帮助？联系我们：' : 'Need help? Contact us at'}{' '}
            <a href="mailto:mornscience@gmail.com" className="text-purple-400 hover:text-purple-300 hover:underline">
              mornscience@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
