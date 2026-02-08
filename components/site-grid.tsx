"use client"

import { useState } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Heart, Trash2, ExternalLink } from "lucide-react"

export function SiteGrid({ sites, onRemove }) {
  const [favorites, setFavorites] = useState(new Set())

  const handleSiteClick = (url) => {
    window.open(url, "_blank")
  }

  const toggleFavorite = (siteId) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(siteId)) {
      newFavorites.delete(siteId)
    } else {
      newFavorites.add(siteId)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
      {sites.map((site) => (
        <ContextMenu key={site.id}>
          <ContextMenuTrigger>
            <div
              onClick={() => handleSiteClick(site.url)}
              className="group relative cursor-pointer p-3 bg-slate-100 dark:bg-white/8 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:bg-slate-200 dark:hover:bg-white/15 transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105"
            >
              <div className="text-center space-y-2">
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{site.logo}</div>
                <div className="text-xs text-slate-600 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white font-medium truncate">{site.name}</div>
              </div>

              {/* Custom site indicator */}
              {site.custom && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}

              {/* Favorite indicator */}
              {favorites.has(site.id) && (
                <div className="absolute -top-1 -left-1">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                </div>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="bg-slate-800 border-slate-700">
            <ContextMenuItem onClick={() => handleSiteClick(site.url)} className="text-white hover:bg-slate-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </ContextMenuItem>
            <ContextMenuItem onClick={() => toggleFavorite(site.id)} className="text-white hover:bg-slate-700">
              <Heart className={`w-4 h-4 mr-2 ${favorites.has(site.id) ? "fill-red-500 text-red-500" : ""}`} />
              {favorites.has(site.id) ? "Remove from Favorites" : "Add to Favorites"}
            </ContextMenuItem>
            {site.custom && (
              <ContextMenuItem onClick={() => onRemove(site.id)} className="text-red-400 hover:bg-slate-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Site
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  )
}
