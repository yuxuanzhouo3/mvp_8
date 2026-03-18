/**
 * 前端状态机 - 统一用户状态管理
 * 单一事实源（SSOT）模式
 */

/**
 * 用户会话管理类
 */
class UserSession {
  constructor() {
    this.me = null
    this.loading = false
    this.lastFetch = 0
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
    this.listeners = []
  }
  
  /**
   * 获取用户画像 - /me 接口
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 用户画像
   */
  async fetchMe(forceRefresh = false) {
    // 生成 traceId
    const traceId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 探针1：前端发起 /me 前
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    console.log('[FE] call /me', {
      traceId: traceId,
      userId: userInfo?.userId,
      openid: userInfo?.openid,
      forceRefresh: forceRefresh,
      timestamp: Date.now()
    })
    
    // 检查缓存
    if (!forceRefresh && this.me && (Date.now() - this.lastFetch < this.cacheTimeout)) {
      console.log('[FE] 使用缓存的用户画像')
      return this.me
    }
    
    // 检查是否正在加载
    if (this.loading) {
      console.log('[FE] 正在加载用户画像，等待完成...')
      // 等待加载完成
      await this.waitForLoading()
      return this.me
    }
    
    try {
      this.loading = true
      
      // 检查用户信息
      if (!userInfo || !userInfo.openid) {
        console.log('❌ [FE] 用户信息不存在，请先登录')
        this.me = null
        this.notifyListeners()
        return null
      }
      
      // 调用云函数获取用户画像
      console.log('📡 [FE] 调用云函数 callAIGateway/getMe')
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getMe',
          userInfo: userInfo,
          traceId: traceId
        }
      })
      
      if (result.result && result.result.success) {
        const me = result.result.data
        
        console.log('✅ [FE] 用户画像获取成功:', {
          userId: me.userId,
          openid: me.openid,
          plan: me.entitlement.plan,
          status: me.entitlement.status,
          traceId: me.traceId
        })
        
        // 更新状态
        this.me = me
        this.lastFetch = Date.now()
        
        // 同步到本地存储和全局数据
        this.syncToStorage(me)
        
        // 通知监听器
        this.notifyListeners()
        
        return me
        
      } else {
        console.error('❌ [FE] 获取用户画像失败:', result.result?.error)
        this.me = null
        this.notifyListeners()
        return null
      }
      
    } catch (error) {
      console.error('❌ [FE] 获取用户画像异常:', error)
      this.me = null
      this.notifyListeners()
      return null
      
    } finally {
      this.loading = false
    }
  }
  
  /**
   * 等待加载完成
   */
  async waitForLoading() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.loading) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }
  
  /**
   * 同步到本地存储和全局数据
   */
  syncToStorage(me) {
    try {
      // 更新本地存储
      const userInfo = wx.getStorageSync('sitehub_userInfo') || {}
      const updatedUserInfo = {
        ...userInfo,
        userId: me.userId,
        openid: me.openid,
        nickName: me.profile.nickname,
        avatarUrl: me.profile.avatar,
        createdAt: me.profile.createdAt,
        // 会员信息
        pro: me.entitlement.status === 'active',
        isPro: me.entitlement.status === 'active',
        plan: me.entitlement.plan,
        status: me.entitlement.status,
        expiresAt: me.entitlement.expiresAt,
        version: me.entitlement.version
      }
      
      wx.setStorageSync('sitehub_userInfo', updatedUserInfo)
      
      // 更新全局数据
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.userInfo = updatedUserInfo
      }
      
      console.log('✅ [FE] 用户信息已同步到本地存储和全局数据')
      
    } catch (error) {
      console.error('❌ [FE] 同步用户信息失败:', error)
    }
  }
  
  /**
   * 获取当前状态
   */
  getState() {
    if (!this.me) {
      return {
        me: null,
        loading: this.loading,
        isLoggedIn: false,
        isPro: false,
        plan: 'free',
        status: 'unknown'
      }
    }
    
    return {
      me: this.me,
      loading: this.loading,
      isLoggedIn: true,
      isPro: this.me.entitlement.status === 'active',
      plan: this.me.entitlement.plan,
      status: this.me.entitlement.status,
      expiresAt: this.me.entitlement.expiresAt,
      version: this.me.entitlement.version
    }
  }
  
  /**
   * 添加监听器
   */
  addListener(listener) {
    this.listeners.push(listener)
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
  
  /**
   * 通知监听器
   */
  notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('❌ [FE] 监听器执行失败:', error)
      }
    })
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    console.log('🧹 [FE] 清除用户画像缓存')
    this.me = null
    this.lastFetch = 0
    this.notifyListeners()
  }
  
  /**
   * 登出
   */
  logout() {
    console.log('👋 [FE] 用户登出')
    this.me = null
    this.lastFetch = 0
    
    // 清除本地存储
    wx.removeStorageSync('sitehub_userInfo')
    
    // 清除全局数据
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.userInfo = null
    }
    
    this.notifyListeners()
  }
}

// 创建全局单例
let globalUserSession = null

/**
 * 获取全局用户会话实例
 */
function getUserSession() {
  if (!globalUserSession) {
    globalUserSession = new UserSession()
    
    // 挂载到全局
    const app = getApp()
    if (app) {
      app.globalData.userSession = globalUserSession
    }
  }
  
  return globalUserSession
}

module.exports = {
  UserSession,
  getUserSession
}





