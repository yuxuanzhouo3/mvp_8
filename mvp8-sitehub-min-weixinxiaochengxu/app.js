// app.js - SiteHub小程序入口文件
// 支持IP智能路由和双数据库架构

App({
  onLaunch() {
    console.log('🚀 [SiteHub] 小程序启动')

    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-1gnip2iaa08260e5', // 微信云环境ID
        traceUser: true
      })
      console.log('✅ [SiteHub] 微信云开发初始化成功')
    } else {
      console.error('❌ [SiteHub] 请使用 2.2.3 或以上的基础库以使用云能力')
    }

    // 初始化全局数据
    this.initGlobalData()
  },

  // 初始化全局数据
  initGlobalData() {
    console.log('📊 [SiteHub] 初始化全局数据')
    
    // 设置默认值
    this.globalData = {
      userInfo: null,
      userRegion: 'china', // 默认中国，等待IP检测
      database: 'wechat_cloud', // 默认微信云
      regionDetected: false,
      sites: [],
      favorites: [],
      lastUpdateTime: null
    }

    // 加载本地缓存
    this.loadLocalCache()
  },

  // 加载本地缓存
  loadLocalCache() {
    try {
      const userInfo = wx.getStorageSync('sitehub_userInfo')
      const favorites = wx.getStorageSync('sitehub_favorites')
      const userRegion = wx.getStorageSync('sitehub_userRegion')

      if (userInfo) {
        this.globalData.userInfo = userInfo
        console.log('✅ [SiteHub] 本地用户信息已加载')
      }

      if (favorites && favorites.length > 0) {
        this.globalData.favorites = favorites
        console.log(`✅ [SiteHub] 本地收藏已加载: ${favorites.length}个`)
      }

      if (userRegion) {
        this.globalData.userRegion = userRegion
        console.log(`✅ [SiteHub] 本地地域信息已加载: ${userRegion}`)
      }

    } catch (error) {
      console.error('❌ [SiteHub] 加载本地缓存失败:', error)
    }
  },

  // 保存用户信息到全局和本地
  saveUserInfo(userInfo) {
    try {
      this.globalData.userInfo = userInfo
      wx.setStorageSync('sitehub_userInfo', userInfo)
      console.log('✅ [SiteHub] 用户信息已保存')
    } catch (error) {
      console.error('❌ [SiteHub] 保存用户信息失败:', error)
    }
  },

  // 保存收藏到全局和本地
  saveFavorites(favorites) {
    try {
      this.globalData.favorites = favorites
      wx.setStorageSync('sitehub_favorites', favorites)
      console.log(`✅ [SiteHub] 收藏已保存: ${favorites.length}个`)
    } catch (error) {
      console.error('❌ [SiteHub] 保存收藏失败:', error)
    }
  },

  // 更新用户地域信息
  updateUserRegion(region, database, reason) {
    try {
      this.globalData.userRegion = region
      this.globalData.database = database
      this.globalData.regionDetected = true
      
      wx.setStorageSync('sitehub_userRegion', region)
      wx.setStorageSync('sitehub_database', database)
      
      console.log(`✅ [SiteHub] 用户地域已更新: ${region} (${database}) - ${reason}`)
    } catch (error) {
      console.error('❌ [SiteHub] 更新用户地域失败:', error)
    }
  },

  // 清除用户数据
  clearUserData() {
    try {
      this.globalData.userInfo = null
      this.globalData.favorites = []
      this.globalData.userRegion = 'china'
      this.globalData.database = 'wechat_cloud'
      this.globalData.regionDetected = false

      wx.removeStorageSync('sitehub_userInfo')
      wx.removeStorageSync('sitehub_favorites')
      wx.removeStorageSync('sitehub_userRegion')
      wx.removeStorageSync('sitehub_database')

      console.log('✅ [SiteHub] 用户数据已清除')
    } catch (error) {
      console.error('❌ [SiteHub] 清除用户数据失败:', error)
    }
  },

  // 获取当前用户地域
  getUserRegion() {
    return this.globalData.userRegion || 'china'
  },

  // 获取当前数据库类型
  getDatabaseType() {
    return this.globalData.database || 'wechat_cloud'
  },

  // 检查是否已检测地域
  isRegionDetected() {
    return this.globalData.regionDetected || false
  },

  globalData: {
    userInfo: null,
    userRegion: 'china',
    database: 'wechat_cloud',
    regionDetected: false,
    sites: [],
    favorites: [],
    lastUpdateTime: null
  }
})