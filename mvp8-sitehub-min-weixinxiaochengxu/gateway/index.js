/**
 * 网关入口 - 依赖组装
 * 在同一文件里完成依赖组装，避免隐式全局依赖
 */

// 使用相对路径导入，避免别名问题
const { getDatabaseRoute, smartRoute } = require('../utils/route')
const { createAIGateway } = require('./ai-gateway')

/**
 * 创建云函数调用包装器
 * @param {Function} wxCloudCallFunction - 微信云函数调用
 * @returns {Function} 包装后的云函数调用
 */
function createCloudFunctionWrapper(wxCloudCallFunction) {
  return async function callCloudFunction(params) {
    try {
      console.log('[Gateway] 调用云函数:', params.name, params.data?.action)
      const result = await wxCloudCallFunction(params)
      console.log('[Gateway] 云函数返回:', result.result?.success ? '成功' : '失败')
      return result
    } catch (error) {
      console.error('[Gateway] 云函数调用失败:', error)
      throw error
    }
  }
}

/**
 * 创建AI网关实例 - 显式依赖注入
 * @param {Object} options - 配置选项
 * @param {Function} options.wxCloudCallFunction - 微信云函数调用
 * @returns {Object} AI网关实例
 */
function createGatewayInstance(options = {}) {
  // 获取微信云函数调用
  const wxCloudCallFunction = options.wxCloudCallFunction || wx.cloud.callFunction
  
  // 创建云函数调用包装器
  const callCloudFunction = createCloudFunctionWrapper(wxCloudCallFunction)
  
  // 创建AI网关实例
  const aiGateway = createAIGateway({
    getDatabaseRoute,
    callCloudFunction
  })
  
  console.log('[Gateway] AI网关实例创建成功')
  return aiGateway
}

/**
 * 智能用户信息获取 - 自动检测环境
 * @param {Object} userInfo - 用户信息
 * @param {string} userIP - 用户IP
 * @returns {Promise<Object>} 用户信息
 */
async function smartGetUserInfo(userInfo, userIP = '127.0.0.1') {
  try {
    console.log('[Gateway] 智能获取用户信息:', {
      hasUserInfo: !!userInfo,
      userIP: userIP
    })
    
    // 创建网关实例
    const gateway = createGatewayInstance()
    
    // 智能路由选择
    const route = smartRoute(userIP)
    
    // 获取用户信息
    const result = await gateway.getUserInfo({
      env: route.env || 'prod',
      region: route.region || 'cn',
      userIP: userIP,
      userInfo: userInfo
    })
    
    console.log('[Gateway] 智能获取用户信息成功:', {
      userId: result.userId,
      openid: result.openid,
      source: result.source
    })
    
    return result
    
  } catch (error) {
    console.error('[Gateway] 智能获取用户信息失败:', error)
    throw error
  }
}

/**
 * 智能订阅状态获取 - 自动检测环境
 * @param {Object} userInfo - 用户信息
 * @param {string} userIP - 用户IP
 * @returns {Promise<Object>} 订阅状态
 */
async function smartGetSubscriptionStatus(userInfo, userIP = '127.0.0.1') {
  try {
    console.log('[Gateway] 智能获取订阅状态:', {
      hasUserInfo: !!userInfo,
      userIP: userIP
    })
    
    // 创建网关实例
    const gateway = createGatewayInstance()
    
    // 智能路由选择
    const route = smartRoute(userIP)
    
    // 获取订阅状态
    const result = await gateway.getSubscriptionStatus({
      env: route.env || 'prod',
      region: route.region || 'cn',
      userIP: userIP,
      userInfo: userInfo
    })
    
    console.log('[Gateway] 智能获取订阅状态成功:', {
      status: result.status,
      plan: result.plan_type,
      source: result.source
    })
    
    return result
    
  } catch (error) {
    console.error('[Gateway] 智能获取订阅状态失败:', error)
    throw error
  }
}

// 导出网关实例和工具函数
module.exports = {
  createGatewayInstance,
  smartGetUserInfo,
  smartGetSubscriptionStatus,
  getDatabaseRoute,
  smartRoute
}

// 兼容ES6导出
if (typeof exports !== 'undefined') {
  exports.createGatewayInstance = createGatewayInstance
  exports.smartGetUserInfo = smartGetUserInfo
  exports.smartGetSubscriptionStatus = smartGetSubscriptionStatus
  exports.getDatabaseRoute = getDatabaseRoute
  exports.smartRoute = smartRoute
}





