"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { homeUiText } from "@/lib/i18n/home-ui"
import { useDroppable } from "@dnd-kit/core"

interface SearchAndFiltersProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  filteredCount: number
  categoryOrder?: string[]
  totalCount?: number
}

const iconMap: Record<string, string> = {
  favorites: "⭐",
  custom: "➕",
  all: "🌐",
  china: "🇨🇳",
  social: "👥",
  video: "📺",
  shopping: "🛒",
  tools: "🛠️",
  news: "📰",
  finance: "💰",
  education: "🎓",
  productivity: "📊",
  design: "🎨",
  gaming: "🎮",
  travel: "✈️",
  food: "🍔",
  health: "💪",
  music: "🎵",
}

const labelMapZh: Record<string, string> = {
  favorites: "收藏",
  custom: "自定义网站",
  all: "全部",
  china: "中国网站",
  social: "社交",
  video: "视频与流媒体",
  shopping: "购物",
  tools: "开发工具",
  news: "新闻与媒体",
  finance: "金融",
  education: "教育",
  productivity: "效率工具",
  design: "设计",
  gaming: "游戏",
  travel: "旅行",
  food: "美食外卖",
  health: "健康运动",
  music: "音乐",
}

const labelMapEn: Record<string, string> = {
  favorites: "Favorites",
  custom: "Custom Sites",
  all: "All Sites",
  china: "China Sites",
  social: "Social Media",
  video: "Video & Streaming",
  shopping: "Shopping",
  tools: "Dev Tools",
  news: "News & Media",
  finance: "Finance",
  education: "Education",
  productivity: "Productivity",
  design: "Design",
  gaming: "Gaming",
  travel: "Travel",
  food: "Food & Delivery",
  health: "Health & Fitness",
  music: "Music",
}

const DEFAULT_CATEGORY_ORDER = [
  "favorites",
  "custom",
  "all",
  "china",
  "social",
  "video",
  "shopping",
  "tools",
  "news",
  "finance",
  "education",
  "productivity",
  "design",
  "gaming",
  "travel",
  "food",
  "health",
  "music",
]

const formatCategory = (key: string) =>
  key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

// 可拖放的收藏按钮组件
function DroppableFavoriteButton({ isSelected, onClick, label, icon }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'favorites-dropzone',
  })

  return (
    <Button
      ref={setNodeRef}
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`text-xs transition-all duration-200 ${
        isSelected
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : isOver
          ? "bg-red-500/30 border-red-400 text-white ring-2 ring-red-400 scale-110 shadow-lg shadow-red-400/50"
          : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-blue-400"
      }`}
    >
      <span className={`mr-1 ${isOver ? "animate-bounce" : ""}`}>{icon}</span>
      {label}
      {isOver && <span className="ml-1 animate-pulse">👆</span>}
    </Button>
  )
}

export function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredCount,
  categoryOrder,
  totalCount,
}: SearchAndFiltersProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)
  const { language } = useLanguage()
  const text = homeUiText[language].search

  const orderedCategories = useMemo(() => {
    const order = categoryOrder && categoryOrder.length > 0 ? categoryOrder : DEFAULT_CATEGORY_ORDER
    const uniqueKeys = Array.from(new Set(order))
    return uniqueKeys
  }, [categoryOrder])

  const categoriesWithoutAll = useMemo(
    () => orderedCategories.filter((key) => key !== "all"),
    [orderedCategories],
  )

  const visibleCategoryKeys = showAllCategories
    ? categoriesWithoutAll
    : categoriesWithoutAll.slice(0, 8)

  const remainingCount = Math.max(0, categoriesWithoutAll.length - 8)

  const labelMap = language === "zh" ? labelMapZh : labelMapEn
  const placeholderCount = totalCount != null ? totalCount.toString() : "300"
  const moreLabel = language === "zh" ? `+${remainingCount} 个分类` : `+${remainingCount} more`
  const lessLabel = language === "zh" ? "收起" : "Show less"

  const getLabel = (key: string) => {
    if (key === "all") return language === "zh" ? text.allSites : text.allSites
    if (key === "china") return language === "zh" ? text.chinaSites : text.chinaSites
    return labelMap[key] || formatCategory(key)
  }
  const getIcon = (key: string) => iconMap[key] || "🌐"

  const sectionLabel = text.categoriesLabel
  const sitesSuffix = text.sitesSuffix

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
        <Input
          type="text"
          placeholder={text.placeholder.replace("{count}", placeholderCount)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-blue-400"
          aria-label={sectionLabel}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/80">{sectionLabel}</span>
          {filteredCount > 0 && (
            <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
              {`${filteredCount} ${sitesSuffix}`}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            key="all-category"
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={`text-xs ${
              selectedCategory === "all"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-blue-400"
            }`}
          >
            <span className="mr-1">{getIcon("all")}</span>
            {getLabel("all")}
          </Button>

          {visibleCategoryKeys.map((categoryId) => {
            // 收藏按钮使用可拖放组件
            if (categoryId === "favorites") {
              return (
                <DroppableFavoriteButton
                  key={categoryId}
                  isSelected={selectedCategory === categoryId}
                  onClick={() => setSelectedCategory(categoryId)}
                  label={getLabel(categoryId)}
                  icon={getIcon(categoryId)}
                />
              )
            }
            
            return (
              <Button
                key={categoryId}
                variant={selectedCategory === categoryId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(categoryId)}
                className={`text-xs ${
                  selectedCategory === categoryId
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-blue-400"
                }`}
              >
                <span className="mr-1">{getIcon(categoryId)}</span>
                {getLabel(categoryId)}
              </Button>
            )
          })}

          {!showAllCategories && remainingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllCategories(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
            >
              {moreLabel}
            </Button>
          )}

          {showAllCategories && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllCategories(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
            >
              {lessLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
