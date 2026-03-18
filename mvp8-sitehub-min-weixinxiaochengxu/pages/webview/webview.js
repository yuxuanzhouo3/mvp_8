// pages/webview/webview.js - Cookie 持久化版本
Page({
  data: {
    url: '',
    title: '网页浏览',
    isLoading: true,      // 加载状态
    webviewLoaded: false, // WebView 是否已加载过
    isFavorited: false,   // 是否已收藏
    siteId: ''            // 网站ID
  },

  onLoad(options) {
    console.log('🌐 [WebView] 页面加载，参数:', options)
    const { url, title, id } = options

    if (url) {
      const decodedUrl = decodeURIComponent(url)
      const decodedTitle = decodeURIComponent(title || '网页浏览')
      const siteId = id || ''

      this.setData({
        url: decodedUrl,
        title: decodedTitle,
        siteId: siteId,
        isLoading: true,
        webviewLoaded: false
      })

      // 检查是否已收藏
      this.checkFavoriteStatus()

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: decodedTitle
      })

      // 设置右上角菜单按钮（收藏按钮）
      this.updateMenuButton()

      console.log('🔗 [WebView] 加载URL:', decodedUrl)
      console.log('💾 [WebView] Cookie 自动持久化已启用')

      // 🛡️ 安全保护：最多显示8秒加载页面
      setTimeout(() => {
        if (this.data.isLoading) {
          console.warn('⏱️ [WebView] 加载超时，强制隐藏加载页面')
          this.setData({
            isLoading: false,
            webviewLoaded: true
          })
        }
      }, 8000)
    } else {
      console.error('❌ [WebView] 缺少URL参数')
      this.setData({ isLoading: false })
    }
  },

  // 更新右上角菜单按钮
  updateMenuButton() {
    const { isFavorited } = this.data
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // WebView 加载完成
  onWebViewLoad(e) {
    console.log('✅ [WebView] 内容加载完成')

    this.setData({
      isLoading: false,
      webviewLoaded: true
    })

    // 提示用户 Cookie 已保存
    if (!this.cookieTipShown) {
      this.cookieTipShown = true
      setTimeout(() => {
        wx.showToast({
          title: '💾 登录状态已保存',
          icon: 'none',
          duration: 2000
        })
      }, 1000)
    }
  },

  // WebView 加载错误
  onError(e) {
    console.error('❌ [WebView] 加载错误:', e)

    this.setData({
      isLoading: false,
      webviewLoaded: true
    })

    const currentUrl = this.data.url
    const errorMsg = e.detail ? e.detail.errMsg : ''
    
    // 检查是否是业务域名未配置的错误
    const isDomainError = errorMsg.includes('不支持打开') || errorMsg.includes('business domain')

    if (isDomainError && currentUrl) {
      // 业务域名未配置，提供复制链接选项
      wx.showModal({
        title: '无法打开该页面',
        content: `该网站尚未配置业务域名，无法在小程序中打开。\n\n是否复制链接到剪贴板，然后到外部浏览器打开？`,
        confirmText: '复制链接',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 复制链接到剪贴板
            wx.setClipboardData({
              data: currentUrl,
              success: () => {
                wx.showToast({
                  title: '链接已复制，请到浏览器打开',
                  icon: 'success',
                  duration: 3000
                })
                // 延迟返回，让用户看到提示
                setTimeout(() => {
                  wx.navigateBack()
                }, 2000)
              },
              fail: () => {
                wx.showToast({
                  title: '复制失败',
                  icon: 'error'
                })
              }
            })
          } else {
            wx.navigateBack()
          }
        }
      })
    } else {
      // 其他错误（网络问题等）
      wx.showModal({
        title: '页面加载失败',
        content: '无法加载该网页，请检查网络连接或稍后重试。',
        confirmText: '重新加载',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            this.refresh()
          } else {
            wx.navigateBack()
          }
        }
      })
    }
  },

  // 接收来自 WebView 的消息
  onMessage(e) {
    console.log('📩 [WebView] 收到消息:', e.detail.data)
  },

  // 返回上一页
  goBack() {
    console.log('⬅️ [WebView] 返回上一页')
    wx.navigateBack({
      fail: () => {
        // 如果无法返回，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 刷新页面
  refresh() {
    console.log('↻ [WebView] 刷新页面')

    this.setData({
      isLoading: true,
      webviewLoaded: false
    })

    // 重新设置 URL 触发刷新
    const currentUrl = this.data.url
    this.setData({
      url: ''
    }, () => {
      setTimeout(() => {
        this.setData({
          url: currentUrl
        })
      }, 100)
    })

    wx.showToast({
      title: '正在刷新...',
      icon: 'loading',
      duration: 1000
    })
  },

  // 分享给好友
  shareToFriend() {
    console.log('⊕ [WebView] 分享功能')
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    })
  },

  // 分享给好友配置
  onShareAppMessage() {
    return {
      title: this.data.title,
      path: `/pages/webview/webview?url=${encodeURIComponent(this.data.url)}&title=${encodeURIComponent(this.data.title)}`,
      imageUrl: '' // 可以设置分享图片
    }
  },

  // 分享到朋友圈配置
  onShareTimeline() {
    return {
      title: this.data.title,
      query: `url=${encodeURIComponent(this.data.url)}&title=${encodeURIComponent(this.data.title)}`,
      imageUrl: ''
    }
  },

  // 检查收藏状态
  checkFavoriteStatus() {
    const favorites = wx.getStorageSync('sitehub_favorites') || []
    const isFavorited = favorites.includes(this.data.siteId)
    this.setData({ isFavorited })
  },

  // 切换收藏状态
  toggleFavorite() {
    const { siteId, isFavorited, title } = this.data

    if (!siteId) {
      wx.showToast({
        title: '无法收藏此网站',
        icon: 'none'
      })
      return
    }

    let favorites = wx.getStorageSync('sitehub_favorites') || []

    if (isFavorited) {
      // 取消收藏
      favorites = favorites.filter(id => id !== siteId)
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      })
    } else {
      // 添加收藏
      if (!favorites.includes(siteId)) {
        favorites.push(siteId)
      }
      wx.showToast({
        title: '已添加到收藏',
        icon: 'success'
      })
    }

    wx.setStorageSync('sitehub_favorites', favorites)
    this.setData({ isFavorited: !isFavorited })
    this.updateMenuButton()

    console.log('⭐ [WebView] 收藏状态更新:', !isFavorited)
  },

  // 页面菜单按钮点击（右上角"···"）
  onShareAppMenu(options) {
    // 用户点击右上角"···"菜单中的按钮
    console.log('📱 [WebView] 用户点击菜单按钮:', options)
  }
})