"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Heart, GripVertical, Chrome, X } from "lucide-react"

interface GuestLimitationBannerProps {
  user: any
  onSignUpClick: () => void
  onDismiss?: () => void
}

export function GuestLimitationBanner({ user, onSignUpClick, onDismiss }: GuestLimitationBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(600)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (user.type !== "guest") return

    const startTime = localStorage.getItem("guest-start-time")
    const now = Date.now()

    if (!startTime) {
      localStorage.setItem("guest-start-time", now.toString())
    } else {
      const elapsed = Math.floor((now - Number.parseInt(startTime)) / 1000)
      const remaining = Math.max(0, 600 - elapsed)
      setTimeRemaining(remaining)
    }

    const interval = setInterval(() => {
      const startTime = localStorage.getItem("guest-start-time")
      if (!startTime) return

      const elapsed = Math.floor((Date.now() - Number.parseInt(startTime)) / 1000)
      const remaining = Math.max(0, 600 - elapsed)
      setTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [user.type])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isExpired = timeRemaining === 0

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // Always return the same structure, use CSS to hide when not guest or dismissed
  return (
    <div
      className={`mb-6 p-4 rounded-xl border ${user.type !== "guest" || isDismissed ? "hidden" : ""} ${
        isExpired
          ? "bg-red-600/20 border-red-500/30"
          : timeRemaining < 120
            ? "bg-yellow-600/20 border-yellow-500/30"
            : "bg-blue-600/20 border-blue-500/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${
                isExpired ? "text-red-400" : timeRemaining < 120 ? "text-yellow-400" : "text-blue-400"
              }`}
            />
            <Badge
              className={`${
                isExpired
                  ? "bg-red-600 text-white"
                  : timeRemaining < 120
                    ? "bg-yellow-600 text-white"
                    : "bg-blue-600 text-white"
              } animate-pulse`}
            >
              {isExpired ? "Expired" : `${minutes}:${seconds.toString().padStart(2, "0")}`}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <GripVertical className="w-4 h-4 text-white/60" />
              <span className="text-white/80">Drag to reorder</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-white/80">Favorite sites</span>
            </div>
          </div>

          <div className="text-sm text-white/90">
            <span className="font-medium">
              {isExpired
                ? "🔒 Guest trial expired! Sign up to continue organizing your sites"
                : `⏰ Guest trial: ${minutes}:${seconds.toString().padStart(2, "0")} remaining to drag & favorite sites`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button size="sm" onClick={onSignUpClick} className="bg-white text-black hover:bg-gray-100 font-medium">
              <Chrome className="w-4 h-4 mr-2" />
              Sign up with Google
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
