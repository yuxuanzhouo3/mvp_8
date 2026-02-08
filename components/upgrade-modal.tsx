"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Crown, Chrome, Mail, Clock, Zap, Heart, Shield } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onAuth: (provider: string) => void
  isTimeExpired: boolean
  region?: "China" | "Overseas"  // 新增：地区参数
}

export function UpgradeModal({ isOpen, onClose, onAuth, isTimeExpired, region = "Overseas" }: UpgradeModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // ✅ 关键修复：添加 isMountedRef 来防止 Presence 动画期间的状态更新
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  const features = [
    { icon: Zap, text: "Unlimited drag & drop reordering", premium: false },
    { icon: Heart, text: "Save unlimited custom sites", premium: true },
    { icon: Shield, text: "Cloud sync across devices", premium: true },
    { icon: Crown, text: "Premium themes & layouts", premium: true },
  ]

  const handleEmailSignup = () => {
    if (!email || !password) {
      alert("Please fill in both email and password")
      return
    }
    // ✅ 关键修复：只在组件仍挂载时调用回调
    if (isMountedRef.current) {
      onAuth("email")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
        <DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-4xl">💾</div>
            <DialogTitle className="text-xl font-bold">{isTimeExpired ? "Save Your Data!" : "Unlock Full Access"}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {isTimeExpired
                ? "Your session expired! Sign up now to save your favorites & custom sites permanently"
                : "Get unlimited access to all features with a free account"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center text-slate-700 dark:text-slate-200">What you'll get:</h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200">{feature.text}</span>
                {feature.premium && (
                  <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs border-none">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Quick Sign Up */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600"
                onClick={() => {
                  if (isMountedRef.current) {
                    // 国内用户打开登录模态框,海外用户使用Google登录
                    onAuth(region === "China" ? "login" : "google")
                  }
                }}
              >
                <Chrome className="w-4 h-4 mr-2 text-blue-500" />
                {region === "China" ? "立即登录" : "Continue with Google"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                  {region === "China" ? "或使用邮箱" : "Or with email"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-slate-800 dark:text-slate-200">{region === "China" ? "邮箱" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={region === "China" ? "your@email.com" : "your@email.com"}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-800 dark:text-slate-200">{region === "China" ? "密码" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEmailSignup}>
              <Mail className="w-4 h-4 mr-2" />
              {region === "China" ? "创建免费账户" : "Create Free Account"}
            </Button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              {region === "China" ? "已有账号？" : "Already have an account?"}{" "}
              <button className="text-blue-600 dark:text-blue-400 hover:underline" onClick={() => {
                if (isMountedRef.current) {
                  onAuth("login")
                }
              }}>
                {region === "China" ? "立即登录" : "Sign in"}
              </button>
            </div>
          </div>

          {/* Data Loss Warning */}
          {isTimeExpired && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-100">
                <Clock className="w-4 h-4" />
                <span>Your favorites & custom sites will be lost! Sign up to save them!</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
