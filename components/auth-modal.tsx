"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chrome, Mail, Eye, EyeOff, Loader2, X, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/lib/supabase"
import { useGeo } from "@/contexts/geo-context"
import { useLanguage } from "@/contexts/language-context"
import { authTranslationsZh } from "@/lib/i18n/auth-zh"
import { authTranslationsEn } from "@/lib/i18n/auth-en"
import { signupWithEmailCN, loginWithEmailCN, sendEmailCodeCN, resetPasswordWithEmailCodeCN } from "@/lib/auth-client-cn"
import { signInWithNativeGoogleBridge } from "@/lib/native-google-login"
// import { PhoneAuthModal } from "@/components/phone-auth-modal"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuth: (userData: any) => void
  authMode?: "login" | "signup"
}

type AuthViewMode = "login" | "signup" | "forgot"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function AuthModal({ open, onOpenChange, onAuth, authMode = "login" }: AuthModalProps) {
  const { isEurope } = useGeo()
  const { language } = useLanguage()
  const deploymentRegion = (process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "china").toLowerCase()
  const isChinaDeployment = !["overseas", "intl", "international", "global"].includes(deploymentRegion)
  const isZh = language === "zh"
  
  // 强制按部署环境隔离，避免 CN / INTL UI 混用
  const displayRegion = isChinaDeployment ? "China" : "Overseas"
  
  // 选择翻译文本
  const t = isZh ? authTranslationsZh : authTranslationsEn

  const [mode, setMode] = useState<AuthViewMode>(authMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wechatLoading, setWechatLoading] = useState(false)  // 微信登录单独的loading状态
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBenefits, setShowBenefits] = useState(true)
  const [verificationCode, setVerificationCode] = useState("")
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  // const [showPhoneAuth, setShowPhoneAuth] = useState(false)

  const isLoginMode = mode === "login"
  const isSignupMode = mode === "signup"
  const isForgotMode = mode === "forgot"

  const modeTitle = isForgotMode ? t.forgotPassword.title : (isLoginMode ? t.login.title : t.signup.title)

  const modeSubtitle = isForgotMode
    ? (
      isChinaDeployment
        ? (isZh ? "输入邮箱、验证码和新密码完成重置" : "Enter your email, verification code, and new password to reset.")
        : t.forgotPassword.subtitle
    )
    : (isLoginMode ? t.login.subtitle : t.signup.subtitle)

  const submitButtonLabel = isForgotMode
    ? (
      isChinaDeployment
        ? (isZh ? (loading ? "重置中..." : "重置密码") : (loading ? "Resetting..." : "Reset Password"))
        : (loading ? t.forgotPassword.submitting : t.forgotPassword.submitButton)
    )
    : (
      isLoginMode
        ? (loading ? t.login.submitting : t.login.submitButton)
        : (loading ? t.signup.submitting : t.signup.submitButton)
    )

  // Update mode when authMode prop changes
  useEffect(() => {
    setMode(prev => prev === authMode ? prev : authMode)
  }, [authMode])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // ✅ 只在需要时重置，避免不必要的更新
      setEmail(prev => prev ? "" : prev)
      setPassword(prev => prev ? "" : prev)
      setConfirmPassword(prev => prev ? "" : prev)
      setError(prev => prev ? "" : prev)
      setSuccess(prev => prev ? "" : prev)
      setShowPassword(prev => prev ? false : prev)
      setLoading(prev => prev ? false : prev)
      setShowBenefits(prev => !prev ? true : prev)
      setVerificationCode(prev => prev ? "" : prev)
      setSendingCode(prev => prev ? false : prev)
      setCountdown(prev => prev ? 0 : prev)
    }
  }, [open])

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleSendVerificationCode = async () => {
    if (displayRegion !== "China" || (!isSignupMode && !isForgotMode)) {
      return
    }

    if (sendingCode || countdown > 0) {
      return
    }

    const targetEmail = email.trim()
    if (!targetEmail) {
      setError(isZh ? "请输入邮箱地址" : "Please enter your email address")
      return
    }

    if (!isValidEmail(targetEmail)) {
      setError(isZh ? "请输入有效邮箱地址" : "Please enter a valid email address")
      return
    }

    setError("")
    setSuccess("")
    setSendingCode(true)

    try {
      const result = await sendEmailCodeCN(targetEmail, isForgotMode ? "reset" : "signup")
      if (!result.success) {
        setError(result.error || (isZh ? "发送验证码失败，请稍后重试" : "Failed to send verification code. Please try again."))
        return
      }

      setSuccess(result.message || (isZh ? "验证码已发送，请注意查收" : "Verification code sent. Please check your inbox."))
      setCountdown(60)
    } catch (error: any) {
      setError(error?.message || (isZh ? "发送验证码失败，请稍后重试" : "Failed to send verification code. Please try again."))
    } finally {
      setSendingCode(false)
    }
  }

  const handleEmailAuth = async () => {
    const targetEmail = email.trim()

    if (!targetEmail) {
      setError(isZh ? "请输入邮箱地址" : "Please enter your email address")
      return
    }

    if (!isValidEmail(targetEmail)) {
      setError(isZh ? "请输入有效邮箱地址" : "Please enter a valid email address")
      return
    }

    if (!isForgotMode && !password) {
      setError(isZh ? "请填写完整信息" : "Please fill in all fields")
      return
    }

    if (isSignupMode) {
      if (!confirmPassword) {
        setError(isZh ? "请确认密码" : "Please confirm your password")
        return
      }

      if (password !== confirmPassword) {
        setError(isZh ? "两次输入的密码不一致" : "Passwords do not match")
        return
      }
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // 根据用户地区选择认证服务
      const isChinaRegion = displayRegion === "China"

      if (isForgotMode) {
        if (isChinaRegion) {
          if (!/^\d{6}$/.test(verificationCode.trim())) {
            setError(isZh ? "请输入6位邮箱验证码" : "Please enter the 6-digit verification code")
            return
          }

          if (!password || password.length < 6) {
            setError(isZh ? "密码至少需要6位" : "Password must be at least 6 characters")
            return
          }

          if (password !== confirmPassword) {
            setError(isZh ? "两次输入的密码不一致" : "Passwords do not match")
            return
          }

          const result = await resetPasswordWithEmailCodeCN(targetEmail, verificationCode.trim(), password)
          if (!result.success) {
            setError(result.error || (isZh ? "重置密码失败，请稍后重试" : "Failed to reset password. Please try again."))
            return
          }

          setSuccess(result.message || (isZh ? "密码重置成功，请使用新密码登录" : "Password reset successful. Please sign in with your new password."))
          setMode("login")
          setPassword("")
          setConfirmPassword("")
          setVerificationCode("")
          setCountdown(0)
          return
        }

        const { error } = await auth.resetPassword(targetEmail)
        if (error) {
          setError(error.message)
          return
        }

        setSuccess(t.forgotPassword.successMessage)
        setMode("login")
        setPassword("")
        setConfirmPassword("")
        return
      }

      let result
      if (isChinaRegion) {
        // 🇨🇳 国内用户：使用 CloudBase 认证
        if (isSignupMode) {
          if (!/^\d{6}$/.test(verificationCode.trim())) {
            setError(isZh ? "请输入6位邮箱验证码" : "Please enter the 6-digit verification code")
            return
          }

          result = await signupWithEmailCN(targetEmail, password, verificationCode.trim())
          console.log('✅ 国内注册成功:', result)
        } else {
          result = await loginWithEmailCN(targetEmail, password)
          console.log('✅ 国内登录成功:', result)
        }
      } else {
        // 🌍 海外用户：使用 Supabase 认证
        if (isSignupMode) {
          const { data, error } = await auth.signUp(targetEmail, password)
          if (error) throw error
          result = { success: true, data, message: '注册成功' }
          console.log('✅ 海外注册成功:', result)
        } else {
          const { data, error } = await auth.signIn(targetEmail, password)
          if (error) throw error
          result = { success: true, data, message: '登录成功' }
          console.log('✅ 海外登录成功:', result)
        }
      }

      // ✅ 检查认证结果
      if (result.success) {
        console.log('✅ 认证成功，准备关闭模态框并刷新页面')
        
        // ✅ 保存 JWT Token 和用户信息到 localStorage
        if (typeof window !== 'undefined') {
          if ('token' in result && result.token) {
            localStorage.setItem('user_token', result.token)
            console.log('✅ [Token Saved]: JWT token saved to localStorage')
          }
          
          if ('user' in result && result.user) {
            localStorage.setItem('user_info', JSON.stringify(result.user))
            console.log('✅ [User Info Saved]: User info saved to localStorage')
          }
        }
        
        // Reset form and loading state
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setVerificationCode("")
        setCountdown(0)
        setError("")

        // 关闭模态框
        onOpenChange(false)

        // 刷新页面以更新用户状态
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        // 认证失败：显示错误信息
        const errorMessage = result.message || result.error || '认证失败，请重试'
        console.error('❌ 认证失败:', errorMessage)
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ 认证失败:', error)
      const errorMessage = error?.message || 'Authentication failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: string) => {
    if (provider !== "google") return
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const nativeResult = await signInWithNativeGoogleBridge({ timeoutMs: 60_000 })
      if (nativeResult.success) {
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setVerificationCode("")
        setCountdown(0)
        onOpenChange(false)
        if (typeof window !== "undefined") {
          window.location.reload()
        }
        return
      }

      if (nativeResult.reason === "cancelled") {
        setError(isZh ? "已取消 Google 登录" : "Google login cancelled")
        return
      }

      if (nativeResult.reason === "native_error" || nativeResult.reason === "timeout") {
        setError(
          nativeResult.error ||
            (isZh
              ? "原生 Google 登录失败，请检查 App 配置（包名、google-services.json、web client id）"
              : "Native Google login failed. Please verify app config (package, google-services.json, web client id).")
        )
        return
      }

      const { data, error } = await auth.signInWithGoogle()
      if (error) {
        setError(error.message)
        return
      }

      // ✅ 修复：手动重定向到 Google OAuth 页面
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError("Failed to initiate Google OAuth")
      }
    } catch (err) {
      setError(`${provider} authentication failed. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "signup" ? "login" : "signup")
    setError("")
    setSuccess("")
    setPassword("")
    setConfirmPassword("")
    setVerificationCode("")
    setCountdown(0)
    setShowBenefits(true) // Reset benefits when switching modes
  }

  const enterForgotMode = () => {
    setMode("forgot")
    setError("")
    setSuccess("")
    setPassword("")
    setConfirmPassword("")
    setVerificationCode("")
    setCountdown(0)
  }

  const backToLoginMode = () => {
    setMode("login")
    setError("")
    setSuccess("")
    setPassword("")
    setConfirmPassword("")
    setVerificationCode("")
    setCountdown(0)
  }

  const handleWeChatLogin = async () => {
    setWechatLoading(true)
    setError("")

    try {
      // ✅ 构建完整的 redirectUri（从 window.location.origin 获取实际域名）
      const redirectUri = `${window.location.origin}/api/auth/wechat/callback`

      // 调用后端API获取微信授权URL
      const response = await fetch('/api/auth/wechat/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirectUri
        })
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        // 跳转到微信授权页面
        window.location.href = data.authUrl
      } else {
        setError('微信登录配置错误，请稍后重试')
        setWechatLoading(false)
      }
    } catch (error) {
      console.error('微信登录错误:', error)
      setError('微信登录失败，请稍后重试')
      setWechatLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={`auth-modal-${mode}`}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto shadow-xl transition-colors">
        {isEurope ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Service Not Available in Europe
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-center">
                Due to regulatory requirements (GDPR), we are currently unable to offer authentication services in European countries.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                We apologize for any inconvenience. You can still browse our content as a guest.
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open('mailto:mornscience@gmail.com?subject=Inquiry from Europe', '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </div>
          </>
        ) : displayRegion === "China" ? (
          // === 🇨🇳 国内 UI：优先显示微信登录，然后是邮箱表单 ===
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {modeTitle}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {modeSubtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isForgotMode && (
                <>
                  {/* WeChat Login Button - 国内优先显示 */}
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-12"
                    onClick={handleWeChatLogin}
                    disabled={wechatLoading}
                  >
                    {wechatLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <span>{isZh ? "正在跳转..." : "Redirecting..."}</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        <span>{isZh ? "微信登录" : "WeChat Sign In"}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">{isZh ? "推荐" : "Recommended"}</Badge>
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                        {isZh ? "或使用邮箱登录" : "Or sign in with email"}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Email Form - 国内次要显示邮箱表单 */}
              <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {isSignupMode ? t.signup.emailLabel : t.login.emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={isSignupMode ? t.signup.emailPlaceholder : t.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {isForgotMode ? (isZh ? "新密码" : "New Password") : (isLoginMode ? t.login.passwordLabel : t.signup.passwordLabel)}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isForgotMode ? (isZh ? "至少6位" : "At least 6 characters") : (isLoginMode ? t.login.passwordPlaceholder : t.signup.passwordPlaceholder)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                  )}
                </Button>
              </div>
            </div>

            {(isSignupMode || isForgotMode) && (
              <div>
                <Label htmlFor="verification-code" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {isZh ? "邮箱验证码" : "Email Verification Code"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder={isZh ? "请输入6位验证码" : "Enter 6-digit code"}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    disabled={loading || sendingCode || countdown > 0}
                    className="shrink-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    {sendingCode ? (isZh ? "发送中..." : "Sending...") : countdown > 0 ? `${countdown}s` : (isZh ? "发送验证码" : "Send Code")}
                  </Button>
                </div>
              </div>
            )}

            {(isSignupMode || isForgotMode) && (
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {isSignupMode ? t.signup.confirmPasswordLabel : (isZh ? "确认新密码" : "Confirm New Password")}
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignupMode ? t.signup.confirmPasswordPlaceholder : (isZh ? "再次输入新密码" : "Re-enter new password")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
            )}
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
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {submitButtonLabel}
          </Button>

          {/* Mode Toggle */}
          <div className="text-center text-sm space-y-2">
            {!isForgotMode && (
              <button
                onClick={toggleMode}
                className="text-blue-600 dark:text-blue-400 hover:underline block"
                disabled={loading}
              >
                {isLoginMode
                  ? `${t.login.noAccount} ${t.login.signUpLink}`
                  : `${t.signup.hasAccount} ${t.signup.loginLink}`
                }
              </button>
            )}

            {/* Forgot Password Link - Only show in login mode */}
            {isLoginMode && (
              <button
                onClick={enterForgotMode}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs block"
                disabled={loading}
              >
                {t.login.forgotPassword}
              </button>
            )}

            {isForgotMode && (
              <button
                onClick={backToLoginMode}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs block"
                disabled={loading}
              >
                {t.forgotPassword.backToLogin}
              </button>
            )}
          </div>

          {/* Benefits - Collapsible */}
          {showBenefits ? (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2 relative border border-slate-200 dark:border-transparent">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-slate-700 dark:text-white">您将获得:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBenefits(false)}
                  className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10">✓</Badge>
                  <span>无限制的自定义网站和收藏</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10">✓</Badge>
                  <span>跨设备同步您的数据</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10">✓</Badge>
                  <span>统一管理300+网站</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10">✓</Badge>
                  <span>永不丢失您的数据</span>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBenefits(true)}
              className="text-xs text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            >
              Show benefits
            </Button>
          )}
        </div>
          </>
        ) : (
          // === 🌍 海外 UI：优先显示 Google 登录 ===
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {modeTitle}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {modeSubtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isForgotMode && (
                <>
                  {/* Social Login Buttons - 海外显示 Google */}
                  <div className="grid gap-3">
                    <Button
                      variant="outline"
                      className="bg-white text-black hover:bg-gray-100 relative border-slate-200"
                      onClick={() => handleSocialAuth("google")}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>{isLoginMode ? t.login.redirecting : t.signup.redirecting}</span>
                        </>
                      ) : (
                        <>
                          <Chrome className="w-4 h-4 mr-2" />
                          <span>{isLoginMode ? t.login.googleButton : t.signup.googleButton}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                        {isLoginMode ? t.login.orContinueWith : t.signup.orContinueWith}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Email Form - 海外次要显示 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-overseas" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {isSignupMode ? t.signup.emailLabel : t.login.emailLabel}
                  </Label>
                  <Input
                    id="email-overseas"
                    type="email"
                    placeholder={isSignupMode ? t.signup.emailPlaceholder : t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                    disabled={loading}
                  />
                </div>

                {!isForgotMode && (
                  <div>
                    <Label htmlFor="password-overseas" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {isLoginMode ? t.login.passwordLabel : t.signup.passwordLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-overseas"
                        type={showPassword ? "text" : "password"}
                        placeholder={isLoginMode ? t.login.passwordPlaceholder : t.signup.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 pr-10"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {isSignupMode && (
                  <div>
                    <Label htmlFor="confirm-password-overseas" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {t.signup.confirmPasswordLabel}
                    </Label>
                    <Input
                      id="confirm-password-overseas"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.signup.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                      disabled={loading}
                    />
                  </div>
                )}
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
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {submitButtonLabel}
              </Button>

              {/* Mode Toggle */}
              <div className="text-center text-sm space-y-2">
                {!isForgotMode && (
                  <button
                    onClick={toggleMode}
                    className="text-blue-400 hover:underline block"
                    disabled={loading}
                  >
                    {isLoginMode
                      ? `${t.login.noAccount} ${t.login.signUpLink}`
                      : `${t.signup.hasAccount} ${t.signup.loginLink}`
                    }
                  </button>
                )}

                {/* Forgot Password Link - Only show in login mode */}
                {isLoginMode && (
                  <button
                    onClick={enterForgotMode}
                    className="text-slate-400 hover:text-slate-300 text-xs block"
                    disabled={loading}
                  >
                    {t.login.forgotPassword}
                  </button>
                )}

                {isForgotMode && (
                  <button
                    onClick={backToLoginMode}
                    className="text-slate-400 hover:text-slate-300 text-xs block"
                    disabled={loading}
                  >
                    {t.forgotPassword.backToLogin}
                  </button>
                )}
              </div>

              {/* Benefits - Collapsible */}
              {showBenefits ? (
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{isZh ? "您将获得:" : "What you get:"}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBenefits(false)}
                      className="h-6 w-6 p-0 hover:bg-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>{isZh ? "无限制的自定义网站和收藏" : "Unlimited custom sites & favorites"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>{isZh ? "跨设备同步您的数据" : "Sync across all your devices"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>{isZh ? "统一管理300+网站" : "Organize 300+ sites in one place"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>{isZh ? "永不丢失您的数据" : "Never lose your data again"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBenefits(true)}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  {isZh ? "显示权益" : "Show benefits"}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
      
      {/* Phone Auth Modal */}
      {/* <PhoneAuthModal
        open={showPhoneAuth}
        onOpenChange={setShowPhoneAuth}
        onAuth={onAuth}
      /> */}
    </Dialog>
  )
} 
