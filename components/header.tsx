"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Crown, Settings, LogOut, MessageSquare, Globe, Check, Download, Moon, Sun } from "lucide-react"
import { GuestTimer } from "@/components/guest-timer"
import { AuthModal } from "@/components/auth-modal"
import { PaymentModal } from "@/components/payment-modal"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { useSettings } from "@/contexts/settings-context"
import { homeUiText } from "@/lib/i18n/home-ui"
import { useTheme } from "next-themes"

interface HeaderProps {
  onGuestTimeExpired: () => void
  onUpgradeClick: () => void
}

export function Header({ onGuestTimeExpired, onUpgradeClick }: HeaderProps) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const { language, setLanguage, isAuto } = useLanguage()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [mounted, setMounted] = useState(false)
  const headerText = homeUiText[language].header

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for custom events to open auth modal
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      setAuthMode(event.detail.mode || "login")
      setShowAuthModal(true)
    }

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener)
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener)
    }
  }, [])

  const handleAuth = (userData: any) => {
    // Auth is now handled by the context
    setShowAuthModal(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {loading ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-white">S</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">SiteHub</h1>
                <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 hidden sm:inline-flex border-none">
                  300+ Sites
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="h-8 w-16 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">SiteHub</h1>
              <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 hidden sm:inline-flex border-none">
                {headerText.badgeLabel}
              </Badge>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <GuestTimer user={user} loading={loading} onTimeExpired={onGuestTimeExpired} onUpgradeClick={onUpgradeClick} />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/downloads")}
              className="text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 sm:px-3"
              title={language === "zh" ? "下载" : "Download"}
            >
              <Download className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">{language === "zh" ? "下载" : "Download"}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSettings({ theme: theme === "dark" ? "light" : "dark" })}
              className="p-2 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="w-5 h-5 transition-all" />
                ) : (
                  <Moon className="w-5 h-5 transition-all text-blue-600" />
                )
              ) : (
                <div className="w-5 h-5" /> // Spacer for hydration
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 sm:px-3">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === "zh" ? headerText.languageChinese : headerText.languageEnglish}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xl">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {headerText.languageMenuTitle}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setLanguage("zh")}
                  className="justify-between text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="Chinese flag">
                      🇨🇳
                    </span>
                    <div className="flex flex-col text-sm">
                      <span>{headerText.languageChinese}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{headerText.languageChineseDesc}</span>
                    </div>
                  </div>
                  {language === "zh" && <Check className="w-4 h-4 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="justify-between text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="US flag">
                      🇺🇸
                    </span>
                    <div className="flex flex-col text-sm">
                      <span>{headerText.languageEnglish}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{headerText.languageEnglishDesc}</span>
                    </div>
                  </div>
                  {language === "en" && <Check className="w-4 h-4 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setLanguage("auto")}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {headerText.languageAutoNote}
                  {isAuto && <Check className="w-4 h-4 ml-auto text-blue-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 sm:px-3">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.type === "guest" ? headerText.guestUser : user?.name || "Loading..."}</span>
                  {user?.pro && <Crown className="w-4 h-4 text-yellow-400" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xl">
                {user?.type === "guest" ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => {
                        setAuthMode("signup")
                        setShowAuthModal(true)
                      }} 
                      className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {headerText.signUp}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex flex-col">
                        <span>{headerText.guestAccount}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{headerText.limitedFeatures}</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex flex-col">
                        <span>{user?.name || "User"}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ""}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                    <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex items-center justify-between w-full">
                        <span>{user?.pro ? headerText.proAccount : headerText.freeAccount}</span>
                        {user?.pro && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </DropdownMenuItem>
                    {!user?.pro && (
                      <DropdownMenuItem
                        onClick={onUpgradeClick}
                        className="text-yellow-600 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {headerText.upgrade}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => router.push('/settings')}
                      className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                      {headerText.settings}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(`mailto:mornscience@gmail.com?subject=${encodeURIComponent(headerText.contactEmailSubject)}`, '_blank')}
                      className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                      {headerText.support}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {headerText.signOut}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onAuth={handleAuth}
        authMode={authMode}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => {
          console.log("Payment successful!")
          // Update user pro status
        }}
      />
    </header>
  )
}
