"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Info } from "lucide-react"

export function Toast({ message, type = "success" }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2700)

    return () => clearTimeout(timer)
  }, [])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  }

  const colors = {
    success: "bg-green-600 border-green-500",
    error: "bg-red-600 border-red-500",
    info: "bg-blue-600 border-blue-500",
  }

  const Icon = icons[type]

  // Always return the same structure, use CSS to hide when not visible
  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 ${!isVisible ? "hidden" : ""}`}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-white shadow-lg backdrop-blur-sm ${colors[type]}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}
