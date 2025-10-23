/**
 * SiteHub - Your Personal Web Dashboard
 *
 * @author Yuxuan Zhou
 * @copyright 2025 Yuxuan Zhou. All rights reserved.
 * @license MIT
 */

"use client"

// Force client-side rendering to avoid SSR hydration mismatch
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Header } from "@/components/header"
import { FeaturedProducts } from "@/components/featured-products"
import { SearchAndFilters } from "@/components/search-and-filters"
import { UltraCompactSiteGrid } from "@/components/ultra-compact-site-grid"
import { AddSiteModal } from "@/components/add-site-modal"
import { ParseSitesModal } from "@/components/parse-sites-modal"
import { UpgradeModal } from "@/components/upgrade-modal"
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

const canonicalFeaturedProducts: Site[] = (canonical.products || []).map((product) => ({
  id: product.id,
  name: product.name_en,
  nameEn: product.name_en,
  url: product.url,
  logo: product.logo || "🌐",
  category: product.category || "tools",
  featured: true,
  custom: false,
  isChina: product.isCN ?? false,
}))

const canonicalSiteEntries: Site[] = (canonical.sites || []).map((site) => ({
  id: site.id,
  name: site.name_en,
  nameEn: site.name_en,
  url: site.url,
  logo: site.logo || "🌐",
  category: site.category || "tools",
  featured: false,
  custom: false,
  isChina: site.isCN ?? false,
}))

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

// 强制客户端渲染，避免SSR hydration问题
export const dynamic = 'force-dynamic'

export default function SiteHub() {
  const { user, loading: authLoading } = useAuth()
  const { regionCategory, loading: geoLoading, isChina } = useGeo()
  
  // 检查Supabase配置
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log('🔍 [Supabase] 配置检查:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl && !supabaseUrl.includes('placeholder'),
      keyValid: supabaseKey && supabaseKey !== 'placeholder_key'
    })
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

  const [sites, setSites] = useState<Site[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categoryInitialized, setCategoryInitialized] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showParseModal, setShowParseModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [toast, setToast] = useState<any>(null)
  const [isGuestTimeExpired, setIsGuestTimeExpired] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [regionPriorityApplied, setRegionPriorityApplied] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null)
  const [dbAdapter, setDbAdapter] = useState<IDatabaseAdapter | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const customSitesCount = useMemo(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isClient) {
      return 0
    }
    return sites.filter((site) => site.custom).length
  }, [sites, isClient])

  // 计算是否禁用拖拽（需要在 sensors 之前）
  const isDragDisabled = user.type === "guest" && isGuestTimeExpired

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
    if (user.pro) {
      return null
    }
    return Math.max(0, 10 - customSitesCount)
  }, [user.pro, customSitesCount])

  const existingUrls = useMemo(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isClient) {
      return new Set()
    }
    return new Set(sites.map((site) => normalizeUrlForComparison(site.url)))
  }, [sites, isClient])

  const customCountRef = useRef(0)

  useEffect(() => {
    customCountRef.current = customSitesCount
  }, [customSitesCount])

  // Set mounted flag after client-side hydration to prevent SSR/CSR mismatch
  useEffect(() => {
    setMounted(true)
    setIsHydrated(true)
    setIsClient(true)
  }, [])

  useEffect(() => {
    setRegionPriorityApplied(false)
  }, [regionCategory])

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

  // Load favorites from database (for authenticated users) or localStorage (for guests)
  useEffect(() => {
    async function loadFavorites() {
      // 只有在hydration完成且不是loading状态时才加载
      if (authLoading || geoLoading) return
      
      if (user.type === "authenticated" && user.id && dbAdapter) {
        // Authenticated users: load from database adapter (CloudBase or Supabase)
        try {
          const favoriteSiteIds = await dbAdapter.getFavorites()
          setFavorites(favoriteSiteIds)
          console.log('✅ [DB] 加载收藏成功:', favoriteSiteIds.length, '个')
        } catch (error) {
          console.error('❌ [DB] 加载收藏失败:', error)
        }
      } else {
        // Guest users: use localStorage
        if (typeof window !== 'undefined') {
          const savedFavorites = localStorage.getItem("sitehub-favorites")
          if (savedFavorites) {
            try {
              setFavorites(JSON.parse(savedFavorites))
            } catch (error) {
              console.error('❌ [LocalStorage] 解析收藏失败:', error)
            }
          }
        }
      }
    }

    loadFavorites()
  }, [authLoading, geoLoading, user.type, user.id, dbAdapter])

  // Load custom sites from database (for authenticated users) or localStorage (for guests)
  useEffect(() => {
    async function loadSites() {
      // 只有在hydration完成且不是loading状态时才加载
      if (authLoading || geoLoading) return
      
      if (user.type === "authenticated" && user.id && dbAdapter) {
        // Authenticated users: load custom sites from database adapter
        try {
          const data = await dbAdapter.getCustomSites()

          const customSites = data.map((site: any) => ({
            id: site.id || site._id,
            name: site.name,
            nameEn: site.name,
            url: site.url,
            logo: site.logo || "",
            category: site.category || "tools",
            custom: true,
            featured: false,
            isChina: false,
          }))

          // Merge default sites with custom sites
          const defaultSites = getDefaultSites()
          const mergedSites = [...defaultSites, ...customSites]
          const normalizedSites = normalizeSites(mergedSites)
          setSites(localizeSites(prioritizeSitesByRegion(normalizedSites, regionCategory), language))

          console.log('✅ [DB] 加载自定义网站成功:', customSites.length, '个')

          // Migrate localStorage custom sites to database if exists
          if (typeof window !== 'undefined') {
            const localSites = localStorage.getItem("sitehub-sites")
            if (localSites) {
              try {
                const localSitesData = JSON.parse(localSites)
            const customLocalSites = localSitesData.filter((s: Site) => s.custom)

            for (const site of customLocalSites) {
              // Check if site already exists
              const exists = data.some((s: any) => s.url === site.url)
              if (!exists) {
                await dbAdapter.addCustomSite({
                  name: site.name,
                  url: site.url,
                  logo: site.logo,
                  category: site.category,
                })
              }
            }
                // Clear localStorage after migration
                localStorage.removeItem("sitehub-sites")
                console.log('✅ [DB] localStorage自定义网站已迁移到数据库')
              } catch (error) {
                console.error('❌ [DB] 迁移localStorage自定义网站失败:', error)
              }
            }
          }
        } catch (error) {
          console.error('❌ [DB] 加载自定义网站失败:', error)
        }
      } else {
        // Guest users: use localStorage
        if (typeof window !== 'undefined') {
          const savedSites = localStorage.getItem("sitehub-sites")
          if (savedSites) {
            try {
              const parsedSites = JSON.parse(savedSites)
              const normalizedSites = normalizeSites(parsedSites)
              setSites(localizeSites(prioritizeSitesByRegion(normalizedSites, regionCategory), language))
            } catch (error) {
              console.error('❌ [LocalStorage] 解析自定义网站失败:', error)
            }
          } else {
            const defaultSites = getDefaultSites()
            setSites(localizeSites(prioritizeSitesByRegion(defaultSites, regionCategory), language))
          }
        } else {
          const defaultSites = getDefaultSites()
          setSites(localizeSites(prioritizeSitesByRegion(defaultSites, regionCategory), language))
        }
      }
    }

    loadSites()

    // Load shuffle preference
    if (typeof window !== 'undefined') {
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
    if (user.type === "guest" && typeof window !== 'undefined') {
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
  }, [authLoading, geoLoading, user.type, user.id, dbAdapter, regionCategory, language])

  useEffect(() => {
    if (geoLoading) {
      return
    }
    if (regionPriorityApplied) {
      return
    }
    if (sites.length === 0) {
      return
    }

    const prioritized = prioritizeSitesByRegion(sites, regionCategory)
    if (!areSiteOrdersEqual(sites, prioritized)) {
      const localizedPrioritized = localizeSites(prioritized, language)
      setSites(localizedPrioritized)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("sitehub-sites", JSON.stringify(localizedPrioritized))
        } catch (error) {
          console.warn("Failed to persist regional ordering:", error)
        }
      }
    }
    setRegionPriorityApplied(true)
  }, [geoLoading, regionPriorityApplied, sites, regionCategory, language])

  useEffect(() => {
    setSites((prev) => localizeSites(prev, language))
  }, [language])

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
  const filteredSites = useMemo(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isClient) {
      return []
    }
    
    let filtered = sites.filter((site) => !site.featured)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (selectedCategory === "favorites") {
      filtered = filtered.filter((site) => favorites.includes(site.id))
    } else if (selectedCategory === "custom") {
      filtered = filtered.filter((site) => site.custom === true)
    } else if (selectedCategory === "china") {
      filtered = filtered.filter((site) => site.isChina)
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter((site) => site.category === selectedCategory)
    }

    return filtered
  }, [sites, searchQuery, selectedCategory, favorites, isClient])

  const nonFeaturedCount = useMemo(() => {
    // 防止hydration mismatch：只在客户端渲染完成后处理sites
    if (!isClient) {
      return 0
    }
    return sites.filter((site) => !site.featured).length
  }, [sites, isClient])

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

  const handleGuestTimeExpired = () => {
    setIsGuestTimeExpired(true)
    showToast(toastText.timeExpired, "info")
  }

  const handleUpgradeClick = () => {
    // If user is already logged in (authenticated), go to payment page
    if (user.type === 'authenticated') {
      if (typeof window !== 'undefined') {
        window.location.href = '/payment'
      }
      return
    }

    // For guest users, show coming soon message
    alert('注册功能即将上线，敬请期待！')
  }

  const handleAuth = (provider: string) => {
    // Close the upgrade modal first
    setShowUpgradeModal(false)
    
    // Show coming soon message for all auth providers
    if (provider === "login") {
      alert('登录功能即将上线，敬请期待！')
    } else {
      alert('注册功能即将上线，敬请期待！')
    }
  }

  const handleOpenParseModal = () => {
    try {
      if (!user.pro && remainingCustomSlots !== null && remainingCustomSlots <= 0) {
        showToast(toastText.limitReached, "error")
        return
      }

      if (user.type === "guest" && isGuestTimeExpired) {
        setShowUpgradeModal(true)
        return
      }

      setShowParseModal(true)
    } catch (error) {
      console.error('🚨 [Parse Modal Error]', error)
    }
  }

  const shuffleSites = () => {
    if (user.type === "guest" && isGuestTimeExpired) {
      setShowUpgradeModal(true)
      return
    }

    const featuredSites = sites.filter((site) => site.featured)
    const regularSites = sites.filter((site) => !site.featured)

    // Fisher-Yates shuffle for regular sites
    const shuffled = [...regularSites]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const newSites = [...featuredSites, ...shuffled]
    setSites(newSites)
    setIsShuffled(!isShuffled)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("webhub-sites", JSON.stringify(newSites))
        localStorage.setItem("webhub-shuffle", JSON.stringify(!isShuffled))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存随机状态失败:', error)
      }
    }

    showToast(toastText.shuffled)
  }

  const handleReorder = (newSites: Site[]) => {
    if (user.type === "guest" && isGuestTimeExpired) {
      setShowUpgradeModal(true)
      return
    }

    const featuredSites = sites.filter((site) => site.featured)
    const reorderedSites = [...featuredSites, ...newSites]
    setSites(reorderedSites)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("sitehub-sites", JSON.stringify(reorderedSites))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存重排序状态失败:', error)
      }
    }
    showToast(toastText.reordered)
  }

  const addCustomSite = async (newSite: any): Promise<boolean> => {
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
      setShowUpgradeModal(true)
      showToast("Sign up to keep adding custom sites.", "info")
      return false
    }

    try {
      if (user.type === "authenticated" && user.id) {
        console.log('🔍 [AddSite] 准备插入Supabase，用户ID:', user.id)
        const { data, error } = await supabase
          .from("web_custom_sites")
          .insert({
            user_id: user.id,
            name: newSite.name,
            url: newSite.url,
            logo: newSite.logo,
            category: "tools",
          })
          .select()
          .single()

        console.log('🔍 [AddSite] Supabase插入结果:', { data, error })
        if (error || !data) {
          console.error('🔍 [AddSite] Supabase插入失败:', error)
          throw error

      const currentCustomCount = customCountRef.current

      if (!user.pro && currentCustomCount >= 10) {
        showToast("Free limit reached! Upgrade to Pro for unlimited sites.", "error")
        return false
      }

      if (user.type === "guest" && isGuestTimeExpired) {
        setShowUpgradeModal(true)
        showToast("Sign up to keep adding custom sites.", "info")
        return false
      }
      if (user.type === "authenticated" && user.id && dbAdapter) {
        // Add custom site to database
        const success = await dbAdapter.addCustomSite({
          name: newSite.name,
          url: newSite.url,
          logo: newSite.logo,
          category: "tools",
        })

        if (!success) {
          throw new Error('Failed to add custom site to database')
        }

        // Reload sites from database to get the new site with ID
        const customSites = await dbAdapter.getCustomSites()
        const addedSite = customSites.find((s: any) => s.url === newSite.url)

        if (!addedSite) {
          throw new Error('Added site not found in database')
>>>>>>> 81f18acdfbd9a1a0562c6d9824b69a6a77b6cb75
        }

        const siteWithId: Site = {
          ...newSite,
          id: addedSite.id || addedSite._id,
          nameEn: newSite.name,
          custom: true,
          category: "tools",
          isChina: false,
        }

        setSites((prev) => [...prev, siteWithId])

        // Add to favorites
        await dbAdapter.addFavorite(siteWithId.id)
        setFavorites((prev) => [...prev, siteWithId.id])
        showToast(`${newSite.name} added to favorites! ⭐`)
        customCountRef.current += 1
        console.log('✅ [DB] 添加自定义网站成功')
        return true
      }

      const siteWithId: Site = {
        ...newSite,
        id: `custom-${Date.now()}`,
        nameEn: newSite.name,
        custom: true,
        category: "tools",
        isChina: false,
      }

      setSites((prev) => {
        const updated = [...prev, siteWithId]
        if (typeof window !== 'undefined') {
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
        if (typeof window !== 'undefined') {
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
      console.error("Add custom site failed:", error)
      showToast("Failed to add site. Please try again.", "error")
      return false
    }
  }

  const toggleFavorite = async (siteId: string) => {
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("sitehub-favorites", JSON.stringify(newFavorites))
      } catch (error) {
        console.error('❌ [LocalStorage] 保存收藏失败:', error)
      }
    }

    // 4. 异步同步到云端（如果已登录，不阻塞UI）
    if (user.type === "authenticated" && user.id && dbAdapter) {
      try {
        if (isFavorited) {
          // Remove favorite from database
          await dbAdapter.removeFavorite(siteId)
        } else {
          // Add favorite to database
          await dbAdapter.addFavorite(siteId)
        }
        console.log('✅ [DB] 收藏云端同步成功')
      } catch (error) {
        console.error('❌ [DB] 收藏云端同步失败:', error)
        // 即使云端同步失败，本地状态也已经更新了
      }
    }
  }

  const removeSite = async (siteId: string) => {
    if (user.type === "authenticated" && user.id && dbAdapter) {
      // Authenticated users: delete from database
      await dbAdapter.removeCustomSite(siteId)

      // Also remove from favorites if it was favorited
      if (favorites.includes(siteId)) {
        await dbAdapter.removeFavorite(siteId)
        setFavorites(favorites.filter((id) => id !== siteId))
      }

      setSites(sites.filter((site) => site.id !== siteId))
      showToast(toastText.removed)
      console.log('✅ [DB] 删除自定义网站成功')
    } else {
      // Guest users: use localStorage
      const updatedSites = sites.filter((site) => site.id !== siteId)
      setSites(updatedSites)

      if (favorites.includes(siteId)) {
        const newFavorites = favorites.filter((id) => id !== siteId)
        setFavorites(newFavorites)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem("sitehub-favorites", JSON.stringify(newFavorites))
          } catch (error) {
            console.error('❌ [LocalStorage] 保存取消收藏失败:', error)
          }
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("sitehub-sites", JSON.stringify(updatedSites))
        } catch (error) {
          console.error('❌ [LocalStorage] 保存删除网站失败:', error)
        }
      }
      showToast(toastText.removed)
    }
  }

  const showToast = (message: string, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

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

  // Show loading screen while contexts initialize (after all hooks are called)
  if (authLoading || geoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Header
        onGuestTimeExpired={handleGuestTimeExpired}
        onUpgradeClick={handleUpgradeClick}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          {/* 拖拽提示 - 移动端优化 */}
          {draggingSiteId && !favorites.includes(draggingSiteId) && (
            <div className="fixed top-16 sm:top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 animate-pulse text-sm sm:text-base max-w-[90%] sm:max-w-none text-center">
              <span className="mr-1 sm:mr-2">⭐</span>
              {language === "zh" ? "拖拽到收藏按钮来添加收藏" : "Drag to ⭐ Favorites to add"}
            </div>
          )}

          {/* Data Loss Warning for Guest Users - 移动端优化 */}
          {user.type === "guest" && (favorites.length > 0 || sites.some(site => site.custom)) && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">⚠️</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-red-300 text-sm sm:text-base">{text.guestBanner.title}</h3>
                  <p className="text-xs sm:text-sm text-red-200 mt-0.5">
                    {text.guestBanner.description
                      .replace("{favorites}", favorites.length.toString())
                      .replace("{custom}", isClient ? sites.filter((s) => s.custom).length.toString() : "0")}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  alert('注册功能即将上线，敬请期待！')
                }}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white h-9 sm:h-10 text-sm sm:text-base min-w-[44px] touch-manipulation flex-shrink-0 w-full sm:w-auto"
              >
                <Crown className="w-4 h-4 mr-2" />
                {text.guestBanner.cta}
              </Button>
            </div>
          </div>
        )}

        <section className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{text.hero.title}</h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">{text.hero.subtitle}</p>
        </section>

        <FeaturedProducts sites={isClient ? sites.filter((site) => site.featured) : []} />

        <SearchAndFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredCount={mounted ? filteredSites.length : 0}
          categoryOrder={canonicalCategoryOrder}
          totalCount={mounted ? nonFeaturedCount : 0}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold truncate">{text.stats.heading}</h2>
            <p className="text-xs text-white/60 truncate">{summaryLabel}</p>
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
              className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial"
            >
              <Plus className="w-3 h-3 sm:mr-1" />
              <span className="hidden xs:inline ml-1">{text.buttons.addSite}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenParseModal}
              disabled={!user.pro && remainingCustomSlots !== null && remainingCustomSlots <= 0}
              className={`bg-white/10 border-white/20 hover:bg-white/20 hover:border-blue-400 text-white text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial ${
                !user.pro && remainingCustomSlots !== null && remainingCustomSlots <= 0
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              }`}
            >
              <Sparkles className="w-3 h-3 sm:mr-1 text-blue-300" />
              <span className="hidden xs:inline ml-1">{text.buttons.smartParse}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shuffleSites}
              disabled={isDragDisabled}
              className={`text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 min-w-[44px] touch-manipulation flex-1 sm:flex-initial ${
                isDragDisabled
                  ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
              }`}
            >
              <Shuffle className="w-3 h-3 sm:mr-1" />
              <span className="hidden xs:inline ml-1">{text.buttons.shuffle}</span>
            </Button>
          </div>
        </div>

        <UltraCompactSiteGrid
          sites={isClient ? filteredSites : []}
          onRemove={removeSite}
          onReorder={handleReorder}
          onToggleFavorite={toggleFavorite}
          favorites={isClient ? favorites : []}
          isDragDisabled={isDragDisabled}
        />
        </main>
      </DndContext>



      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomSite}
        user={user}
        customCount={customSitesCount}
        limit={10}
      />

      <ParseSitesModal
        isOpen={showParseModal}
        onClose={() => setShowParseModal(false)}
        onAddSite={addCustomSite}
        existingUrls={existingUrls}
        isProUser={user.pro}
        remainingSlots={remainingCustomSlots}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onAuth={handleAuth}
        isTimeExpired={isGuestTimeExpired}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
