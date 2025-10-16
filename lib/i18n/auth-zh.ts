/**
 * 登录/注册页面 - 中文翻译
 */

export const authTranslationsZh = {
  // 登录表单
  login: {
    title: '欢迎回到 SiteHub',
    subtitle: '登录以访问您的收藏和自定义网站',
    emailLabel: '邮箱',
    emailPlaceholder: '请输入您的邮箱',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    submitButton: '登录',
    submitting: '登录中...',
    noAccount: '还没有账号？',
    signUpLink: '立即注册',
    orContinueWith: '或使用以下方式继续',
    googleButton: '使用 Google 登录',
    redirecting: '正在跳转到 Google...',
  },

  // 注册表单
  signup: {
    title: '加入 SiteHub',
    subtitle: '创建账号，解锁所有功能',
    nameLabel: '姓名',
    namePlaceholder: '请输入您的姓名',
    emailLabel: '邮箱',
    emailPlaceholder: '请输入您的邮箱',
    passwordLabel: '密码',
    passwordPlaceholder: '创建密码（至少6位）',
    confirmPasswordLabel: '确认密码',
    confirmPasswordPlaceholder: '再次输入密码',
    agreeTerms: '我同意服务条款和隐私政策',
    submitButton: '注册',
    submitting: '注册中...',
    hasAccount: '已有账号？',
    loginLink: '立即登录',
    orContinueWith: '或使用以下方式继续',
    googleButton: '使用 Google 注册',
    redirecting: '正在跳转到 Google...',
  },

  // 忘记密码
  forgotPassword: {
    title: '重置密码',
    subtitle: '输入您的邮箱，我们将发送重置链接',
    emailLabel: '邮箱',
    emailPlaceholder: '请输入您的邮箱',
    submitButton: '发送重置链接',
    submitting: '发送中...',
    backToLogin: '返回登录',
    successMessage: '重置链接已发送到您的邮箱',
  },

  // 错误消息
  errors: {
    invalidEmail: '请输入有效的邮箱地址',
    passwordTooShort: '密码至少需要6位',
    passwordMismatch: '两次输入的密码不一致',
    emailRequired: '邮箱不能为空',
    passwordRequired: '密码不能为空',
    nameRequired: '姓名不能为空',
    termsRequired: '请同意服务条款',
    loginFailed: '登录失败，请检查邮箱和密码',
    signupFailed: '注册失败，该邮箱可能已被注册',
    networkError: '网络错误，请稍后重试',
  },

  // 成功消息
  success: {
    loginSuccess: '登录成功！',
    signupSuccess: '注册成功！欢迎加入 SiteHub',
    passwordResetSent: '密码重置邮件已发送',
  },
}

export type AuthTranslations = typeof authTranslationsZh
