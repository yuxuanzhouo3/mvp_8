"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chrome, Mail, Eye, EyeOff, Loader2, X, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useGeo } from "@/contexts/geo-context"
import { authTranslationsZh } from "@/lib/i18n/auth-zh"
import { authTranslationsEn } from "@/lib/i18n/auth-en"
import { signupWithEmailCN, loginWithEmailCN } from "@/lib/auth-client-cn"
// import { PhoneAuthModal } from "@/components/phone-auth-modal"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuth: (userData: any) => void
  authMode?: "login" | "signup"
  region?: "China" | "Overseas"  // 新增：地区 prop
}

export function AuthModal({ open, onOpenChange, onAuth, authMode = "login", region }: AuthModalProps) {
  const { signIn } = useAuth()
  const { isEurope, languageCode, isChina } = useGeo()
  
  // 确定显示的地区（优先使用传入的 region prop，否则根据 isChina 判断）
  const displayRegion = region || (isChina ? "China" : "Overseas")
  
  // 选择翻译文本
  const t = displayRegion === "China" ? authTranslationsZh : authTranslationsEn

  const [mode, setMode] = useState(authMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wechatLoading, setWechatLoading] = useState(false)  // 微信登录单独的loading状态
  const [appleLoading, setAppleLoading] = useState(false)  // Apple登录单独的loading状态
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBenefits, setShowBenefits] = useState(true)
  // const [showPhoneAuth, setShowPhoneAuth] = useState(false)

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
      setError(prev => prev ? "" : prev)
      setSuccess(prev => prev ? "" : prev)
      setShowPassword(prev => prev ? false : prev)
      setLoading(prev => prev ? false : prev)
      setShowBenefits(prev => !prev ? true : prev)
    }
  }, [open])

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 根据用户地区选择认证服务
      const isChinaRegion = isChina
      
      let result
      
      if (isChinaRegion) {
        // 🇨🇳 国内用户：使用 CloudBase 认证
        if (mode === "signup") {
          result = await signupWithEmailCN(email, password)
          console.log('✅ 国内注册成功:', result)
        } else {
          result = await loginWithEmailCN(email, password)
          console.log('✅ 国内登录成功:', result)
        }
      } else {
        // 🌍 海外用户：使用 Supabase 认证
        if (mode === "signup") {
          const { data, error } = await auth.signUp(email, password)
          if (error) throw error
          result = { success: true, data, message: '注册成功' }
          console.log('✅ 海外注册成功:', result)
        } else {
          const { data, error } = await auth.signIn(email, password)
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
        setError("")
        setLoading(false)  // 重置 loading 状态

        // 关闭模态框
        onOpenChange(false)

        // 刷新页面以更新用户状态
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        // 认证失败：显示错误信息
        const errorMessage = result.message || '认证失败，请重试'
        console.error('❌ 认证失败:', errorMessage)
        setError(errorMessage)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('❌ 认证失败:', error)
      const errorMessage = error?.message || 'Authentication failed. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: string) => {
    if (provider === "google") setLoading(true)
    if (provider === "apple") setAppleLoading(true)
    setError("")

    try {
      if (provider === "google") {
        const { data, error } = await auth.signInWithGoogle()
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        // ✅ 修复：手动重定向到 Google OAuth 页面
        if (data?.url) {
          window.location.href = data.url
        } else {
          setError("Failed to initiate Google OAuth")
          setLoading(false)
        }
      }
      else if (provider === "apple") {
        const { data, error } = await auth.signInWithApple()
        if (error) {
          setError(error.message)
          setAppleLoading(false)
          return
        }
        if (data?.url) {
          window.location.href = data.url
        } else {
          setError("Failed to initiate Apple OAuth")
          setAppleLoading(false)
        }
      }
      else {
        setError(`${provider} authentication is temporarily disabled. Please use Google or email login.`)
        setLoading(false)
        setAppleLoading(false)
        return
      }
    } catch (err) {
      setError(`${provider} authentication failed. Please try again.`)
      setLoading(false)
      setAppleLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login")
    setError("")
    setSuccess("")
    setShowBenefits(true) // Reset benefits when switching modes
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
                {mode === "login" ? t.login.title : t.signup.title}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {mode === "login" ? t.login.subtitle : t.signup.subtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
                    <span>正在跳转...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    <span>微信登录</span>
                    <Badge variant="secondary" className="ml-2 text-xs">推荐</Badge>
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
                    或使用邮箱登录
                  </span>
                </div>
              </div>

              {/* Email Form - 国内次要显示邮箱表单 */}
              <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {mode === "login" ? t.login.emailLabel : t.signup.emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={mode === "login" ? t.login.emailPlaceholder : t.signup.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {mode === "login" ? t.login.passwordLabel : t.signup.passwordLabel}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "login" ? t.login.passwordPlaceholder : t.signup.passwordPlaceholder}
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
            {mode === "login"
              ? (loading ? t.login.submitting : t.login.submitButton)
              : (loading ? t.signup.submitting : t.signup.submitButton)
            }
          </Button>

          {/* Mode Toggle */}
          <div className="text-center text-sm space-y-2">
            <button
              onClick={toggleMode}
              className="text-blue-600 dark:text-blue-400 hover:underline block"
              disabled={loading}
            >
              {mode === "login"
                ? `${t.login.noAccount} ${t.login.signUpLink}`
                : `${t.signup.hasAccount} ${t.signup.loginLink}`
              }
            </button>

            {/* Forgot Password Link - Only show in login mode */}
            {mode === "login" && (
              <button
                onClick={() => window.open('/auth/forgot-password', '_blank')}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs block"
                disabled={loading}
              >
                {t.login.forgotPassword}
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
                {mode === "login" ? t.login.title : t.signup.title}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {mode === "login" ? t.login.subtitle : t.signup.subtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Social Login Buttons - 海外优先显示 Google 和 Apple */}
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="bg-white text-black hover:bg-gray-100 relative border-slate-200"
                  onClick={() => handleSocialAuth("google")}
                  disabled={loading || appleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>{mode === "login" ? t.login.redirecting : t.signup.redirecting}</span>
                    </>
                  ) : (
                    <>
                      <Chrome className="w-4 h-4 mr-2" />
                      <span>{mode === "login" ? t.login.googleButton : t.signup.googleButton}</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="bg-black text-white hover:bg-black/90 relative border-transparent"
                  onClick={() => handleSocialAuth("apple")}
                  disabled={loading || appleLoading}
                >
                  {appleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>{mode === "login" ? t.login.redirecting : t.signup.redirecting}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.08-.46-2.07-.48-3.2 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.1M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                      </svg>
                      <span>{mode === "login" ? t.login.appleButton : t.signup.appleButton}</span>
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
                    {mode === "login" ? t.login.orContinueWith : t.signup.orContinueWith}
                  </span>
                </div>
              </div>

              {/* Email Form - 海外次要显示 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-overseas" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {mode === "login" ? t.login.emailLabel : t.signup.emailLabel}
                  </Label>
                  <Input
                    id="email-overseas"
                    type="email"
                    placeholder={mode === "login" ? t.login.emailPlaceholder : t.signup.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password-overseas" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {mode === "login" ? t.login.passwordLabel : t.signup.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-overseas"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "login" ? t.login.passwordPlaceholder : t.signup.passwordPlaceholder}
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
                {mode === "login"
                  ? (loading ? t.login.submitting : t.login.submitButton)
                  : (loading ? t.signup.submitting : t.signup.submitButton)
                }
              </Button>

              {/* Mode Toggle */}
              <div className="text-center text-sm space-y-2">
                <button
                  onClick={toggleMode}
                  className="text-blue-400 hover:underline block"
                  disabled={loading}
                >
                  {mode === "login"
                    ? `${t.login.noAccount} ${t.login.signUpLink}`
                    : `${t.signup.hasAccount} ${t.signup.loginLink}`
                  }
                </button>

                {/* Forgot Password Link - Only show in login mode */}
                {mode === "login" && (
                  <button
                    onClick={() => window.open('/auth/forgot-password', '_blank')}
                    className="text-slate-400 hover:text-slate-300 text-xs block"
                    disabled={loading}
                  >
                    {t.login.forgotPassword}
                  </button>
                )}
              </div>

              {/* Benefits - Collapsible */}
              {showBenefits ? (
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">What you get:</h4>
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
                      <span>Unlimited custom sites & favorites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>Sync across all your devices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>Organize 300+ sites in one place</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      <span>Never lose your data again</span>
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
                  Show benefits
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