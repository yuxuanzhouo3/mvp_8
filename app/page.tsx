/**
 * SiteHub - Your Personal Web Dashboard
 *
 * @author Yuxuan Zhou
 * @copyright 2025 Yuxuan Zhou. All rights reserved.
 * @license MIT
 */

"use client"

// 完全客户端渲染，避免服务器端性能问题
// 注意：如果遇到 hydration mismatch，请检查组件中的服务端/客户端不一致问题

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { FeaturedProducts } from "@/components/featured-products"
import { SearchAndFilters } from "@/components/search-and-filters"
import { UltraCompactSiteGrid } from "@/components/ultra-compact-site-grid"
import { AddSiteModal } from "@/components/add-site-modal"
import { ParseSitesModal } from "@/components/parse-sites-modal"
import { AuthModal } from "@/components/auth-modal"
import { Toast } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Shuffle, Plus, Crown, Sparkles } from "lucide-react"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useAuth } from "@/contexts/auth-context"
import { useGeo } from "@/contexts/geo-context"
import { useLanguage } from "@/contexts/language-context"
import type { SupportedLanguage } from "@/contexts/language-context"
import type { Region } from "@/lib/ip-detection"
import { normalizeUrlForComparison } from "@/lib/site-parser"
import canonicalData from "@/lib/sitehub-data/canonical.en.json"
import { zhProducts, zhSites } from "@/lib/sitehub-data/zh-localization"
import { homeUiText, uiPlaceholders } from "@/lib/i18n/home-ui"
import { createDatabaseAdapter, type IDatabaseAdapter } from "@/lib/database/adapter"
import { getFavorites, addToFavorites, removeFromFavorites, type CreateFavoriteData } from "@/lib/favorites"
import { getCustomWebsites, addCustomWebsite, deleteCustomWebsite, type CreateWebsiteData } from "@/lib/custom-websites"

interface Site {
  id: string
  name: string
  nameEn: string
  url: string
  logo: string
  featured?: boolean
  custom: boolean
  category: string
  isChina?: boolean
}

type CanonicalRecord = {
  id: string
  name_en: string
  url: string
  url_cn?: string
  url_intl?: string
  logo: string
  category: string
  isCN?: boolean
  tags?: string[]
}

type CanonicalProduct = CanonicalRecord & {
  description?: string
}

type CanonicalCategory = {
  key: string
  name_en: string
}

type CanonicalData = {
  products: CanonicalProduct[]
  categories: CanonicalCategory[]
  sites: CanonicalRecord[]
}

const canonical = canonicalData as CanonicalData

const isOverseas = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION === 'overseas'

const canonicalFeaturedProducts: Site[] = (canonical.products || []).map((product) => {
  const finalUrl = isOverseas 
    ? (product.url_intl || product.url_cn || product.url)
    : (product.url_cn || product.url_intl || product.url)

  return {
    id: product.id,
    name: product.name_en,
    nameEn: product.name_en,
    url: finalUrl,
    logo: product.logo || "🌐",
    category: product.category || "tools",
    featured: true,
    custom: false,
    isChina: product.isCN ?? false,
  }
})

const canonicalSiteEntries: Site[] = (canonical.sites || []).map((site) => {
  const finalUrl = isOverseas 
    ? (site.url_intl || site.url_cn || site.url)
    : (site.url_cn || site.url_intl || site.url)

  return {
    id: site.id,
    name: site.name_en,
    nameEn: site.name_en,
    url: finalUrl,
    logo: site.logo || "🌐",
    category: site.category || "tools",
    featured: false,
    custom: false,
    isChina: site.isCN ?? false,
  }
})

const canonicalSiteTemplate: Site[] = [...canonicalFeaturedProducts, ...canonicalSiteEntries]

const canonicalSiteMap = new Map<string, Site>(
  canonicalSiteTemplate.map((site) => [site.id, site])
)

const canonicalCategoryOrder = (canonical.categories || []).map((category) => category.key)

const cloneSite = (site: Site): Site => ({ ...site })

const getDefaultSites = (): Site[] => canonicalSiteTemplate.map(cloneSite)

const normalizeSiteRecord = (site: any): Site => {
  if (!site) {
    return {
      id: "unknown",
      name: "Unknown",
      nameEn: "Unknown",
      url: "#",
      logo: "🌐",
      category: "tools",
      custom: false,
      featured: false,
      isChina: false,
    }
  }

  const isCustom = site.custom ?? false
  const canonicalSite = canonicalSiteMap.get(site.id)

  if (!isCustom && canonicalSite) {
    // 保持与canonical一致，避免旧数据格式导致缺字段
    return cloneSite(canonicalSite)
  }

  return {
    id: site.id,
    name: site.name || site.nameEn || site.name_en || canonicalSite?.name || canonicalSite?.nameEn || "Untitled",
    nameEn: site.nameEn || site.name_en || canonicalSite?.nameEn || site.name || "Untitled",
    url: site.url || canonicalSite?.url || "#",
    logo: site.logo || canonicalSite?.logo || "🌐",
    category: site.category || canonicalSite?.category || "tools",
    featured: site.featured ?? canonicalSite?.featured ?? false,
    custom: isCustom,
    isChina: isCustom ? false : site.isChina ?? canonicalSite?.isChina ?? false,
  }
}

const normalizeSites = (siteList: any[]): Site[] => siteList.map(normalizeSiteRecord)

const prioritizeSitesByRegion = (input: Site[], region: Region): Site[] => {
  if (input.length === 0) {
    return input
  }

  const featured = input.filter((site) => site.featured)
  const regular = input.filter((site) => !site.featured)

  if (region === "china") {
    const chinaSites = regular.filter((site) => site.isChina)
    const otherSites = regular.filter((site) => !site.isChina)
    return [...featured, ...chinaSites, ...otherSites]
  }

  // 海外默认把非中国网站排在前面 // Outside China we keep global sites ahead of China list
  const chinaSites = regular.filter((site) => site.isChina)
  const otherSites = regular.filter((site) => !site.isChina)
  return [...featured, ...otherSites, ...chinaSites]
}

const areSiteOrdersEqual = (a: Site[], b: Site[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) {
      return false
    }
  }
  return true
}

const localizeSite = (site: Site, language: SupportedLanguage): Site => {
  if (site.custom) {
    return { ...site, name: site.nameEn }
  }

  if (language === "zh") {
    const zhName = site.featured
      ? zhProducts[site.nameEn] || zhSites[site.nameEn]
      : zhSites[site.nameEn]

    return {
      ...site,
      name: zhName || site.nameEn,
    }
  }

  return { ...site, name: site.nameEn }
}

const localizeSites = (list: Site[], language: SupportedLanguage): Site[] =>
  list.map((site) => localizeSite(site, language))

// 辅助函数：获取用户地区（优先使用localStorage中的用户信息）
function getUserRegionFromStorage(): 'china' | 'overseas' | null {
  if (typeof window === 'undefined') return null
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.region === 'china' ? 'china' : 'overseas'
    }
  } catch (e) {
    console.error('获取用户地区失败:', e)
  }
  return null
}

export default function SiteHub() {
  const { user, loading: authLoading } = useAuth()
  const { regionCategory, loading: geoLoading, isChina: geoIsChina } = useGeo()

  // ✅ 性能优化：使用 useMemo 缓存地区检测结果，避免每次渲染都解析 localStorage
  const isChina = React.useMemo(() => {
    const userRegion = getUserRegionFromStorage()
    return userRegion === 'china' || (userRegion === null && geoIsChina)
  }, [geoIsChina]) // 只在 geoIsChina 改变时重新计算
  
  // 处理微信登录回调
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const wechatLogin = params.get('wechat_login')
    const token = params.get('token')
    const userStr = params.get('user')

    if (wechatLogin === 'success' && token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr))

        // 保存到 localStorage
        localStorage.setItem('user_token', token)
        localStorage.setItem('user_info', JSON.stringify(userData))

        console.log('✅ [微信登录成功]:', userData)

        // 清除URL参数并刷新页面
        window.history.replaceState({}, '', window.location.pathname)
        window.location.reload()
      } catch (error) {
        console.error('❌ [微信登录] 处理失败:', error)
      }
    }
  }, [])

  // 检查Supabase配置
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log('🔍 [Supabase] 配置检查:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl && !supabaseUrl.includes('placeholder'),
      keyValid: supabaseKey && supabaseKey !== 'placeholder_key',
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      key: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined'
    })

    // 测试Supabase连接
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder_key') {
      console.log('🔍 [Supabase] 配置有效，测试连接...')
      // 这里可以添加一个简单的连接测试
    } else {
      console.warn('⚠️ [Supabase] 配置无效，将使用模拟客户端')
    }
  }, [])

  // Hydration 探针 - 更安全的实现
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    // 使用 setTimeout 确保在下一个事件循环中设置，避免 SSR/CSR 不一致
    const timer = setTimeout(() => {
      setIsHydrated(true)
      console.log('🔍 [Hydration] 客户端已水合')
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  // 调试日志
  React.useEffect(() => {
    console.log('🔍 [Debug] SiteHub render state:', {
      userType: user.type,
      userId: user.id,
      authLoading,
      geoLoading,
      isChina,
      isSSR: typeof window === 'undefined',
      timestamp: new Date().toISOString()
    })
  }, [user.type, user.id, authLoading, geoLoading, isChina])
  const { language } = useLanguage()
  const text = homeUiText[language]
  const toastText = text.toasts

  // 存储原始站点数据（未处理）
  const [rawSites, setRawSites] = useState<Site[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categoryInitialized, setCategoryInitialized] = useState(false)
  
  // ✅ 性能优化：使用 useMemo 缓存处理后的站点数据，避免重复计算
  const sites = useMemo(() => {
    if (rawSites.length === 0) return []
    const prioritized = prioritizeSitesByRegion(rawSites, regionCategory)
    return localizeSites(prioritized, language)
  }, [rawSites, regionCategory, language])
  const [isShuffled, setIsShuffled] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showParseModal, setShowParseModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [toast, setToast] = useState<any>(null)
  const [isGuestTimeExpired, setIsGuestTimeExpired] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  // ✅ 性能优化：移除了 regionPriorityApplied，因为数据处理现在由 useMemo 自动完成
  const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null)
  const [dbAdapter, setDbAdapter] = useState<IDatabaseAdapter | null>(null)
  const [mounted, setMounted] = useState(false)

  const customSitesCount = useMemo(() => {
    // 简化逻辑，避免复杂的异步状态
    if (!isHydrated) {
      return 0
    }
    return sites.filter((site) => site.custom).length
  }, [sites, isHydrated])

  // 计算是否禁用拖拽（需要在 sensors 之前）
  // 小程序没有这个限制，官网也应该保持一致
  const isDragDisabled = false

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isDragDisabled ? 999999 : 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const remainingCustomSlots = useMemo(() => {
    if (!isHydrated) return null // 服务端渲染时返回 null
    if (user.pro) {
      return null // Pro用户无限制
    }
    // 小程序没有这个限制，官网也应该保持一致
    return null
  }, [isHydrated, user.pro, customSitesCount])

  const existingUrls = useMemo(() => {
    // 简化逻辑，避免复杂的异步状态
    if (!isHydrated) {
      return new Set<string>()
    }
    const urls = sites.map((site) => normalizeUrlForComparison(site.url))
    return new Set(urls)
  }, [sites.length, isHydrated])  // ✅ 关键修复：只依赖数组长度，不依赖整个数组

  const customCountRef = useRef(0)

  useEffect(() => {
    customCountRef.current = customSitesCount
  }, [customSitesCount])

  // Set mounted flag after client-side hydration to prevent SSR/CSR mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ 性能优化：移除了 regionPriorityApplied 的 useEffect，因为数据处理现在由 useMemo 自动完成

  useEffect(() => {
    if (categoryInitialized || geoLoading) {
      return
    }

    const defaultCategory = regionCategory === "china" ? "china" : "all"
    setSelectedCategory(defaultCategory)
    setCategoryInitialized(true)
  }, [categoryInitialized, geoLoading, regionCategory])

  // Initialize database adapter based on user region
  useEffect(() => {
    async function initAdapter() {
      // 只有在hydration完成且不是loading状态时才初始化
      if (!authLoading && !geoLoading && user.type === "authenticated" && user.id) {
        console.log(`🔧 [DB] 初始化数据库适配器 - 用户地区: ${isChina ? '🇨🇳 国内' : '🌍 海外'}`)
        const adapter = await createDatabaseAdapter(isChina, user.id)
        setDbAdapter(adapter)
      } else {
        setDbAdapter(null)
      }
    }
    initAdapter()
  }, [authLoading, geoLoading, user.type, user.id, isChina])

  // ✅ 性能优化：合并收藏和自定义网站的加载，使用 Promise.all 并行请求
  useEffect(() => {
    async function loadUserData() {
      // 只有在hydration完成且不是loading状态时才加载
      if (authLoading || geoLoading) return

      if (user.type === "authenticated" && user.id) {
        // Authenticated users: 并行加载收藏和自定义网站
        try {
          const loadPromises: Promise<any>[] = []

          // 准备收藏加载
          const favoritesPromise = (async () => {
            if (isChina) {
              console.log('🇨🇳 [中国用户] 使用API加载收藏...')
              const favoritesData = await getFavorites(user.id)
              const favoriteSiteIds = favoritesData.map(f => f.site_id)
              console.log('✅ [API] 加载收藏成功:', favoriteSiteIds.length, '个')
              return { type: 'favorites', data: favoriteSiteIds }
            } else if (dbAdapter) {
              console.log('🌍 [海外用户] 使用Adapter加载收藏...')
              const favoriteSiteIds = await dbAdapter.getFavorites()
              console.log('✅ [DB] 加载收藏成功:', favoriteSiteIds.length, '个')
              return { type: 'favorites', data: favoriteSiteIds }
            }
            return { type: 'favorites', data: [] }
          })()

          // 准备自定义网站加载
          const sitesPromise = (async () => {
            if (isChina) {
              console.log('🇨🇳 [中国用户] 使用API加载自定义网站...')
              const data = await getCustomWebsites(user.id)
              console.log('✅ [API] 加载自定义网站成功:', data.length, '个')
              return { type: 'sites', data }
            } else if (dbAdapter) {
              console.log('🌍 [海外用户] 使用Adapter加载自定义网站...')
              const data = await dbAdapter.getCustomSites()
              console.log('✅ [DB] 加载自定义网站成功:', data.length, '个')
              return { type: 'sites', data }
            }
            return { type: 'sites', data: [] }
          })()

          // ✅ 并行执行两个请求，显著减少加载时间
          const [favoritesResult, sitesResult] = await Promise.all([
            favoritesPromise.catch(err => {
              console.error('❌ [DB] 加载收藏失败:', err)
              return { type: 'favorites', data: [] }
            }),
            sitesPromise.catch(err => {
              console.error('❌ [DB] 加载自定义网站失败:', err)
              return { type: 'sites', data: [] }
            })
          ])

          // 更新状态
          setFavorites(favoritesResult.data)

          const customSites = sitesResult.data.map((site: any) => ({
            id: site.id || site._id,
            name: site.name,
            nameEn: site.name,
            url: site.url,
            logo: site.logo || site.icon || "",
            category: site.category || "tools",
            custom: true,
            featured: false,
            isChina: false,
          }))

          const defaultSites = getDefaultSites()
          const mergedSites = [...defaultSites, ...customSites]
          const normalizedSites = normalizeSites(mergedSites)
          // ✅ 性能优化：只设置原始数据，处理由 useMemo 自动完成
          setRawSites(normalizedSites)

          // ✅ 性能优化：异步迁移 localStorage 数据，不阻塞主渲染
          if (isHydrated && typeof window !== 'undefined') {
            const localSites = localStorage.getItem("sitehub-sites")
            if (localSites) {
              setTimeout(async () => {
                try {
                  const localSitesData = JSON.parse(localSites)
                  const customLocalSites = localSitesData.filter((s: Site) => s.custom)

                  for (const site of customLocalSites) {
                    const exists = sitesResult.data.some((s: any) => s.url === site.url)
                    if (!exists) {
                      if (isChina) {
                        await addCustomWebsite(user.id, {
                          name: site.name,
                          url: site.url,
                          icon: site.logo,
                          category: site.category,
                        })
                      } else if (dbAdapter) {
                        await dbAdapter.addCustomSite({
                          name: site.name,
                          url: site.url,
                          logo: site.logo,
                          category: site.category,
                        })
                      }
                    }
                  }
                  localStorage.removeItem("sitehub-sites")
                  console.log('✅ [DB] localStorage自定义网站已迁移到数据库')
                } catch (error) {
                  console.error('❌ [DB] 迁移localStorage自定义网站失败:', error)
                }
              }, 0) // 延迟到下一个事件循环执行，不阻塞主线程
            }
          }
        } catch (error) {
          console.error('❌ [DB] 加载用户数据失败:', error)
        }
      } else {
        // Guest users: use localStorage
        if (isHydrated && typeof window !== 'undefined') {
          const savedFavorites = localStorage.getItem("sitehub-favorites")
          if (savedFavorites) {
            try {
              setFavorites(JSON.parse(savedFavorites))
            } catch (error) {
              console.error('❌ [LocalStorage] 解析收藏失败:', error)
            }
          }

          const savedSites = localStorage.getItem("sitehub-sites")
          if (savedSites) {
            try {
              const parsedSites = JSON.parse(savedSites)
              const normalizedSites = normalizeSites(parsedSites)
              // ✅ 性能优化：只设置原始数据，处理由 useMemo 自动完成
              setRawSites(normalizedSites)
            } catch (error) {
              console.error('❌ [LocalStorage] 解析自定义网站失败:', error)
            }
          } else {
            const defaultSites = getDefaultSites()
            // ✅ 性能优化：只设置原始数据，处理由 useMemo 自动完成
            setRawSites(defaultSites)
          }
        } else {
          const defaultSites = getDefaultSites()
          // ✅ 性能优化：只设置原始数据，处理由 useMemo 自动完成
          setRawSites(defaultSites)
        }
      }
    }

    loadUserData()

    // Load shuffle preference
    if (isHydrated && typeof window !== 'undefined') {
      const savedShuffle = localStorage.getItem("sitehub-shuffle")
      if (savedShuffle) {
        try {
          setIsShuffled(JSON.parse(savedShuffle))
        } catch (error) {
          console.error('❌ [LocalStorage] 解析随机偏好失败:', error)
        }
      }
    }

    // Check if guest time is already expired
    if (!authLoading && user.type === "guest" && isHydrated && typeof window !== 'undefined') {
      const startTime = localStorage.getItem("guest-start-time")
      if (startTime) {
        try {
          const elapsed = Math.floor((Date.now() - Number.parseInt(startTime)) / 1000)
          if (elapsed >= 600) {
            setIsGuestTimeExpired(true)
          }
        } catch (error) {
          console.error('❌ [LocalStorage] 解析访客时间失败:', error)
        }
      }
    }
  }, [authLoading, geoLoading, user.type, user.id, dbAdapter, isChina, isHydrated, regionCategory, language])

  // ✅ 性能优化：移除重复的数据处理 useEffect
  // 现在数据处理由 useMemo 自动完成，当 regionCategory 或 language 变化时会自动重新计算
  // 保存到 localStorage 的逻辑移到 sites useMemo 的副作用中（如果需要）

  // Save data with user-specific keys for authenticated users
  const saveUserData = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        if (user.type === "authenticated") {
          const userKey = `${key}-${user.email}`
          localStorage.setItem(userKey, JSON.stringify(data))
        } else {
          localStorage.setItem(key, JSON.stringify(data))
        }
      } catch (error) {
        console.error('❌ [LocalStorage] 保存用户数据失败:', error)
      }
    }
  }

  const loadUserData = (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        if (user.type === "authenticated") {
          const userKey = `${key}-${user.email}`
          return localStorage.getItem(userKey)
        } else {
          return localStorage.getItem(key)
        }
      } catch (error) {
        console.error('❌ [LocalStorage] 加载用户数据失败:', error)
        return null
      }
    }
    return null
  }
  // Filter sites based on search and category
  const filteredSites = useMemo<Site[]>(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isHydrated) {
      return []
    }

    let filtered = sites.filter((site) => !site.featured)

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(query) ||
          site.category.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (selectedCategory === "favorites") {
      const favoriteSet = new Set(favorites)
      filtered = filtered.filter((site) => favoriteSet.has(site.id))
    } else if (selectedCategory === "custom") {
      filtered = filtered.filter((site) => site.custom === true)
    } else if (selectedCategory === "china") {
      filtered = filtered.filter((site) => site.isChina)
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter((site) => site.category === selectedCategory)
    }

    return filtered
  }, [sites.length, sites, searchQuery, selectedCategory, favorites.length, favorites, isHydrated])

  // 使用所有过滤后的站点（移除数量限制以显示全部站点）
  const displayedSites = useMemo(() => {
    if (!Array.isArray(filteredSites)) {
      return []
    }
    return filteredSites
  }, [filteredSites])

  const nonFeaturedCount = useMemo(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isHydrated) {
      return 0
    }
    return sites.filter((site) => !site.featured).length
  }, [sites, isHydrated])

  const summaryLabel = useMemo(() => {
    if (!mounted) {
      return ""
    }
    const stats = homeUiText[language].stats
    if (selectedCategory === "custom") {
      return stats.summaryCustom.replace(uiPlaceholders.visible, filteredSites.length.toString())
    }
    if (selectedCategory === "favorites") {
      return stats.summaryFavorites.replace(uiPlaceholders.visible, filteredSites.length.toString())
    }
    return stats.summaryDefault
      .replace(uiPlaceholders.visible, filteredSites.length.toString())
      .replace(uiPlaceholders.total, nonFeaturedCount.toString())
  }, [mounted, language, selectedCategory, filteredSites.length, nonFeaturedCount])

  // ✅ 先定义 showToast，供后续函数使用
  const showToast = useCallback((message: string, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleOpenAuthModal = useCallback((mode: "login" | "signup" = "signup") => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }, [])

  const handleGuestTimeExpired = useCallback(() => {
    setIsGuestTimeExpired(true)
    showToast(toastText.timeExpired, "info")
  }, [showToast, toastText])

  const handleUpgradeClick = useCallback(() => {
    // If user is already logged in (authenticated), go to payment page.
    if (user.type === 'authenticated') {
      if (isHydrated && typeof window !== 'undefined') {
        window.location.href = '/payment'
      }
      return
    }

    handleOpenAuthModal("signup")
  }, [user.type, isHydrated, handleOpenAuthModal])

  const handleOpenParseModal = useCallback(() => {
    try {
      console.log('🔍 [ParseModal] 打开智能解析模态框')
      setShowParseModal(true)
    } catch (error) {
      console.error('🚨 [Parse Modal Error]', error)
    }
  }, [])

  const shuffleSites = useCallback(() => {
    console.log('🔍 [Shuffle] 开始随机排序网站')

    // ✅ 性能优化：从处理后的 sites 中提取对应的 rawSites
    // 因为 shuffle 应该基于用户看到的顺序
    const featuredSites = sites.filter((site) => site.featured)
    const regularSites = sites.filter((site) => !site.featured)

    // Fisher-Yates shuffle for regular sites
    const shuffled = [...regularSites]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // 从处理后的 sites 中找到对应的 rawSites
    const shuffledRawSites = featuredSites
      .map(processedSite => rawSites.find(s => s.id === processedSite.id) || processedSite)
      .concat(
        shuffled.map(processedSite => rawSites.find(s => s.id === processedSite.id) || processedSite)
      )
    
    setRawSites(shuffledRawSites)
    setIsShuffled(!isShuffled)

    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("webhub-sites", JSON.stringify(shuffledRawSites))
        localStorage.setItem("webhub-shuffle", JSON.stringify(!isShuffled))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存随机状态失败:', error)
      }
    }

    showToast(toastText.shuffled)
  }, [sites, rawSites, isHydrated, showToast, toastText, isShuffled])

  const handleReorder = useCallback((newSites: Site[]) => {
    if (user.type === "guest" && isGuestTimeExpired) {
      handleOpenAuthModal("signup")
      return
    }

    // ✅ 性能优化：从处理后的 sites 中提取原始数据
    // newSites 是处理后的数据，需要通过 id 匹配找到对应的原始数据
    const featuredSites = rawSites.filter((site) => site.featured)
    const reorderedRawSites = featuredSites.concat(
      newSites.map(processedSite => {
        const rawSite = rawSites.find(s => s.id === processedSite.id)
        return rawSite || processedSite
      })
    )
    setRawSites(reorderedRawSites)
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("sitehub-sites", JSON.stringify(reorderedRawSites))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存重排序状态失败:', error)
      }
    }
    showToast(toastText.reordered)
  }, [user.type, isGuestTimeExpired, handleOpenAuthModal, rawSites, isHydrated, showToast, toastText])

  const addCustomSite = useCallback(async (newSite: any): Promise<boolean> => {
    console.log('🔍 [AddSite] 开始添加网站:', newSite)
    const normalizedUrl = normalizeUrlForComparison(newSite.url)
    if (existingUrls.has(normalizedUrl)) {
      console.log('🔍 [AddSite] URL重复，拒绝添加')
      showToast("This link already exists in your collection.", "info")
      return false
    }
    console.log('🔍 [AddSite] URL验证通过:', newSite.url)

    const currentCustomCount = customCountRef.current

    if (!user.pro && currentCustomCount >= 10) {
      showToast("Free limit reached! Upgrade to Pro for unlimited sites.", "error")
      return false
    }

    if (user.type === "guest" && isGuestTimeExpired) {
      handleOpenAuthModal("signup")
      showToast("Sign up to keep adding custom sites.", "info")
      return false
    }

    try {
      if (user.type === "authenticated" && user.id) {
        console.log('🔍 [AddSite] 添加自定义网站，用户ID:', user.id, '地区:', isChina ? '国内' : '海外')

        let addedSite: any

        if (isChina) {
          // 🇨🇳 国内用户：使用API
          const result = await addCustomWebsite(user.id, {
            name: newSite.name,
            url: newSite.url,
            icon: newSite.logo,
            category: "tools"
          })
          addedSite = result
          console.log('✅ [API] 添加自定义网站成功')
        } else if (dbAdapter) {
          // 🌍 海外用户：使用adapter
          const success = await dbAdapter.addCustomSite({
            name: newSite.name,
            url: newSite.url,
            logo: newSite.logo,
            category: "tools",
          })

          if (!success) {
            throw new Error('Failed to add custom site to database')
          }

          // 重新加载网站列表以获取新添加的网站
          const customSites = await dbAdapter.getCustomSites()
          addedSite = customSites.find((s: any) => s.url === newSite.url)

          if (!addedSite) {
            throw new Error('Added site not found in database')
          }
          console.log('✅ [Adapter] 添加自定义网站成功')
        }

        const siteWithId: Site = {
          ...newSite,
          id: addedSite.id || addedSite._id,
          nameEn: newSite.name,
          custom: true,
          featured: false,
          isChina: isChina,
        }

        setRawSites((prev) => [...prev, siteWithId])

        // 添加到收藏
        if (isChina) {
          // 🇨🇳 国内用户：使用API
          await addToFavorites(user.id!, {
            site_id: siteWithId.id,
            site_name: siteWithId.name,
            site_url: siteWithId.url,
            site_icon: siteWithId.logo,
            site_category: siteWithId.category
          })
        } else if (dbAdapter) {
          // 🌍 海外用户：使用adapter
          await dbAdapter.addFavorite(siteWithId.id)
        }
        setFavorites((prev) => [...prev, siteWithId.id])
        showToast(`${newSite.name} added to favorites! ⭐`)
        customCountRef.current += 1
        return true
      }

      const siteWithId: Site = {
        ...newSite,
        id: `custom-${Date.now()}`,
        nameEn: newSite.name,
        custom: true,
        category: "tools",
        isChina: isChina,
      }

      // ✅ 性能优化：直接设置原始数据
      setRawSites((prev) => {
        const updated = [...prev, siteWithId]
        if (isHydrated && typeof window !== 'undefined') {
          try {
            localStorage.setItem("sitehub-sites", JSON.stringify(updated))
          } catch (error) {
            console.error('❌ [LocalStorage] 保存添加网站失败:', error)
          }
        }
        return updated
      })

      setFavorites((prev) => {
        const updated = [...prev, siteWithId.id]
        if (isHydrated && typeof window !== 'undefined') {
          try {
            localStorage.setItem("sitehub-favorites", JSON.stringify(updated))
          } catch (error) {
            console.error('❌ [LocalStorage] 保存收藏失败:', error)
          }
        }
        return updated
      })

      showToast(`${newSite.name} added! ⭐ Sign up to keep your data forever!`)
      customCountRef.current += 1
      return true
    } catch (error) {
      console.error("❌ [AddSite] 添加自定义网站失败:", error)
      if (error instanceof Error) {
        console.error("❌ [AddSite] 错误详情:", error.message)
        showToast(`Failed to add site: ${error.message}`, "error")
      } else {
        showToast("Failed to add site. Please try again.", "error")
      }
      return false
    }
  }, [existingUrls, user, isGuestTimeExpired, handleOpenAuthModal, dbAdapter, isHydrated, isChina, showToast])

  const toggleFavorite = useCallback(async (siteId: string) => {
    const isFavorited = favorites.includes(siteId)
    const site = sites.find((s) => s.id === siteId)
    const defaultSiteName = language === "zh" ? "网站" : "Site"
    const siteName = site?.name ? site.name : defaultSiteName

    // 1. 立即更新 UI（和小程序逻辑一致）
    const newFavorites = isFavorited
      ? favorites.filter((id) => id !== siteId)
      : [...favorites, siteId]
    
    setFavorites(newFavorites)

    // 2. 立即显示Toast反馈
    if (isFavorited) {
      showToast(toastText.favoriteRemoved.replace(uiPlaceholders.name, siteName))
    } else {
      if (user.type === "authenticated") {
        showToast(toastText.favoriteAdded.replace(uiPlaceholders.name, siteName))
      } else {
        showToast(toastText.guestFavoriteAdded.replace(uiPlaceholders.name, siteName))
      }
    }

    // 3. 保存到本地存储（立即执行）
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("sitehub-favorites", JSON.stringify(newFavorites))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存收藏失败:', error)
      }
    }

    // 4. 异步同步到云端（如果已登录，不阻塞UI）
    if (user.type === "authenticated" && user.id) {
      try {
        console.log('🔍 [Favorite] 开始云端同步:', {
          siteId,
          isFavorited,
          userId: user.id,
          isChina,
          hasDbAdapter: !!dbAdapter
        })

        if (isChina) {
          // 🇨🇳 国内用户：使用API
          if (isFavorited) {
            await removeFromFavorites(user.id, siteId)
            console.log('✅ [API] 删除收藏成功')
          } else {
            // 找到网站信息
            const site = sites.find(s => s.id === siteId)
            if (site) {
              await addToFavorites(user.id, {
                site_id: siteId,
                site_name: site.name,
                site_url: site.url,
                site_icon: site.logo,
                site_category: site.category
              })
              console.log('✅ [API] 添加收藏成功')
            }
          }
        } else if (dbAdapter) {
          // 🌍 海外用户：使用adapter
          if (isFavorited) {
            const success = await dbAdapter.removeFavorite(siteId)
            console.log('🔍 [Adapter] 删除收藏结果:', success)
          } else {
            const success = await dbAdapter.addFavorite(siteId)
            console.log('🔍 [Adapter] 添加收藏结果:', success)
          }
        }
        console.log('✅ [DB] 收藏云端同步成功')
      } catch (error) {
        console.error('❌ [DB] 收藏云端同步失败:', error)
        // 即使云端同步失败，本地状态也已经更新了
      }
    } else {
      console.log('🔍 [Favorite] 跳过云端同步:', {
        userType: user.type,
        hasUserId: !!user.id,
        hasDbAdapter: !!dbAdapter
      })
    }
  }, [favorites, sites, language, user.type, user.id, dbAdapter, isChina, isHydrated, showToast, toastText])

  const removeSite = useCallback(async (siteId: string) => {
    if (user.type === "authenticated" && user.id) {
      // Authenticated users: delete from database
      if (isChina) {
        // 🇨🇳 国内用户：使用API删除自定义网站
        await deleteCustomWebsite(siteId)
      } else if (dbAdapter) {
        // 🌍 海外用户：使用adapter
        await dbAdapter.removeCustomSite(siteId)
      }

      // Also remove from favorites if it was favorited
      if (favorites.includes(siteId)) {
        if (isChina) {
          // 🇨🇳 国内用户：使用API
          await removeFromFavorites(user.id, siteId)
        } else if (dbAdapter) {
          // 🌍 海外用户：使用adapter
          await dbAdapter.removeFavorite(siteId)
        }
        setFavorites(favorites.filter((id) => id !== siteId))
      }

      // ✅ 性能优化：直接操作原始数据
      setRawSites(rawSites.filter((site) => site.id !== siteId))
      showToast(toastText.removed)
      console.log('✅ [DB] 删除自定义网站成功')
    } else {
      // Guest users: use localStorage
      // ✅ 性能优化：直接操作原始数据
      const updatedSites = rawSites.filter((site) => site.id !== siteId)
      setRawSites(updatedSites)

      if (favorites.includes(siteId)) {
        const newFavorites = favorites.filter((id) => id !== siteId)
        setFavorites(newFavorites)
        if (isHydrated && typeof window !== 'undefined') {
          try {
            localStorage.setItem("sitehub-favorites", JSON.stringify(newFavorites))
          } catch (error) {
            console.error('❌ [LocalStorage] 保存取消收藏失败:', error)
          }
        }
      }

      if (isHydrated && typeof window !== 'undefined') {
        try {
          localStorage.setItem("sitehub-sites", JSON.stringify(updatedSites))
        } catch (error) {
          console.error('❌ [LocalStorage] 保存删除网站失败:', error)
        }
      }
      showToast(toastText.removed)
    }
  }, [user.type, user.id, dbAdapter, favorites, rawSites, isHydrated, showToast, toastText])

  // ✅ 关键修复：所有模态框回调函数都用 useCallback 包装
  const handleCloseAddModal = useCallback(() => setShowAddModal(false), [])
  const handleCloseParseModal = useCallback(() => setShowParseModal(false), [])
  const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), [])
  const handleAuthSuccess = useCallback((userData: any) => {
    console.log('🔍 [Auth] 用户认证成功:', userData)
    setIsGuestTimeExpired(false)
    setShowAuthModal(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem("guest-start-time")
    }
  }, [])

  // 拖拽处理
  const handleDragStart = (event: any) => {
    setDraggingSiteId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setDraggingSiteId(null)

    if (!over) return

    // 检查是否拖放到收藏区域
    if (over.id === 'favorites-dropzone') {
      const siteId = active.id
      const isAlreadyFavorited = favorites.includes(siteId)
      
      // 如果还没收藏，则添加到收藏
      if (!isAlreadyFavorited) {
        toggleFavorite(siteId)
      }
      return
    }

    // 原有的排序逻辑 (from UltraCompactSiteGrid)
    if (active.id !== over.id) {
      const oldIndex = filteredSites.findIndex((site) => site.id === active.id)
      const newIndex = filteredSites.findIndex((site) => site.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...filteredSites]
        const [movedSite] = newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, movedSite)
        handleReorder(newOrder)
      }
    }
  }

  // 不再显示 loading 屏幕，避免 hydration mismatch
  // 用 isHydrated 控制内容显示

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white transition-colors duration-300">
      <Header
        onGuestTimeExpired={handleGuestTimeExpired}
        onUpgradeClick={handleUpgradeClick}
        onOpenAuth={handleOpenAuthModal}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="container mx-auto px-2 sm:px-4 md:px-6 py-1 sm:py-3">
          {!isHydrated && (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-slate-500 dark:text-white text-xl animate-pulse">Loading...</div>
            </div>
          )}
          
          {isHydrated && (
            <>
              {/* 拖拽提示 - 移动端优化 */}
              {draggingSiteId && !favorites.includes(draggingSiteId) && (
            <div className="fixed top-16 sm:top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 animate-pulse text-sm sm:text-base max-w-[90%] sm:max-w-none text-center">
              <span className="mr-1 sm:mr-2">⭐</span>
              {language === "zh" ? "拖拽到收藏按钮来添加收藏" : "Drag to ⭐ Favorites to add"}
            </div>
          )}

          {/* Data Loss Warning for Guest Users - 移动端优化 */}
          {user.type === "guest" && (favorites.length > 0 || sites.some(site => site.custom)) && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">⚠️</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm sm:text-base">{text.guestBanner.title}</h3>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-100 mt-0.5">
                    {text.guestBanner.description
                      .replace("{favorites}", favorites.length.toString())
                      .replace("{custom}", isHydrated ? sites.filter((s) => s.custom).length.toString() : "0")}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white h-9 sm:h-10 text-sm sm:text-base min-w-[44px] touch-manipulation flex-shrink-0 w-full sm:w-auto"
              >
                <Crown className="w-4 h-4 mr-2" />
                {text.guestBanner.cta}
              </Button>
            </div>
          </div>
        )}

        <FeaturedProducts sites={isHydrated ? sites.filter((site) => site.featured) : []} />

        <SearchAndFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredCount={mounted ? filteredSites.length : 0}
          categoryOrder={canonicalCategoryOrder}
          totalCount={mounted ? nonFeaturedCount : 0}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-2 sm:mb-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold truncate text-slate-900 dark:text-white">{text.stats.heading}</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/60 truncate">{summaryLabel}</p>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔍 [AddSite] 按钮点击，准备打开模态框')
                try {
                  setShowAddModal(true)
                } catch (error) {
                  console.error('🚨 [Add Modal Error]', error)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-blue-600 text-white text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial"
            >
              <Plus className="w-3 h-3 sm:mr-1" />
              <span className="hidden xs:inline ml-1">{text.buttons.addSite}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenParseModal}
              disabled={!isHydrated}
              className={`bg-slate-200/50 dark:bg-white/10 border-slate-200 dark:border-white/20 hover:bg-slate-300 dark:hover:bg-white/20 hover:border-slate-300 dark:hover:border-blue-400 text-slate-700 dark:text-white text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial transition-colors ${
                !isHydrated
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              }`}
            >
              <Sparkles className="w-3 h-3 sm:mr-1 text-blue-600 dark:text-blue-300" />
              <span className="hidden xs:inline ml-1">{text.buttons.smartParse}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shuffleSites}
              disabled={!isHydrated}
              className={`text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial transition-colors ${
                !isHydrated
                  ? "bg-slate-100 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 dark:text-white/40 cursor-not-allowed"
                  : "bg-slate-200/50 dark:bg-white/10 border-slate-200 dark:border-white/20 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white"
              }`}
            >
              <Shuffle className="w-3 h-3 sm:mr-1" />
              <span className="hidden xs:inline ml-1">{text.buttons.shuffle}</span>
            </Button>
          </div>
        </div>

        <UltraCompactSiteGrid
          sites={displayedSites}
          onRemove={removeSite}
          onReorder={handleReorder}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          isDragDisabled={isDragDisabled}
        />
            </>
          )}
        </main>
      </DndContext>

      {/* 模态框总是渲染，保持 Hook 数量一致 */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onAdd={addCustomSite}
        user={user}
        customCount={customSitesCount}
        limit={10}
      />

      <ParseSitesModal
        isOpen={showParseModal}
        onClose={handleCloseParseModal}
        onAddSite={addCustomSite}
        existingUrls={existingUrls}
        isProUser={user.pro}
        remainingSlots={remainingCustomSlots}
      />

      <AuthModal
        open={showAuthModal}
        onOpenChange={handleCloseAuthModal}
        onAuth={handleAuthSuccess}
        authMode={authMode}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
