"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Star, Shield } from "lucide-react"
import { openInWebView } from "@/lib/webview-utils"

interface Site {
  id: string
  name: string
  url: string
  logo: string
  category: string
  rating: number
  supportsLogin: boolean
  description: string
  bgColor: string
}

interface WebsiteCardProps {
  site: Site
  onClick: () => void
}

export function WebsiteCard({ site, onClick }: WebsiteCardProps) {
  const handleVisit = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // ✅ 使用统一的多端链接处理函数
    try {
      await openInWebView(site.url)
    } catch (error) {
      console.error('[WebsiteCard] 打开链接失败:', error)
      // Fallback: 直接跳转
      window.location.href = site.url
    }
  }

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-2 hover:border-blue-300"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          {/* Logo */}
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl ${site.bgColor} shadow-lg group-hover:shadow-xl transition-shadow`}
          >
            {site.logo}
          </div>

          {/* Site Name */}
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{site.name}</h3>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-600">{site.rating}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className="text-xs">
              {site.category}
            </Badge>
            {site.supportsLogin && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Login
              </Badge>
            )}
          </div>

          {/* Visit Button */}
          <Button
            size="sm"
            onClick={handleVisit}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 group-hover:shadow-lg transition-all"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
