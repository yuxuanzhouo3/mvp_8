// utils/cross-platform-api.js - 跨平台API接口
// 供MornGPT等其他产品调用，实现Jeff的产品生态策略

/**
 * 跨平台API接口
 * 允许其他产品通过此接口访问SiteHub的数据和功能
 */
class CrossPlatformAPI {
  constructor() {
    this.baseUrl = 'https://your-api-domain.com' // 替换为实际API地址
    this.version = 'v1'
  }

  /**
   * 获取用户的自定义网站列表
   * 供MornGPT等产品调用，获取用户的个人网站收藏
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 自定义网站列表
   */
  async getUserCustomSites(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/users/${userId}/custom-sites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.sites || []
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 获取自定义网站失败:', error)
      return []
    }
  }

  /**
   * 获取用户的收藏网站列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 收藏网站列表
   */
  async getUserFavorites(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/users/${userId}/favorites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.sites || []
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 获取收藏网站失败:', error)
      return []
    }
  }

  /**
   * 解析文本中的URL
   * 供其他产品调用，智能解析用户分享的链接
   * @param {string} text - 包含URL的文本
   * @returns {Promise<Array>} 解析结果
   */
  async parseTextUrls(text) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/parse-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ text })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.urls || []
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 解析URL失败:', error)
      return []
    }
  }

  /**
   * 添加网站到用户收藏
   * @param {string} userId - 用户ID
   * @param {Object} siteInfo - 网站信息
   * @returns {Promise<boolean>} 是否成功
   */
  async addToFavorites(userId, siteInfo) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/users/${userId}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ site: siteInfo })
      })
      
      return response.ok
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 添加收藏失败:', error)
      return false
    }
  }

  /**
   * 获取用户的使用统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 使用统计
   */
  async getUserStats(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.stats || {}
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 获取用户统计失败:', error)
      return {}
    }
  }

  /**
   * 记录用户行为
   * @param {string} userId - 用户ID
   * @param {string} action - 行为类型
   * @param {Object} metadata - 行为元数据
   * @returns {Promise<boolean>} 是否成功
   */
  async recordUserAction(userId, action, metadata = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.version}/users/${userId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ 
          action, 
          metadata,
          timestamp: new Date().toISOString()
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('❌ [CrossPlatformAPI] 记录用户行为失败:', error)
      return false
    }
  }

  /**
   * 获取认证令牌
   * @returns {string} 认证令牌
   */
  getAuthToken() {
    // 这里应该返回实际的认证令牌
    // 可以从localStorage、cookie或其他安全存储中获取
    return 'your-auth-token'
  }

  /**
   * 设置认证令牌
   * @param {string} token - 认证令牌
   */
  setAuthToken(token) {
    // 将认证令牌保存到安全存储中
    localStorage.setItem('cross_platform_auth_token', token)
  }
}

// 导出单例实例
const crossPlatformAPI = new CrossPlatformAPI()
module.exports = crossPlatformAPI

// 如果在浏览器环境中，也暴露到全局
if (typeof window !== 'undefined') {
  window.CrossPlatformAPI = crossPlatformAPI
}






