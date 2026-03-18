/**
 * AI网关 - 显式依赖注入模式
 * 从"假定存在"改为"显式携带、可观测"
 */

/**
 * 依赖类型定义
 * @typedef {Object} GatewayDeps
 * @property {Function} getDatabaseRoute - 路由函数
 * @property {Function} callCloudFunction - 云函数调用
 */

/**
 * 创建AI网关 - 显式依赖注入
 * @param {GatewayDeps} deps - 依赖注入
 * @returns {Object} AI网关实例
 */
function createAIGateway(deps) {
  // 立即断言依赖存在 - fail-fast
  if (typeof deps.getDatabaseRoute !== 'function') {
    throw new Error('[AIGateway] getDatabaseRoute missing - 路由函数未注入')
  }
  
  if (typeof deps.callCloudFunction !== 'function') {
    throw new Error('[AIGateway] callCloudFunction missing - 云函数调用未注入')
  }
  
  // 守护日志 - 确认注入已生效
  console.log('[AIGateway.deps] 依赖注入验证:')
  console.log('  - getDatabaseRoute:', typeof deps.getDatabaseRoute, deps.getDatabaseRoute?.name)
  console.log('  - callCloudFunction:', typeof deps.callCloudFunction, deps.callCloudFunction?.name)
  
  const { getDatabaseRoute, callCloudFunction } = deps
  
  return {
    /**
     * 获取用户信息 - 使用注入的路由函数
     * @param {Object} ctx - 上下文
     * @param {string} ctx.env - 环境
     * @param {string} ctx.region - 地区
     * @param {string} ctx.userIP - 用户IP
     * @param {Object} ctx.userInfo - 用户信息
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(ctx) {
      try {
        console.log('[AIGateway] 开始获取用户信息:', {
          env: ctx.env,
          region: ctx.region,
          userIP: ctx.userIP,
          hasUserInfo: !!ctx.userInfo
        })
        
        // 使用注入的路由函数选择数据库
        const route = getDatabaseRoute(ctx.env, ctx.region)
        console.log('[AIGateway.route] 路由选择结果:', route)
        
        // 根据路由选择调用不同的云函数
        if (route.database === 'wechat_cloud') {
          console.log('[AIGateway] 使用微信云数据库')
          return await this.getUserInfoFromWeChatCloud(ctx.userInfo, route)
        } else {
          console.log('[AIGateway] 使用Supabase数据库')
          return await this.getUserInfoFromSupabase(ctx.userInfo, route)
        }
        
      } catch (error) {
        console.error('[AIGateway] 获取用户信息失败:', error)
        throw error
      }
    },
    
    /**
     * 从微信云获取用户信息
     * @param {Object} userInfo - 用户信息
     * @param {Object} route - 路由配置
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfoFromWeChatCloud(userInfo, route) {
      try {
        console.log('[AIGateway] 调用微信云数据库获取用户信息')
        
        const result = await callCloudFunction({
          name: 'callAIGateway',
          data: {
            action: 'getUserInfo',
            userInfo: userInfo
          }
        })
        
        if (result.result && result.result.success) {
          const userData = result.result.data
          console.log('[AIGateway] 微信云用户信息获取成功:', {
            userId: userData.userId,
            openid: userData.openid,
            nickname: userData.nickname
          })
          
          return {
            ...userData,
            source: 'wechat_cloud',
            route: route
          }
        } else {
          throw new Error(result.result?.error || '微信云获取用户信息失败')
        }
        
      } catch (error) {
        console.error('[AIGateway] 微信云获取用户信息失败:', error)
        throw error
      }
    },
    
    /**
     * 从Supabase获取用户信息
     * @param {Object} userInfo - 用户信息
     * @param {Object} route - 路由配置
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfoFromSupabase(userInfo, route) {
      try {
        console.log('[AIGateway] 调用Supabase数据库获取用户信息')
        
        const result = await callCloudFunction({
          name: 'callAIGateway',
          data: {
            action: 'getUserInfo',
            userInfo: userInfo
          }
        })
        
        if (result.result && result.result.success) {
          const userData = result.result.data
          console.log('[AIGateway] Supabase用户信息获取成功:', {
            userId: userData.userId,
            openid: userData.openid,
            nickname: userData.nickname
          })
          
          return {
            ...userData,
            source: 'supabase',
            route: route
          }
        } else {
          throw new Error(result.result?.error || 'Supabase获取用户信息失败')
        }
        
      } catch (error) {
        console.error('[AIGateway] Supabase获取用户信息失败:', error)
        throw error
      }
    },
    
    /**
     * 获取订阅状态
     * @param {Object} ctx - 上下文
     * @returns {Promise<Object>} 订阅状态
     */
    async getSubscriptionStatus(ctx) {
      try {
        console.log('[AIGateway] 获取订阅状态')
        
        const route = getDatabaseRoute(ctx.env, ctx.region)
        console.log('[AIGateway.route] 订阅状态路由:', route)
        
        const result = await callCloudFunction({
          name: 'callAIGateway',
          data: {
            action: 'getSubscriptionStatus',
            userInfo: ctx.userInfo
          }
        })
        
        if (result.result && result.result.success) {
          return {
            ...result.result.data,
            source: route.database,
            route: route
          }
        } else {
          throw new Error(result.result?.error || '获取订阅状态失败')
        }
        
      } catch (error) {
        console.error('[AIGateway] 获取订阅状态失败:', error)
        throw error
      }
    }
  }
}

module.exports = {
  createAIGateway
}





