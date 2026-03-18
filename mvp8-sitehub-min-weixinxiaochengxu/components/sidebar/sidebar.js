// components/sidebar/sidebar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    userInfo: {
      type: Object,
      value: null
    },
    uiText: {
      type: Object,
      value: {
        loginText: '点击登录',
        loginHint: '解锁更多功能',
        upgradeText: '升级 Pro 会员',
        settingsText: '设置',
        contactText: '联系我们',
        logoutText: '退出登录',
        wechatUser: '微信用户',
        proMember: 'Pro 会员',
        contactTitle: '联系我们',
        contactContent: '客服邮箱：mornscience@gmail.com\n\n工作时间：周一至周五 9:00-18:00',
        copyEmail: '复制邮箱',
        close: '关闭',
        emailCopied: '邮箱已复制'
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 🎯 会员状态（从userSession获取）
    membershipStatus: {
      isPro: false,
      plan: 'free',
      status: 'free'
    }
  },
  
  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 🎯 监听用户状态变化
      this.setupUserSessionListener()
    },
    detached() {
      // 清理监听器
      if (this.unsubscribe) {
        this.unsubscribe()
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 🎯 设置用户状态监听器
    setupUserSessionListener() {
      try {
        const { getUserSession } = require('../../utils/userSession')
        const userSession = getUserSession()
        
        // 监听状态变化
        this.unsubscribe = userSession.addListener((state) => {
          console.log('[Sidebar] 会员状态更新:', state)
          this.setData({
            membershipStatus: {
              isPro: state.isPro,
              plan: state.plan,
              status: state.status
            }
          })
        })
        
        // 立即获取当前状态
        const currentState = userSession.getState()
        this.setData({
          membershipStatus: {
            isPro: currentState.isPro,
            plan: currentState.plan,
            status: currentState.status
          }
        })
      } catch (error) {
        console.error('[Sidebar] 设置用户状态监听器失败:', error)
      }
    },
    
    // 关闭侧边栏
    onClose() {
      this.triggerEvent('close')
    },

    // 阻止事件冒泡
    stopPropagation() {},

    // 用户信息点击（已登录用户）
    onUserInfoClick() {
      console.log('用户信息点击')
      // 可以跳转到用户个人中心
    },

    // 登录按钮点击（未登录用户）
    onLoginClick() {
      console.log('🔑 [Sidebar] 登录按钮点击')
      // 先触发登录事件,再关闭侧边栏
      this.triggerEvent('login')
      // 延迟关闭,确保事件已触发
      setTimeout(() => {
        this.onClose()
      }, 100)
    },

    // 升级会员
    onUpgradeClick() {
      this.triggerEvent('upgrade')
      this.onClose()
    },

    // 联系客服
    onContactClick() {
      const text = this.data.uiText
      wx.showModal({
        title: text.contactTitle,
        content: text.contactContent,
        confirmText: text.copyEmail,
        cancelText: text.close,
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: 'mornscience@gmail.com',
              success: () => {
                wx.showToast({
                  title: text.emailCopied,
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    },

    // 设置
    onSettingsClick() {
      console.log('⚙️ [Sidebar] 设置按钮点击')
      wx.navigateTo({
        url: '/pages/settings/settings'
      })
      this.onClose()
    },

    // 退出登录
    onLogoutClick() {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        confirmText: '确定',
        cancelText: '取消',
        confirmColor: '#ef4444',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('logout')
            this.onClose()
          }
        }
      })
    }
  }
})
