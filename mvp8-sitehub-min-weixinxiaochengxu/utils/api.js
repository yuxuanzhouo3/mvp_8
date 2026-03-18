// utils/api.js - 前端API封装工具
// 简化云函数调用，统一错误处理

// 工具：避免在控制台打印超大对象
function preview(obj) {
  try {
    const s = JSON.stringify(obj);
    return s.length > 800 ? s.slice(0, 800) + " …(truncated)" : s;
  } catch { 
    return obj; 
  }
}

// 云函数调用拦截器 - 全面抓取错误详情
async function callCloudFunction(functionName, data) {
  console.log(`📤 [API] 调用云函数: ${functionName}`);
  console.log(`📤 [API] 调用参数预览:`, preview(data));
  
  try {
    const result = await wx.cloud.callFunction({
      name: functionName,
      data: data
    });
    
    console.log(`📥 [API] 云函数响应:`, preview(result));
    
    // 检查云函数返回的错误
    if (result.result && result.result.success === false) {
      console.error(`🔎 [API] 云函数业务错误:`, {
        functionName,
        error: result.result.error,
        detail: result.result.detail,
        result: result.result
      });
      
      // 如果有详细错误信息，优先显示
      if (result.result.detail) {
        console.error(`🔎 [API] 详细错误信息:`, result.result.detail);
        throw new Error(`云函数错误: ${result.result.error} | 详情: ${JSON.stringify(result.result.detail)}`);
      } else {
        throw new Error(result.result.error || '云函数业务错误');
      }
    }
    
    return result;
  } catch (error) {
    console.error(`🔎 [API] 云函数调用失败:`, {
      functionName,
      data: preview(data),
      error: error.message,
      stack: error.stack,
      // 如果是微信云函数错误，会有更多详情
      errCode: error.errCode,
      errMsg: error.errMsg
    });
    throw error;
  }
}

const api = {
  
  // ========================================
  // 收藏夹相关
  // ========================================
  
  /**
   * 保存收藏夹到数据库
   * @param {Array<string>} favorites - 收藏的网站ID数组
   * @returns {Promise<Object>} 保存结果
   */
  async saveFavorites(favorites) {
    try {
      const app = getApp();
      let userInfo = app.globalData.userInfo;
      
      // 🔥 保险措施：如果全局数据中没有用户信息，从本地存储重新加载
      if (!userInfo || !userInfo.openid) {
        console.log('⚠️ [API] 全局数据中无用户信息，尝试从本地存储加载...')
        userInfo = wx.getStorageSync('sitehub_userInfo')
        if (userInfo) {
          app.globalData.userInfo = userInfo
          console.log('✅ [API] 用户信息已从本地存储同步到全局数据')
        }
      }
      
      if (!userInfo || !userInfo.openid) {
        throw new Error('用户未登录');
      }
      
      const callData = {
        action: 'saveUserData',
        userInfo: userInfo,
        dataType: 'favorites',
        data: favorites // 直接传递favorites数组
      };
      console.log('📤 [API] saveFavorites payload preview:', preview(callData));
      
      const result = await callCloudFunction('callAIGateway', callData);
      
      if (result.result.success) {
        console.log('✅ [API] 收藏保存成功');
        return { success: true };
      } else {
        throw new Error(result.result.error);
      }
    } catch (error) {
      console.error('❌ [API] 收藏保存失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 从数据库加载收藏夹
   * @returns {Promise<Array<string>>} 收藏的网站ID数组
   */
  async loadFavorites() {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      
      if (!userInfo || !userInfo.openid) {
        console.log('⚠️ [API] 用户未登录，返回空收藏');
        return [];
      }
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'loadUserData',
          userInfo: userInfo,
          dataType: 'favorites'
        }
      });
      
      if (result.result.success) {
        console.log(`✅ [API] 收藏加载成功: ${result.result.data?.length || 0}个`);
        return result.result.data || [];
      } else {
        console.warn('⚠️ [API] 收藏加载失败，返回空数组');
        return [];
      }
    } catch (error) {
      console.error('❌ [API] 收藏加载失败:', error);
      return [];
    }
  },
  
  // ========================================
  // 自定义网站相关
  // ========================================
  
  /**
   * 保存自定义网站到数据库
   * @param {Array<Object>} sites - 自定义网站数组
   * @returns {Promise<Object>} 保存结果
   */
  async saveCustomSites(sites) {
    try {
      const app = getApp();
      let userInfo = app.globalData.userInfo;
      
      // 🔥 保险措施：如果全局数据中没有用户信息，从本地存储重新加载
      if (!userInfo || !userInfo.openid) {
        console.log('⚠️ [API] 全局数据中无用户信息，尝试从本地存储加载...')
        userInfo = wx.getStorageSync('sitehub_userInfo')
        if (userInfo) {
          app.globalData.userInfo = userInfo
          console.log('✅ [API] 用户信息已从本地存储同步到全局数据')
        }
      }
      
      if (!userInfo || !userInfo.openid) {
        throw new Error('用户未登录');
      }
      
      // 🔥 调试日志：云函数调用参数
      const callData = {
        action: 'saveUserData',
        userInfo: userInfo,
        dataType: 'custom_sites',
        data: sites // 直接传递sites数组，不需要包装
      }
      console.log('📤 [API] saveCustomSites payload preview:', preview(callData));
      
      const result = await callCloudFunction('callAIGateway', callData);
      
      if (result.result && result.result.success) {
        console.log(`✅ [API] 自定义网站保存成功: ${sites.length}个`);
        return { success: true };
      } else {
        throw new Error(result.result?.error || '保存失败');
      }
    } catch (error) {
      console.error('❌ [API] saveCustomSites failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 从数据库加载自定义网站
   * @returns {Promise<Array<Object>>} 自定义网站数组
   */
  async loadCustomSites() {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      
      if (!userInfo || !userInfo.openid) {
        console.log('⚠️ [API] 用户未登录，返回空自定义网站');
        return [];
      }
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'loadUserData',
          userInfo: userInfo,
          dataType: 'custom_sites'
        }
      });
      
      if (result.result.success) {
        console.log(`✅ [API] 自定义网站加载成功: ${result.result.data?.length || 0}个`);
        return result.result.data || [];
      } else {
        console.warn('⚠️ [API] 自定义网站加载失败，返回空数组');
        return [];
      }
    } catch (error) {
      console.error('❌ [API] 自定义网站加载失败:', error);
      return [];
    }
  },
  
  // ========================================
  // 使用统计相关
  // ========================================
  
  /**
   * 保存使用统计
   * @param {Object} stat - 统计数据 { site_id, action }
   * @returns {Promise<Object>} 保存结果
   */
  async saveUsageStats(stat) {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      
      if (!userInfo || !userInfo.openid) {
        // 未登录用户不记录统计
        return { success: false, error: 'Not logged in' };
      }
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'saveUserData',
          userInfo: userInfo,
          dataType: 'usage_stats',
          data: {
            site_id: stat.site_id,
            action: stat.action || 'visit'
          }
        }
      });
      
      if (result.result.success) {
        console.log(`✅ [API] 使用统计保存成功: ${stat.site_id}`);
        return { success: true };
      } else {
        return { success: false, error: result.result.error };
      }
    } catch (error) {
      console.error('❌ [API] 使用统计保存失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 加载用户所有数据
   * @returns {Promise<Object>} { favorites, custom_sites, usage_stats }
   */
  async loadAllUserData() {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      
      if (!userInfo || !userInfo.openid) {
        console.log('⚠️ [API] 用户未登录，返回空数据');
        return {
          favorites: [],
          custom_sites: [],
          usage_stats: []
        };
      }
      
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'loadUserData',
          userInfo: userInfo,
          dataType: 'all'
        }
      });
      
      if (result.result.success) {
        console.log('✅ [API] 所有用户数据加载成功');
        return result.result.data || {
          favorites: [],
          custom_sites: [],
          usage_stats: []
        };
      } else {
        console.warn('⚠️ [API] 数据加载失败，返回空数据');
        return {
          favorites: [],
          custom_sites: [],
          usage_stats: []
        };
      }
    } catch (error) {
      console.error('❌ [API] 数据加载失败:', error);
      return {
        favorites: [],
        custom_sites: [],
        usage_stats: []
      };
    }
  },

  // ========================================
  // 支付统计相关
  // ========================================
  
  /**
   * 记录支付统计
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 记录结果
   */
  async recordPayment(paymentData) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'recordPayment',
          paymentData: paymentData
        }
      });
      
      if (result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error(result.result.error || '支付统计记录失败');
      }
    } catch (error) {
      console.error('[API] 支付统计记录失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取产品利润统计
   * @param {string} productId - 产品ID
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} 产品统计
   */
  async getProductStats(productId, platform) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getProductStats',
          productId: productId,
          platform: platform
        }
      });
      
      if (result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error(result.result.error || '产品统计获取失败');
      }
    } catch (error) {
      console.error('[API] 产品统计获取失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取平台利润统计
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} 平台统计
   */
  async getPlatformStats(platform) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'callAIGateway',
        data: {
          action: 'getPlatformStats',
          platform: platform
        }
      });
      
      if (result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error(result.result.error || '平台统计获取失败');
      }
    } catch (error) {
      console.error('[API] 平台统计获取失败:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = api;

