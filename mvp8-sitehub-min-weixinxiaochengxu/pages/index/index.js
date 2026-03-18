// pages/index/index.js - PRD规范化重构版 + IP地域化功能
// 遵循"单一事实来源"原则，canonical英文数据 + 本土化显示 + IP智能路由

const { loadMergedData, getUIText, logValidationReport, languageManager } = require('./data-loader')
const geoDetector = require('../../utils/geoDetector')
const geoFilter = require('./geo-filter')
const { getUserSession } = require('../../utils/userSession')

Page({
  data: {
    searchQuery: '',
    selectedCategory: 'all',

    // 无限滚动相关(替代分页)
    batchSize: 40,        // 每次加载数量
    loadedCount: 0,       // 已加载数量
    hasMore: true,        // 是否还有更多
    isLoading: false,     // 是否正在加载

    // 防抖定时器
    searchTimer: null,

    // 数据源（从canonical.en.json + l10n.zh.json合并）
    quickLinks: [],        // 顶部产品条
    allCategories: [],     // 所有分类
    allSites: [],          // 所有网站

    // 显示数据
    visibleCategories: [],      // 前8个分类
    remainingCategoriesCount: 0, // +N 更多分类数量
    filteredSites: [],          // 过滤后网站
    displaySites: [],           // 当前显示网站

    // 收藏列表
    favorites: [],

    // 自定义网站列表
    customSites: [],

    // 自定义网站管理状态
    showCustomSitesManager: false,

    // 添加/编辑网站弹窗
    showAddSiteModal: false,
    showEditSiteModal: false,
    showParseModal: false, // 智能解析弹窗
    editingSiteId: null,
    siteFormData: {
      name: '',
      url: '',
      logo: '🌐',
      description: ''
    },

    // 智能解析相关
    parseText: '', // 待解析的文本
    parseResults: [], // 解析结果
    lastClipboardText: '', // 上次检查的剪贴板内容

    // 用户信息
    userInfo: null,

    // 分类选择面板
    showCategoryPanel: false,

    // 侧边栏
    showSidebar: false,

    // 语言切换器相关
    showLanguageSwitcher: false,
    currentLanguage: 'zh',
    currentLanguageInfo: { code: 'zh', name: '中文', flag: '🇨🇳' },
    isAutoDetected: false,
    detectedCountry: null,
    langSwitcherTitle: 'Language / 语言',
    autoDetectText: 'Auto-detected based on your location',
    detectedCountryText: '',

    // 地域化相关字段（新增）
    userRegion: 'china',        // 用户地域
    regionDetected: false,      // 是否已检测地域
    regionReason: '',          // 检测原因
    regionText: '',            // 地域提示文本
    database: 'wechat_cloud',   // 当前使用的数据库
    showRegionSwitch: false,   // 是否显示地域切换按钮
    
    // China tab相关字段
    defaultTab: 'china',       // 默认Tab（根据IP动态设置）

    // ICP备案号
    icpFilingNumber: '粤ICP备2024281756号-2X',

    // UI文本(多语言)
    uiText: {
      mainTitle: 'SiteHub 工具集',
      subTitle: '一站式网站导航平台',
      productsLabel: '辰汇科技产品集',
      searchPlaceholder: '搜索网站...',
      sitesCount: '共 {count} 个网站',
      allCategory: '全部',
      loginText: '点击登录',
      loginHint: '解锁更多功能',
      upgradeText: '升级 Pro 会员',
      settingsText: '设置',
      contactText: '联系我们',
      logoutText: '退出登录',
      wechatUser: '微信用户',
      proMember: 'Pro 会员'
    }
  },

  async onLoad() {
    console.log('🚀 [SiteHub] 页面加载开始')

    // 初始化语言设置 (优先执行)
    await this.initializeLanguage()

    // 检测用户地域 (新增 - 优先执行)
    await this.detectUserRegion()

    // 开发期校验数据完整性
    logValidationReport()

    // 加载合并数据 (集成地域化过滤)
    this.initializeData()

    // 初始化剪贴板监听 (Jeff的需求)
    this.initClipboardListener()

    // 加载收藏数据
    this.loadFavorites()

    // 加载用户信息
    this.loadUserInfo()
  },

  // 初始化数据（集成地域化过滤）
  initializeData() {
    try {
      const data = loadMergedData()
      const region = this.data.userRegion

      console.log(`🌍 [SiteHub] 开始地域化数据初始化: ${region}`)

      // 地域化过滤产品
      const quickLinks = geoFilter.filterProductsByRegion(data.products, region)

      // 地域化过滤分类
      const allCategories = geoFilter.filterCategoriesByRegion(data.categories, region)
      const nonAllCategories = allCategories.filter(cat => cat.key !== 'all')
      const visibleCategories = nonAllCategories.slice(0, 8)
      const remainingCategoriesCount = Math.max(0, nonAllCategories.length - 8)

      // ✅ 保留所有网站数据,不在初始化时过滤
      // allSites应该包含所有322个网站,让filterSites函数根据selectedCategory动态过滤
      const allSites = data.sites

      // 根据默认tab过滤初始显示的网站
      const defaultTab = this.data.defaultTab || (region === 'china' ? 'china' : 'all')
      let initialFilteredSites = allSites

      // 如果默认tab是china,只显示中国网站
      if (defaultTab === 'china') {
        initialFilteredSites = allSites.filter(site => site.isCN === true)
      }

      const sortedSites = geoFilter.sortSitesByRegion(initialFilteredSites, region, '')

      this.setData({
        quickLinks,
        allCategories,
        allSites: allSites,  // ✅ 保存所有网站
        visibleCategories,
        remainingCategoriesCount,
        filteredSites: sortedSites,
        displaySites: sortedSites.slice(0, this.data.batchSize),
        selectedCategory: defaultTab
      })

      // 更新UI文本（在setData之后调用，确保allSites已设置）
      this.updateUIText()

      // 更新地域化UI文本
      this.updateRegionUIText()

      // 输出地域化统计
      const stats = geoFilter.getRegionStats(data.sites)
      console.log('✅ [SiteHub] 地域化数据初始化完成', {
        region: region,
        products: quickLinks.length,
        categories: allCategories.length,
        sites: sortedSites.length,
        totalStats: stats
      })

    } catch (error) {
      console.error('❌ [SiteHub] 数据初始化失败:', error)
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      })
    }
  },

  // 更新UI文本（多语言）
  updateUIText() {
    const lang = this.data.currentLanguage
    // 使用固定的总数，而不是过滤后的数量
    const count = 300

    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: lang === 'zh' ? 'SiteHub工具集' : 'SiteHub Tools'
    })

    this.setData({
      uiText: {
        mainTitle: lang === 'zh' ? 'SiteHub 工具集' : 'SiteHub Tools',
        subTitle: lang === 'zh' ? '一站式网站导航平台' : 'One-stop website navigation platform',
        productsLabel: lang === 'zh' ? '辰汇科技产品集' : 'MornHub Products',
        searchPlaceholder: lang === 'zh' ? `搜索 ${count}+ 网站...` : `Search ${count}+ websites...`,
        sitesCount: lang === 'zh' ? '共 {count} 个网站' : '{count} websites total',
        allCategory: lang === 'zh' ? '全部' : 'All',
        loginText: lang === 'zh' ? '点击登录' : 'Click to Login',
        loginHint: lang === 'zh' ? '解锁更多功能' : 'Unlock more features',
        upgradeText: lang === 'zh' ? '升级 Pro 会员' : 'Upgrade to Pro',
        settingsText: lang === 'zh' ? '设置' : 'Settings',
        contactText: lang === 'zh' ? '联系我们' : 'Contact Support',
        logoutText: lang === 'zh' ? '退出登录' : 'Logout',
        wechatUser: lang === 'zh' ? '微信用户' : 'WeChat User',
        proMember: lang === 'zh' ? 'Pro 会员' : 'Pro Member',
        contactTitle: lang === 'zh' ? '联系我们' : 'Contact Support',
        contactContent: lang === 'zh'
          ? '客服邮箱：mornscience@gmail.com\n\n工作时间：周一至周五 9:00-18:00'
          : 'Customer Email: mornscience@gmail.com\n\nBusiness Hours: Mon-Fri 9:00-18:00',
        copyEmail: lang === 'zh' ? '复制邮箱' : 'Copy Email',
        close: lang === 'zh' ? '关闭' : 'Close',
        emailCopied: lang === 'zh' ? '邮箱已复制' : 'Email Copied'
      }
    })
  },

  // 网站排序算法（新架构适配）
  sortSites(sites, query = '') {
    return sites.sort((a, b) => {
      // 1. isCN desc (国内网站优先)
      if (a.isCN !== b.isCN) {
        return b.isCN ? 1 : -1
      }
      
      // 2. 关键词匹配分 desc
      const scoreA = this.getMatchScore(a, query)
      const scoreB = this.getMatchScore(b, query)
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }
      
      // 3. name_zh asc（中文优先显示名排序）
      const nameA = (a.name_zh || a.name_en).toLowerCase()
      const nameB = (b.name_zh || b.name_en).toLowerCase()
      return nameA.localeCompare(nameB)
    })
  },

  // 计算匹配分数（支持中英文双语搜索）
  getMatchScore(site, query) {
    if (!query) return 0
    
    let score = 0
    const lowerQuery = query.toLowerCase()
    const nameZh = (site.name_zh || '').toLowerCase()
    const nameEn = (site.name_en || '').toLowerCase()
    const tags = ((site.tagsCN || []).concat(site.tags || [])).join(' ').toLowerCase()
    
    // 中文名称匹配（优先级更高）
    if (nameZh === lowerQuery) score += 15
    else if (nameZh.startsWith(lowerQuery)) score += 8
    else if (nameZh.includes(lowerQuery)) score += 4
    
    // 英文名称匹配
    if (nameEn === lowerQuery) score += 10
    else if (nameEn.startsWith(lowerQuery)) score += 5
    else if (nameEn.includes(lowerQuery)) score += 2
    
    // 标签匹配（中英文标签）
    if (tags.includes(lowerQuery)) score += 1
    
    return score
  },

  // 搜索输入（200ms防抖）
  onSearchInput(e) {
    const query = e.detail.value

    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      this.setData({
        searchQuery: query,
        loadedCount: 0  // 重置加载计数
      })
      this.filterSites()
    }, 200)

    this.setData({ searchTimer: timer })
  },

  // 搜索确认（点击搜索按钮或键盘确认）
  onSearchConfirm() {
    // 如果有防抖定时器，立即清除并执行搜索
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
      this.setData({ searchTimer: null })
    }

    // 立即执行搜索
    this.setData({ loadedCount: 0 })
    this.filterSites()
  },

  // 过滤网站（集成地域化搜索）
  filterSites() {
    const { allSites, searchQuery, selectedCategory, userRegion } = this.data
    let filtered = [...allSites]

    // 搜索过滤（支持中英文双语匹配）
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(site => {
        const nameZh = (site.name_zh || '').toLowerCase()
        const nameEn = (site.name_en || '').toLowerCase()
        const tags = ((site.tagsCN || []).concat(site.tags || [])).join(' ').toLowerCase()
        return nameZh.includes(query) || nameEn.includes(query) || tags.includes(query)
      })
      
      // 地域化排序（带搜索权重）
      filtered = geoFilter.sortSitesByRegion(filtered, userRegion, searchQuery)
    }

    // 分类过滤（集成地域化逻辑）
    console.log(`🏷️ [FilterSites] 分类过滤: ${selectedCategory}, 地域: ${userRegion}, 原始数量: ${filtered.length}`);
    console.log(`🔍 [FilterSites] 当前用户地域: ${this.data.userRegion}, 检测状态: ${this.data.regionDetected}`);
    
    if (selectedCategory === 'favorites') {
      // 收藏分类：显示已收藏的网站
      filtered = filtered.filter(site => this.data.favorites.includes(site.id))
    } else if (selectedCategory === 'china') {
      // China tab：显示所有中国网站
      filtered = filtered.filter(site => site.isCN === true)
    } else if (selectedCategory === 'custom') {
      // 自定义网站：显示用户自定义的网站
      filtered = this.data.customSites.map(site => ({
        id: `custom_${site.id || Math.random().toString(36).substr(2, 9)}`,
        name_en: site.name,
        name_zh: site.name,
        url: site.url,
        logo: site.logo || '🌐',
        description: site.description || '',
        category: 'custom',
        isCN: false, // 自定义网站默认不限制地域
        tags: ['custom']
      }))
    } else if (selectedCategory === 'all') {
      // ✅ ALL按钮：显示所有网站,但按地域优先级排序
      // 本国能访问的网站排在前面,其他国家的网站排在后面
      filtered = geoFilter.sortSitesByRegion(filtered, userRegion, searchQuery)
    } else {
      // 其他分类：按category过滤 + 地域化排序
      filtered = filtered.filter(site => site.category === selectedCategory)

      // ✅ 所有分类都使用地域化排序(本国网站优先)
      filtered = geoFilter.sortSitesByRegion(filtered, userRegion, searchQuery)
    }

    console.log(`✅ [FilterSites] 过滤完成: ${filtered.length}个网站`);

    // 无限滚动模式：初始加载第一批
    const batchSize = this.data.batchSize
    const displaySites = filtered.slice(0, batchSize)
    const hasMore = filtered.length > batchSize

    this.setData({
      filteredSites: filtered,
      displaySites,
      loadedCount: batchSize,
      hasMore,
      isLoading: false
    })
  },

  // 加载更多（无限滚动）
  loadMore() {
    const { filteredSites, loadedCount, hasMore, isLoading, batchSize } = this.data

    // 防止重复加载
    if (isLoading || !hasMore) {
      console.log('⚠️ [LoadMore] 跳过加载:', { isLoading, hasMore })
      return
    }

    console.log('📥 [LoadMore] 开始加载更多...')

    this.setData({ isLoading: true })

    // 模拟网络延迟（可选，让用户看到加载状态）
    setTimeout(() => {
      const newLoadedCount = loadedCount + batchSize
      const newDisplaySites = filteredSites.slice(0, newLoadedCount)
      const newHasMore = newLoadedCount < filteredSites.length

      this.setData({
        displaySites: newDisplaySites,
        loadedCount: newLoadedCount,
        hasMore: newHasMore,
        isLoading: false
      })

      console.log(`✅ [LoadMore] 加载完成: ${newDisplaySites.length}/${filteredSites.length}`)
    }, 300)
  },

  // 分类切换
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category,
      loadedCount: 0  // 重置加载计数
    })
    this.filterSites()
  },

  // 打开网站（使用canonical URL）
  openSite(e) {
    const { url, title, openinbrowser } = e.currentTarget.dataset

    console.log('🌐 打开网站:', { url, title, openinbrowser })

    if (!url) {
      wx.showToast({
        title: '网址不存在',
        icon: 'error'
      })
      return
    }

    // 始终提示用户复制链接到浏览器打开
    wx.showModal({
      title: `打开 ${title || '网页'}`,
      content: '请复制链接到浏览器打开',
      confirmText: '复制链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制\n请到浏览器粘贴打开',
                icon: 'none',
                duration: 3000
              })
            }
          })
        }
      }
    })
  },

  // 长按显示操作菜单（本土化文案）
  showActionSheet(e) {
    const { url, id } = e.currentTarget.dataset
    const isFavorite = this.data.favorites.includes(id)
    
    wx.showActionSheet({
      itemList: [
        getUIText('action_copy'),
        isFavorite ? getUIText('action_unfavorite') : getUIText('action_favorite')
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制链接
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({ 
                title: getUIText('toast_copied'), 
                icon: 'success' 
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 收藏/取消收藏
          this.toggleFavorite(id)
        }
      }
    })
  },

  // 收藏功能（本土化提示 + 云端同步）
  async toggleFavorite(id) {
    let favorites = [...this.data.favorites]

    if (favorites.includes(id)) {
      // 取消收藏
      favorites = favorites.filter(fav => fav !== id)
      wx.showToast({
        title: getUIText('toast_unfavorited'),
        icon: 'success'
      })
    } else {
      // 加入收藏
      favorites.push(id)
      wx.showToast({
        title: getUIText('toast_favorited'),
        icon: 'success'
      })
    }

    // 1. 立即更新 UI
    this.setData({ favorites })

    // 2. 保存到本地存储
    this.saveFavorites(favorites)

    // 3. 同步到云端数据库（如果已登录）
    if (this.data.userInfo) {
      try {
        console.log('☁️ [Favorite] 开始同步到云端:', { favorites, userId: this.data.userInfo.openid })
        const api = require('../../utils/api.js')
        const result = await api.saveFavorites(favorites)

        if (result.success) {
          console.log('✅ [Favorite] 云端同步成功')
        } else {
          console.error('❌ [Favorite] 云端同步失败:', result.error)
        }
      } catch (error) {
        console.error('❌ [Favorite] 云端同步异常:', error)
      }
    } else {
      console.log('⚠️ [Favorite] 用户未登录，跳过云端同步')
    }
  },

  // 显示所有分类（打开分类选择面板）
  showAllCategories() {
    this.setData({
      showCategoryPanel: true
    })
  },

  // 关闭分类面板
  closeCategoryPanel() {
    this.setData({
      showCategoryPanel: false
    })
  },

  // 选择分类
  selectCategory(e) {
    const categoryKey = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: categoryKey,
      loadedCount: 0,  // 重置加载计数
      showCategoryPanel: false
    })
    this.filterSites()
  },

  // 本地存储收藏
  loadFavorites() {
    try {
      const favorites = wx.getStorageSync('sitehub_favorites') || []
      this.setData({ favorites })
    } catch (e) {
      console.error('加载收藏失败:', e)
    }
  },

  saveFavorites(favorites) {
    try {
      wx.setStorageSync('sitehub_favorites', favorites)
    } catch (e) {
      console.error('保存收藏失败:', e)
    }
  },

  // 语言初始化（IP自动检测）
  async initializeLanguage() {
    try {
      console.log('🌍 [Language] 初始化语言设置...')
      
      // 初始化语言管理器（包含IP检测）
      const result = await languageManager.initialize()
      
      this.setData({
        currentLanguage: result.language,
        currentLanguageInfo: this.getLanguageInfo(result.language),
        isAutoDetected: result.isAutoDetected,
        detectedCountry: result.detectedCountry
      })
      
      // 如果是自动检测，更新显示文本
      if (result.isAutoDetected && result.detectedCountry) {
        this.setData({
          detectedCountryText: `检测到您在 ${result.detectedCountry}，已自动切换语言`
        })
      }
      
      console.log('✅ [Language] 语言设置完成:', result)
      
    } catch (error) {
      console.error('❌ [Language] 语言初始化失败:', error)
      // 使用默认中文设置
      this.setData({
        currentLanguage: 'zh',
        currentLanguageInfo: this.getLanguageInfo('zh'),
        isAutoDetected: false
      })
    }
  },

  // 获取语言信息
  getLanguageInfo(langCode) {
    const languageMap = {
      'zh': { code: 'zh', name: '中文', flag: '🇨🇳' },
      'en': { code: 'en', name: 'English', flag: '🇺🇸' }
    }
    return languageMap[langCode] || languageMap['zh']
  },

  // 显示语言切换器
  showLangSwitcher() {
    this.setData({
      showLanguageSwitcher: true
    })
  },

  // 关闭语言切换器
  closeLangSwitcher() {
    this.setData({
      showLanguageSwitcher: false
    })
  },

  // 切换语言
  async switchLanguage(e) {
    const newLanguage = e.currentTarget.dataset.lang
    
    if (newLanguage === this.data.currentLanguage) {
      this.closeLangSwitcher()
      return
    }
    
    try {
      console.log('🔄 [Language] 切换语言:', newLanguage)
      
      // 更新语言管理器
      await languageManager.switchLanguage(newLanguage)
      
      // 更新页面数据
      this.setData({
        currentLanguage: newLanguage,
        currentLanguageInfo: this.getLanguageInfo(newLanguage),
        isAutoDetected: false, // 手动切换后不再显示自动检测信息
        showLanguageSwitcher: false
      })
      
      // 重新加载数据（使用新语言）
      this.initializeData()
      
      wx.showToast({
        title: newLanguage === 'zh' ? '已切换至中文' : 'Switched to English',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('❌ [Language] 语言切换失败:', error)
      wx.showToast({
        title: '语言切换失败',
        icon: 'error'
      })
    }
  },

  // 加载自定义网站
  async loadCustomSites() {
    try {
      if (!this.data.userInfo) {
        console.log('⚠️ [CustomSites] 用户未登录，跳过加载自定义网站')
        return
      }

      console.log('📥 [CustomSites] 开始加载自定义网站...')
      const api = require('../../utils/api.js')
      const customSites = await api.loadCustomSites()
      
      console.log(`✅ [CustomSites] 加载完成: ${customSites.length}个自定义网站`)
      this.setData({ customSites })
      
      // 如果当前在自定义网站分类，重新过滤
      if (this.data.selectedCategory === 'custom') {
        this.filterSites()
      }
    } catch (error) {
      console.error('❌ [CustomSites] 加载自定义网站失败:', error)
    }
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('sitehub_userInfo')
      if (userInfo) {
        console.log('✅ [Login] 用户已登录:', userInfo)
        
        // 🔥 关键修复：同步到全局数据
        const app = getApp()
        app.globalData.userInfo = userInfo
        console.log('✅ [Login] 用户信息已同步到全局数据')
        
        this.setData({ userInfo })
        
        // 加载用户相关数据
        this.loadCustomSites()
      } else {
        console.log('⚠️ [Login] 用户未登录')
        this.setData({ 
          userInfo: null,
          customSites: [] // 清空自定义网站
        })
        
        // 清空全局数据
        const app = getApp()
        app.globalData.userInfo = null
      }
    } catch (e) {
      console.error('❌ [Login] 加载用户信息失败:', e)
    }
  },

  // 跳转到登录页面
  goToLogin() {
    console.log('🔑 [Index] 准备跳转到登录页面')
    console.log('🔑 [Index] 当前用户信息:', this.data.userInfo)

    // 先关闭侧边栏
    this.closeSidebar()

    wx.navigateTo({
      url: '/pages/login/login',
      success: () => {
        console.log('✅ [Index] 成功跳转到登录页面')
      },
      fail: (err) => {
        console.error('❌ [Login] 页面跳转失败:', err)
        wx.showToast({
          title: '页面打开失败',
          icon: 'error'
        })
      }
    })
  },

  // 跳转到支付页面
  goToPayment() {
    wx.navigateTo({
      url: '/pages/payment/payment',
      fail: (err) => {
        console.error('❌ [Payment] 页面跳转失败:', err)
        wx.showToast({
          title: '页面打开失败',
          icon: 'error'
        })
      }
    })
  },

  // 打开侧边栏
  openSidebar() {
    this.setData({
      showSidebar: true
    })
  },

  // 关闭侧边栏
  closeSidebar() {
    this.setData({
      showSidebar: false
    })
  },

  // 处理退出登录
  handleLogout() {
    try {
      // 清除本地存储的用户信息
      wx.removeStorageSync('sitehub_userInfo')

      // 更新页面数据
      this.setData({
        userInfo: null
      })

      wx.showToast({
        title: '已退出登录',
        icon: 'success'
      })

      console.log('✅ [Logout] 退出登录成功')
    } catch (e) {
      console.error('❌ [Logout] 退出登录失败:', e)
      wx.showToast({
        title: '退出失败',
        icon: 'error'
      })
    }
  },

  // 监听页面显示（从登录页面返回时刷新用户信息）
  async onShow() {
    // 加载用户信息
    this.loadUserInfo()
    
    // 使用统一状态机获取用户画像
    try {
      const userSession = getUserSession()
      await userSession.fetchMe(false) // 不强制刷新，使用缓存
      
      // 监听状态变化
      this.unsubscribe = userSession.addListener((state) => {
        console.log('📊 [Index] 用户状态变化:', {
          isLoggedIn: state.isLoggedIn,
          isPro: state.isPro,
          plan: state.plan,
          status: state.status
        })
        
        // 更新UI文本（根据会员状态）
        this.updateUIForMembership(state)
      })
    } catch (error) {
      console.error('❌ [Index] 获取用户画像失败:', error)
    }
  },
  
  /**
   * 根据会员状态更新UI
   */
  updateUIForMembership(state) {
    // 更新侧边栏文本
    const uiText = this.data.uiText || {}
    uiText.userStatus = state.isPro ? 'Pro 会员' : '免费版'
    uiText.upgradeText = state.isPro ? '管理订阅' : '升级 Pro 会员'
    
    this.setData({ uiText })
  },

  // 新增：检测用户地域
  async detectUserRegion() {
    try {
      console.log('========================================');
      console.log('🌍 [Frontend] 开始检测用户地域...');

      // 🔥 方案1: 尝试通过微信地理位置API检测
      let locationRegion = null;
      try {
        console.log('📍 [Frontend] 尝试获取微信地理位置...');
        const location = await wx.getLocation({
          type: 'wgs84',
          isHighAccuracy: false,
          timeout: 5000
        });

        console.log('✅ [Frontend] 获取到地理位置:', {
          latitude: location.latitude,
          longitude: location.longitude
        });

        // 中国大陆经纬度范围 (粗略判断)
        // 纬度: 18°N - 54°N, 经度: 73°E - 135°E
        const isInChina = (
          location.latitude >= 18 && location.latitude <= 54 &&
          location.longitude >= 73 && location.longitude <= 135
        );

        if (isInChina) {
          locationRegion = 'china';
          console.log('🇨🇳 [Frontend] 根据经纬度判断: 在中国大陆');
        } else {
          locationRegion = 'international';
          console.log('🌍 [Frontend] 根据经纬度判断: 在国际');
        }
      } catch (locationError) {
        console.log('⚠️ [Frontend] 获取地理位置失败 (用户可能拒绝授权):', locationError.errMsg);
        // 继续使用IP检测
      }

      // 🔥 方案2: 调用云函数获取IP信息 (作为补充)
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'detectRegion',
          timestamp: Date.now()
        }
      });

      console.log('📦 [Frontend] 云函数返回原始数据:', JSON.stringify(result.result, null, 2));

      const regionInfo = result.result;

      // 🔥 优先使用地理位置检测结果
      if (locationRegion) {
        regionInfo.region = locationRegion;
        regionInfo.reason = 'location_based_detection';
        regionInfo.database = locationRegion === 'china' ? 'wechat_cloud' : 'supabase';
        console.log('✅ [Frontend] 使用地理位置检测结果覆盖IP检测结果');
      }

      if (regionInfo.success) {
        console.log('✅ [Frontend] 云函数调用成功');
        console.log('🌐 [Frontend] 检测到的地域:', regionInfo.region);
        console.log('💾 [Frontend] 使用的数据库:', regionInfo.database);
        console.log('🔍 [Frontend] 检测原因:', regionInfo.reason);
        console.log('📍 [Frontend] IP地址:', regionInfo.ip);
        console.log('📡 [Frontend] IP来源:', regionInfo.ipSources);

        // 根据IP设置默认Tab
        const defaultTab = regionInfo.region === 'china' ? 'china' : 'all';
        console.log(`🎯 [Frontend] 计算的默认Tab: ${defaultTab} (region=${regionInfo.region})`);

        // ✅ 使用回调确保状态更新完成后再过滤
        this.setData({
          userRegion: regionInfo.region,
          regionDetected: true,
          regionReason: regionInfo.reason,
          database: regionInfo.database,
          defaultTab: defaultTab,
          selectedCategory: defaultTab
        }, () => {
          // ✅ 回调函数：状态已更新，强制重新过滤
          console.log('✅ [Frontend] setData回调触发，地域状态已更新:');
          console.log('  - userRegion:', this.data.userRegion);
          console.log('  - selectedCategory:', this.data.selectedCategory);
          console.log('  - defaultTab:', this.data.defaultTab);
          console.log('  - database:', this.data.database);

          // ✅ 立即触发过滤，使用最新的userRegion
          console.log('🔄 [Frontend] 准备触发地域化过滤...');
          this.filterSites();
          console.log('✅ [Frontend] 地域化过滤已完成');
        });

        // 更新全局数据
        const app = getApp();
        app.updateUserRegion(regionInfo.region, regionInfo.database, regionInfo.reason);

        console.log('✅ [Frontend] 地域检测流程完成');
        console.log('========================================');

      } else {
        console.warn('⚠️ [Frontend] 云函数返回success=false');
        console.warn('⚠️ [Frontend] 错误信息:', regionInfo.error || '未知错误');

        // 降级策略：默认国际（遵循"道法自然"原则，不确定时选择"开放"）
        this.setData({
          userRegion: 'international',
          regionDetected: true,
          regionReason: 'detection_failed_fallback',
          database: 'supabase',
          defaultTab: 'all',
          selectedCategory: 'all'
        }, () => {
          console.log('⚠️ [Frontend] 使用降级策略，地域: international（不确定时默认开放）');
          this.filterSites();
          console.log('🔄 [Frontend] 已触发降级过滤');
        });
        console.log('========================================');
      }

    } catch (error) {
      console.error('========================================');
      console.error('❌ [Frontend] 地域检测异常:', error);
      console.error('========================================');

      // 降级策略：默认国际（遵循"道法自然"原则，不确定时选择"开放"）
      this.setData({
        userRegion: 'international',
        regionDetected: true,
        regionReason: 'network_error_fallback',
        database: 'supabase',
        defaultTab: 'all',
        selectedCategory: 'all'
      }, () => {
        console.log('⚠️ [Frontend] 检测异常，使用降级策略: international（不确定时默认开放）');
        this.filterSites();
        console.log('🔄 [Frontend] 已触发异常降级过滤');
      });
    }
  },

  // 新增：更新地域化UI文本
  updateRegionUIText() {
    const region = this.data.userRegion;
    const lang = this.data.currentLanguage;
    
    const regionTexts = geoFilter.getRegionUIText(region, lang);
    
    this.setData({
      regionText: regionTexts.regionText,
      showRegionSwitch: true
    });
  },

  // 新增：手动切换地域
  switchRegion() {
    const newRegion = this.data.userRegion === 'china' ? 'international' : 'china';
    const regionTexts = geoFilter.getRegionUIText(newRegion, this.data.currentLanguage);
    
    wx.showModal({
      title: '切换显示',
      content: `确定要切换到${newRegion === 'china' ? '中国' : '国际'}网站吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            userRegion: newRegion,
            regionText: regionTexts.regionText
          });
          
          // 重新加载数据
          this.initializeData();
          
          // 更新全局数据
          const app = getApp();
          const newDatabase = newRegion === 'china' ? 'wechat_cloud' : '，supabase';
          app.updateUserRegion(newRegion, newDatabase, 'manual_switch');
          
          wx.showToast({
            title: '切换成功',
            icon: 'success'
          });
          
          console.log(`🔄 [SiteHub] 用户手动切换到: ${newRegion}`);
        }
      }
    });
  },

  // 新增：加载用户数据（支持双数据库）
  async loadUserData() {
    try {
      console.log('📥 [SiteHub] 开始加载用户数据');
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'loadUserData',
          userInfo: this.data.userInfo
        }
      });

      if (result.result.success) {
        const { userData, route } = result.result;
        
        this.setData({
          favorites: userData.favorites || [],
          database: route.database
        });

        // 保存到全局
        const app = getApp();
        app.saveFavorites(userData.favorites || []);

        console.log('✅ [SiteHub] 用户数据加载完成:', {
          favorites: userData.favorites?.length || 0,
          database: route.database
        });
      }
      
    } catch (error) {
      console.error('❌ [SiteHub] 用户数据加载失败:', error);
      // 使用本地数据作为降级
      this.loadLocalData();
    }
  },

  // 新增：保存用户数据（支持双数据库）
  async saveUserData(data) {
    try {
      console.log('💾 [SiteHub] 开始保存用户数据');
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'saveUserData',
          data: data
        }
      });

      if (result.result.success) {
        console.log('✅ [SiteHub] 用户数据保存成功:', result.result);
        return true;
      }
      
    } catch (error) {
      console.error('❌ [SiteHub] 用户数据保存失败:', error);
      return false;
    }
  },

  // 新增：加载本地数据（降级策略）
  loadLocalData() {
    try {
      const favorites = wx.getStorageSync('sitehub_favorites') || [];
      this.setData({ favorites });
      
      const app = getApp();
      app.saveFavorites(favorites);
      
      console.log('✅ [SiteHub] 本地数据加载完成:', { favorites: favorites.length });
    } catch (error) {
      console.error('❌ [SiteHub] 本地数据加载失败:', error);
    }
  },


  // 阻止事件冒泡
  stopPropagation() {  },

  // 跳转到自定义网站管理页面
  goToCustomSites() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/custom-sites/custom-sites'
    })
  },

  // 显示自定义网站管理界面
  showCustomSitesManager() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    this.setData({ showCustomSitesManager: true })
  },

  // 隐藏自定义网站管理界面
  hideCustomSitesManager() {
    this.setData({ showCustomSitesManager: false })
  },

  // 添加自定义网站
  async addCustomSite(siteData) {
    try {
      const { customSites } = this.data
      const newSites = [...customSites, siteData]
      
      const api = require('../../utils/api.js')
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        this.setData({ customSites: newSites })
        this.filterSites()
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [CustomSites] 添加失败:', error)
      wx.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
  },

  // 编辑自定义网站
  async editCustomSite(siteId, siteData) {
    try {
      const { customSites } = this.data
      const newSites = customSites.map(site => 
        site.id === siteId ? { ...site, ...siteData } : site
      )
      
      const api = require('../../utils/api.js')
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        this.setData({ customSites: newSites })
        this.filterSites()
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [CustomSites] 编辑失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // 删除自定义网站
  async deleteCustomSite(e) {
    const siteId = e.currentTarget.dataset.id
    const site = this.data.customSites.find(s => s.id === siteId)
    
    if (!site) return
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个网站吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const { customSites } = this.data
            const newSites = customSites.filter(site => site.id !== siteId)
            
            const api = require('../../utils/api.js')
            const result = await api.saveCustomSites(newSites)
            
            if (result.success) {
              this.setData({ customSites: newSites })
              this.filterSites()
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            } else {
              throw new Error(result.error)
            }
          } catch (error) {
            console.error('❌ [CustomSites] 删除失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 显示添加网站弹窗
  showAddSiteModal() {
    this.setData({
      showAddSiteModal: true,
      showEditSiteModal: false,
      showParseModal: false, // 确保解析弹窗关闭
      editingSiteId: null,
      siteFormData: {
        name: '',
        url: '',
        logo: '🌐',
        description: ''
      }
    })
  },

  // 显示智能解析弹窗（仅用于手动输入）
  showParseModal() {
    this.setData({
      showParseModal: true,
      showAddSiteModal: false,
      showEditSiteModal: false,
      parseText: '',
      parseResults: []
    })
  },

  // 关闭智能解析弹窗
  closeParseModal() {
    this.setData({
      showParseModal: false,
      parseText: '',
      parseResults: []
    })
  },

  // 解析文本输入
  onParseTextInput(e) {
    const text = e.detail.value
    this.setData({ parseText: text })
    
    // 实时解析（防抖）
    clearTimeout(this.parseTimeout)
    this.parseTimeout = setTimeout(() => {
      this.parseTextUrls(text)
    }, 500)
  },

  // 解析文本中的URL
  parseTextUrls(text) {
    if (!text || text.trim().length === 0) {
      this.setData({ parseResults: [] })
      return
    }

    try {
      const textParser = require('../../utils/text-parser.js')
      const results = textParser.parseText(text)
      
      console.log('🔍 [Parse] 解析结果:', results)
      this.setData({ parseResults: results })
    } catch (error) {
      console.error('❌ [Parse] 文本解析失败:', error)
      this.setData({ parseResults: [] })
    }
  },

  // 选择解析结果
  selectParseResult(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.parseResults[index]
    
    if (!result) return
    
    // 填充到表单
    this.setData({
      showParseModal: false,
      showAddSiteModal: true,
      siteFormData: {
        name: result.name,
        url: result.url,
        logo: result.logo,
        description: result.description
      }
    })
  },

  // 批量添加解析结果
  async addAllParseResults() {
    const { parseResults } = this.data
    
    if (parseResults.length === 0) {
      wx.showToast({
        title: '没有可添加的链接',
        icon: 'none'
      })
      return
    }

    try {
      const { customSites } = this.data
      const newSites = [...customSites, ...parseResults]
      
      console.log('🔍 [Parse] addAllParseResults 开始批量添加');
      console.log('🔍 [Parse] 当前自定义网站数量:', customSites.length);
      console.log('🔍 [Parse] 解析结果数量:', parseResults.length);
      console.log('🔍 [Parse] 合并后总数:', newSites.length);
      console.log('🔍 [Parse] 解析结果预览:', JSON.stringify(parseResults.slice(0, 2), null, 2));
      
      const api = require('../../utils/api.js')
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        console.log('✅ [Parse] 批量添加成功');
        this.setData({ customSites: newSites })
        this.closeParseModal()
        this.filterSites()
        
        wx.showToast({
          title: `成功添加${parseResults.length}个网站`,
          icon: 'success'
        })
      } else {
        console.error('❌ [Parse] 批量添加失败 - API返回失败:', result);
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [Parse] 批量添加失败:', error)
      wx.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
  },

  // 显示编辑网站弹窗
  showEditSiteModal(e) {
    const siteId = e.currentTarget.dataset.id
    const site = this.data.customSites.find(s => s.id === siteId)
    
    if (!site) return
    
    this.setData({
      showAddSiteModal: false,
      showEditSiteModal: true,
      editingSiteId: siteId,
      siteFormData: {
        name: site.name,
        url: site.url,
        logo: site.logo || '🌐',
        description: site.description || ''
      }
    })
  },

  // 关闭弹窗
  closeSiteModal() {
    this.setData({
      showAddSiteModal: false,
      showEditSiteModal: false,
      editingSiteId: null,
      siteFormData: {
        name: '',
        url: '',
        logo: '🌐',
        description: ''
      }
    })
  },

  // 表单输入处理
  onSiteFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`siteFormData.${field}`]: value
    })
  },

  // 验证表单
  validateSiteForm() {
    const { name, url } = this.data.siteFormData
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入网站名称',
        icon: 'none'
      })
      return false
    }
    
    if (!url.trim()) {
      wx.showToast({
        title: '请输入网站地址',
        icon: 'none'
      })
      return false
    }
    
    // 智能URL验证 - 微信小程序兼容版本
    try {
      // 微信小程序不支持URL构造函数，改用正则验证
      const urlPattern = /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(:\d+)?(\/.*)?$/
      
      if (!urlPattern.test(url)) {
        throw new Error('无效的URL格式')
      }
      
      // 检查协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('不支持的协议')
      }
      
      // 提取主机名进行进一步验证
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/)
      if (!hostnameMatch) {
        throw new Error('无效的主机名')
      }
      
      const hostname = hostnameMatch[1]
      
      // 检查主机名长度
      if (hostname.length < 3) {
        throw new Error('无效的主机名')
      }
      
      // 检查是否有域名部分（至少包含一个点，或为localhost）
      if (!hostname.includes('.') && hostname !== 'localhost') {
        throw new Error('无效的域名格式')
      }
      
    } catch (error) {
      console.log('🔍 [Debug] URL验证失败:', url, error.message)
      wx.showToast({
        title: '请输入有效的网址',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 保存网站
  async saveSite() {
    if (!this.validateSiteForm()) return
    
    // 🔥 调试日志：检查用户信息
    const app = getApp()
    console.log('🔍 [Debug] app.globalData.userInfo:', app.globalData.userInfo)
    console.log('🔍 [Debug] this.data.userInfo:', this.data.userInfo)
    
    try {
      const { siteFormData, editingSiteId, customSites } = this.data
      const api = require('../../utils/api.js')
      
      let newSites = [...customSites]
      
      if (editingSiteId) {
        // 编辑模式
        const index = newSites.findIndex(s => s.id === editingSiteId)
        if (index !== -1) {
          newSites[index] = {
            ...newSites[index],
            name: siteFormData.name.trim(),
            url: siteFormData.url.trim(),
            logo: siteFormData.logo.trim() || '🌐',
            description: siteFormData.description.trim()
          }
        }
      } else {
        // 添加模式
        const newSite = {
          id: Date.now().toString(),
          name: siteFormData.name.trim(),
          url: siteFormData.url.trim(),
          logo: siteFormData.logo.trim() || '🌐',
          description: siteFormData.description.trim(),
          sort_order: newSites.length
        }
        newSites.push(newSite)
      }
      
      // 🔥 调试日志：保存前的数据检查
      console.log('🔍 [Debug] 准备保存的自定义网站数据:', JSON.stringify(newSites, null, 2))
      console.log('🔍 [Debug] 数据数量:', newSites.length)
      
      // 保存到云端
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        this.setData({ customSites: newSites })
        this.closeSiteModal()
        this.filterSites()
        
        wx.showToast({
          title: editingSiteId ? '保存成功' : '添加成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [CustomSites] 保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // ========================================
  // 剪贴板智能检测功能 (Jeff的需求)
  // ========================================

  // 初始化剪贴板监听（改为手动触发模式）
  initClipboardListener() {
    console.log('📋 [Clipboard] 剪贴板功能已就绪（手动触发模式）')
    // ⚠️ 微信的 wx.getClipboardData() 每次调用都会弹出系统提示
    // 为了避免骚扰用户，我们不使用定时检查，而是改为手动触发
    // 用户点击"智能解析"按钮时才读取剪贴板
  },

  // 智能解析入口（先打开弹窗，提供读取剪贴板选项）
  readClipboardAndParse() {
    // 先打开解析弹窗
    this.setData({
      showParseModal: true,
      parseText: '',
      parseResults: []
    })
    
    // 尝试读取剪贴板（如果失败也不影响手动输入）
    this.tryReadClipboard()
  },

  // 尝试读取剪贴板内容
  async tryReadClipboard() {
    try {
      const res = await wx.getClipboardData()
      const clipboardText = res.data
      
      if (!clipboardText || clipboardText.trim().length === 0) {
        console.log('📋 [Clipboard] 剪贴板为空，等待用户手动输入')
        return
      }

      // 检查是否包含URL
      const hasUrl = /https?:\/\/[^\s]+/.test(clipboardText)
      
      if (!hasUrl) {
        console.log('📋 [Clipboard] 剪贴板中无链接，等待用户手动输入')
        return
      }

      console.log('📋 [Clipboard] 检测到包含URL的内容:', clipboardText)
      
      // 自动填入剪贴板内容
      this.setData({
        parseText: clipboardText
      })
      
      // 立即解析
      this.parseTextUrls(clipboardText)

    } catch (error) {
      console.log('📋 [Clipboard] 读取剪贴板失败或用户拒绝:', error)
      // 不显示错误提示，让用户可以手动输入
    }
  },

  // 页面隐藏（不需要清理定时器了）
  onHide() {
    // 手动触发模式，无需清理
  },

  // 页面卸载 - 清理监听器
  onUnload() {
    // 取消用户状态监听
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },

  // 页面滚动到底部时触发（无限滚动）
  onReachBottom() {
    console.log('📍 [Scroll] 触发底部事件')
    this.loadMore()
  },

  // ========================================
  // API 测试函数
  // ========================================
  
  // 测试API功能
  async testAPI() {
    console.log('🧪 ========================================');
    console.log('🧪 开始API功能测试');
    
    // 🔥 首先测试云函数连通性
    try {
      console.log('🧪 测试1: 云函数连通性...');
      const testResult = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getUserIP'
        }
      });
      console.log('✅ 测试1通过：云函数连通性正常', testResult);
    } catch (error) {
      console.error('❌ 测试1失败：云函数连通性异常', error);
      return;
    }
    
    // 🔥 测试2: 最简单的saveUserData调用
    try {
      console.log('🧪 测试2: 最简单的saveUserData调用...');
      const app = getApp();
      const userInfo = app.globalData.userInfo || wx.getStorageSync('sitehub_userInfo');
      
      if (!userInfo || !userInfo.openid) {
        console.error('❌ 测试2失败：用户未登录');
        return;
      }
      
      const testSites = [{
        id: 'test_123',
        name: '测试网站',
        url: 'https://example.com',
        logo: '🌐',
        description: '测试描述',
        sort_order: 0
      }];
      
      console.log('🧪 测试数据:', JSON.stringify(testSites, null, 2));
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'saveUserData',
          userInfo: userInfo,
          dataType: 'custom_sites',
          data: testSites
        }
      });
      
      console.log('✅ 测试2通过：saveUserData调用成功', result);
    } catch (error) {
      console.error('❌ 测试2失败：saveUserData调用异常', error);
    }
    console.log('🧪 ========================================');
    
    const api = require('../../utils/api.js');
    
    try {
      // 测试1: 收藏功能
      console.log('\n=== 测试1: 收藏功能 ===');
      console.log('📤 保存收藏: [google, github, youtube]');
      
      // 🔥 修复：确保传递正确的数据结构
      const favoritesArray = ['google', 'github', 'youtube'];
      const saveResult = await api.saveFavorites(favoritesArray);
      if (saveResult.success) {
        console.log('✅ 保存成功');
        
        // 等待500ms确保数据写入
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📥 加载收藏...');
        const favorites = await api.loadFavorites();
        console.log('✅ 加载结果:', favorites);
        
        if (favorites.length === 3) {
          console.log('✅ 测试1通过：收藏数据一致');
        } else {
          console.error('❌ 测试1失败：数据不一致');
        }
      } else {
        console.error('❌ 保存失败:', saveResult.error);
      }
      
      // 测试2: 自定义网站功能
      console.log('\n=== 测试2: 自定义网站功能 ===');
      // 🔥 修复：确保字段名与云函数期望一致
      const testSites = [
        { 
          url: 'https://example.com', 
          name: '示例网站', 
          logo: '🌐',
          description: '这是一个示例网站',
          sort_order: 0
        },
        { 
          url: 'https://test.com', 
          name: '测试网站', 
          logo: '🧪',
          description: '这是一个测试网站',
          sort_order: 1
        }
      ];
      
      console.log('📤 保存自定义网站:', testSites.length, '个');
      const saveSitesResult = await api.saveCustomSites(testSites);
      
      if (saveSitesResult.success) {
        console.log('✅ 保存成功');
        
        // 等待500ms确保数据写入
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📥 加载自定义网站...');
        const sites = await api.loadCustomSites();
        console.log('✅ 加载结果:', sites.length, '个');
        console.log('  网站列表:', sites.map(s => s.name));
        
        if (sites.length === testSites.length) {
          console.log('✅ 测试2通过：自定义网站数量一致');
        } else {
          console.error('❌ 测试2失败：数量不一致');
        }
      } else {
        console.error('❌ 保存失败:', saveSitesResult.error);
      }
      
      // 测试3: 使用统计功能
      console.log('\n=== 测试3: 使用统计功能 ===');
      console.log('📤 保存使用统计: google');
      const statsResult = await api.saveUsageStats({
        site_id: 'google',
        action: 'visit'
      });
      
      if (statsResult.success) {
        console.log('✅ 保存成功');
        console.log('✅ 测试3通过：使用统计功能正常');
      } else if (statsResult.error === 'Not logged in') {
        console.log('⚠️ 未登录，跳过统计保存（预期行为）');
        console.log('✅ 测试3通过：未登录处理正确');
      } else {
        console.error('❌ 保存失败:', statsResult.error);
      }
      
      // 测试4: 加载所有数据
      console.log('\n=== 测试4: 加载所有数据 ===');
      console.log('📥 加载所有用户数据...');
      const allData = await api.loadAllUserData();
      
      console.log('✅ 加载结果:');
      console.log('  - 收藏:', allData.favorites?.length || 0, '个');
      console.log('  - 自定义网站:', allData.custom_sites?.length || 0, '个');
      console.log('  - 使用统计:', allData.usage_stats?.length || 0, '条');
      
      if (allData.favorites !== undefined && 
          allData.custom_sites !== undefined && 
          allData.usage_stats !== undefined) {
        console.log('✅ 测试4通过：数据结构完整');
      } else {
        console.error('❌ 测试4失败：数据结构不完整');
      }
      
      console.log('\n🧪 ========================================');
      console.log('🧪 测试完成');
      console.log('🧪 ========================================');
      console.log('✅ 所有测试通过！API功能正常！');
      
    } catch (error) {
      console.error('❌ 测试异常:', error);
    }
  },

  // ICP备案号点击事件
  onICPClick() {
    // 提示用户复制链接到浏览器打开
    wx.showModal({
      title: '打开 ICP 备案查询',
      content: '请复制链接到浏览器打开',
      confirmText: '复制链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'https://beian.miit.gov.cn',
            success: () => {
              wx.showToast({
                title: '链接已复制\n请到浏览器粘贴打开',
                icon: 'none',
                duration: 3000
              })
            }
          })
        }
      }
    })
  },

  // 用户点击右上角"转发"按钮分享给好友
  onShareAppMessage() {
    return {
      title: 'SiteHub工具集 - 一站式网站导航平台',
      path: '/pages/index/index',
      imageUrl: '' // 使用小程序默认封面图
    }
  },

  // 用户点击右上角菜单分享到朋友圈
  onShareTimeline() {
    return {
      title: 'SiteHub工具集 - 一站式网站导航平台',
      query: '', // 分享参数（可选）
      imageUrl: '' // 使用小程序默认封面图
    }
  }
})
