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

  // Always return the same structure, use CSS to hide when no sites
  return (
    <section className={`mb-2 ${!safeSites?.length ? "hidden" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          {text.productLabel}
        </Badge>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {safeSites.map((site) => (
          <div
            key={site.id}
            onClick={() => handleSiteClick(site.url)}
            className="group cursor-pointer p-1.5 bg-white/5 backdrop-blur-sm rounded-md border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:scale-105 flex-shrink-0"
          >
            <div className="text-center space-y-0.5 w-14">
              <div className="text-sm group-hover:scale-110 transition-transform duration-300">{site.logo}</div>
              <h3 className="font-medium text-xs text-white group-hover:text-blue-300 transition-colors truncate">
                {site.name}
              </h3>
              <div className="w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
