/**
 * 支付页面 - 中文翻译
 */

export const paymentTranslationsZh = {
  // 页面标题
  title: '升级到 Pro',
  subtitle: '解锁所有高级功能，提升您的浏览体验',

  // 套餐选择
  planSelector: {
    monthly: '月付',
    yearly: '年付',
    save: '省 {amount}',
    perMonth: '/月',
    perYear: '/年',
    billedMonthly: '按月计费',
    billedYearly: '按年计费',
  },

  // Pro 套餐详情
  plans: {
    pro: {
      name: 'Pro 会员',
      price: {
        monthly: '¥199',
        yearly: '¥1,888',
        monthlyUSD: '$29',
        yearlyUSD: '$268',
      },
      description: '适合需要完整功能的专业用户',
      features: [
        '无限收藏夹',
        '自定义网站',
        '云端同步',
        '无广告体验',
        '优先客服支持',
        '高级搜索功能',
        '数据导出',
        '团队协作（即将推出）',
      ],
    },
  },

  // 支付方式
  paymentMethod: {
    title: '选择支付方式',
    stripe: 'Stripe',
    stripeDesc: '信用卡/借记卡',
    paypal: 'PayPal',
    paypalDesc: 'PayPal 账户支付',
    alipay: '支付宝',
    alipayDesc: '支付宝扫码支付',
    wechatpay: '微信支付',
    wechatpayDesc: '微信扫码支付',
  },

  // 邮箱输入
  email: {
    label: '邮箱地址',
    placeholder: '请输入您的邮箱',
    required: '请输入邮箱地址',
    invalid: '请输入有效的邮箱地址',
    description: '我们会将订单确认发送到此邮箱',
  },

  // 按钮
  buttons: {
    subscribe: '立即订阅',
    subscribing: '处理中...',
    backToHome: '返回首页',
    contactSupport: '联系客服',
  },

  // 功能特性说明
  features: {
    title: '为什么选择 Pro？',
    items: [
      {
        title: '无限收藏',
        description: '保存任意数量的网站到您的收藏夹',
      },
      {
        title: '云端同步',
        description: '在所有设备上同步您的数据',
      },
      {
        title: '无广告',
        description: '享受清爽无干扰的浏览体验',
      },
      {
        title: '优先支持',
        description: '获得专属客服团队的优先响应',
      },
    ],
  },

  // FAQ
  faq: {
    title: '常见问题',
    items: [
      {
        question: '可以随时取消吗？',
        answer: '是的，您可以随时取消订阅，无需任何理由。',
      },
      {
        question: '支持哪些支付方式？',
        answer: '我们支持 Stripe、PayPal、支付宝和微信支付。',
      },
      {
        question: '会自动续费吗？',
        answer: '是的，订阅会自动续费，您可以在账户设置中取消。',
      },
      {
        question: '有退款政策吗？',
        answer: '我们提供 7 天无理由退款保证。',
      },
    ],
  },

  // 错误消息
  errors: {
    paymentFailed: '支付失败，请重试',
    networkError: '网络错误，请检查您的连接',
    invalidEmail: '邮箱地址无效',
    sessionExpired: '会话已过期，请重新开始',
  },

  // 成功消息
  success: {
    title: '订阅成功！',
    message: '感谢您升级到 Pro 会员',
    description: '您现在可以享受所有高级功能',
    nextSteps: '您的订单确认已发送到邮箱',
  },
}

export type PaymentTranslations = typeof paymentTranslationsZh
