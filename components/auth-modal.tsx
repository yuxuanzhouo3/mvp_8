"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chrome, Mail, Eye, EyeOff, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useGeo } from "@/contexts/geo-context"
import { authTranslationsZh } from "@/lib/i18n/auth-zh"
import { authTranslationsEn } from "@/lib/i18n/auth-en"
// import { PhoneAuthModal } from "@/components/phone-auth-modal"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuth: (userData: any) => void
  authMode?: "login" | "signup"
}

export function AuthModal({ open, onOpenChange, onAuth, authMode = "login" }: AuthModalProps) {
  const { signIn } = useAuth()
  const { isEurope, isChina, languageCode } = useGeo()
  const t = languageCode === 'zh' ? authTranslationsZh : authTranslationsEn

  const [mode, setMode] = useState(authMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBenefits, setShowBenefits] = useState(true)
  // const [showPhoneAuth, setShowPhoneAuth] = useState(false)

  // 欧洲地区检测 - 显示屏蔽消息
  if (isEurope) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Service Not Available in Europe
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              Due to regulatory requirements (GDPR), we are currently unable to offer authentication services in European countries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-300 text-center">
              We apologize for any inconvenience. You can still browse our content as a guest.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.open('mailto:mornscience@gmail.com?subject=Inquiry from Europe', '_blank')}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Us
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Update mode when authMode prop changes
  useEffect(() => {
    setMode(authMode)
  }, [authMode])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setEmail("")
      setPassword("")
      setError("")
      setSuccess("")
      setShowPassword(false)
      setLoading(false)
      setShowBenefits(true)
    }
  }, [open])

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError(languageCode === 'zh' ? "请填写完整信息" : "Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError(languageCode === 'zh' ? "密码至少6位" : "Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 调用双认证API（自动根据IP选择数据库）
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          mode: mode // 'login' or 'signup'
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || (languageCode === 'zh' ? '认证失败' : 'Authentication failed'))
        return
      }

      // 认证成功
      const dbInfo = result.database === 'cloudbase' ? '腾讯云' : 'Supabase'
      console.log(`✅ 登录成功 [${dbInfo}数据库]`, result.user)

      if (mode === "signup" && result.user && !result.user.emailConfirmed) {
        // 注册成功但需要邮箱验证（仅Supabase）
        if (result.database === 'supabase') {
          setSuccess(languageCode === 'zh'
            ? "注册成功！请检查邮箱确认账户。"
            : "Account created! Please check your email to confirm your account.")
          return
        }
      }

      if (result.user) {
        const userData = {
          type: "authenticated" as const,
          name: result.user.name || email.split("@")[0],
          email: result.user.email || email,
          customCount: 0,
          pro: result.user.pro || false,
          id: result.user.id,
          database: result.database, // 记录用户使用的数据库
          region: result.region // 记录用户地区
        }

        signIn(userData)
        onAuth(userData)

        // 显示成功消息
        const regionText = result.region === 'china' ? '国内' : '海外'
        console.log(`🎉 ${mode === 'login' ? '登录' : '注册'}成功 [${regionText}用户]`)

        onOpenChange(false)
      }

      // Reset form
      setEmail("")
      setPassword("")
      setError("")
    } catch (err: any) {
      console.error('邮箱认证错误:', err)
      setError(languageCode === 'zh'
        ? '登录失败，请稍后再试'
        : 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: string) => {
    setLoading(true)
    setError("")

    try {
      if (provider === "google") {
        const { data, error } = await auth.signInWithGoogle()
        if (error) {
          if (error.message.includes('Supabase not configured')) {
            setError(languageCode === 'zh' 
              ? '登录功能正在配置中，请稍后再试' 
              : 'Login feature is being configured, please try again later')
          } else {
            setError(error.message)
          }
          setLoading(false)
          return
        }
        // OAuth redirects to callback, keep loading state
        // Don't close modal or reset loading - user will be redirected
      }
      else if (provider === "wechat") {
        // 微信登录功能开发中
        setError(languageCode === 'zh' 
          ? '微信登录功能正在开发中，请使用邮箱登录' 
          : 'WeChat login is under development, please use email login')
        setLoading(false)
        return
      }
      else {
        setError(`${provider} authentication is temporarily disabled. Please use ${isChina ? 'WeChat' : 'Google'} or email login.`)
        setLoading(false)
        return
      }
    } catch (err) {
      setError(languageCode === 'zh' 
        ? '登录功能正在配置中，请稍后再试' 
        : 'Login feature is being configured, please try again later')
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login")
    setError("")
    setSuccess("")
    setShowBenefits(true) // Reset benefits when switching modes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={`auth-modal-${mode}`}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === "login" ? t.login.title : t.signup.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "login" ? t.login.subtitle : t.signup.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Login Buttons - IP自适应 */}
          {/* 微信登录已隐藏，等待二次迭代开发 */}
          <div className="grid gap-3">
            {!isChina && (
              /* 海外IP：显示Google登录 */
              <Button
                variant="outline"
                className="bg-white text-black hover:bg-gray-100 relative"
                onClick={() => handleSocialAuth("google")}
                disabled={loading}
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
                <Badge className="absolute -top-2 -right-2 bg-blue-500">
                  {languageCode === 'zh' ? '推荐' : 'Recommended'}
                </Badge>
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">
                {mode === "login" ? t.login.orContinueWith : t.signup.orContinueWith}
              </span>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {mode === "login" ? t.login.emailLabel : t.signup.emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={mode === "login" ? t.login.emailPlaceholder : t.signup.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                {mode === "login" ? t.login.passwordLabel : t.signup.passwordLabel}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "login" ? t.login.passwordPlaceholder : t.signup.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
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
                <h4 className="font-medium text-sm">{languageCode === 'zh' ? '你将获得：' : 'What you get:'}</h4>
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
                  <span>{languageCode === 'zh' ? '无限自定义网站和收藏' : 'Unlimited custom sites & favorites'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">✓</Badge>
                  <span>{languageCode === 'zh' ? '跨设备同步' : 'Sync across all your devices'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">✓</Badge>
                  <span>{languageCode === 'zh' ? '一站式管理300+网站' : 'Organize 300+ sites in one place'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">✓</Badge>
                  <span>{languageCode === 'zh' ? '永不丢失数据' : 'Never lose your data again'}</span>
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
              {languageCode === 'zh' ? '显示权益' : 'Show benefits'}
            </Button>
          )}
        </div>
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