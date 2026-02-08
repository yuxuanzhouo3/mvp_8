"use client"

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Heart, Trash2, ExternalLink, GripVertical } from "lucide-react"
import { handleWebViewLink } from "@/lib/webview-utils"
import React, { useState, useEffect, useRef, useMemo } from "react"

const UltraCompactSiteCard = React.memo(function UltraCompactSiteCard({ site, onRemove, favorites, onToggleFavorite, isDragDisabled }) {
  // 性能优化：使用 useMemo 缓存 favorites 检查结果
  const isFavorited = useMemo(() => {
    return Array.isArray(favorites) && favorites.includes(site.id)
  }, [favorites, site.id])
  // 安全检查
  if (!site || !site.id) {
    return null
  }

  const safeFavorites = Array.isArray(favorites) ? favorites : []
  const handleRemove = onRemove || (() => {})
  const handleToggleFavorite = onToggleFavorite || (() => {})

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  // ✅ 性能优化：预计算样式，避免每次渲染都计算
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  }), [transform, transition, isDragging])

  // ✅ 性能优化：预计算CSS类，避免字符串拼接
  const cardClassName = useMemo(() => {
    const baseClasses = 'group relative p-1.5 sm:p-2 bg-slate-200/50 dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/10 hover:border-blue-400/60 dark:hover:border-blue-400/60 hover:bg-slate-300 dark:hover:bg-white/20 touch-manipulation min-h-[60px] sm:min-h-[70px] transition-colors duration-300'
    const cursorClass = isDragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
    const dragClass = isDragging ? 'shadow-lg border-blue-500 bg-blue-500/20' : ''
    const disabledClass = isDragDisabled ? 'opacity-60' : ''
    // 性能优化：添加 will-change 提示浏览器优化
    const perfClass = 'will-change-transform'

    return `${baseClasses} ${cursorClass} ${dragClass} ${disabledClass} ${perfClass}`.trim()
  }, [isDragDisabled, isDragging])

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
          className={cardClassName}
        >
          {/* Drag indicator - 移动端隐藏 */}
          {!isDragDisabled && (
            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 hidden sm:block">
              <GripVertical className="w-2 h-2 text-slate-400 dark:text-white/60" />
            </div>
          )}

          <div onClick={(e) => handleSiteClick(e, site.url)} className="relative text-center space-y-0.5 sm:space-y-1">
            <div className="text-base sm:text-lg">{site.logo}</div>
            <div className="text-[10px] sm:text-xs text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white font-medium truncate leading-tight px-0.5">
              {site.name}
            </div>
          </div>

          {/* Custom site indicator */}
          {site.custom && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white dark:border-slate-800" />
          )}

          {/* Favorite indicator - 移动端触摸优化 */}
          {isFavorited ? (
            <div
              className="absolute -top-0.5 -left-0.5 cursor-pointer z-10 p-1.5 -m-1.5 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(site.id)
              }}
            >
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 fill-red-500 drop-shadow-sm active:scale-90" />
            </div>
          ) : (
            <div
              className="absolute -top-0.5 -left-0.5 opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10 p-1.5 -m-1.5 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(site.id)
              }}
            >
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-white/40 hover:text-red-400 active:scale-90" />
            </div>
          )}

          {/* Minimal tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {isDragDisabled ? "Sign up" : "Drag • Click"}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <ContextMenuItem
          onClick={() => handleSiteClick({ stopPropagation: () => {} }, site.url)}
          className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleToggleFavorite(site.id)} className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
          <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
          {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        {site.custom && (
          <ContextMenuItem onClick={() => handleRemove(site.id)} className="text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Site
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
})

UltraCompactSiteCard.displayName = 'UltraCompactSiteCard'

// 自定义比较函数，优化 React.memo
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.site.id === nextProps.site.id &&
    prevProps.site.name === nextProps.site.name &&
    prevProps.site.logo === nextProps.site.logo &&
    prevProps.isDragDisabled === nextProps.isDragDisabled &&
    prevProps.favorites?.length === nextProps.favorites?.length &&
    prevProps.favorites?.every((fav, i) => fav === nextProps.favorites?.[i])
  )
}

// 使用自定义比较函数的 memo
const OptimizedUltraCompactSiteCard = React.memo(UltraCompactSiteCard, arePropsEqual)
OptimizedUltraCompactSiteCard.displayName = 'OptimizedUltraCompactSiteCard'

const UltraCompactSiteGrid = React.memo(function UltraCompactSiteGrid({ sites, onRemove, onReorder, onToggleFavorite, favorites = [] as string[], isDragDisabled = false }) {
  // 防止hydration mismatch：确保sites数组安全
  const safeSites = Array.isArray(sites) ? sites : []
  const safeFavorites = Array.isArray(favorites) ? favorites : []
  
  // ✅ 性能优化：分批渲染，初始只渲染前 100 个卡片
  const INITIAL_RENDER_COUNT = 100
  const BATCH_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // ✅ 性能优化：使用稳定的依赖项计算可见站点
  const sitesLength = safeSites.length
  const visibleSites = useMemo(() => {
    return safeSites.slice(0, visibleCount)
  }, [sitesLength, visibleCount, safeSites])
  
  // ✅ 性能优化：使用 Intersection Observer 实现懒加载
  // 关键修复：只在 safeSites.length 变化时重建 observer，不依赖 visibleCount
  useEffect(() => {
    if (visibleCount >= sitesLength) {
      // 已经加载完所有卡片，清理 observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      return
    }

    if (!loadMoreRef.current) return

    // 清理旧的 observer（如果存在）
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 创建新的 Intersection Observer - 性能优化配置
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 防抖处理：使用 requestAnimationFrame 避免频繁触发
        requestAnimationFrame(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 当加载触发器进入视口时，加载更多卡片
              setVisibleCount((prev) => {
                const newCount = Math.min(prev + BATCH_SIZE, sitesLength)
                return newCount
              })
            }
          })
        })
      },
      {
        rootMargin: '300px', // 提前 300px 开始加载，减少触发频率
        threshold: 0.1, // 10%可见时触发，减少误触发
      }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [sitesLength]) // ✅ 关键修复：只依赖 sitesLength，不依赖 visibleCount
  
  // ✅ 性能优化：当 sites 数量变化时，重置可见数量（使用稳定的依赖项）
  useEffect(() => {
    setVisibleCount(INITIAL_RENDER_COUNT)
  }, [sitesLength])
  
  // 始终渲染相同数量的组件结构，保持 Hook 调用一致性
  // 即使 sites 为空，也渲染一个最小结构来保持组件树的一致性
  const isEmpty = safeSites.length === 0
  
  // 确保所有回调函数都存在
  const handleRemove = onRemove || (() => {})
  const handleToggleFavorite = onToggleFavorite || (() => {})
  
  return (
    <SortableContext items={visibleSites.map((site) => site?.id || '').filter(Boolean)} strategy={rectSortingStrategy}>
      <div ref={containerRef} className={`grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2 ${isEmpty ? 'min-h-[100px]' : ''}`}>
        {visibleSites.map((site) => {
          if (!site || !site.id) return null
          return (
            <OptimizedUltraCompactSiteCard
              key={site.id}
              site={site}
              onRemove={handleRemove}
              favorites={safeFavorites}
              onToggleFavorite={handleToggleFavorite}
              isDragDisabled={isDragDisabled}
            />
          )
        })}
        {/* 加载触发器：当滚动到这里时，加载更多卡片 */}
        {visibleCount < safeSites.length && (
          <div 
            ref={loadMoreRef}
            className="col-span-full h-20 flex items-center justify-center"
            aria-label="Loading more sites"
          >
            <div className="text-slate-400 dark:text-white/40 text-xs">加载更多...</div>
          </div>
        )}
      </div>
    </SortableContext>
  )
})

UltraCompactSiteGrid.displayName = 'UltraCompactSiteGrid'

export { UltraCompactSiteGrid }
