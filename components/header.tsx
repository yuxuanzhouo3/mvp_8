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
import { User, Crown, Settings, LogOut, MessageSquare, Globe, Check } from "lucide-react"
import { GuestTimer } from "@/components/guest-timer"
import { AuthModal } from "@/components/auth-modal"
import { PaymentModal } from "@/components/payment-modal"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { homeUiText } from "@/lib/i18n/home-ui"

interface HeaderProps {
  onGuestTimeExpired: () => void
  onUpgradeClick: () => void
}

export function Header({ onGuestTimeExpired, onUpgradeClick }: HeaderProps) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { language, setLanguage, isAuto } = useLanguage()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const headerText = homeUiText[language].header

  // Listen for custom events to open auth modal
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      // 显示功能待上线提示
      const message = headerText.loginComingSoon || '登录功能即将上线，敬请期待！'
      alert(message)
    }

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener)
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener)
    }
  }, [])

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold">S</span>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold">SiteHub</h1>
                <Badge variant="secondary" className="text-[10px] sm:text-xs bg-white/10 text-white/80 hidden xs:inline-flex">
                  300+ Sites
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 sm:w-24 bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const handleAuth = (userData: any) => {
    // Auth is now handled by the context
    setShowAuthModal(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo - 移动端优化 */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold">S</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">SiteHub</h1>
              <Badge variant="secondary" className="text-[10px] sm:text-xs bg-white/10 text-white/80 hidden xs:inline-flex">
                {headerText.badgeLabel}
              </Badge>
            </div>
          </div>

          {/* User Menu - 移动端优化 */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            <GuestTimer user={user} onTimeExpired={onGuestTimeExpired} onUpgradeClick={onUpgradeClick} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 text-white hover:bg-white/10 h-9 sm:h-10 px-2 sm:px-3 min-w-[44px] touch-manipulation">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline text-sm">{language === "zh" ? headerText.languageChinese : headerText.languageEnglish}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700 text-white">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">
                  {headerText.languageMenuTitle}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setLanguage("zh")}
                  className="justify-between text-white hover:bg-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="Chinese flag">
                      🇨🇳
                    </span>
                    <div className="flex flex-col text-sm">
                      <span>{headerText.languageChinese}</span>
                      <span className="text-xs text-slate-400">{headerText.languageChineseDesc}</span>
                    </div>
                  </div>
                  {language === "zh" && <Check className="w-4 h-4 text-blue-400" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="justify-between text-white hover:bg-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="US flag">
                      🇺🇸
                    </span>
                    <div className="flex flex-col text-sm">
                      <span>{headerText.languageEnglish}</span>
                      <span className="text-xs text-slate-400">{headerText.languageEnglishDesc}</span>
                    </div>
                  </div>
                  {language === "en" && <Check className="w-4 h-4 text-blue-400" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setLanguage("auto")}
                  className="text-xs text-slate-300 hover:bg-slate-700"
                >
                  {headerText.languageAutoNote}
                  {isAuto && <Check className="w-4 h-4 ml-auto text-blue-400" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 text-white hover:bg-white/10 h-9 sm:h-10 px-2 sm:px-3 min-w-[44px] max-w-[120px] sm:max-w-none touch-manipulation">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm hidden xs:inline">
                    {user?.type === "guest" ? headerText.guestUser : user?.name || "Loading..."}
                  </span>
                  {user?.pro && <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                {user?.type === "guest" ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => {
                        const message = headerText.loginComingSoon || '登录功能即将上线，敬请期待！'
                        alert(message)
                      }} 
                      className="text-white hover:bg-slate-700"
                    >
                      {headerText.signUp}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-slate-700">
                      <div className="flex flex-col">
                        <span>{headerText.guestAccount}</span>
                        <span className="text-xs text-slate-400">{headerText.limitedFeatures}</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem className="text-white hover:bg-slate-700">
                      <div className="flex flex-col">
                        <span>{user?.name || "User"}</span>
                        <span className="text-xs text-slate-400">{user?.email || ""}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem className="text-white hover:bg-slate-700">
                      <div className="flex items-center justify-between w-full">
                        <span>{user?.pro ? headerText.proAccount : headerText.freeAccount}</span>
                        {user?.pro && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </DropdownMenuItem>
                    {!user?.pro && (
                      <DropdownMenuItem
                        onClick={onUpgradeClick}
                        className="text-yellow-400 hover:bg-slate-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {headerText.upgrade}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => router.push('/settings')}
                      className="text-white hover:bg-slate-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {headerText.settings}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(`mailto:mornscience@gmail.com?subject=${encodeURIComponent(headerText.contactEmailSubject)}`, '_blank')}
                      className="text-white hover:bg-slate-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {headerText.support}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 hover:bg-slate-700"
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
