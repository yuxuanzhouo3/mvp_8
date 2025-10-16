/**
 * Payment Page - English Translations
 */

import type { PaymentTranslations } from './payment-zh'

export const paymentTranslationsEn: PaymentTranslations = {
  // Page title
  title: 'Upgrade to Pro',
  subtitle: 'Unlock all premium features and enhance your browsing experience',

  // Plan selector
  planSelector: {
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save {amount}',
    perMonth: '/month',
    perYear: '/year',
    billedMonthly: 'Billed monthly',
    billedYearly: 'Billed yearly',
  },

  // Pro plan details
  plans: {
    pro: {
      name: 'Pro Plan',
      price: {
        monthly: '¥199',
        yearly: '¥1,888',
        monthlyUSD: '$29',
        yearlyUSD: '$268',
      },
      description: 'Perfect for professionals who need full features',
      features: [
        'Unlimited Favorites',
        'Custom Sites',
        'Cloud Sync',
        'Ad-Free Experience',
        'Priority Support',
        'Advanced Search',
        'Data Export',
        'Team Collaboration (Coming Soon)',
      ],
    },
  },

  // Payment methods
  paymentMethod: {
    title: 'Choose Payment Method',
    stripe: 'Stripe',
    stripeDesc: 'Credit/Debit Card',
    paypal: 'PayPal',
    paypalDesc: 'PayPal Account',
    alipay: 'Alipay',
    alipayDesc: 'Alipay QR Code',
    wechatpay: 'WeChat Pay',
    wechatpayDesc: 'WeChat QR Code',
  },

  // Email input
  email: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    description: 'We\'ll send your order confirmation to this email',
  },

  // Buttons
  buttons: {
    subscribe: 'Subscribe Now',
    subscribing: 'Processing...',
    backToHome: 'Back to Home',
    contactSupport: 'Contact Support',
  },

  // Features description
  features: {
    title: 'Why Go Pro?',
    items: [
      {
        title: 'Unlimited Favorites',
        description: 'Save as many websites as you want to your favorites',
      },
      {
        title: 'Cloud Sync',
        description: 'Sync your data across all devices',
      },
      {
        title: 'Ad-Free',
        description: 'Enjoy a clean, distraction-free browsing experience',
      },
      {
        title: 'Priority Support',
        description: 'Get priority response from our dedicated support team',
      },
    ],
  },

  // FAQ
  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        question: 'Can I cancel anytime?',
        answer: 'Yes, you can cancel your subscription at any time, no questions asked.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Stripe, PayPal, Alipay, and WeChat Pay.',
      },
      {
        question: 'Will it auto-renew?',
        answer: 'Yes, subscriptions auto-renew. You can cancel in account settings.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 7-day money-back guarantee, no questions asked.',
      },
    ],
  },

  // Error messages
  errors: {
    paymentFailed: 'Payment failed, please try again',
    networkError: 'Network error, please check your connection',
    invalidEmail: 'Invalid email address',
    sessionExpired: 'Session expired, please start over',
  },

  // Success messages
  success: {
    title: 'Subscription Successful!',
    message: 'Thank you for upgrading to Pro',
    description: 'You now have access to all premium features',
    nextSteps: 'Order confirmation has been sent to your email',
  },
}
