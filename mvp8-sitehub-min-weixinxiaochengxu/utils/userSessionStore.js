// utils/userSessionStore.js
// 前端状态机 + 全局Store - 杜绝分散数据源

/**
 * 用户会话状态管理
 * 单一事实源，所有页面都从这里读取用户信息
 */

// 权益状态枚举
export const ENTITLEMENT_STATUS = {
  UNKNOWN: 'unknown',
  FREE: 'free', 
  ACTIVE: 'active',
  GRACE: 'grace',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
}

// 计划类型
export const PLAN_TYPE = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team'
}

class UserSessionStore {
  constructor() {
    this.me = null
    this.loading = false
    this.lastFetchTime = null
    this.listeners = []
  }

  // 添加状态变化监听器
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // 通知所有监听器
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('❌ [UserSessionStore] 监听器执行失败:', error)
      }
    })
  }

  // 获取当前状态
  getState() {
    return {
      me: this.me,
      loading: this.loading,
      lastFetchTime: this.lastFetchTime,
      // 计算属性
      isLoggedIn: !!this.me?.openid,
      isPro: this.me?.entitlement?.status === ENTITLEMENT_STATUS.ACTIVE,
      plan: this.me?.entitlement?.plan || PLAN_TYPE.FREE,
      status: this.me?.entitlement?.status || ENTITLEMENT_STATUS.UNKNOWN
    }
  }

  // 获取用户画像（单一数据源）
  async fetchMe(force = false) {
    if (this.loading && !force) {
      console.log('🔄 [UserSessionStore] 正在加载中，跳过重复请求')
      return
    }

    try {
      this.loading = true
      this.notify()

      console.log('📡 [UserSessionStore] 获取用户画像，强制刷新:', force)

      // 获取用户信息
      const userInfo = wx.getStorageSync('sitehub_userInfo')
      if (!userInfo?.openid) {
        console.log('❌ [UserSessionStore] 用户未登录')
        this.me = null
        this.loading = false
        this.notify()
        return
      }

      // 调用统一的 /me 接口
      const result = await wx.cloud.callFunction({
        name: 'getUserProfile',
        data: {
          action: 'getMe',
          userInfo: userInfo
        }
      })

      if (result.result && result.result.success) {
        this.me = result.result.data
        this.lastFetchTime = Date.now()
        
        console.log('✅ [UserSessionStore] 用户画像获取成功:', {
          userId: this.me.userId,
          plan: this.me.entitlement.plan,
          status: this.me.entitlement.status,
          version: this.me.entitlement.version
        })

        // 同步到本地存储（向后兼容）
        const localUserInfo = {
          ...userInfo,
          userId: this.me.userId,
          nickName: this.me.profile.nickname,
          avatarUrl: this.me.profile.avatar,
          pro: this.me.entitlement.status === ENTITLEMENT_STATUS.ACTIVE,
          isPro: this.me.entitlement.status === ENTITLEMENT_STATUS.ACTIVE,
          memberType: this.me.entitlement.plan,
          memberStatus: this.me.entitlement.status
        }
        
        wx.setStorageSync('sitehub_userInfo', localUserInfo)
        
        // 更新全局状态
        const app = getApp()
        app.globalData.userInfo = localUserInfo

      } else {
        console.error('❌ [UserSessionStore] 获取用户画像失败:', result.result?.error)
        this.me = null
      }

    } catch (error) {
      console.error('❌ [UserSessionStore] 获取用户画像异常:', error)
      this.me = null
    } finally {
      this.loading = false
      this.notify()
    }
  }

  // 强制刷新（支付成功后调用）
  async bumpVersion() {
    console.log('🔄 [UserSessionStore] 强制刷新用户画像')
    await this.fetchMe(true)
  }

  // 更新用户资料
  async updateProfile(updates) {
    try {
      console.log('📝 [UserSessionStore] 更新用户资料:', updates)

      const userInfo = wx.getStorageSync('sitehub_userInfo')
      if (!userInfo?.openid) {
        throw new Error('用户未登录')
      }

      const result = await wx.cloud.callFunction({
        name: 'getUserProfile',
        data: {
          action: 'updateProfile',
          userInfo: userInfo,
          ...updates
        }
      })

      if (result.result && result.result.success) {
        // 更新成功后强制刷新
        await this.bumpVersion()
        console.log('✅ [UserSessionStore] 用户资料更新成功')
        return true
      } else {
        console.error('❌ [UserSessionStore] 更新用户资料失败:', result.result?.error)
        return false
      }

    } catch (error) {
      console.error('❌ [UserSessionStore] 更新用户资料异常:', error)
      return false
    }
  }

  // 支付成功后的处理
  async handlePaymentSuccess(orderNo, paymentResult) {
    try {
      console.log('🎉 [UserSessionStore] 处理支付成功:', orderNo)

      // 等待一下让后端处理支付回调
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 强制刷新用户画像
      await this.bumpVersion()

      console.log('✅ [UserSessionStore] 支付成功处理完成')
      return true

    } catch (error) {
      console.error('❌ [UserSessionStore] 处理支付成功失败:', error)
      return false
    }
  }

  // 获取状态显示信息
  getStatusDisplay() {
    const state = this.getState()
    const { plan, status } = state

    const statusMap = {
      [ENTITLEMENT_STATUS.UNKNOWN]: { text: '未知', color: '#gray' },
      [ENTITLEMENT_STATUS.FREE]: { text: '免费用户', color: '#green' },
      [ENTITLEMENT_STATUS.ACTIVE]: { text: 'Pro 会员', color: '#gold' },
      [ENTITLEMENT_STATUS.GRACE]: { text: '即将到期', color: '#orange' },
      [ENTITLEMENT_STATUS.EXPIRED]: { text: '已到期', color: '#red' },
      [ENTITLEMENT_STATUS.SUSPENDED]: { text: '已暂停', color: '#red' }
    }

    return statusMap[status] || statusMap[ENTITLEMENT_STATUS.UNKNOWN]
  }

  // 获取升级按钮文案
  getUpgradeButtonText() {
    const state = this.getState()
    const { plan, status } = state

    if (status === ENTITLEMENT_STATUS.FREE) {
      return '升级 Pro 会员'
    } else if (status === ENTITLEMENT_STATUS.ACTIVE) {
      return '管理订阅'
    } else if (status === ENTITLEMENT_STATUS.GRACE) {
      return '修复支付方式'
    } else if (status === ENTITLEMENT_STATUS.EXPIRED) {
      return '立即续费'
    } else {
      return '升级会员'
    }
  }
}

// 创建全局实例
const userSessionStore = new UserSessionStore()

// 导出实例和工具函数
export default userSessionStore

// 便捷的hook函数（类似React hooks）
export const useUserSession = () => {
  return userSessionStore.getState()
}

// 初始化函数
export const initUserSession = async () => {
  console.log('🚀 [UserSessionStore] 初始化用户会话')
  await userSessionStore.fetchMe()
  return userSessionStore
}





