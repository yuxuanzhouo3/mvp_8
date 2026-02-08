"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { homeUiText } from "@/lib/i18n/home-ui"

export function FeaturedProducts({ sites }) {
  const { language } = useLanguage()
  const text = homeUiText[language].hero

  const handleSiteClick = (url: string) => {
    window.open(url, "_blank")
  }

  // 防止hydration mismatch：确保sites数组安全
  const safeSites = Array.isArray(sites) ? sites : []

  if (!safeSites?.length) return null

  return (
    <section className="mb-3 sm:mb-4 overflow-hidden">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth">
        {/* 紫色标签 - 保持在第一排且不缩放 */}
        <Badge className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-none">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
          {text.productLabel}
        </Badge>
        
        {/* 产品列表 - 与标签排成一排 */}
        <div className="flex gap-1.5 flex-nowrap items-center">
          {safeSites.map((site) => (
            <div
              key={site.id}
              onClick={() => handleSiteClick(site.url)}
              className="group cursor-pointer p-1.5 bg-slate-200/50 dark:bg-white/5 backdrop-blur-sm rounded-md border border-slate-200 dark:border-white/10 hover:border-blue-400/50 hover:bg-slate-300 dark:hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:scale-105 flex-shrink-0"
            >
              <div className="flex items-center gap-1 px-1 min-w-[60px] sm:min-w-[70px]">
                <div className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-300">{site.logo}</div>
                <h3 className="font-medium text-[10px] sm:text-xs text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate max-w-[80px]">
                  {site.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
