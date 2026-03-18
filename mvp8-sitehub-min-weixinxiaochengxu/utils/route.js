/**
 * 权威路由实现 - 环境选择器枢纽
 * 从"假定存在"改为"显式携带、可观测"
 */

// 环境类型定义
const ENV_TYPES = {
  DEV: 'dev',
  TEST: 'test', 
  PROD: 'prod'
}

const REGION_TYPES = {
  CN: 'cn',
  US: 'us',
  EU: 'eu'
}

/**
 * 获取数据库路由 - 权威实现
 * @param {string} env - 环境 ('dev'|'test'|'prod')
 * @param {string} region - 地区 ('cn'|'us'|'eu')
 * @returns {Object} 路由配置
 */
function getDatabaseRoute(env = ENV_TYPES.PROD, region = REGION_TYPES.CN) {
  console.log(`[Route] 环境选择: env=${env}, region=${region}`)
  
  // 环境映射表
  const routeMap = {
    [ENV_TYPES.DEV]: {
      [REGION_TYPES.CN]: { database: 'wechat_cloud', region: 'china', reason: 'dev_china' },
      [REGION_TYPES.US]: { database: 'wechat_cloud', region: 'international', reason: 'dev_us' },
      [REGION_TYPES.EU]: { database: 'wechat_cloud', region: 'international', reason: 'dev_eu' }
    },
    [ENV_TYPES.TEST]: {
      [REGION_TYPES.CN]: { database: 'wechat_cloud', region: 'china', reason: 'test_china' },
      [REGION_TYPES.US]: { database: 'supabase', region: 'international', reason: 'test_us' },
      [REGION_TYPES.EU]: { database: 'supabase', region: 'international', reason: 'test_eu' }
    },
    [ENV_TYPES.PROD]: {
      [REGION_TYPES.CN]: { database: 'wechat_cloud', region: 'china', reason: 'prod_china' },
      [REGION_TYPES.US]: { database: 'supabase', region: 'international', reason: 'prod_us' },
      [REGION_TYPES.EU]: { database: 'supabase', region: 'international', reason: 'prod_eu' }
    }
  }
  
  // 获取路由配置
  const route = routeMap[env]?.[region] || routeMap[ENV_TYPES.PROD][REGION_TYPES.CN]
  
  console.log(`[Route] 路由结果:`, route)
  return route
}

/**
 * 根据IP自动检测地区
 * @param {string} userIP - 用户IP
 * @returns {string} 地区代码
 */
function detectRegionFromIP(userIP) {
  if (!userIP || userIP === '127.0.0.1' || userIP === '::1') {
    console.log('[Route] 本地环境，默认中国地区')
    return REGION_TYPES.CN
  }
  
  // 简单的中国IP检测
  const ipParts = userIP.split('.')
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0])
    
    // 检查是否在中国IP范围内
    const chinaIPRanges = [
      '1.0.0.0/8', '14.0.0.0/8', '27.0.0.0/8', '36.0.0.0/8',
      '39.0.0.0/8', '42.0.0.0/8', '49.0.0.0/8', '58.0.0.0/8',
      '59.0.0.0/8', '60.0.0.0/8', '61.0.0.0/8', '101.0.0.0/8',
      '103.0.0.0/8', '106.0.0.0/8', '110.0.0.0/8', '111.0.0.0/8',
      '112.0.0.0/8', '113.0.0.0/8', '114.0.0.0/8', '115.0.0.0/8',
      '116.0.0.0/8', '117.0.0.0/8', '118.0.0.0/8', '119.0.0.0/8',
      '120.0.0.0/8', '121.0.0.0/8', '122.0.0.0/8', '123.0.0.0/8',
      '124.0.0.0/8', '125.0.0.0/8', '140.0.0.0/8', '150.0.0.0/8',
      '153.0.0.0/8', '163.0.0.0/8', '171.0.0.0/8', '175.0.0.0/8',
      '180.0.0.0/8', '182.0.0.0/8', '183.0.0.0/8', '202.0.0.0/8',
      '203.0.0.0/8', '210.0.0.0/8', '211.0.0.0/8', '218.0.0.0/8',
      '219.0.0.0/8', '220.0.0.0/8', '221.0.0.0/8', '222.0.0.0/8'
    ]
    
    const isChinaIP = chinaIPRanges.some(range => {
      const [startIP, cidr] = range.split('/')
      const startParts = startIP.split('.')
      const startFirstOctet = parseInt(startParts[0])
      
      if (cidr === '8') {
        return firstOctet === startFirstOctet
      }
      return false
    })
    
    if (isChinaIP) {
      console.log('[Route] 检测到中国IP，使用中国地区')
      return REGION_TYPES.CN
    }
  }
  
  console.log('[Route] 检测到国际IP，使用国际地区')
  return REGION_TYPES.US // 默认国际地区
}

/**
 * 智能路由选择 - 自动检测环境
 * @param {string} userIP - 用户IP
 * @param {string} env - 环境 (可选，默认自动检测)
 * @returns {Object} 路由配置
 */
function smartRoute(userIP, env = null) {
  // 自动检测环境
  if (!env) {
    // 根据运行环境自动检测
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      // 微信小程序环境
      env = ENV_TYPES.PROD
    } else if (process.env.NODE_ENV === 'development') {
      env = ENV_TYPES.DEV
    } else if (process.env.NODE_ENV === 'test') {
      env = ENV_TYPES.TEST
    } else {
      env = ENV_TYPES.PROD
    }
  }
  
  // 自动检测地区
  const region = detectRegionFromIP(userIP)
  
  // 获取路由配置
  const route = getDatabaseRoute(env, region)
  
  console.log(`[Route] 智能路由: env=${env}, region=${region}, result=`, route)
  return route
}

// 导出权威实现
module.exports = {
  getDatabaseRoute,
  detectRegionFromIP,
  smartRoute,
  ENV_TYPES,
  REGION_TYPES
}

// 兼容ES6导出
if (typeof exports !== 'undefined') {
  exports.getDatabaseRoute = getDatabaseRoute
  exports.detectRegionFromIP = detectRegionFromIP
  exports.smartRoute = smartRoute
  exports.ENV_TYPES = ENV_TYPES
  exports.REGION_TYPES = REGION_TYPES
}





