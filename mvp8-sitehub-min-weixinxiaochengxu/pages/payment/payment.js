// pages/payment/payment.js
const languageManager = require('../index/language-manager')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    planType: 'personal', // 'personal' | 'team'
    billingCycle: 'yearly', // 'monthly' 或 'yearly'
    currentPrice: '168',
    loading: false,
    currentLang: 'zh', // 当前语言

    // 语言切换器相关
    showLanguageSwitcher: false,
    currentLanguage: 'zh',
    currentLanguageInfo: { code: 'zh', name: '中文', flag: '🇨🇳' },
    langSwitcherTitle: 'Language / 语言',

    // 套餐价格
    prices: {
      personal: {
        monthly: '19.99',
        yearly: '168'
      },
      team: {
        monthly: '299.99',
        yearly: '2520'
      }
    },

    // UI文本
    uiText: {
      pageTitle: '升级 Pro 会员',
      upgradeTitle: '升级到 Pro 会员',
      unlockFeatures: '解锁所有高级功能',
      monthly: '月付',
      yearly: '年付',
      perMonth: '/月',
      perYear: '/年',
      save30: '省30%',
      subscribe: '立即订阅',
      currency: '¥',
      // 功能列表
      features: [
        '无限收藏夹',
        '自定义网站',
        '云端同步',
        '无广告体验',
        '优先客服支持',
        '高级搜索功能',
        '数据导出',
        '团队协作（即将推出）'
      ],
      // 弹窗文本
      loginRequired: '需要登录',
      loginPrompt: '购买会员需要先登录，是否前往登录？',
      goLogin: '去登录',
      cancel: '取消'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取当前语言
    const lang = wx.getStorageSync('sitehub_language') || 'zh'
    this.setData({ 
      currentLang: lang,
      currentLanguage: lang,
      currentLanguageInfo: this.getLanguageInfo(lang)
    })
    this.updateUIText(lang)

    // 检查登录状态
    this.checkLoginStatus()

    // 可以从上一页传入套餐类型
    if (options.cycle) {
      this.setData({
        billingCycle: options.cycle
      })
    }

    // 初始化价格显示
    this.updatePrice()
  },

  // 切换套餐类型
  selectPlanType(e) {
    const planType = e.currentTarget.dataset.plan
    this.setData({ planType })
    this.updatePrice()
  },

  // 更新价格显示
  updatePrice() {
    const { planType, billingCycle, prices } = this.data
    const currentPrice = prices[planType][billingCycle]
    
    this.setData({
      currentPrice: currentPrice.toString()
    })
  },

  // 更新UI文本
  updateUIText(lang) {
    const isEn = lang === 'en'
    this.setData({
      uiText: {
        pageTitle: isEn ? 'Upgrade to Pro' : '升级 Pro 会员',
        upgradeTitle: isEn ? 'Upgrade to Pro' : '升级到 Pro 会员',
        unlockFeatures: isEn ? 'Unlock all premium features' : '解锁所有高级功能',
        monthly: isEn ? 'Monthly' : '月付',
        yearly: isEn ? 'Yearly' : '年付',
        perMonth: isEn ? '/month' : '/月',
        perYear: isEn ? '/year' : '/年',
        save30: isEn ? 'Save 30%' : '省30%',
        subscribe: isEn ? 'Subscribe Now' : '立即订阅',
        currency: '¥',  // 🔒 固定为人民币符号，因为所有支付都通过微信支付（人民币）
        features: isEn ? [
          'Unlimited Favorites',
          'Custom Websites',
          'Cloud Sync',
          'Ad-free Experience',
          'Priority Support',
          'Advanced Search',
          'Data Export',
          'Team Collaboration (Coming Soon)'
        ] : [
          '无限收藏夹',
          '自定义网站',
          '云端同步',
          '无广告体验',
          '优先客服支持',
          '高级搜索功能',
          '数据导出',
          '团队协作（即将推出）'
        ],
        loginRequired: isEn ? 'Login Required' : '需要登录',
        loginPrompt: isEn ? 'Please login to purchase membership. Go to login?' : '购买会员需要先登录，是否前往登录？',
        goLogin: isEn ? 'Login' : '去登录',
        cancel: isEn ? 'Cancel' : '取消',
        personal: isEn ? 'Personal' : '个人',
        team: isEn ? 'Team' : '团队'
      }
    })
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('sitehub_userInfo')

      if (!userInfo) {
        // 未登录，显示提示并跳转到登录页
        wx.showModal({
          title: this.data.uiText.loginRequired,
          content: this.data.uiText.loginPrompt,
          confirmText: this.data.uiText.goLogin,
          cancelText: this.data.uiText.cancel,
          success: (res) => {
            if (res.confirm) {
              // 跳转到登录页
              wx.redirectTo({
                url: '/pages/login/login'
              })
            } else {
              // 返回上一页
              wx.navigateBack()
            }
          }
        })
        return false
      }

      console.log('✅ [Payment] 用户已登录:', userInfo.nickName)
      return true
    } catch (e) {
      console.error('❌ [Payment] 检查登录状态失败:', e)
      return false
    }
  },

  /**
   * 选择月付
   */
  selectMonthly() {
    this.setData({
      billingCycle: 'monthly'
    })
    this.updatePrice()
  },

  /**
   * 选择年付
   */
  selectYearly() {
    this.setData({
      billingCycle: 'yearly'
    })
    this.updatePrice()
  },

  // 获取语言信息
  getLanguageInfo(lang) {
    const languageMap = {
      'zh': { code: 'zh', name: '中文', flag: '🇨🇳' },
      'en': { code: 'en', name: 'English', flag: '🇺🇸' }
    }
    return languageMap[lang] || languageMap['zh']
  },

  // 显示语言切换器
  showLangSwitcher() {
    this.setData({ showLanguageSwitcher: true })
  },

  // 关闭语言切换器
  closeLangSwitcher() {
    this.setData({ showLanguageSwitcher: false })
  },

  // 切换语言
  async switchLanguage(e) {
    const newLanguage = e.currentTarget.dataset.lang
    
    if (newLanguage === this.data.currentLanguage) {
      this.closeLangSwitcher()
      return
    }
    
    try {
      console.log('🔄 [Payment] 切换语言:', newLanguage)
      
      // 更新语言管理器
      await languageManager.switchLanguage(newLanguage)
      
      // 更新页面数据
      this.setData({
        currentLanguage: newLanguage,
        currentLanguageInfo: this.getLanguageInfo(newLanguage),
        currentLang: newLanguage,
        showLanguageSwitcher: false
      })
      
      // 更新UI文本
      this.updateUIText(newLanguage)
      
      wx.showToast({
        title: newLanguage === 'zh' ? '已切换至中文' : 'Switched to English',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('❌ [Payment] 语言切换失败:', error)
      wx.showToast({
        title: '语言切换失败',
        icon: 'error'
      })
    }
  },

  /**
   * 处理支付
   */
  async handlePayment(forceUpgrade = false) {
    // 🔒 支付前再次检查登录状态
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo) {
      console.warn('⚠️ [Payment] 用户未登录，无法支付')
      wx.showModal({
        title: this.data.uiText.loginRequired,
        content: this.data.uiText.loginPrompt,
        confirmText: this.data.uiText.goLogin,
        cancelText: this.data.uiText.cancel,
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }

    const { planType, billingCycle, prices } = this.data
    // 确保金额是数字类型，不是字符串
    const amountStr = billingCycle === 'monthly' ? prices[planType].monthly : prices[planType].yearly
    const amount = parseFloat(amountStr)
    const planName = billingCycle === 'monthly' ?
      (planType === 'team' ? '月付团队' : '月付会员') :
      (planType === 'team' ? '年付团队' : '年付会员')

    console.log('💳 [Payment] 准备支付:', { planName, amount, amountType: typeof amount, user: userInfo.nickName })

    // 验证金额
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('❌ [Payment] 金额无效:', { amountStr, amount })
      wx.showToast({
        title: '金额配置错误',
        icon: 'none'
      })
      return
    }

    // 显示加载状态
    this.setData({ loading: true })

    try {
      // 检查云开发环境
      if (!wx.cloud) {
        throw new Error('云开发未初始化')
      }

      console.log('☁️ [Payment] 调用云函数...')

      // 使用wechatPaySubscription云函数创建订阅
      const res = await wx.cloud.callFunction({
        name: 'wechatPaySubscription',
        data: {
          action: 'createSubscription',
          planType: planType === 'pro' ? 'personal' : planType, // 修复：pro 改为 personal
          billingCycle: billingCycle,
          amount: amount,
          userInfo: userInfo,
          forceUpgrade: forceUpgrade
        }
      })

      console.log('✅ [Payment] 云函数返回:', res)

      if (res.result && res.result.success) {
        const { paymentParams, orderNo } = res.result.data

        // 调用真实的微信支付
        console.log('💳 [Payment] 调用微信支付...')
        console.log('💳 [Payment] 支付参数:', paymentParams)
        
        // 调用微信支付
        wx.requestPayment({
          timeStamp: paymentParams.timeStamp,
          nonceStr: paymentParams.nonceStr,
          package: paymentParams.package,
          signType: paymentParams.signType,
          paySign: paymentParams.paySign,
          success: async (payRes) => {
            console.log('✅ [Payment] 支付成功', payRes)
            
            // 处理支付成功回调，传递真实的交易信息
            await this.handlePaymentSuccess(orderNo, userInfo, payRes)
            
            wx.showToast({
              title: '订阅成功！',
              icon: 'success',
              duration: 2000
            })
            
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/settings/settings'
              })
            }, 2000)
          },
          fail: (err) => {
            console.error('❌ [Payment] 支付失败', err)
            if (err.errMsg === 'requestPayment:fail cancel') {
              wx.showToast({
                title: '支付已取消',
                icon: 'none',
                duration: 2000
              })
            } else {
              wx.showToast({
                title: '支付失败，请重试',
                icon: 'none',
                duration: 2000
              })
            }
          }
        })
      } else {
        // 检查是否是重复订阅
        if (res.result?.existingSubscription) {
          const existingPlan = res.result.existingSubscription.plan_type === 'team'
            ? 'team'
            : (res.result.existingSubscription.plan_type === 'pro' ? 'personal' : res.result.existingSubscription.plan_type)

          if (existingPlan === 'personal' && planType === 'team' && !forceUpgrade) {
            this.setData({ loading: false })
            wx.showModal({
              title: '升级到团队版',
              content: '我们检测到您当前正处于个人版会员，是否立即升级为团队版？升级后新的套餐会立即生效。',
              confirmText: '确认升级',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.handlePayment(true)
                }
              }
            })
            return
          }

          wx.showModal({
            title: '已有活跃订阅',
            content: '您已有一个活跃的订阅，请先取消当前订阅后再购买新的套餐。',
            confirmText: '查看订阅',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateTo({
                  url: '/pages/settings/settings'
                })
              }
            }
          })
        } else {
          throw new Error(res.result?.error || '创建订阅订单失败')
        }
      }
    } catch (error) {
      console.error('❌ [Payment] 支付错误:', error)
      console.error('❌ [Payment] 错误详情:', error.stack)

      // 智能错误处理 - 根据错误类型给出明确提示
      let errorTitle = '支付失败'
      let errorContent = '支付过程中遇到问题，请稍后重试'
      let showModal = false

      if (error.message.includes('Failed to fetch')) {
        // 云函数调用失败（开发者工具模拟器常见问题）
        errorTitle = '提示'
        errorContent = '云函数调用失败，这通常发生在开发者工具模拟器中。\n\n请在真机上测试支付功能：\n1. 点击"预览"生成二维码\n2. 用微信扫码打开小程序\n3. 再次尝试支付'
        showModal = true
      } else if (error.message.includes('商户号')) {
        errorContent = '商户配置错误，请联系客服\n错误代码: MCH_CONFIG_ERROR'
        showModal = true
      } else if (error.message.includes('API密钥')) {
        errorContent = 'API密钥配置错误，请联系客服\n错误代码: API_KEY_ERROR'
        showModal = true
      } else if (error.message.includes('签名')) {
        errorContent = '支付签名验证失败，请联系客服\n错误代码: SIGN_ERROR'
        showModal = true
      } else if (error.message.includes('IP')) {
        errorContent = 'IP访问受限，请联系客服\n错误代码: IP_ERROR'
        showModal = true
      } else if (error.message.includes('openid')) {
        errorContent = '用户登录状态失效，请重新登录'
        showModal = true
      } else if (error.message.includes('timeStamp')) {
        errorContent = '支付参数错误，请重试或联系客服\n错误代码: PARAM_ERROR'
        showModal = true
      }

      if (showModal) {
        wx.showModal({
          title: errorTitle,
          content: errorContent,
          confirmText: '我知道了',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: error.message || '支付失败，请重试',
          icon: 'none',
          duration: 3000
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 处理支付成功回调
   */
  async handlePaymentSuccess(orderId, userInfo, payRes = {}) {
    try {
      console.log('🔄 [Payment] 处理支付成功回调:', orderId)
      console.log('🔄 [Payment] 支付响应:', payRes)

      // 获取真实的交易ID（从支付响应中获取）
      const transactionId = payRes.transaction_id || `real_txn_${Date.now()}`

      // 🎯 关键1：更新订单状态为已支付
      console.log('💾 [Payment] 更新订单状态为已支付...')
      await wx.cloud.database()
        .collection('orders')
        .where({ orderNo: orderId })
        .update({
          data: {
            status: 'paid',
            transaction_id: transactionId,
            paidAt: new Date(),
            updatedAt: new Date()
          }
        })

      // 🎯 关键2：⭐ 更新订阅记录状态为 active（云函数已创建，这里只更新状态）
      console.log('📝 [Payment] 更新订阅状态为 active...')
      const subsUpdateResult = await wx.cloud.database()
        .collection('sitehub_subscriptions')
        .where({ wechat_order_id: orderId })
        .update({
          data: {
            status: 'active',  // ⭐ 从 pending 改为 active
            wechat_transaction_id: transactionId,
            updated_at: new Date()
          }
        })

      console.log('✅ [Payment] 订阅状态已更新:', subsUpdateResult.stats.updated, '条')

      // 获取订阅信息（用于更新用户到期时间）
      const subsResult = await wx.cloud.database()
        .collection('sitehub_subscriptions')
        .where({ wechat_order_id: orderId })
        .get()

      const subscription = subsResult.data[0]

      // 🎯 关键3：更新用户会员状态
      console.log('👤 [Payment] 更新用户会员状态...')
      await wx.cloud.database()
        .collection('sitehub_users')
        .where({ openid: userInfo.openid })
        .update({
          data: {
            is_pro: true,
            subscription_status: 'active',
            subscription_expires_at: subscription?.current_period_end || new Date(),
            updated_at: new Date(),
            version: Date.now()
          }
        })

      // 更新本地用户状态
      this.updateLocalUserStatus(true)
      
      // 更新全局用户状态
      const app = getApp()
      if (app.globalData.userInfo) {
        app.globalData.userInfo.pro = true
        app.globalData.userInfo.isPro = true
      }
      
      // 🎯 关键4：支付成功后强制刷新用户画像
      console.log('🔄 [Payment] 强制刷新用户画像...')
      try {
        const { getUserSession } = require('../../utils/userSession')
        const userSession = getUserSession()
        await userSession.fetchMe(true) // 强制刷新，不使用缓存
      } catch (e) {
        console.log('⚠️ [Payment] 用户会话刷新失败（可忽略）:', e.message)
      }

      console.log('✅ [Payment] 支付成功处理完成！')
    } catch (error) {
      console.error('❌ [Payment] 处理支付回调失败:', error)
    }
  },

  /**
   * 计算订阅到期时间
   */
  calculatePeriodEnd(startDate, billingCycle) {
    const endDate = new Date(startDate)
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }
    return endDate
  },

  /**
   * 更新本地用户状态
   */
  updateLocalUserStatus(isPro) {
    try {
      const userInfo = wx.getStorageSync('sitehub_userInfo')
      if (userInfo) {
        userInfo.pro = isPro
        userInfo.isPro = isPro
        wx.setStorageSync('sitehub_userInfo', userInfo)
        console.log('✅ [Payment] 本地用户状态已更新:', isPro)
      }
    } catch (error) {
      console.error('❌ [Payment] 更新本地用户状态失败:', error)
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
