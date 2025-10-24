"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Crown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { homeUiText } from "@/lib/i18n/home-ui"

interface GuestTimerProps {
  user: any
  onTimeExpired: () => void
  onUpgradeClick: () => void
}

export function GuestTimer({ user, onTimeExpired, onUpgradeClick }: GuestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false)
  const { language } = useLanguage()
  const text = homeUiText[language].guestTimer

  useEffect(() => {
    if (user.type !== "guest") return

    // Get start time from localStorage or set it now
    const startTime = localStorage.getItem("guest-start-time")
    const now = Date.now()

    if (!startTime) {
      localStorage.setItem("guest-start-time", now.toString())
    } else {
      const elapsed = Math.floor((now - Number.parseInt(startTime)) / 1000)
      const remaining = Math.max(0, 600 - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        setIsExpired(true)
        onTimeExpired()
      }
    }

    const interval = setInterval(() => {
      const startTime = localStorage.getItem("guest-start-time")
      if (!startTime) return

      const elapsed = Math.floor((Date.now() - Number.parseInt(startTime)) / 1000)
      const remaining = Math.max(0, 600 - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0 && !isExpired) {
        setIsExpired(true)
        onTimeExpired()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user.type, isExpired, onTimeExpired])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const getTimerColor = () => {
    if (timeRemaining > 300) return "bg-green-600" // > 5 minutes
    if (timeRemaining > 120) return "bg-yellow-600" // > 2 minutes
    return "bg-red-600" // < 2 minutes
  }

  const getWarningMessage = () => {
    if (timeRemaining > 300) return text.warningHigh || null
    if (timeRemaining > 120) return text.warningMid || null
    if (timeRemaining > 60) return text.warningLow || null
    return text.warningLow || null
  }

  // Always return the same structure, use CSS to hide when not guest
  return (
    <div className={`flex items-center gap-1 sm:gap-3 ${user.type !== "guest" ? "hidden" : ""}`}>
      <Badge className={`${getTimerColor()} text-white animate-pulse text-xs px-2 py-1`}>
        <Clock className="w-3 h-3 mr-1" />
        {isExpired ? text.expired : `${minutes}:${seconds.toString().padStart(2, "0")}`}
      </Badge>

      {getWarningMessage() && (
        <div className="hidden sm:block text-xs text-red-400 animate-pulse">
          {getWarningMessage()}
        </div>
      )}

      {(timeRemaining < 120 || isExpired) && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white text-xs px-2 sm:px-3"
          >
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{isExpired ? text.upgradeCtaExpired : text.upgradeCtaActive}</span>
          </Button>
          <span className="hidden sm:inline text-xs text-yellow-300">
            {isExpired ? text.upgradeHintExpired : text.upgradeHintActive}
          </span>
        </div>
      )}
    </div>
  )
}
