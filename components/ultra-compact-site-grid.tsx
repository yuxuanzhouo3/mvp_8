"use client"

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Heart, Trash2, ExternalLink, GripVertical } from "lucide-react"
import { handleWebViewLink } from "@/lib/webview-utils"

function UltraCompactSiteCard({ site, onRemove, favorites, onToggleFavorite, isDragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const handleSiteClick = (e, url) => {
    if (isDragging) return
    e.stopPropagation()

    // 使用WebView兼容的链接处理
    handleWebViewLink(url)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...(isDragDisabled ? {} : { ...attributes, ...listeners })}
          data-site-card="true"
          data-site-url={site.url}
          className={`group relative ${isDragDisabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} p-1.5 sm:p-2 bg-white/8 backdrop-blur-sm rounded-md border border-white/10 hover:border-blue-400/50 hover:bg-white/15 transition-all duration-200 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] active:scale-95 sm:hover:scale-105 touch-manipulation min-h-[60px] sm:min-h-[70px] ${
            isDragging ? "shadow-lg border-blue-500 bg-white/20 scale-110" : ""
          } ${isDragDisabled ? "opacity-60" : ""}`}
        >
          {/* Drag indicator - 移动端隐藏 */}
          {!isDragDisabled && (
            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              <GripVertical className="w-2 h-2 text-white/60" />
            </div>
          )}

          <div onClick={(e) => handleSiteClick(e, site.url)} className="relative text-center space-y-0.5 sm:space-y-1">
            <div className="text-base sm:text-lg group-hover:scale-110 transition-transform duration-200">{site.logo}</div>
            <div className="text-[10px] sm:text-xs text-white/80 group-hover:text-white font-medium truncate leading-tight px-0.5">
              {site.name}
            </div>
          </div>

          {/* Custom site indicator */}
          {site.custom && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-slate-800" />
          )}

          {/* Favorite indicator - 移动端触摸优化 */}
          {favorites.includes(site.id) ? (
            <div
              className="absolute -top-0.5 -left-0.5 cursor-pointer z-10 p-1.5 -m-1.5 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(site.id)
              }}
            >
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 fill-red-500 drop-shadow-sm active:scale-90 sm:hover:scale-110 transition-transform" />
            </div>
          ) : (
            <div
              className="absolute -top-0.5 -left-0.5 opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-10 p-1.5 -m-1.5 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(site.id)
              }}
            >
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40 hover:text-red-400 active:scale-90 sm:hover:scale-110 transition-all" />
            </div>
          )}

          {/* Minimal tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {isDragDisabled ? "Sign up" : "Drag • Click"}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-slate-800 border-slate-700">
        <ContextMenuItem
          onClick={() => handleSiteClick({ stopPropagation: () => {} }, site.url)}
          className="text-white hover:bg-slate-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleFavorite(site.id)} className="text-white hover:bg-slate-700">
          <Heart className={`w-4 h-4 mr-2 ${favorites.includes(site.id) ? "fill-red-500 text-red-500" : ""}`} />
          {favorites.includes(site.id) ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        {site.custom && (
          <ContextMenuItem onClick={() => onRemove(site.id)} className="text-red-400 hover:bg-slate-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Site
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function UltraCompactSiteGrid({ sites, onRemove, onReorder, onToggleFavorite, favorites = [] as string[], isDragDisabled = false }) {
  // 防止hydration mismatch：确保sites数组安全
  const safeSites = Array.isArray(sites) ? sites : []
  
  // 始终渲染相同数量的组件结构，保持 Hook 调用一致性
  // 即使 sites 为空，也渲染一个最小结构来保持组件树的一致性
  const isEmpty = safeSites.length === 0
  
  return (
    <SortableContext items={safeSites.map((site) => site.id)} strategy={rectSortingStrategy}>
      <div className={`grid grid-cols-3 xs:grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-18 gap-2 sm:gap-2 ${isEmpty ? 'min-h-[100px]' : ''}`}>
        {safeSites.map((site) => (
          <UltraCompactSiteCard
            key={site.id}
            site={site}
            onRemove={onRemove}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            isDragDisabled={isDragDisabled}
          />
        ))}
      </div>
    </SortableContext>
  )
}
