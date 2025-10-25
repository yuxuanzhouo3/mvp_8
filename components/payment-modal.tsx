"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Wallet,
  MessageCircle,
  Chrome,
  Loader2,
  Check,
  Crown,
  Zap,
  Users,
  Shield,
  Star
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: "pro-monthly",
    name: "Pro",
    price: 19.99,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited custom websites",
      "Advanced analytics",
      "Priority support",
      "Custom themes",
      "Export/Import data"
    ]
  },
  {
    id: "pro-yearly",
    name: "Pro",
    price: 3.00,
    currency: "USD",
    interval: "year",
    features: [
      "Everything in Pro Monthly",
      "Save 50%",
      "Early access to features",
      "Exclusive themes"
    ],
    popular: true
  },
  {
    id: "team-monthly",
    name: "Team",
    price: 299.99,
    currency: "USD",
    interval: "month",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced security",
      "Custom integrations",
      "Dedicated support"
    ]
  },
  {
    id: "team-yearly",
    name: "Team",
    price: 5.00,
    currency: "USD",
    interval: "year",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced security",
      "Custom integrations",
      "Dedicated support",
      "Save 58%"
    ]
  }
]

const paymentMethods = [
  {
    id: "stripe",
    name: "Credit Card",
    icon: CreditCard,
    description: "Visa, Mastercard, American Express",
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: Wallet,
    description: "Pay with your PayPal account",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    id: "wechat",
    name: "WeChat Pay",
    icon: MessageCircle,
    description: "Pay with WeChat",
    color: "bg-green-600 hover:bg-green-700"
  },
  {
    id: "alipay",
    name: "Alipay",
    icon: Wallet,
    description: "Pay with Alipay",
    color: "bg-blue-400 hover:bg-blue-500"
  },
  {
    id: "google",
    name: "Google Pay",
    icon: Chrome,
    description: "Pay with Google Pay",
    color: "bg-gray-800 hover:bg-gray-900"
  }
]

export function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string>("pro-yearly")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("stripe")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      // 检查用户是否登录
      if (!user || user.type !== 'authenticated') {
        setError("Please login first to make a payment")
        setLoading(false)
        return
      }

      // 解析套餐信息
      const planParts = selectedPlan.split('-')
      const planType = planParts[0] // 'pro' or 'team'
      const billingCycle = planParts[1] // 'monthly' or 'yearly'

      if (selectedPaymentMethod === 'stripe') {
        // Stripe支付流程
        const response = await fetch('/api/payment/stripe/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planType,
            billingCycle,
            userEmail: user.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session')
        }

        // 重定向到Stripe Checkout
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      } else if (selectedPaymentMethod === 'paypal') {
        // PayPal支付流程
        setError("PayPal payment is under development")
        setLoading(false)
      } else if (selectedPaymentMethod === 'wechat') {
        // 微信支付流程
        setError("WeChat payment is under development")
        setLoading(false)
      } else if (selectedPaymentMethod === 'alipay') {
        // 支付宝支付流程
        setError("Alipay payment is under development")
        setLoading(false)
      } else {
        setError("Unsupported payment method")
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || "Payment failed. Please try again.")
      setLoading(false)
    }
  }

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your plan and payment method to unlock premium features
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plans Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Your Plan</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      {plan.popular && (
                        <Badge className="bg-yellow-500 text-black text-xs">Popular</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${plan.price}
                      </div>
                      <div className="text-sm text-slate-400">
                        per {plan.interval}
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Method</h3>
            
            {/* Payment Methods */}
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <method.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-slate-400">{method.description}</div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Form */}
            {selectedPaymentMethod === "stripe" && (
              <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="font-medium">Credit Card Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="card-number" className="text-sm">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiry" className="text-sm">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-sm">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span>{selectedPlanData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${selectedPlanData?.price} {selectedPlanData?.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">Payment successful! Upgrading your account...</p>
              </div>
            )}

            {/* Pay Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {loading ? "Processing..." : `Pay $${selectedPlanData?.price} ${selectedPlanData?.currency}`}
            </Button>

            {/* Security Notice */}
            <div className="text-center text-xs text-slate-400">
              <Shield className="w-4 h-4 inline mr-1" />
              Your payment is secure and encrypted
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 