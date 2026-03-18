// pages/settings/settings.js
const { languageManager } = require('../index/language-manager')

Page({
  data: {
    // 当前选中的Tab
    currentTab: 'account', // 'account' | 'billing' | 'language' | 'legal'
    
    // 用户信息
    userInfo: null,
    
    // 订阅信息
    subscription: null,
    subscriptionHistory: [],
    loadingSubscription: false,
    
    // 当前语言
    currentLang: 'zh',
    isAutoDetected: false,
    
    // UI文本（多语言）
    uiText: {
      // Tab标签
      tabs: {
        account: '账号',
        billing: '账单',
        language: '语言',
        legal: '法律'
      },
      
      // Account Tab
      account: {
        profileTitle: '个人信息',
        nickname: '昵称',
        userId: '用户ID',
        registered: '注册时间',
        membershipTitle: '会员信息',
        currentPlan: '当前套餐',
        expiresAt: '到期时间',
        autoRenewal: '自动续费',
        enabled: '开启',
        disabled: '关闭',
        free: '免费版',
        pro: 'Pro 会员',
        team: 'Team 会员',
        logout: '退出登录'
      },
      
      // Billing Tab
      billing: {
        statusTitle: '订阅状态',
        plan: '当前套餐',
        nextBilling: '下次扣费',
        autoRenewal: '自动续费',
        upgrade: '升级到 Team 会员',
        manageBilling: '管理订阅',
        historyTitle: '计费历史',
        noSubscription: '暂无订阅',
        noHistory: '暂无历史记录',
        goUpgrade: '立即升级',
        noticeTitle: '重要提示',
        notice1: '• 默认开启自动续费，避免服务中断',
        notice2: '• 可随时通过"管理订阅"关闭自动续费',
        notice3: '• 取消后服务将持续至当前周期结束',
        notice4: '• 如需帮助请联系我们',
        paid: '已支付',
        pending: '待支付',
        refunded: '已退款'
      },
      
      // Language Tab
      language: {
        preferenceTitle: '语言偏好',
        currentLanguage: '当前语言',
        detectionMethod: '检测方式',
        autoDetected: '自动检测（基于IP）',
        manualSelected: '手动选择',
        switchTitle: '切换语言',
        autoOption: '自动检测（推荐）',
        autoDesc: '根据您的IP地址自动选择语言',
        zhOption: '中文（手动选择）',
        zhDesc: '始终使用中文界面',
        enOption: 'English (Manual)',
        enDesc: 'Always use English interface',
        noteTitle: '说明',
        note1: '• 首次访问时根据IP自动选择语言',
        note2: '• 手动选择后将持久化保存',
        note3: '• 手动选择会覆盖IP检测结果'
      },
      
      // Legal Tab
      legal: {
        title: '法律与政策',
        termsOfService: '服务条款',
        privacyPolicy: '隐私政策',
        autoRenewalTerms: '自动续费说明',
        cancellationGuide: '取消订阅指南',
        refundPolicy: '退款政策',
        contactTitle: '联系我们',
        email: '客服邮箱',
        workingHours: '工作时间',
        workingHoursText: '周一至周五 9:00-18:00',
        copyEmail: '复制邮箱',
        emailCopied: '邮箱已复制'
      },
      
      // 通用
      loading: '加载中...',
      loadFailed: '加载失败',
      retry: '重试',
      loginRequired: '请先登录',
      goLogin: '去登录'
    }
  },

  onLoad() {
    console.log('📱 [Settings] 页面加载')
    
    // 初始化语言
    this.initLanguage()
    
    // 加载用户信息
    this.loadUserInfo()
    
    // 加载订阅信息
    this.loadSubscription()
  },

  async onShow() {
    // 🎯 使用统一状态机强制刷新用户画像
    console.log('🔄 [Settings] onShow() 开始加载用户数据...')

    try {
      const { getUserSession } = require('../../utils/userSession')
      const userSession = getUserSession()

      // 强制刷新用户画像（不使用缓存）
      const me = await userSession.fetchMe(true)

      console.log('📊 [诊断] fetchMe返回:', me)

      if (me && me.entitlement) {
        const isActive = me.entitlement.status === 'active'

        console.log('📊 [诊断] entitlement.status:', me.entitlement.status)
        console.log('📊 [诊断] isActive:', isActive)

        // 更新Settings页面显示
        const displayUserInfo = {
          userId: me.userId,
          nickName: me.profile.nickname,
          avatarUrl: me.profile.avatar,
          openid: me.openid,
          pro: isActive,
          isPro: isActive,
          memberType: me.entitlement.plan,
          memberStatus: me.entitlement.status,
          formattedCreatedAt: this.formatDate(me.profile.createdAt)
        }

        this.setData({ userInfo: displayUserInfo })
        wx.nextTick(() => {
          this.loadSubscription()
        })

        // 🎯 关键修复：完整构建subscription对象
        if (isActive && me.entitlement.expiresAt) {
          const expiryDate = new Date(me.entitlement.expiresAt)
          const now = new Date()
          const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))

          // 格式化到期日期
          const formattedExpiry = expiryDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          const subscriptionData = {
            status: 'active',
            plan_type: me.entitlement.plan === 'pro' ? 'personal' : me.entitlement.plan,
            current_period_end: me.entitlement.expiresAt,
            formattedExpiry: formattedExpiry,
            billing_display_date: formattedExpiry,
            daysLeft: daysLeft > 0 ? daysLeft : 0,
            isExpiringSoon: daysLeft <= 7 && daysLeft > 0,
            amount: me.entitlement.plan === 'pro' ? 19.99 : 299.99,
            billing_cycle: 'monthly'  // 默认显示月付
          }

          console.log('✅ [诊断] 订阅对象已构建:', subscriptionData)

          this.setData({
            isPro: true,
            subscription: subscriptionData
          })
        } else {
          // 非active状态，确保isPro为false
          console.log('⚠️ [诊断] 非会员状态')
          this.setData({
            isPro: false,
            subscription: null
          })
        }

        // 🔍 诊断输出：检查最终的页面数据
        console.log('📊 [诊断] 最终页面数据:')
        console.log('  - isPro:', this.data.isPro)
        console.log('  - subscription:', this.data.subscription)
        console.log('  - userInfo.isPro:', this.data.userInfo?.isPro)

        console.log('✅ [Settings] 用户画像已更新')
      } else {
        console.warn('⚠️ [Settings] fetchMe返回空数据或无entitlement')
      }
    } catch (error) {
      console.error('❌ [Settings] 获取用户画像失败:', error)
      // 降级到旧的加载方式
      if (this.data.userInfo) {
        console.log('🔄 [Settings] 降级：使用loadSubscription()')
        this.loadSubscription()
      }
    }
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.loadUserInfo()
    this.loadSubscription()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // ========================================
  // 初始化和加载数据
  // ========================================

  initLanguage() {
    const lang = wx.getStorageSync('sitehub_language') || 'zh'
    const manager = languageManager.languageManager || languageManager
    const isAutoDetected = manager.isAutoDetected || false
    
    this.setData({
      currentLang: lang,
      isAutoDetected: isAutoDetected
    })
    
    this.updateUIText(lang)
  },

  async loadUserInfo() {
    try {
      const app = getApp()
      let userInfo = app.globalData.userInfo
      
      // 从本地存储加载
      if (!userInfo) {
        userInfo = wx.getStorageSync('sitehub_userInfo')
      }
      
      if (!userInfo || !userInfo.openid) {
        // 未登录，提示登录
        this.showLoginPrompt()
        return
      }
      
      // 从数据库获取完整用户信息（包括注册时间）
      console.log('📡 [Settings] 从数据库获取完整用户信息')
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getUserInfo',
          userInfo: userInfo
        }
      })
      
      if (result.result && result.result.success) {
        const fullUserInfo = result.result.data
        console.log('✅ [Settings] 获取完整用户信息成功:', fullUserInfo)
        
        // 合并本地信息和数据库信息
        const mergedUserInfo = {
          ...userInfo,
          ...fullUserInfo,
          nickName: fullUserInfo.nickname || userInfo.nickName,
          avatarUrl: fullUserInfo.avatar_url || userInfo.avatarUrl,
          // 格式化注册时间
          formattedCreatedAt: this.formatDate(fullUserInfo.created_at)
        }
        
        this.setData({ userInfo: mergedUserInfo })
        wx.nextTick(() => {
          this.loadSubscription()
        })
        
        // 同步到全局数据和本地存储
        app.globalData.userInfo = mergedUserInfo
        wx.setStorageSync('sitehub_userInfo', mergedUserInfo)
        
      } else {
        console.warn('⚠️ [Settings] 获取完整用户信息失败，使用本地信息')
        // 格式化本地时间
        if (userInfo.createdAt) {
          userInfo.formattedCreatedAt = this.formatDate(userInfo.createdAt)
        }
        this.setData({ userInfo })
        wx.nextTick(() => {
          this.loadSubscription()
        })
      }
    } catch (error) {
      console.error('❌ [Settings] 加载用户信息失败:', error)
      // 降级：使用本地信息
      const app = getApp()
      const userInfo = app.globalData.userInfo || wx.getStorageSync('sitehub_userInfo')
      if (userInfo) {
        // 格式化本地时间
        if (userInfo.createdAt) {
          userInfo.formattedCreatedAt = this.formatDate(userInfo.createdAt)
        }
        this.setData({ userInfo })
        wx.nextTick(() => {
          this.loadSubscription()
        })
      }
    }
  },

  async loadSubscription() {
    if (!this.data.userInfo) return
    
    this.setData({ loadingSubscription: true })
    
    try {
      // 调用新的订阅云函数获取订阅状态
      const result = await wx.cloud.callFunction({
        name: 'wechatPaySubscription',
        data: {
          action: 'getSubscriptionStatus',
          userInfo: this.data.userInfo
        }
      })
      
      console.log('✅ [Settings] 订阅状态:', result)

      if (result.result && result.result.success && result.result.data) {
        // 格式化订阅数据供UI使用
        const subscription = this.formatSubscriptionData(result.result.data)

        this.setData({
          subscription: subscription,
          isPro: subscription.status === 'active',
          loadingSubscription: false
        })

        // 同时加载订阅历史
        this.loadSubscriptionHistory()
      } else {
        this.setData({
          subscription: null,
          isPro: false,
          loadingSubscription: false
        })
      }
    } catch (error) {
      console.error('❌ [Settings] 加载订阅失败:', error)
      this.setData({ loadingSubscription: false })
    }
  },

  // 格式化订阅数据供UI显示
  formatSubscriptionData(subscription) {
    if (!subscription) return null

    try {
      const planMeta = {
        personal: {
          tierLabel: '个人版',
          displayName: 'Pro 会员',
          summary: '以下权益已为你开启',
          features: [
            '无限收藏与自定义站点',
            '跨设备数据实时同步',
            '无广告纯净体验',
            '优先客服支持与反馈直达',
            '数据导出与批量管理工具',
            '智能推荐算法增强'
          ],
          canUpgrade: true
        },
        team: {
          tierLabel: '团队版',
          displayName: 'Team 会员',
          summary: '团队高级权益已为你开启',
          features: [
            '团队成员统一管理与分工',
            '无限团队收藏与共享站点',
            '团队看板与协作审批流程',
            '企业级数据导出与审计日志',
            '多管理员权限控制',
            '专属客户成功与优先支持'
          ],
          canUpgrade: false
        }
      }

      const normalizedPlan = (() => {
        const planType = subscription.planType || subscription.plan_type || 'personal'
        if (planType === 'team') return 'team'
        if (planType === 'pro') return 'personal'
        return 'personal'
      })()

      const planInfo = planMeta[normalizedPlan] || planMeta.personal
      const pricingTable = {
        personal: { monthly: '19.99', yearly: '168.00' },
        team: { monthly: '299.99', yearly: '2520.00' }
      }
      const rawCycle = subscription.billingCycle || subscription.billing_cycle || ''
      const normalizedCycle = rawCycle.toLowerCase() === 'yearly' ? 'yearly' : 'monthly'
      const numericAmount = subscription.amount != null ? Number(subscription.amount) : null
      const displayAmount = numericAmount != null && !Number.isNaN(numericAmount)
        ? numericAmount.toFixed(2)
        : (pricingTable[normalizedPlan]?.[normalizedCycle] || '')
      const displayCurrency = subscription.currency || 'CNY'
      const startRaw = subscription.startDate || subscription.start_date
      const formattedStart = startRaw ? new Date(startRaw).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '未知'

      // 计算剩余天数
      const endDateRaw = subscription.currentPeriodEnd || subscription.current_period_end
      const endDate = endDateRaw ? new Date(endDateRaw) : null
      const now = new Date()
      const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0

      // 格式化到期日期
      const formattedExpiry = endDate ? endDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '--'
      const billingDisplayDate = formattedExpiry

      const canUpgrade = planInfo.canUpgrade || !!subscription.cancelAtPeriodEnd

      const formattedSubscription = {
        ...subscription,
        current_period_end: endDateRaw,
        plan_type: normalizedPlan,
        billing_cycle: rawCycle,
        cancel_at_period_end: subscription.cancelAtPeriodEnd,
        formattedExpiry: formattedExpiry,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        isExpiringSoon: endDate ? (daysLeft <= 7 && daysLeft > 0) : false,
        plan_display: planInfo.displayName,
        plan_tier_label: planInfo.tierLabel,
        plan_summary: planInfo.summary,
        featureList: planInfo.features,
        canUpgrade: canUpgrade,
        displayAmount,
        displayCurrency,
        normalizedCycle,
        billing_display_date: billingDisplayDate,
        start_display_date: formattedStart,
        start_date: startRaw
      }

      return formattedSubscription
    } catch (error) {
      console.error('❌ [Settings] 格式化订阅数据失败:', error)
      return subscription
    }
  },

  async loadSubscriptionHistory() {
    if (!this.data.userInfo) return
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'wechatPaySubscription',
        data: {
          action: 'getSubscriptionHistory',
          userInfo: this.data.userInfo
        }
      })
      
      if (result.result && result.result.success) {
        const history = (result.result.data.history || []).map(item => {
          const numericAmount = item.amount != null ? Number(item.amount) : null
          const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : '--'
          return {
            ...item,
            created_at_formatted: formattedDate,
            displayAmount: numericAmount != null && !Number.isNaN(numericAmount) ? numericAmount.toFixed(2) : item.amount
          }
        })

        this.setData({
          subscriptionHistory: history
        })
      }
    } catch (error) {
      console.error('❌ [Settings] 加载订阅历史失败:', error)
    }
  },

  // ========================================
  // Tab 切换
  // ========================================

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    
    // 切换到标题
    const titles = {
      account: this.data.uiText.tabs.account,
      billing: this.data.uiText.tabs.billing,
      language: this.data.uiText.tabs.language,
      legal: this.data.uiText.tabs.legal
    }
    wx.setNavigationBarTitle({
      title: titles[tab] || 'Settings'
    })
  },

  // ========================================
  // Account Tab 操作
  // ========================================

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          wx.removeStorageSync('sitehub_userInfo')
          wx.removeStorageSync('sitehub_favorites')
          
          // 清除全局数据
          const app = getApp()
          app.globalData.userInfo = null
          
          // 返回首页
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // ========================================
  // Billing Tab 操作
  // ========================================

  onUpgrade() {
    // 跳转到支付页面
    wx.navigateTo({
      url: '/pages/payment/payment'
    })
  },

  onViewBilling() {
    // 切换到账单tab
    this.setData({ currentTab: 'billing' })
  },

  onManageBilling() {
    if (!this.data.subscription) {
      wx.showToast({
        title: '暂无订阅',
        icon: 'none'
      })
      return
    }
    
    // 显示管理选项
    const actions = []
    
    if (this.data.subscription.cancel_at_period_end) {
      // 已标记取消，提供重新激活选项
      actions.push('重新激活订阅')
    } else {
      // 未取消，提供取消选项
      actions.push('取消订阅')
    }
    
    actions.push('查看详情')
    
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        if (res.tapIndex === 0) {
          if (this.data.subscription.cancel_at_period_end) {
            this.reactivateSubscription()
          } else {
            this.cancelSubscription()
          }
        } else if (res.tapIndex === 1) {
          this.showSubscriptionDetail()
        }
      }
    })
  },

  cancelSubscription() {
    const sub = this.data.subscription
    const planLabel = sub.plan_display || (sub.plan_type === 'team' ? 'Team 会员' : 'Pro 会员')
    const endDate = sub.billing_display_date || this.formatDate(sub.current_period_end)
    
    wx.showModal({
      title: '取消订阅',
      content: `确定要取消订阅吗？\n\n取消后，您的${planLabel}服务将在当前付费周期结束时停止。\n\n服务将持续到：${endDate}`,
      confirmText: '确认取消',
      cancelText: '我再想想',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'wechatPaySubscription',
              data: {
                action: 'cancelSubscription',
                userInfo: this.data.userInfo,
                subscriptionId: sub.id
              }
            })
            
            wx.hideLoading()
            
            if (result.result && result.result.success) {
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              })
              
              // 重新加载订阅状态
              this.loadSubscription()
            } else {
              wx.showToast({
                title: result.result.error || '取消失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            wx.showToast({
              title: '操作失败',
              icon: 'error'
            })
            console.error('❌ [Settings] 取消订阅失败:', error)
          }
        }
      }
    })
  },

  async reactivateSubscription() {
    const sub = this.data.subscription
    
    wx.showModal({
      title: '重新激活订阅',
      content: `确定要重新激活订阅吗？\n\n您的${sub.plan_type === 'pro' ? 'Pro' : 'Team'}会员服务将继续自动续费。`,
      confirmText: '确认激活',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'wechatPaySubscription',
              data: {
                action: 'reactivateSubscription',
                userInfo: this.data.userInfo,
                subscriptionId: sub.id
              }
            })
            
            wx.hideLoading()
            
            if (result.result && result.result.success) {
              wx.showToast({
                title: '激活成功',
                icon: 'success'
              })
              
              // 重新加载订阅状态
              this.loadSubscription()
            } else {
              wx.showToast({
                title: result.result.error || '激活失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            wx.showToast({
              title: '操作失败',
              icon: 'error'
            })
            console.error('❌ [Settings] 重新激活失败:', error)
          }
        }
      }
    })
  },

  showSubscriptionDetail() {
    const sub = this.data.subscription
    const planLabel = sub.plan_display || (sub.plan_type === 'team' ? 'Team 会员' : 'Pro 会员')
    const cycleLabel = sub.normalizedCycle === 'yearly' ? '年付' : '月付'
    const amountText = sub.displayAmount || sub.amount || '--'
    const startDate = sub.start_display_date || (sub.start_date ? this.formatDate(sub.start_date) : '未知')
    const endDate = sub.billing_display_date || sub.formattedExpiry || this.formatDate(sub.current_period_end)
    
    const content = `套餐类型：${planLabel}\n` +
                   `计费周期：${cycleLabel}\n` +
                   `支付金额：¥${amountText}\n` +
                   `开始时间：${startDate}\n` +
                   `到期时间：${endDate}\n` +
                   `自动续费：${sub.cancel_at_period_end ? '已关闭' : '已开启'}`
    
    wx.showModal({
      title: '订阅详情',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // ========================================
  // Language Tab 操作
  // ========================================

  onLanguageChange(e) {
    const lang = e.currentTarget.dataset.lang
    
    // 更新语言
    languageManager.switchLanguage(lang)
    
    // 更新界面
    this.setData({
      currentLang: lang,
      isAutoDetected: false
    })
    
    this.updateUIText(lang)
    
    // 提示需要重新加载
    wx.showModal({
      title: '语言已切换',
      content: '部分界面需要重新加载才能生效，是否立即重新加载？',
      confirmText: '立即重新加载',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // ========================================
  // 头像错误处理
  // ========================================
  
  onAvatarError(e) {
    console.log('❌ [Settings] 头像加载失败:', e)
    
    // 更新为默认头像
    const userInfo = this.data.userInfo
    if (userInfo) {
      userInfo.avatarUrl = 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
      
      this.setData({ userInfo })
      
      // 更新本地存储
      wx.setStorageSync('sitehub_userInfo', userInfo)
      
      // 更新全局数据
      const app = getApp()
      if (app.globalData.userInfo) {
        app.globalData.userInfo.avatarUrl = userInfo.avatarUrl
      }
      
      console.log('✅ [Settings] 头像已更新为默认头像')
    }
  },

  // ========================================
  // Legal Tab 操作
  // ========================================

  onLegalItemClick(e) {
    const item = e.currentTarget.dataset.item
    
    // 跳转到法律条款页面
    wx.navigateTo({
      url: `/pages/legal/legal?type=${item}`
    })
  },

  onCopyEmail() {
    wx.setClipboardData({
      data: 'mornscience@gmail.com',
      success: () => {
        wx.showToast({
          title: this.data.uiText.legal.emailCopied,
          icon: 'success'
        })
      }
    })
  },

  // ========================================
  // 辅助方法
  // ========================================

  showLoginPrompt() {
    wx.showModal({
      title: this.data.uiText.loginRequired,
      content: '请先登录以查看设置',
      confirmText: this.data.uiText.goLogin,
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        } else {
          // 返回首页
          wx.navigateBack()
        }
      }
    })
  },

  updateUIText(lang) {
    const uiText = lang === 'en' ? this.getEnglishText() : this.getChineseText()
    this.setData({ uiText })
    
    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: uiText.tabs[this.data.currentTab]
    })
  },

  getChineseText() {
    return {
      tabs: {
        account: '账号',
        billing: '账单',
        language: '语言',
        legal: '法律'
      },
      account: {
        profileTitle: '个人信息',
        nickname: '昵称',
        userId: '用户ID',
        registered: '注册时间',
        membershipTitle: '会员信息',
        currentPlan: '当前套餐',
        expiresAt: '到期时间',
        autoRenewal: '自动续费',
        enabled: '开启',
        disabled: '关闭',
        free: '免费版',
        pro: 'Pro 会员',
        team: 'Team 会员',
        logout: '退出登录'
      },
      billing: {
        statusTitle: '订阅状态',
        plan: '当前套餐',
        nextBilling: '下次扣费',
        autoRenewal: '自动续费',
        upgrade: '升级到 Team 会员',
        manageBilling: '管理订阅',
        historyTitle: '计费历史',
        noSubscription: '暂无订阅',
        noHistory: '暂无历史记录',
        goUpgrade: '立即升级',
        noticeTitle: '重要提示',
        notice1: '• 默认开启自动续费，避免服务中断',
        notice2: '• 可随时通过"管理订阅"关闭自动续费',
        notice3: '• 取消后服务将持续至当前周期结束',
        notice4: '• 如需帮助请联系我们',
        paid: '已支付',
        pending: '待支付',
        refunded: '已退款'
      },
      language: {
        preferenceTitle: '语言偏好',
        currentLanguage: '当前语言',
        detectionMethod: '检测方式',
        autoDetected: '自动检测（基于IP）',
        manualSelected: '手动选择',
        switchTitle: '切换语言',
        autoOption: '自动检测（推荐）',
        autoDesc: '根据您的IP地址自动选择语言',
        zhOption: '中文（手动选择）',
        zhDesc: '始终使用中文界面',
        enOption: 'English (Manual)',
        enDesc: 'Always use English interface',
        noteTitle: '说明',
        note1: '• 首次访问时根据IP自动选择语言',
        note2: '• 手动选择后将持久化保存',
        note3: '• 手动选择会覆盖IP检测结果'
      },
      legal: {
        title: '法律与政策',
        termsOfService: '服务条款',
        privacyPolicy: '隐私政策',
        autoRenewalTerms: '自动续费说明',
        cancellationGuide: '取消订阅指南',
        refundPolicy: '退款政策',
        contactTitle: '联系我们',
        email: '客服邮箱',
        workingHours: '工作时间',
        workingHoursText: '周一至周五 9:00-18:00',
        copyEmail: '复制邮箱',
        emailCopied: '邮箱已复制'
      },
      loading: '加载中...',
      loadFailed: '加载失败',
      retry: '重试',
      loginRequired: '请先登录',
      goLogin: '去登录'
    }
  },

  getEnglishText() {
    return {
      tabs: {
        account: 'Account',
        billing: 'Billing',
        language: 'Language',
        legal: 'Legal'
      },
      account: {
        profileTitle: 'Profile',
        nickname: 'Nickname',
        userId: 'User ID',
        registered: 'Registered',
        membershipTitle: 'Membership',
        currentPlan: 'Current Plan',
        expiresAt: 'Expires At',
        autoRenewal: 'Auto-renewal',
        enabled: 'Enabled',
        disabled: 'Disabled',
        free: 'Free',
        pro: 'Pro Member',
        team: 'Team Member',
        logout: 'Logout'
      },
      billing: {
        statusTitle: 'Subscription Status',
        plan: 'Current Plan',
        nextBilling: 'Next Billing',
        autoRenewal: 'Auto-renewal',
        upgrade: 'Upgrade to Team',
        manageBilling: 'Manage Billing',
        historyTitle: 'Billing History',
        noSubscription: 'No Subscription',
        noHistory: 'No History',
        goUpgrade: 'Upgrade Now',
        noticeTitle: 'Important Notice',
        notice1: '• Auto-renewal is enabled by default',
        notice2: '• You can turn off auto-renewal anytime',
        notice3: '• Service continues until current period ends',
        notice4: '• Contact us if you need help',
        paid: 'Paid',
        pending: 'Pending',
        refunded: 'Refunded'
      },
      language: {
        preferenceTitle: 'Language Preference',
        currentLanguage: 'Current Language',
        detectionMethod: 'Detection Method',
        autoDetected: 'Auto-detected (IP-based)',
        manualSelected: 'Manual Selection',
        switchTitle: 'Switch Language',
        autoOption: 'Auto-detect (Recommended)',
        autoDesc: 'Automatically select based on your IP',
        zhOption: '中文 (Manual)',
        zhDesc: 'Always use Chinese interface',
        enOption: 'English (Manual)',
        enDesc: 'Always use English interface',
        noteTitle: 'Note',
        note1: '• Language is auto-detected on first visit',
        note2: '• Manual selection will be persisted',
        note3: '• Manual selection overrides IP detection'
      },
      legal: {
        title: 'Legal & Policies',
        termsOfService: 'Terms of Service',
        privacyPolicy: 'Privacy Policy',
        autoRenewalTerms: 'Auto-renewal Terms',
        cancellationGuide: 'Cancellation Guide',
        refundPolicy: 'Refund Policy',
        contactTitle: 'Contact Us',
        email: 'Support Email',
        workingHours: 'Working Hours',
        workingHoursText: 'Mon-Fri 9:00-18:00',
        copyEmail: 'Copy Email',
        emailCopied: 'Email Copied'
      },
      loading: 'Loading...',
      loadFailed: 'Load Failed',
      retry: 'Retry',
      loginRequired: 'Login Required',
      goLogin: 'Go to Login'
    }
  },

  // ========================================
  // 工具方法
  // ========================================

  // 格式化日期（显示年月日）
  formatDate(dateString) {
    if (!dateString) return '未知'
    
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      // 根据语言显示不同格式
      if (this.data.currentLang === 'zh') {
        return `${year}年${month}月${day}日`
      } else {
        return `${month}/${day}/${year}`
      }
    } catch (error) {
      console.error('❌ 日期格式化失败:', error)
      return '格式错误'
    }
  }
})
