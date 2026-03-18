// cloudfunctions/callAIGateway/index.js
// SiteHub智能路由云函数 - 支持IP检测和双数据库架构
// 使用显式依赖注入的网关架构

const cloud = require('wx-server-sdk');
const axios = require('axios');

// 内置路由实现（避免外部模块依赖问题）

// ========================================
// 内置路由实现
// ========================================

/**
 * 智能路由选择 - 根据IP自动检测地区
 * @param {string} userIP - 用户IP
 * @returns {Object} 路由配置
 */
function smartRoute(userIP) {
  console.log(`[Route] 智能路由检测: userIP=${userIP}`)
  
  // 本地环境
  if (!userIP || userIP === '127.0.0.1' || userIP === '::1') {
    console.log('[Route] 本地环境，使用微信云数据库')
    return {
      database: 'wechat_cloud',
      region: 'china',
      reason: 'local_environment'
    }
  }
  
  // 简单的中国IP检测
  const ipParts = userIP.split('.')
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0])
    
    // 中国IP段
    const chinaIPs = [1, 14, 27, 36, 39, 42, 49, 58, 59, 60, 61, 101, 103, 106, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 140, 150, 153, 163, 171, 175, 180, 182, 183, 202, 203, 210, 211, 218, 219, 220, 221, 222, 223]
    
    if (chinaIPs.includes(firstOctet)) {
      console.log('[Route] 检测到中国IP，使用微信云数据库')
      return {
        database: 'wechat_cloud',
        region: 'china',
        reason: 'china_ip_detected'
      }
    }
  }
  
  // 默认国际地区使用Supabase
  console.log('[Route] 检测到国际IP，使用Supabase数据库')
  return {
    database: 'supabase',
    region: 'international',
    reason: 'international_ip_detected'
  }
}

/**
 * 安全智能路由 - 带兜底的版本
 * @param {string} userIP - 用户IP
 * @returns {Object} 路由配置
 */
function safeSmartRoute(userIP) {
  try {
    return smartRoute(userIP)
  } catch (error) {
    console.warn('[SafeRoute] 路由检测失败，使用默认配置:', error.message)
    return {
      database: 'wechat_cloud',
      region: 'china',
      reason: 'fallback_default'
    }
  }
}

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// Supabase配置 - Jeff提供的统一配置
const SUPABASE_CONFIG = {
  url: 'https://ykirhilnbvsanqyenusf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3MDk5NCwiZXhwIjoyMDY4NTQ2OTk0fQ.hHRg85NvVmz6gbqCaWbRNyeOLDF-Ch1dUKoScl9vzJA'
};

// 微信云数据库配置
const WECHAT_CLOUD_CONFIG = {
  envId: 'cloudbase-1gnip2iaa08260e5',
  collection: 'sitehub_data'
};

// 中国IP段检测
const CHINA_IP_RANGES = [
  '1.0.0.0/8', '14.0.0.0/8', '27.0.0.0/8', '36.0.0.0/8',
  '39.0.0.0/8', '42.0.0.0/8', '49.0.0.0/8', '58.0.0.0/8',
  '59.0.0.0/8', '60.0.0.0/8', '61.0.0.0/8', '101.0.0.0/8',
  '103.0.0.0/8', '106.0.0.0/8', '110.0.0.0/8', '111.0.0.0/8',
  '112.0.0.0/8', '113.0.0.0/8', '114.0.0.0/8', '115.0.0.0/8',
  '116.0.0.0/8', '117.0.0.0/8', '118.0.0.0/8', '119.0.0.0/8',
  '120.0.0.0/8', '121.0.0.0/8', '122.0.0.0/8', '123.0.0.0/8',
  '124.0.0.0/8', '125.0.0.0/8', '126.0.0.0/8', '171.0.0.0/8',
  '175.0.0.0/8', '180.0.0.0/8', '182.0.0.0/8', '183.0.0.0/8',
  '202.0.0.0/8', '203.0.0.0/8', '210.0.0.0/8', '211.0.0.0/8',
  '218.0.0.0/8', '219.0.0.0/8', '220.0.0.0/8', '221.0.0.0/8',
  '222.0.0.0/8', '223.0.0.0/8'
];

// ========================================
// 用户标识辅助函数
// ========================================

function generateStableUserId(openid) {
  if (!openid || typeof openid !== 'string') {
    return Math.floor(Math.random() * 900000) + 100000;
  }
  let hash = 0;
  for (let i = 0; i < openid.length; i++) {
    hash = (hash * 131 + openid.charCodeAt(i)) % 1000000;
  }
  const normalized = (hash % 900000) + 100000;
  return normalized;
}

function resolveCreatedAt(existingCreatedAt, fallbackSource) {
  if (existingCreatedAt) {
    return existingCreatedAt;
  }
  if (fallbackSource?.createdAt) {
    return fallbackSource.createdAt;
  }
  if (fallbackSource?.created_at) {
    return fallbackSource.created_at;
  }
  return new Date().toISOString();
}

// ========================================
// IP获取辅助函数
// ========================================

/**
 * 从多个来源提取真实客户端IP
 * 优先级：X-Forwarded-For > X-Real-IP > CF-Connecting-IP > context.requestIP
 */
function extractRealClientIP(event, context) {
  let clientIP = context.requestIP || '127.0.0.1';
  const sources = [];

  console.log('========================================');
  console.log('🔍 [IP提取] 开始提取真实客户端IP');
  console.log('📦 [IP提取] context.requestIP:', context.requestIP);
  console.log('📦 [IP提取] 所有Headers:', JSON.stringify(event.headers || {}, null, 2));

  // 🔥 调试：打印所有可能包含IP的headers
  const ipRelatedHeaders = [
    'x-forwarded-for', 'X-Forwarded-For',
    'x-real-ip', 'X-Real-IP',
    'cf-connecting-ip', 'CF-Connecting-IP',
    'x-client-ip', 'X-Client-IP',
    'x-cluster-client-ip', 'X-Cluster-Client-IP',
    'forwarded', 'Forwarded',
    'via', 'Via'
  ];

  console.log('🔍 [IP提取] IP相关Headers:');
  if (event.headers) {
    ipRelatedHeaders.forEach(headerName => {
      if (event.headers[headerName]) {
        console.log(`  - ${headerName}: ${event.headers[headerName]}`);
      }
    });
  }

  // 方案1: X-Forwarded-For (最常用，可能包含多个IP)
  if (event.headers) {
    const xForwardedFor = event.headers['x-forwarded-for'] ||
                          event.headers['X-Forwarded-For'];
    if (xForwardedFor) {
      // X-Forwarded-For 格式: client, proxy1, proxy2
      // 取第一个IP（真实客户端IP）
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      console.log('📋 [IP提取] X-Forwarded-For 完整链:', ips);
      if (ips.length > 0 && ips[0]) {
        clientIP = ips[0];
        sources.push(`X-Forwarded-For: ${xForwardedFor}`);
        console.log('✅ [IP提取] 使用 X-Forwarded-For 第一个IP:', clientIP);
      }
    }

    // 方案2: X-Real-IP (Nginx等设置)
    const xRealIP = event.headers['x-real-ip'] ||
                    event.headers['X-Real-IP'];
    if (xRealIP && !sources.length) {
      clientIP = xRealIP;
      sources.push(`X-Real-IP: ${xRealIP}`);
      console.log('✅ [IP提取] 使用 X-Real-IP:', clientIP);
    }

    // 方案3: CF-Connecting-IP (Cloudflare CDN)
    const cfIP = event.headers['cf-connecting-ip'] ||
                 event.headers['CF-Connecting-IP'];
    if (cfIP && !sources.length) {
      clientIP = cfIP;
      sources.push(`CF-Connecting-IP: ${cfIP}`);
      console.log('✅ [IP提取] 使用 CF-Connecting-IP:', clientIP);
    }
  }

  // 方案4: 降级使用 context.requestIP
  if (!sources.length) {
    sources.push(`context.requestIP: ${context.requestIP}`);
    console.log('⚠️ [IP提取] 未找到Headers，使用 context.requestIP:', clientIP);
  }

  console.log('🎯 [IP提取] 最终IP:', clientIP);
  console.log('📍 [IP提取] 来源:', sources.join(', '));
  console.log('========================================');

  return {
    ip: clientIP,
    sources: sources,
    fallback: sources.length === 0,
    allHeaders: event.headers || {} // 🔥 新增：返回所有headers用于调试
  };
}

// ========================================
// 使用权威路由实现 - 显式依赖注入
// ========================================

exports.main = async (event, context) => {
  // 提取真实客户端IP
  const ipInfo = extractRealClientIP(event, context);

  console.log('🚀 [CloudFunction] callAIGateway 开始执行', {
    action: event.action,
    timestamp: event.timestamp,
    clientIP: ipInfo.ip,
    ipSources: ipInfo.sources,
    contextRequestIP: context.requestIP
  });

  try {
    const { action } = event;

    switch (action) {
      case 'getOpenid':
        return await handleGetOpenid(event.code);

      case 'detectRegion':
        return await handleDetectRegion(ipInfo.ip, ipInfo);
      
      case 'saveUserData':
        const { userInfo, dataType, data } = event;
        return await handleSaveUserData(userInfo, dataType, data, context.requestIP);
      
      case 'loadUserData':
        const { userInfo: loadUserInfo, dataType: loadDataType } = event;
        return await handleLoadUserData(loadUserInfo, loadDataType, context.requestIP);
      
      // 向后兼容的旧版API
      case 'saveUserDataLegacy':
        const { userData } = event;
        return await handleSaveUserDataLegacy(userData, context.requestIP);
      
      case 'loadUserDataLegacy':
        const { userInfo: legacyUserInfo } = event;
        return await handleLoadUserDataLegacy(legacyUserInfo, context.requestIP);
      
      // 支付统计相关
      case 'recordPayment':
        const { paymentData } = event;
        return await handleRecordPayment(paymentData, context.requestIP);
      
      case 'getProductStats':
        const { productId, platform } = event;
        return await handleGetProductStats(productId, platform, context.requestIP);
      
      case 'getPlatformStats':
        const { platform: statsPlatform } = event;
        return await handleGetPlatformStats(statsPlatform, context.requestIP);
      
      // 订阅管理相关（新增）
      case 'getSubscriptionStatus':
        return await handleGetSubscriptionStatus(event.userInfo, context.requestIP);
      
      case 'getSubscriptionHistory':
        return await handleGetSubscriptionHistory(event.userInfo, context.requestIP);
      
      case 'cancelSubscription':
        return await handleCancelSubscription(event.userInfo, event.subscriptionId, context.requestIP);
      
      case 'reactivateSubscription':
        return await handleReactivateSubscription(event.userInfo, event.subscriptionId, context.requestIP);
      
      // 获取用户完整信息（新增）
      case 'getUserInfo':
        return await handleGetUserInfo(event.userInfo, context.requestIP);
      
      // 统一画像接口 - 单一事实源（SSOT）
      case 'getMe':
        return await handleGetMe(event.userInfo, event.traceId, context.requestIP);
      
      default:
        return {
          success: false,
          error: 'Unknown action',
          action: action
        };
    }

  } catch (error) {
    console.error('❌ [CloudFunction] 执行失败:', error);
    
    // 详细错误信息 - 包含 axios 响应详情
    const response = error.response || {};
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      // 关键：把后端校验错误体抛回前端
      detail: {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        request: {
          url: response.config?.url,
          method: response.config?.method,
          data: response.config?.data
        },
        // 微信云函数特定错误
        errCode: error.errCode,
        errMsg: error.errMsg
      }
    };
  }
};

// 处理地域检测
async function handleDetectRegion(userIP, ipInfo) {
  try {
    console.log('========================================');
    console.log('🌍 [DetectRegion] 开始地域检测');
    console.log('📍 [DetectRegion] 输入参数:', {
      userIP,
      ipSources: ipInfo?.sources || [],
      isFallback: ipInfo?.fallback || false
    });

    // 🔥 新增：检测本地环境/调试环境
    if (!userIP || userIP === '127.0.0.1' || userIP === '::1' || userIP.startsWith('192.168.') || userIP.startsWith('10.') || userIP.startsWith('172.')) {
      console.log('🏠 [DetectRegion] 检测到本地/内网IP，默认使用中国区配置');
      const result = {
        success: true,
        region: 'china',
        database: 'wechat_cloud',
        envId: WECHAT_CLOUD_CONFIG.envId,
        reason: 'local_environment_detected',
        ip: userIP,
        ipSources: ipInfo?.sources || [],
        detectionMethod: 'local_ip_fallback',
        warning: '本地环境检测，默认使用中国区配置'
      };
      console.log('✅ [DetectRegion] 本地环境处理完成:', result);
      console.log('========================================');
      return result;
    }

    // 快速检测中国IP段
    const isChinaIP = isQuickChinaIP(userIP);
    console.log('🇨🇳 [DetectRegion] 快速IP检测结果:', {
      isChina: isChinaIP.isChina,
      definitive: isChinaIP.definitive,
      method: 'ip_range_check'
    });

    // 如果快速检测不确定，进行详细检测
    let location = null;
    if (!isChinaIP.definitive) {
      console.log('🔍 [DetectRegion] 快速检测不确定，开始详细检测...');
      location = await getDetailedIPLocation(userIP);
      console.log('🌐 [DetectRegion] 详细IP检测结果:', {
        country: location?.country,
        countryCode: location?.countryCode,
        isChina: location?.isChina,
        fallback: location?.fallback
      });
    } else {
      console.log('✅ [DetectRegion] 快速检测确定，跳过详细检测');
    }

    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, isChinaIP, location);
    console.log('🎯 [DetectRegion] 路由决策结果:', {
      region: routeInfo.region,
      database: routeInfo.database,
      reason: routeInfo.reason,
      envId: routeInfo.envId
    });

    const result = {
      success: true,
      region: routeInfo.region,
      database: routeInfo.database,
      envId: routeInfo.envId,
      reason: routeInfo.reason,
      location: location,
      ip: userIP,
      ipSources: ipInfo?.sources || [],
      detectionMethod: isChinaIP.definitive ? 'ip_range' : 'api_lookup'
    };

    console.log('✅ [DetectRegion] 地域检测完成，最终结果:', result);
    console.log('========================================');

    return result;
  } catch (error) {
    console.error('========================================');
    console.error('❌ [DetectRegion] 地域检测失败:', error);
    console.error('========================================');

    // ✅ 改进的降级策略：默认国际（遵循"道法自然"原则，不确定时选择"开放"）
    return {
      success: true, // ✅ 改为true，因为降级也是成功的一种策略
      region: 'international',
      database: 'supabase',
      reason: 'detection_failed_fallback',
      envId: SUPABASE_CONFIG.url,
      error: error.message,
      ip: userIP,
      warning: '地域检测失败，使用降级策略（默认国际）'
    };
  }
}

// 处理保存用户数据（新版 - 支持 dataType）
async function handleSaveUserData(userInfo, dataType, data, userIP) {
  try {
    console.log(`💾 [CloudFunction] 保存${dataType}数据`, { userIP, dataType, dataLength: Array.isArray(data) ? data.length : 'not array' });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    let result;
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：保存到 WeChat Cloud
      result = await saveToWeChatCloudByType(userInfo, dataType, data);
    } else {
      // 国际用户：保存到 Supabase
      result = await saveToSupabaseByType(userInfo, dataType, data);
    }
    
    return {
      success: true,
      ...result,
      dataType: dataType,
      route: routeInfo
    };
  } catch (error) {
    console.error(`❌ [CloudFunction] 保存${dataType}失败:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理保存用户数据（旧版 - 向后兼容）
async function handleSaveUserDataLegacy(userData, userIP) {
  try {
    console.log('💾 [CloudFunction] 保存用户数据（旧版）', { userIP });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    let result;
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：保存到 WeChat Cloud
      result = await saveToWeChatCloud(userData);
    } else {
      // 国际用户：保存到 Supabase
      result = await saveToSupabase(userData);
    }
    
    return {
      success: true,
      ...result,
      route: routeInfo
    };
  } catch (error) {
    console.error('❌ [CloudFunction] 保存用户数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理加载用户数据（新版 - 支持 dataType）
async function handleLoadUserData(userInfo, dataType, userIP) {
  try {
    console.log(`📥 [CloudFunction] 加载${dataType}数据`, { userIP, dataType });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    let userData;
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：从 WeChat Cloud 加载
      userData = await loadFromWeChatCloudByType(userInfo, dataType);
    } else {
      // 国际用户：从 Supabase 加载
      userData = await loadFromSupabaseByType(userInfo, dataType);
    }
    
    return {
      success: true,
      data: userData,
      dataType: dataType,
      route: routeInfo
    };
  } catch (error) {
    console.error(`❌ [CloudFunction] 加载${dataType}失败:`, error);
    return {
      success: false,
      error: error.message,
      data: getEmptyData(dataType)
    };
  }
}

// 快速检测中国IP段
function isQuickChinaIP(ip) {
  if (!ip) return { isChina: true, definitive: false };
  
  const ipParts = ip.split('.').map(Number);
  if (ipParts.length !== 4) return { isChina: true, definitive: false };
  
  for (const range of CHINA_IP_RANGES) {
    const [network, prefix] = range.split('/');
    const networkParts = network.split('.').map(Number);
    const prefixLength = parseInt(prefix);
    
    if (isIPInRange(ipParts, networkParts, prefixLength)) {
      return { isChina: true, definitive: true };
    }
  }
  
  return { isChina: false, definitive: false };
}

// 检查IP是否在指定范围内
function isIPInRange(ip, network, prefixLength) {
  const ipNum = (ip[0] << 24) + (ip[1] << 16) + (ip[2] << 8) + ip[3];
  const networkNum = (network[0] << 24) + (network[1] << 16) + (network[2] << 8) + network[3];
  const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

// 详细IP地理位置检测
async function getDetailedIPLocation(ip) {
  try {
    console.log('🌐 [详细检测] 调用 ip-api.com 查询IP:', ip);

    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,query`, {
      timeout: 5000 // 5秒超时
    });

    console.log('📡 [详细检测] API响应:', response.data);

    if (response.data.status === 'success') {
      const result = {
        country: response.data.country,
        countryCode: response.data.countryCode,
        region: response.data.region,
        regionName: response.data.regionName,
        city: response.data.city,
        query: response.data.query,
        isChina: response.data.countryCode === 'CN'
      };

      console.log('✅ [详细检测] 成功:', result);
      return result;
    } else {
      throw new Error(response.data.message || 'IP检测失败');
    }
  } catch (error) {
    console.error('❌ [详细检测] IP检测失败:', error.message);

    // ✅ 改进的降级策略：默认国际（不确定时选择"开放"）
    return {
      country: 'Unknown',
      countryCode: 'XX',
      isChina: false, // ✅ 关键改动：降级时默认为非中国
      region: 'Unknown',
      regionName: 'Unknown',
      city: 'Unknown',
      query: ip,
      error: error.message,
      fallback: true
    };
  }
}

// 智能路由决策
async function makeRoutingDecision(userIP, quickResult, detailedLocation) {
  const isChina = quickResult.isChina || (detailedLocation && detailedLocation.countryCode === 'CN');
  
  if (isChina) {
    return {
      region: 'china',
      database: 'wechat_cloud',
      envId: WECHAT_CLOUD_CONFIG.envId,
      reason: quickResult.definitive ? 'china_ip_range' : 'china_location_detected'
    };
  } else {
    return {
      region: 'international',
      database: 'supabase',
      envId: SUPABASE_CONFIG.url,
      reason: 'international_user'
    };
  }
}

// 保存到微信云数据库
async function saveToWeChatCloud(userData) {
  try {
    const db = cloud.database();
    const result = await db.collection(WECHAT_CLOUD_CONFIG.collection).add({
      data: {
        ...userData,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    return { 
      success: true, 
      id: result._id, 
      database: 'wechat_cloud' 
    };
  } catch (error) {
    console.error('微信云数据库保存失败:', error);
    throw error;
  }
}

// 保存到Supabase
async function saveToSupabase(userData) {
  try {
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users`,
      {
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    return { 
      success: true, 
      id: response.data.id, 
      database: 'supabase' 
    };
  } catch (error) {
    console.error('Supabase保存失败:', error);
    throw error;
  }
}

// 从微信云数据库加载
async function loadFromWeChatCloud(userInfo) {
  try {
    const db = cloud.database();
    const result = await db.collection(WECHAT_CLOUD_CONFIG.collection)
      .where({ openid: userInfo.openid })
      .get();
    
    if (result.data.length > 0) {
      return result.data[0];
    }
    
    return { favorites: [], usageStats: [] };
  } catch (error) {
    console.error('微信云数据库加载失败:', error);
    return { favorites: [], usageStats: [] };
  }
}

// 从Supabase加载
async function loadFromSupabase(userInfo) {
  try {
    const response = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${userInfo.openid}`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.length > 0) {
      return response.data[0];
    }
    
    return { favorites: [], usageStats: [] };
  } catch (error) {
    console.error('Supabase加载失败:', error);
    return { favorites: [], usageStats: [] };
  }
}

// ========================================
// 新增：按类型保存/加载数据
// ========================================

// WeChat Cloud 按类型保存
async function saveToWeChatCloudByType(userInfo, dataType, data) {
  const db = cloud.database();
  const userId = userInfo.openid;
  
  console.log(`[DEBUG] saveToWeChatCloudByType - dataType: ${dataType}`);
  console.log(`[DEBUG] saveToWeChatCloudByType - userId: ${userId}`);
  console.log(`[DEBUG] saveToWeChatCloudByType - data:`, JSON.stringify(data, null, 2));
  
  switch(dataType) {
    case 'favorites':
      console.log(`[DEBUG] favorites - data:`, data);
      console.log(`[DEBUG] favorites - type:`, typeof data);
      console.log(`[DEBUG] favorites - isArray:`, Array.isArray(data));
      
      await db.collection('sitehub_favorites')
        .where({ user_id: userId })
        .remove();
      
      if (data && Array.isArray(data) && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          await db.collection('sitehub_favorites').add({
            data: {
              user_id: userId,
              site_id: data[i],
              sort_order: i,
              created_at: new Date()
            }
          });
        }
      }
      console.log(`✅ 保存${data?.length || 0}个收藏到WeChat Cloud`);
      break;
      
    case 'custom_sites':
      console.log(`[DEBUG] custom_sites - data:`, data);
      console.log(`[DEBUG] custom_sites - type:`, typeof data);
      console.log(`[DEBUG] custom_sites - isArray:`, Array.isArray(data));
      
      await db.collection('sitehub_custom_sites')
        .where({ user_id: userId })
        .remove();
      
      if (data && Array.isArray(data) && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const site = data[i];
          await db.collection('sitehub_custom_sites').add({
            data: {
              user_id: userId,
              site_url: site.url,
              site_name: site.name,
              site_logo: site.logo || '🌐',
              site_description: site.description || '',
              sort_order: site.sort_order !== undefined ? site.sort_order : i,
              created_at: new Date()
            }
          });
        }
      }
      console.log(`✅ 保存${data?.length || 0}个自定义网站到WeChat Cloud`);
      break;
      
    case 'usage_stats':
      await db.collection('sitehub_usage_stats')
        .where({ user_id: userId })
        .remove();
      
      if (data && Array.isArray(data) && data.length > 0) {
        for (const stat of data) {
          await db.collection('sitehub_usage_stats').add({
            data: {
              user_id: userId,
              site_id: stat.site_id,
              action: stat.action || 'visit',
              timestamp: new Date(stat.timestamp || new Date()),
              created_at: new Date()
            }
          });
        }
      }
      console.log(`✅ 保存${data?.length || 0}条使用统计到WeChat Cloud`);
      break;
      
    default:
      throw new Error(`不支持的数据类型: ${dataType}`);
  }
  
  return { success: true, database: 'wechat_cloud' };
}

// Supabase 按类型保存
async function saveToSupabaseByType(userInfo, dataType, data) {
  const userId = userInfo.openid;
  
  switch(dataType) {
    case 'favorites':
      // 先删除现有数据
      await axios.delete(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_favorites?user_id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
          }
        }
      );
      
      // 插入新数据
      if (data && Array.isArray(data) && data.length > 0) {
        const records = data.map((siteId, index) => ({
          user_id: userId,
          site_id: siteId,
          sort_order: index
        }));
        
        await axios.post(
          `${SUPABASE_CONFIG.url}/rest/v1/sitehub_favorites`,
          records,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.serviceKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );
      }
      console.log(`✅ 保存${data?.length || 0}个收藏到Supabase`);
      break;
      
    case 'custom_sites':
      // 先删除现有数据
      await axios.delete(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_custom_sites?user_id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
          }
        }
      );
      
      // 插入新数据
      if (data && Array.isArray(data) && data.length > 0) {
        const records = data.map((site, index) => ({
          user_id: userId,
          site_url: site.url,
          site_name: site.name,
          site_logo: site.logo || '🌐',
          site_description: site.description || '',
          sort_order: site.sort_order !== undefined ? site.sort_order : index
        }));
        
        await axios.post(
          `${SUPABASE_CONFIG.url}/rest/v1/sitehub_custom_sites`,
          records,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.serviceKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );
      }
      console.log(`✅ 保存${data?.length || 0}个自定义网站到Supabase`);
      break;
      
    case 'usage_stats':
      // 先删除现有数据
      await axios.delete(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_usage_stats?user_id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
          }
        }
      );
      
      // 插入新数据
      if (data && Array.isArray(data) && data.length > 0) {
        const records = data.map(stat => ({
          user_id: userId,
          site_id: stat.site_id,
          action: stat.action || 'visit',
          timestamp: stat.timestamp || new Date().toISOString()
        }));
        
        await axios.post(
          `${SUPABASE_CONFIG.url}/rest/v1/sitehub_usage_stats`,
          records,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.serviceKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );
      }
      console.log(`✅ 保存${data?.length || 0}条使用统计到Supabase`);
      break;
      
    default:
      throw new Error(`不支持的数据类型: ${dataType}`);
  }
  
  return { success: true, database: 'supabase' };
}

// WeChat Cloud 按类型加载
async function loadFromWeChatCloudByType(userInfo, dataType) {
  const db = cloud.database();
  const userId = userInfo.openid;
  
  switch(dataType) {
    case 'favorites':
      return await loadFavoritesFromWeChatCloud(db, userId);
      
    case 'custom_sites':
      return await loadCustomSitesFromWeChatCloud(db, userId);
      
    case 'usage_stats':
      return await loadUsageStatsFromWeChatCloud(db, userId);
      
    case 'all':
      const [favorites, customSites, usageStats] = await Promise.all([
        loadFavoritesFromWeChatCloud(db, userId),
        loadCustomSitesFromWeChatCloud(db, userId),
        loadUsageStatsFromWeChatCloud(db, userId)
      ]);
      return { favorites, custom_sites: customSites, usage_stats: usageStats };
      
    default:
      return getEmptyData(dataType);
  }
}

// Supabase 按类型加载
async function loadFromSupabaseByType(userInfo, dataType) {
  const userId = userInfo.openid;
  
  switch(dataType) {
    case 'favorites':
      return await loadFavoritesFromSupabase(userId);
      
    case 'custom_sites':
      return await loadCustomSitesFromSupabase(userId);
      
    case 'usage_stats':
      return await loadUsageStatsFromSupabase(userId);
      
    case 'all':
      const [favorites, customSites, usageStats] = await Promise.all([
        loadFavoritesFromSupabase(userId),
        loadCustomSitesFromSupabase(userId),
        loadUsageStatsFromSupabase(userId)
      ]);
      return { favorites, custom_sites: customSites, usage_stats: usageStats };
      
    default:
      return getEmptyData(dataType);
  }
}

// 辅助函数：从 WeChat Cloud 加载收藏
async function loadFavoritesFromWeChatCloud(db, userId) {
  try {
    const result = await db.collection('sitehub_favorites')
      .where({ user_id: userId })
      .orderBy('sort_order', 'asc')
      .get();
    
    return result.data.map(item => item.site_id);
  } catch (error) {
    console.error('加载收藏失败:', error);
    return [];
  }
}

// 辅助函数：从 WeChat Cloud 加载自定义网站
async function loadCustomSitesFromWeChatCloud(db, userId) {
  try {
    const result = await db.collection('sitehub_custom_sites')
      .where({ user_id: userId })
      .orderBy('sort_order', 'asc')
      .get();
    
    return result.data.map(item => ({
      id: item._id,
      name: item.site_name,
      url: item.site_url,
      logo: item.site_logo,
      description: item.site_description,
      sort_order: item.sort_order
    }));
  } catch (error) {
    console.error('加载自定义网站失败:', error);
    return [];
  }
}

// 辅助函数：从 WeChat Cloud 加载使用统计
async function loadUsageStatsFromWeChatCloud(db, userId) {
  try {
    const result = await db.collection('sitehub_usage_stats')
      .where({ user_id: userId })
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    return result.data.map(item => ({
      site_id: item.site_id,
      action: item.action,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('加载使用统计失败:', error);
    return [];
  }
}

// 辅助函数：从 Supabase 加载收藏
async function loadFavoritesFromSupabase(userId) {
  try {
    const response = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_favorites?user_id=eq.${userId}&order=sort_order.asc`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.map(item => item.site_id);
  } catch (error) {
    console.error('加载收藏失败:', error);
    return [];
  }
}

// 辅助函数：从 Supabase 加载自定义网站
async function loadCustomSitesFromSupabase(userId) {
  try {
    const response = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_custom_sites?user_id=eq.${userId}&order=sort_order.asc`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.map(item => ({
      id: item.id,
      name: item.site_name,
      url: item.site_url,
      logo: item.site_logo,
      description: item.site_description,
      sort_order: item.sort_order
    }));
  } catch (error) {
    console.error('加载自定义网站失败:', error);
    return [];
  }
}

// 辅助函数：从 Supabase 加载使用统计
async function loadUsageStatsFromSupabase(userId) {
  try {
    const response = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_usage_stats?user_id=eq.${userId}&order=timestamp.desc&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.map(item => ({
      site_id: item.site_id,
      action: item.action,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('加载使用统计失败:', error);
    return [];
  }
}

// 处理加载用户数据（旧版 - 向后兼容）
async function handleLoadUserDataLegacy(userInfo, userIP) {
  try {
    console.log('📥 [CloudFunction] 加载用户数据（旧版）', { userIP });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    let userData;
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：从 WeChat Cloud 加载
      userData = await loadFromWeChatCloud(userInfo);
    } else {
      // 国际用户：从 Supabase 加载
      userData = await loadFromSupabase(userInfo);
    }
    
    return {
      success: true,
      data: userData,
      route: routeInfo
    };
  } catch (error) {
    console.error('❌ [CloudFunction] 加载用户数据失败:', error);
    return {
      success: false,
      error: error.message,
      data: { favorites: [], usageStats: [] }
    };
  }
}

// ========================================
// 支付统计相关
// ========================================

// 记录支付统计
async function handleRecordPayment(paymentData, userIP) {
  try {
    console.log('💰 [PaymentStats] 记录支付统计', { userIP, paymentData });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    let result;
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：保存到 WeChat Cloud
      return await savePaymentToWeChatCloud(paymentData);
    } else {
      // 国际用户：保存到 Supabase
      return await savePaymentToSupabase(paymentData);
    }
  } catch (error) {
    console.error('❌ [PaymentStats] 记录支付失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取产品利润统计
async function handleGetProductStats(productId, platform, userIP) {
  try {
    console.log('📊 [PaymentStats] 获取产品统计', { userIP, productId, platform });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：从 WeChat Cloud 获取
      return await getProductStatsFromWeChatCloud(productId, platform);
    } else {
      // 国际用户：从 Supabase 获取
      return await getProductStatsFromSupabase(productId, platform);
    }
  } catch (error) {
    console.error('❌ [PaymentStats] 获取产品统计失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取平台利润统计
async function handleGetPlatformStats(platform, userIP) {
  try {
    console.log('📈 [PaymentStats] 获取平台统计', { userIP, platform });
    
    // 智能路由决策
    const routeInfo = await makeRoutingDecision(userIP, { isChina: true }, null);
    
    if (routeInfo.database === 'wechat_cloud') {
      // 中国用户：从 WeChat Cloud 获取
      return await getPlatformStatsFromWeChatCloud(platform);
    } else {
      // 国际用户：从 Supabase 获取
      return await getPlatformStatsFromSupabase(platform);
    }
  } catch (error) {
    console.error('❌ [PaymentStats] 获取平台统计失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========================================
// WeChat Cloud 支付统计操作
// ========================================

// 保存支付统计到 WeChat Cloud
async function savePaymentToWeChatCloud(paymentData) {
  try {
    const db = cloud.database();
    const result = await db.collection('sitehub_payment_stats').add({
      data: {
        ...paymentData,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ 支付统计已保存到 WeChat Cloud:', result._id);
    return { success: true, id: result._id };
  } catch (error) {
    console.error('❌ WeChat Cloud 支付统计保存失败:', error);
    throw error;
  }
}

// 从 WeChat Cloud 获取产品统计
async function getProductStatsFromWeChatCloud(productId, platform) {
  try {
    const db = cloud.database();
    
    // 构建查询条件
    const whereCondition = { product_id: productId };
    if (platform) {
      whereCondition.platform = platform;
    }
    
    const result = await db.collection('sitehub_payment_stats')
      .where(whereCondition)
      .get();
    
    const stats = result.data;
    const totalUsers = new Set(stats.map(s => s.user_id)).size;
    
    return {
      success: true,
      data: {
        product_id: productId,
        platform: platform,
        total_users: totalUsers,
        total_orders: stats.length,
        stats: stats
      }
    };
  } catch (error) {
    console.error('❌ WeChat Cloud 产品统计获取失败:', error);
    throw error;
  }
}

// 从 WeChat Cloud 获取平台统计
async function getPlatformStatsFromWeChatCloud(platform) {
  try {
    const db = cloud.database();
    
    const whereCondition = {};
    if (platform) {
      whereCondition.platform = platform;
    }
    
    const result = await db.collection('sitehub_payment_stats')
      .where(whereCondition)
      .get();
    
    const stats = result.data;
    const productCount = new Set(stats.map(s => s.product_id)).size;
    
    return {
      success: true,
      data: {
        platform: platform,
        total_orders: stats.length,
        product_count: productCount,
        stats: stats
      }
    };
  } catch (error) {
    console.error('❌ WeChat Cloud 平台统计获取失败:', error);
    throw error;
  }
}

// ========================================
// Supabase 支付统计操作
// ========================================

// 保存支付统计到 Supabase
async function savePaymentToSupabase(paymentData) {
  try {
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/payment_stats`,
      {
        ...paymentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    console.log('✅ 支付统计已保存到 Supabase:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Supabase 支付统计保存失败:', error);
    throw error;
  }
}

// 从 Supabase 获取产品统计
async function getProductStatsFromSupabase(productId, platform) {
  try {
    let url = `${SUPABASE_CONFIG.url}/rest/v1/payment_stats?product_id=eq.${productId}`;
    if (platform) {
      url += `&platform=eq.${platform}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'apikey': SUPABASE_CONFIG.serviceKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const stats = response.data;
    const totalUsers = new Set(stats.map(s => s.user_id)).size;
    
    return {
      success: true,
      data: {
        product_id: productId,
        platform: platform,
        total_users: totalUsers,
        total_orders: stats.length,
        stats: stats
      }
    };
  } catch (error) {
    console.error('❌ Supabase 产品统计获取失败:', error);
    throw error;
  }
}

// 从 Supabase 获取平台统计
async function getPlatformStatsFromSupabase(platform) {
  try {
    let url = `${SUPABASE_CONFIG.url}/rest/v1/payment_stats`;
    if (platform) {
      url += `?platform=eq.${platform}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'apikey': SUPABASE_CONFIG.serviceKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const stats = response.data;
    const productCount = new Set(stats.map(s => s.product_id)).size;
    
    return {
      success: true,
      data: {
        platform: platform,
        total_orders: stats.length,
        product_count: productCount,
        stats: stats
      }
    };
  } catch (error) {
    console.error('❌ Supabase 平台统计获取失败:', error);
    throw error;
  }
}

// ========================================
// 工具函数
// ========================================

// 获取空数据
function getEmptyData(dataType) {
  switch(dataType) {
    case 'favorites':
      return [];
    case 'custom_sites':
      return [];
    case 'usage_stats':
      return [];
    case 'all':
      return {
        favorites: [],
        custom_sites: [],
        usage_stats: []
      };
    default:
      return null;
  }
}

// ========================================
// 订阅管理功能（新增）
// ========================================

function buildUserMatchCondition(db, userInfo) {
  const _ = db.command;
  const conditions = [];

  if (userInfo?.openid) {
    conditions.push({ user_openid: userInfo.openid });
    conditions.push({ user_id: userInfo.openid });
  }

  if (userInfo?.userId) {
    conditions.push({ user_id: userInfo.userId });
    conditions.push({ userId: userInfo.userId });
  }

  if (conditions.length === 0) {
    return null;
  }

  return _.or(...conditions);
}

// 获取用户订阅状态
async function handleGetSubscriptionStatus(userInfo, userIP) {
  try {
    console.log('📊 [Subscription] 获取订阅状态:', userInfo.openid);
    
    const routeInfo = safeSmartRoute(userIP);
    
    if (routeInfo.database === 'wechat_cloud') {
      return await getSubscriptionFromWeChatCloud(userInfo);
    } else {
      return await getSubscriptionFromSupabase(userInfo);
    }
  } catch (error) {
    console.error('❌ 获取订阅状态失败:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// 从微信云获取订阅
async function getSubscriptionFromWeChatCloud(userInfo) {
  try {
    const db = cloud.database();
    const _ = db.command;
    const userCondition = buildUserMatchCondition(db, userInfo);
    
    if (!userCondition) {
      return {
        success: true,
        data: { has_subscription: false }
      };
    }
    
    // 查询当前有效订阅
    const result = await db.collection('sitehub_subscriptions')
      .where(_.and([
        userCondition,
        { status: _.in(['active', 'pending', 'cancelled']) }
      ]))
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();
    
    if (result.data && result.data.length > 0) {
      const sub = result.data[0];
      let normalizedStatus = sub.status;
      
      if (userInfo?.userId && (!sub.user_id || sub.user_id === userInfo.openid || sub.user_id === undefined)) {
        try {
          await db.collection('sitehub_subscriptions')
            .doc(sub._id)
            .update({
              data: {
                user_id: userInfo.userId,
                userId: userInfo.userId
              }
            });
        } catch (idUpdateError) {
          console.warn('⚠️ WeChat Cloud 订阅 userId 校正失败:', idUpdateError.message);
        }
      }
      
      if (
        sub.status === 'pending' &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date()
      ) {
        normalizedStatus = 'active';
        
        try {
          await db.collection('sitehub_subscriptions')
            .doc(sub._id)
            .update({
              data: {
                status: normalizedStatus,
                status_auto_fixed: true,
                updated_at: new Date()
              }
            });
        } catch (updateError) {
          console.warn('⚠️ WeChat Cloud 订阅状态自动校正失败:', updateError.message);
        }
        
      }
      
      if (normalizedStatus === 'active') {
        try {
          await db.collection('sitehub_users')
            .where({ openid: userInfo.openid })
            .update({
              data: {
                is_pro: true,
                subscription_status: 'active',
                subscription_expires_at: sub.current_period_end || null,
                updated_at: new Date()
              }
            });
        } catch (userUpdateError) {
          console.warn('⚠️ WeChat Cloud 用户状态同步失败:', userUpdateError.message);
        }
      } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'expired') {
        try {
          await db.collection('sitehub_users')
            .where({ openid: userInfo.openid })
            .update({
              data: {
                is_pro: false,
                subscription_status: normalizedStatus,
                subscription_expires_at: sub.current_period_end || null,
                updated_at: new Date()
              }
            });
        } catch (userDowngradeError) {
          console.warn('⚠️ WeChat Cloud 用户降级同步失败:', userDowngradeError.message);
        }
      }
      return {
        success: true,
        data: {
          has_subscription: true,
          subscription_id: sub._id,
          plan_type: sub.plan_type,
          billing_cycle: sub.billing_cycle,
          status: normalizedStatus,
          original_status: sub.status,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          amount: sub.amount,
          currency: sub.currency || 'CNY',
          start_date: sub.start_date
        }
      };
    } else {
      return {
        success: true,
        data: {
          has_subscription: false
        }
      };
    }
  } catch (error) {
    console.error('❌ WeChat Cloud 订阅查询失败:', error);
    throw error;
  }
}

// 从 Supabase 获取订阅
async function getSubscriptionFromSupabase(userInfo) {
  try {
    // 先获取用户UUID
    const userResponse = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${userInfo.openid}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
        }
      }
    );
    
    if (!userResponse.data || userResponse.data.length === 0) {
      return {
        success: true,
        data: { has_subscription: false }
      };
    }
    
    const userId = userResponse.data[0].id;
    
    // 调用 Supabase 函数获取订阅
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/rpc/get_user_current_subscription`,
      { p_openid: userInfo.openid },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.length > 0) {
      const sub = response.data[0];
      let normalizedStatus = sub.status;
      if (
        sub.status === 'pending' &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date()
      ) {
        normalizedStatus = 'active';
      }
      return {
        success: true,
        data: {
          has_subscription: true,
          subscription_id: sub.subscription_id,
          plan_type: sub.plan_type,
          billing_cycle: sub.billing_cycle,
          status: normalizedStatus,
          original_status: sub.status,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          amount: sub.amount,
          currency: sub.currency || 'CNY',
          start_date: sub.start_date
        }
      };
    } else {
      return {
        success: true,
        data: { has_subscription: false }
      };
    }
  } catch (error) {
    console.error('❌ Supabase 订阅查询失败:', error);
    throw error;
  }
}

// 获取用户订阅历史
async function handleGetSubscriptionHistory(userInfo, userIP) {
  try {
    console.log('📜 [Subscription] 获取订阅历史:', userInfo.openid);
    
    const routeInfo = safeSmartRoute(userIP);
    
    if (routeInfo.database === 'wechat_cloud') {
      return await getSubscriptionHistoryFromWeChatCloud(userInfo);
    } else {
      return await getSubscriptionHistoryFromSupabase(userInfo);
    }
  } catch (error) {
    console.error('❌ 获取订阅历史失败:', error);
    return {
      success: false,
      error: error.message,
      data: { history: [] }
    };
  }
}

// 从微信云获取订阅历史
async function getSubscriptionHistoryFromWeChatCloud(userInfo) {
  try {
    const db = cloud.database();
    const userCondition = buildUserMatchCondition(db, userInfo);
    
    if (!userCondition) {
      return {
        success: true,
        data: { history: [] }
      };
    }
    
    const result = await db.collection('sitehub_subscriptions')
      .where(userCondition)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();
    
    const history = result.data.map(sub => ({
      subscription_id: sub._id,
      plan_type: sub.plan_type,
      billing_cycle: sub.billing_cycle,
      amount: sub.amount,
      currency: sub.currency || 'CNY',
      status: sub.status === 'active' ? 'paid' : sub.status,
      created_at: sub.created_at,
      start_date: sub.start_date,
      end_date: sub.current_period_end
    }));
    
    return {
      success: true,
      data: { history }
    };
  } catch (error) {
    console.error('❌ WeChat Cloud 订阅历史查询失败:', error);
    throw error;
  }
}

// 从 Supabase 获取订阅历史
async function getSubscriptionHistoryFromSupabase(userInfo) {
  try {
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/rpc/get_user_subscription_history`,
      { p_openid: userInfo.openid, p_limit: 10 },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const history = response.data.map(sub => ({
      subscription_id: sub.subscription_id,
      plan_type: sub.plan_type,
      billing_cycle: sub.billing_cycle,
      amount: parseFloat(sub.amount),
      currency: sub.currency || 'CNY',
      status: sub.status === 'active' ? 'paid' : sub.status,
      created_at: sub.created_at,
      start_date: sub.start_date,
      end_date: sub.end_date
    }));
    
    return {
      success: true,
      data: { history }
    };
  } catch (error) {
    console.error('❌ Supabase 订阅历史查询失败:', error);
    throw error;
  }
}

// 取消订阅
async function handleCancelSubscription(userInfo, subscriptionId, userIP) {
  try {
    console.log('❌ [Subscription] 取消订阅:', subscriptionId);
    
    const routeInfo = safeSmartRoute(userIP);
    
    if (routeInfo.database === 'wechat_cloud') {
      return await cancelSubscriptionInWeChatCloud(userInfo, subscriptionId);
    } else {
      return await cancelSubscriptionInSupabase(userInfo, subscriptionId);
    }
  } catch (error) {
    console.error('❌ 取消订阅失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 在微信云中取消订阅
async function cancelSubscriptionInWeChatCloud(userInfo, subscriptionId) {
  try {
    const db = cloud.database();
    
    const result = await db.collection('sitehub_subscriptions')
      .doc(subscriptionId)
      .update({
        data: {
          cancel_at_period_end: true,
          cancelled_at: new Date(),
          updated_at: new Date()
        }
      });
    
    if (result.stats.updated === 1) {
      // 获取更新后的订阅信息
      const subData = await db.collection('sitehub_subscriptions')
        .doc(subscriptionId)
        .get();
      
      return {
        success: true,
        message: '订阅将在当前周期结束时取消',
        data: {
          subscription_id: subscriptionId,
          cancel_at_period_end: true,
          current_period_end: subData.data.current_period_end
        }
      };
    } else {
      throw new Error('订阅不存在或已取消');
    }
  } catch (error) {
    console.error('❌ WeChat Cloud 取消订阅失败:', error);
    throw error;
  }
}

// 在 Supabase 中取消订阅
async function cancelSubscriptionInSupabase(userInfo, subscriptionId) {
  try {
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/rpc/cancel_subscription_at_period_end`,
      {
        p_subscription_id: subscriptionId,
        p_openid: userInfo.openid
      },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Supabase 取消订阅失败:', error);
    throw error;
  }
}

// 重新激活订阅
async function handleReactivateSubscription(userInfo, subscriptionId, userIP) {
  try {
    console.log('✅ [Subscription] 重新激活订阅:', subscriptionId);
    
    const routeInfo = safeSmartRoute(userIP);
    
    if (routeInfo.database === 'wechat_cloud') {
      return await reactivateSubscriptionInWeChatCloud(userInfo, subscriptionId);
    } else {
      return await reactivateSubscriptionInSupabase(userInfo, subscriptionId);
    }
  } catch (error) {
    console.error('❌ 重新激活订阅失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 在微信云中重新激活订阅
async function reactivateSubscriptionInWeChatCloud(userInfo, subscriptionId) {
  try {
    const db = cloud.database();
    
    const result = await db.collection('sitehub_subscriptions')
      .doc(subscriptionId)
      .update({
        data: {
          cancel_at_period_end: false,
          cancelled_at: db.command.remove(),
          status: 'active',
          updated_at: new Date()
        }
      });
    
    if (result.stats.updated === 1) {
      return {
        success: true,
        message: '订阅已重新激活',
        data: {
          subscription_id: subscriptionId,
          cancel_at_period_end: false,
          status: 'active'
        }
      };
    } else {
      throw new Error('订阅不存在或无法重新激活');
    }
  } catch (error) {
    console.error('❌ WeChat Cloud 重新激活订阅失败:', error);
    throw error;
  }
}

// 在 Supabase 中重新激活订阅
async function reactivateSubscriptionInSupabase(userInfo, subscriptionId) {
  try {
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/rpc/reactivate_subscription`,
      {
        p_subscription_id: subscriptionId,
        p_openid: userInfo.openid
      },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Supabase 重新激活订阅失败:', error);
    throw error;
  }
}

// ========================================
// 用户信息管理功能（新增）
// ========================================

// 获取用户完整信息
async function handleGetUserInfo(userInfo, userIP) {
  try {
    console.log('👤 [UserInfo] 获取用户完整信息:', userInfo.openid);
    
    const routeInfo = safeSmartRoute(userIP);
    
    if (routeInfo.database === 'wechat_cloud') {
      return await getUserInfoFromWeChatCloud(userInfo);
    } else {
      return await getUserInfoFromSupabase(userInfo);
    }
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// 从微信云获取用户信息
async function getUserInfoFromWeChatCloud(userInfo) {
  try {
    const db = cloud.database();
    const now = new Date().toISOString();
    
    // 查询用户信息
    const result = await db.collection('sitehub_users')
      .where({ openid: userInfo.openid })
      .limit(1)
      .get();
    
    if (result.data && result.data.length > 0) {
      const user = result.data[0];
      const updates = {};

      // 🔑 确保 userId 存在（检查两个可能的字段名）
      if (!user.userId && !user.user_id) {
        const stableUserId = generateStableUserId(user.openid || userInfo.openid);
        console.log(`✅ [UserInfo] 生成稳定 userId: ${stableUserId} for openid: ${user.openid}`);
        updates.userId = stableUserId;
        updates.user_id = stableUserId; // 兼容字段
        user.userId = stableUserId;
      } else {
        // 使用已存在的 userId
        user.userId = user.userId || user.user_id;
        console.log(`✅ [UserInfo] 使用已存在 userId: ${user.userId}`);
      }

      if (!user.created_at) {
        const resolvedCreatedAt = resolveCreatedAt(user.created_at, userInfo);
        updates.created_at = resolvedCreatedAt;
        user.created_at = resolvedCreatedAt;
      }

      updates.last_login = now;
      user.last_login = now;

      if (Object.keys(updates).length > 0) {
        console.log(`📝 [UserInfo] 更新用户信息:`, updates);
        await db.collection('sitehub_users')
          .doc(user._id)
          .update({
            data: updates
          });
        console.log(`✅ [UserInfo] 用户信息已更新`);
      }

      console.log(`📊 [UserInfo] 返回用户数据 - userId: ${user.userId}, openid: ${user.openid}`);

      return {
        success: true,
        data: {
          openid: user.openid,
          userId: user.userId,
          nickname: user.nickname || userInfo.nickName,
          avatar_url: user.avatar_url || userInfo.avatarUrl,
          region: user.region || 'international',
          created_at: user.created_at,
          last_login: user.last_login
        }
      };
    } else {
      // 用户不存在，创建新用户
      const stableUserId = generateStableUserId(userInfo.openid);
      const createdAt = resolveCreatedAt(null, userInfo);
      const newUser = {
        openid: userInfo.openid,
        userId: stableUserId,
        nickname: userInfo.nickName || 'User',
        avatar_url: userInfo.avatarUrl || '',
        region: 'international',
        created_at: createdAt,
        last_login: now
      };
      
      await db.collection('sitehub_users').add({
        data: newUser
      });
      
      return {
        success: true,
        data: newUser
      };
    }
  } catch (error) {
    console.error('❌ WeChat Cloud 获取用户信息失败:', error);
    throw error;
  }
}

// 从 Supabase 获取用户信息
async function getUserInfoFromSupabase(userInfo) {
  try {
    // 调用 Supabase 函数获取用户完整信息
    const response = await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/rpc/get_user_with_data`,
      { p_openid: userInfo.openid },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.length > 0) {
      const user = response.data[0];
      const now = new Date().toISOString();
      const updates = {};

      if (!user.userId) {
        const stableUserId = generateStableUserId(user.openid || userInfo.openid);
        updates.userId = stableUserId;
        user.userId = stableUserId;
      }

      if (!user.created_at) {
        const resolvedCreatedAt = resolveCreatedAt(user.created_at, userInfo);
        updates.created_at = resolvedCreatedAt;
        user.created_at = resolvedCreatedAt;
      }

      updates.last_login = now;
      user.last_login = now;

      if (Object.keys(updates).length > 0) {
        const patchResponse = await axios.patch(
          `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${encodeURIComponent(userInfo.openid)}`,
          updates,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.serviceKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );
        
        if (patchResponse.data && patchResponse.data.length > 0) {
          const updatedUser = patchResponse.data[0];
          user.userId = updatedUser.userId;
          user.created_at = updatedUser.created_at;
          user.last_login = updatedUser.last_login;
        }
      }

      return {
        success: true,
        data: {
          openid: user.openid,
          userId: user.userId,
          nickname: user.nickname || userInfo.nickName,
          avatar_url: user.avatar_url || userInfo.avatarUrl,
          region: user.region || 'international',
          created_at: user.created_at,
          last_login: user.last_login
        }
      };
    } else {
      // 用户不存在，创建新用户
      const now = new Date().toISOString();
      const stableUserId = generateStableUserId(userInfo.openid);
      const createdAt = resolveCreatedAt(null, userInfo);
      const createResponse = await axios.post(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users`,
        {
          openid: userInfo.openid,
          userId: stableUserId,
          nickname: userInfo.nickName || 'User',
          avatar_url: userInfo.avatarUrl || '',
          region: 'international',
          created_at: createdAt,
          last_login: now
        },
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );
      
      const newUser = createResponse.data[0];
      return {
        success: true,
        data: {
          openid: newUser.openid,
          userId: newUser.userId, // 返回用户ID
          nickname: newUser.nickname,
          avatar_url: newUser.avatar_url,
          region: newUser.region,
          created_at: newUser.created_at,
          last_login: newUser.last_login
        }
      };
    }
  } catch (error) {
    console.error('❌ Supabase 获取用户信息失败:', error);
    throw error;
  }
}

// ========================================
// 获取微信 openid
// ========================================
async function handleGetOpenid(code) {
  if (!code) {
    return { success: false, error: 'Missing code parameter' };
  }
  
  try {
    console.log('🔍 [GetOpenid] 开始获取 openid，code:', code);
    
    // 使用微信云开发 SDK 获取 openid
    // 在微信云函数中，可以直接通过 context 获取 openid
    const openid = cloud.getWXContext().OPENID;
    
    if (openid) {
      console.log('✅ [GetOpenid] 成功获取 openid:', openid);
      return {
        success: true,
        openid: openid
      };
    } else {
      console.error('❌ [GetOpenid] 无法获取 openid');
      return {
        success: false,
        error: 'Failed to get openid'
      };
    }
    
  } catch (error) {
    console.error('❌ [GetOpenid] 获取 openid 失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 统一画像接口 - 单一事实源（SSOT）
// ========================================

/**
 * 获取用户完整画像 - /me 接口
 * 整合用户信息 + 履约状态
 */
async function handleGetMe(userInfo, traceId, userIP) {
  // 生成 traceId
  if (!traceId) {
    traceId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 探针2：API 网关入口
  console.log('[GW-IN]', {
    traceId: traceId,
    appEnv: 'prod',
    userId: userInfo?.userId,
    openid: userInfo?.openid,
    tokenExists: !!userInfo,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 1. 获取用户基础信息
    const userInfoResult = await handleGetUserInfo(userInfo, userIP);
    
    if (!userInfoResult.success) {
      return {
        success: false,
        error: 'Failed to get user info',
        traceId: traceId
      };
    }
    
    const userData = userInfoResult.data;
    
    // 2. 获取履约状态
    const entitlementResult = await getEntitlement(userInfo, userIP, traceId);
    
    // 3. 构建统一画像
    const me = {
      userId: userData.userId,
      openid: userData.openid,
      profile: {
        nickname: userData.nickname,
        avatar: userData.avatar_url,
        createdAt: userData.created_at
      },
      entitlement: entitlementResult.entitlement,
      traceId: traceId
    };
    
    // 探针5：/me 返回
    console.log('[GW-OUT]', {
      traceId: traceId,
      userId: me.userId,
      openid: me.openid,
      entitlement: {
        status: me.entitlement.status,
        plan: me.entitlement.plan,
        expiresAt: me.entitlement.expiresAt,
        version: me.entitlement.version
      },
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: me,
      traceId: traceId
    };
    
  } catch (error) {
    console.error('❌ [GetMe] 获取用户画像失败:', error);
    return {
      success: false,
      error: error.message,
      traceId: traceId
    };
  }
}

/**
 * 获取履约状态
 */
async function getEntitlement(userInfo, userIP, traceId) {
  try {
    // 探针3：履约读取
    console.log('[ENT-GET] 开始获取履约状态', {
      traceId: traceId,
      userId: userInfo.userId,
      openid: userInfo.openid
    });
    
    const routeInfo = safeSmartRoute(userIP);
    
    // 从数据库获取订阅状态
    const subscriptionResult = await handleGetSubscriptionStatus(userInfo, userIP);
    
    let entitlement = {
      plan: 'free',
      status: 'free',
      expiresAt: null,
      source: null,
      version: 1
    };
    
    if (subscriptionResult.success && subscriptionResult.data) {
      const sub = subscriptionResult.data;
      const now = new Date();
      const currentEnd = sub.current_period_end || sub.expiresAt;
      const status = sub.status || 'unknown';
      const isWithinPeriod = currentEnd ? new Date(currentEnd) > now : false;
      const effectiveStatus = (status === 'pending' && isWithinPeriod) ? 'active' : status;
      
      // 根据订阅状态计算履约状态
      if (effectiveStatus === 'active') {
        entitlement = {
          plan: sub.plan_type || 'pro',
          status: 'active',
          expiresAt: sub.current_period_end || sub.expiresAt,
          source: 'wxpay',
          version: sub.version || 1
        };
      } else if (status === 'pending') {
        entitlement = {
          plan: sub.plan_type || 'pro',
          status: 'unknown',
          expiresAt: sub.current_period_end || sub.expiresAt,
          source: 'wxpay',
          version: sub.version || 1
        };
      } else if (status === 'expired' || status === 'cancelled') {
        entitlement = {
          plan: 'free',
          status: 'expired',
          expiresAt: sub.current_period_end || sub.expiresAt,
          source: 'wxpay',
          version: sub.version || 1
        };
      }
    }
    
    // 探针3：履约读取完成
    console.log('[ENT-GET] 履约状态获取完成', {
      traceId: traceId,
      status: entitlement.status,
      plan: entitlement.plan,
      expiresAt: entitlement.expiresAt,
      version: entitlement.version
    });
    
    return {
      entitlement: entitlement
    };
    
  } catch (error) {
    console.error('❌ [ENT-GET] 获取履约状态失败:', error);
    // 降级返回免费用户
    return {
      entitlement: {
        plan: 'free',
        status: 'free',
        expiresAt: null,
        source: null,
        version: 1
      }
    };
  }
}
