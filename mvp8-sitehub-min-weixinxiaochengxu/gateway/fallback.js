/**
 * 应急兜底方案 - 确保链路不断
 * 当权威路由实现无法导入时的临时解决方案
 */

/**
 * 应急路由函数 - 最小可用版本
 * @param {string} env - 环境
 * @param {string} region - 地区
 * @returns {Object} 路由配置
 */
function emergencyGetDatabaseRoute(env = 'prod', region = 'cn') {
  console.log('[EmergencyRoute] 使用应急路由:', { env, region })
  
  // 简单的路由逻辑
  const route = {
    database: 'wechat_cloud',
    region: 'international',
    reason: 'emergency_fallback'
  }
  
  // 根据环境调整
  if (env === 'prod' && region === 'cn') {
    route.database = 'wechat_cloud'
    route.region = 'china'
    route.reason = 'emergency_china'
  } else if (env === 'prod' && (region === 'us' || region === 'eu')) {
    route.database = 'supabase'
    route.region = 'international'
    route.reason = 'emergency_international'
  }
  
  console.log('[EmergencyRoute] 应急路由结果:', route)
  return route
}

/**
 * 应急智能路由 - 基于IP的简单判断
 * @param {string} userIP - 用户IP
 * @returns {Object} 路由配置
 */
function emergencySmartRoute(userIP = '127.0.0.1') {
  console.log('[EmergencyRoute] 应急智能路由:', { userIP })
  
  // 本地环境
  if (!userIP || userIP === '127.0.0.1' || userIP === '::1') {
    return {
      database: 'wechat_cloud',
      region: 'china',
      reason: 'emergency_local'
    }
  }
  
  // 简单的中国IP检测
  const ipParts = userIP.split('.')
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0])
    
    // 中国IP段
    const chinaIPs = [1, 14, 27, 36, 39, 42, 49, 58, 59, 60, 61, 101, 103, 106, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 140, 150, 153, 163, 171, 175, 180, 182, 183, 202, 203, 210, 211, 218, 219, 220, 221, 222, 223]
    
    if (chinaIPs.includes(firstOctet)) {
      return {
        database: 'wechat_cloud',
        region: 'china',
        reason: 'emergency_china_ip'
      }
    }
  }
  
  // 默认国际
  return {
    database: 'supabase',
    region: 'international',
    reason: 'emergency_international_ip'
  }
}

/**
 * 安全路由获取 - 带兜底的版本
 * @param {string} env - 环境
 * @param {string} region - 地区
 * @returns {Object} 路由配置
 */
function safeGetDatabaseRoute(env, region) {
  try {
    // 尝试使用权威路由实现
    const { getDatabaseRoute } = require('../utils/route')
    if (typeof getDatabaseRoute === 'function') {
      console.log('[SafeRoute] 使用权威路由实现')
      return getDatabaseRoute(env, region)
    }
  } catch (error) {
    console.warn('[SafeRoute] 权威路由实现不可用:', error.message)
  }
  
  // 使用应急路由
  console.log('[SafeRoute] 使用应急路由')
  return emergencyGetDatabaseRoute(env, region)
}

/**
 * 安全智能路由 - 带兜底的版本
 * @param {string} userIP - 用户IP
 * @returns {Object} 路由配置
 */
function safeSmartRoute(userIP) {
  try {
    // 尝试使用权威路由实现
    const { smartRoute } = require('../utils/route')
    if (typeof smartRoute === 'function') {
      console.log('[SafeRoute] 使用权威智能路由')
      return smartRoute(userIP)
    }
  } catch (error) {
    console.warn('[SafeRoute] 权威智能路由不可用:', error.message)
  }
  
  // 使用应急智能路由
  console.log('[SafeRoute] 使用应急智能路由')
  return emergencySmartRoute(userIP)
}

module.exports = {
  emergencyGetDatabaseRoute,
  emergencySmartRoute,
  safeGetDatabaseRoute,
  safeSmartRoute
}





