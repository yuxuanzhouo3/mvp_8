// pages/login/login.js - 微信登录页面
Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    tempAvatarUrl: '',  // 临时头像
    tempNickname: '',   // 临时昵称
    currentLang: 'zh',  // 当前语言

    // UI文本
    uiText: {
      pageTitle: 'SiteHub 工具集',
      appTitle: 'SiteHub 工具集',
      appSubtitle: '一站式网站导航平台',
      loginDesc: '登录后可享受个性化服务',
      feature1: '• 同步收藏夹到云端',
      feature2: '• 个性化推荐网站',
      feature3: '• 跨设备数据同步',
      chooseAvatar: '选择头像',
      inputNickname: '请输入昵称',
      confirmLogin: '确认登录',
      loginTips: '登录即表示同意用户协议和隐私政策',
      backBtn: '返回'
    }
  },

  onLoad() {
    console.log('🚀 [Login] 登录页面加载')

    // 获取当前语言
    const lang = wx.getStorageSync('sitehub_language') || 'zh'
    this.setData({ currentLang: lang })
    this.updateUIText(lang)

    this.checkLoginStatus()
  },

  // 更新UI文本
  updateUIText(lang) {
    const isEn = lang === 'en'

    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: isEn ? 'Login' : '登录'
    })

    this.setData({
      uiText: {
        pageTitle: isEn ? 'Login' : '登录',
        appTitle: isEn ? 'SiteHub Tools' : 'SiteHub 工具集',
        appSubtitle: isEn ? 'One-stop website navigation platform' : '一站式网站导航平台',
        loginDesc: isEn ? 'Login to enjoy personalized services' : '登录后可享受个性化服务',
        feature1: isEn ? '• Sync bookmarks to cloud' : '• 同步收藏夹到云端',
        feature2: isEn ? '• Personalized recommendations' : '• 个性化推荐网站',
        feature3: isEn ? '• Cross-device data sync' : '• 跨设备数据同步',
        chooseAvatar: isEn ? 'Choose Avatar' : '选择头像',
        inputNickname: isEn ? 'Enter your nickname' : '请输入昵称',
        confirmLogin: isEn ? 'Confirm Login' : '确认登录',
        loginTips: isEn ? 'By logging in, you agree to our Terms of Service and Privacy Policy' : '登录即表示同意用户协议和隐私政策',
        backBtn: isEn ? 'Back' : '返回'
      }
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (userInfo) {
      this.setData({
        userInfo,
        isLoggedIn: true
      })
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    console.log('🖼️ [Login] 用户选择头像:', e.detail.avatarUrl)
    
    // 检查是否是临时路径
    let avatarUrl = e.detail.avatarUrl
    if (avatarUrl.includes('127.0.0.1') || avatarUrl.includes('__tmp__')) {
      console.log('⚠️ [Login] 检测到临时头像路径，使用微信默认头像')
      avatarUrl = 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132' // 微信默认头像
    }
    
    this.setData({
      tempAvatarUrl: avatarUrl
    })
  },

  // 输入昵称
  onNicknameInput(e) {
    console.log('📝 [Login] 用户输入昵称:', e.detail.value)
    this.setData({
      tempNickname: e.detail.value
    })
  },

  // 确认登录
  async onConfirmLogin() {
    const { tempAvatarUrl, tempNickname } = this.data

    if (!tempAvatarUrl || !tempNickname) {
      wx.showToast({
        title: '请完善头像和昵称',
        icon: 'none'
      })
      return
    }

    try {
      console.log('🔑 [Login] 开始登录流程')

      // 获取登录凭证
      const loginRes = await this.wxLogin()
      console.log('✅ [Login] 登录凭证获取成功, code:', loginRes.code)

      // 通过微信云函数获取真实的 openid
      console.log('🔍 [Login] 正在获取 openid...')
      let realOpenid = null
      
      try {
        // 调用云函数获取 openid（通过微信登录code）
        const openidRes = await wx.cloud.callFunction({
          name: 'callAIGateway',
          data: {
            action: 'getOpenid',
            code: loginRes.code
          }
        })
        
        if (openidRes.result && openidRes.result.success) {
          realOpenid = openidRes.result.openid
          console.log('✅ [Login] 获取真实 openid 成功:', realOpenid)
        } else {
          console.warn('⚠️ [Login] 获取 openid 失败，使用临时 openid')
          realOpenid = 'temp_openid_' + Date.now()
        }
      } catch (error) {
        console.error('❌ [Login] 获取 openid 出错:', error)
        // 如果云函数调用失败，使用临时 openid
        realOpenid = 'temp_openid_' + Date.now()
      }
      
      console.log('✅ [Login] 最终使用 openid:', realOpenid)

      // 🔑 从后端获取用户画像（包含稳定的userId）
      console.log('📡 [Login] 调用 getMe 获取用户画像...')

      // 先保存临时的 userInfo（只有 openid，用于调用云函数）
      const tempUserInfo = {
        openid: realOpenid,
        nickName: tempNickname,
        avatarUrl: tempAvatarUrl
      }

      // 定义 userInfo 变量（在外层作用域）
      let finalUserInfo = null

      try {
        // 调用 getMe 接口获取完整用户信息
        const getMeRes = await wx.cloud.callFunction({
          name: 'callAIGateway',
          data: {
            action: 'getMe',
            userInfo: tempUserInfo
          }
        })

        console.log('✅ [Login] getMe 返回:', getMeRes.result)

        let userId
        if (getMeRes.result && getMeRes.result.success) {
          // 使用后端返回的 userId
          userId = getMeRes.result.data.userId
          console.log('✅ [Login] 使用后端返回的 userId:', userId)
        } else {
          console.warn('⚠️ [Login] getMe 调用失败，生成临时 userId')
          userId = Math.floor(Math.random() * 900000) + 100000
        }

        // 保存完整用户信息
        const now = new Date().toISOString()
        finalUserInfo = {
          openid: realOpenid,
          userId: userId, // ✅ 使用后端返回的稳定 userId
          nickName: tempNickname,
          avatarUrl: tempAvatarUrl,
          code: loginRes.code,
          loginTime: now,
          createdAt: getMeRes.result?.data?.profile?.createdAt || now,
          pro: getMeRes.result?.data?.entitlement?.status === 'active',
          isPro: getMeRes.result?.data?.entitlement?.status === 'active'
        }

        console.log('💾 [Login] 准备保存用户信息:', finalUserInfo)
        wx.setStorageSync('sitehub_userInfo', finalUserInfo)

        // 同步到全局数据
        const app = getApp()
        app.saveUserInfo(finalUserInfo)

      } catch (error) {
        console.error('❌ [Login] 获取用户画像失败:', error)

        // 降级：使用临时数据
        const now = new Date().toISOString()
        finalUserInfo = {
          openid: realOpenid,
          userId: Math.floor(Math.random() * 900000) + 100000,
          nickName: tempNickname,
          avatarUrl: tempAvatarUrl,
          code: loginRes.code,
          loginTime: now,
          createdAt: now,
          pro: false,
          isPro: false
        }

        wx.setStorageSync('sitehub_userInfo', finalUserInfo)
        const app = getApp()
        app.saveUserInfo(finalUserInfo)
      }

      this.setData({
        userInfo: finalUserInfo,
        isLoggedIn: true
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 延迟返回主页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('❌ [Login] 登录失败:', error)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'error'
      })
    }
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('sitehub_userInfo')
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 返回主页
  goBack() {
    wx.navigateBack()
  }
})