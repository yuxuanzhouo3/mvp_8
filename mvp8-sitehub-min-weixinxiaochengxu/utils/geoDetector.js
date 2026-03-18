// utils/geoDetector.js - IP地域检测工具类
// 基于MVP28的IP检测逻辑，用于SiteHub小程序

const geoDetector = {
  // 快速检测中国IP段（0延迟）
  isChinaIP(ip) {
    const chinaIPRanges = [
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
    
    return this.checkIPInRanges(ip, chinaIPRanges);
  },

  // 检查IP是否在指定范围内
  checkIPInRanges(ip, ranges) {
    const ipNum = this.ipToNumber(ip);
    
    for (const range of ranges) {
      const [network, prefix] = range.split('/');
      const networkNum = this.ipToNumber(network);
      const mask = ~((1 << (32 - parseInt(prefix))) - 1);
      
      if ((ipNum & mask) === (networkNum & mask)) {
        return true;
      }
    }
    
    return false;
  },

  // IP地址转换为数字
  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  },

  // 详细IP地理位置查询（复用MVP28逻辑）
  async getIPLocation(ip) {
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://ip-api.com/json/' + ip,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      return {
        country: response.data.countryCode,
        isChina: response.data.countryCode === 'CN',
        region: response.data.region,
        city: response.data.city,
        query: response.data.query
      };
    } catch (error) {
      console.error('IP检测失败:', error);
      return { 
        country: 'CN', 
        isChina: true,
        error: error.message 
      }; // 降级策略
    }
  },

  // 智能路由决策（复用MVP28逻辑）
  async getRegionRoute(userIP) {
    console.log('🌍 [GeoDetector] 开始检测用户IP:', userIP);
    
    // 1. 快速检测
    if (this.isChinaIP(userIP)) {
      console.log('✅ [GeoDetector] 快速检测: 中国IP段');
      return { 
        region: 'china', 
        database: 'wechat_cloud',
        reason: 'china_ip_range',
        envId: 'cloudbase-1gnip2iaa08260e5'
      };
    }

    // 2. 详细检测
    console.log('🔍 [GeoDetector] 开始详细IP检测...');
    const location = await this.getIPLocation(userIP);
    
    if (location.isChina) {
      console.log('✅ [GeoDetector] 详细检测: 中国用户');
      return {
        region: 'china',
        database: 'wechat_cloud',
        reason: 'ip_api_detection',
        envId: 'cloudbase-1gnip2iaa08260e5',
        location: location
      };
    } else {
      console.log('✅ [GeoDetector] 详细检测: 海外用户');
      return {
        region: 'international',
        database: 'supabase',
        reason: 'international_user',
        location: location
      };
    }
  },

  // 获取用户真实IP（通过云函数）
  async getUserIP() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getUserIP',
          timestamp: Date.now()
        }
      });
      
      return result.result.ip || '127.0.0.1';
    } catch (error) {
      console.error('获取用户IP失败:', error);
      return '127.0.0.1'; // 降级策略
    }
  },

  // 完整的地域检测流程
  async detectUserRegion() {
    try {
      console.log('🚀 [GeoDetector] 开始完整地域检测流程...');
      
      // 1. 获取用户IP
      const userIP = await this.getUserIP();
      console.log('📡 [GeoDetector] 用户IP:', userIP);
      
      // 2. 获取路由决策
      const routeInfo = await this.getRegionRoute(userIP);
      console.log('🎯 [GeoDetector] 路由决策:', routeInfo);
      
      return routeInfo;
      
    } catch (error) {
      console.error('❌ [GeoDetector] 地域检测失败:', error);
      // 降级策略：默认中国
      return {
        region: 'china',
        database: 'wechat_cloud',
        reason: 'detection_failed_fallback',
        envId: 'cloudbase-1gnip2iaa08260e5'
      };
    }
  }
};

module.exports = geoDetector;






