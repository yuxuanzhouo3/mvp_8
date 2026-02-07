"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLanguage } from "@/contexts/language-context"
import { homeUiText } from "@/lib/i18n/home-ui"

export function FeaturedProducts({ sites }) {
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useLanguage()
  const text = homeUiText[language].hero

  const handleSiteClick = (url: string) => {
    window.open(url, "_blank")
  }

  // 防止hydration mismatch：确保sites数组安全
  const safeSites = Array.isArray(sites) ? sites : []

  // Always return the same structure, use CSS to hide when no sites
  return (
    <section className={`mb-1.5 sm:mb-3 ${!safeSites?.length ? "hidden" : ""}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse text-[10px] sm:text-xs py-0 h-5 sm:h-auto">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
              {text.productLabel}
            </Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {safeSites.map((site) => (
              <div
                key={site.id}
                onClick={() => handleSiteClick(site.url)}
                className="group cursor-pointer p-1 sm:p-1.5 bg-white/5 backdrop-blur-sm rounded-md border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:scale-103 flex-shrink-0"
              >
                <div className="text-center space-y-0 w-12 sm:w-14">
                  <div className="text-xs sm:text-sm group-hover:scale-110 transition-transform duration-300">{site.logo}</div>
                  <h3 className="font-medium text-[9px] sm:text-xs text-white group-hover:text-blue-300 transition-colors truncate">
                    {site.name}
                  </h3>
                  <div className="w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
