// utils/api-test.js - API功能测试脚本
// 在小程序控制台中运行此脚本测试API功能

const api = require('./api.js');

const apiTest = {
  
  // 测试1: 保存和加载收藏
  async testFavorites() {
    console.log('\n=== 测试1: 收藏功能 ===');
    
    try {
      // 保存收藏
      const testFavorites = ['google', 'github', 'youtube'];
      console.log('📤 保存收藏:', testFavorites);
      const saveResult = await api.saveFavorites(testFavorites);
      
      if (!saveResult.success) {
        console.error('❌ 保存失败:', saveResult.error);
        return false;
      }
      console.log('✅ 保存成功');
      
      // 等待500ms确保数据写入
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 加载收藏
      console.log('📥 加载收藏...');
      const loadedFavorites = await api.loadFavorites();
      console.log('✅ 加载结果:', loadedFavorites);
      
      // 验证数据一致性
      if (JSON.stringify(testFavorites) === JSON.stringify(loadedFavorites)) {
        console.log('✅ 测试1通过：收藏数据一致');
        return true;
      } else {
        console.error('❌ 测试1失败：数据不一致');
        console.error('  期望:', testFavorites);
        console.error('  实际:', loadedFavorites);
        return false;
      }
    } catch (error) {
      console.error('❌ 测试1异常:', error);
      return false;
    }
  },
  
  // 测试2: 保存和加载自定义网站
  async testCustomSites() {
    console.log('\n=== 测试2: 自定义网站功能 ===');
    
    try {
      // 保存自定义网站
      const testSites = [
        {
          url: 'https://example.com',
          name: '示例网站',
          logo: '🌐',
          description: '这是一个测试网站',
          sort_order: 0
        },
        {
          url: 'https://test.com',
          name: '测试网站',
          logo: '🧪',
          description: '测试用',
          sort_order: 1
        }
      ];
      
      console.log('📤 保存自定义网站:', testSites.length, '个');
      const saveResult = await api.saveCustomSites(testSites);
      
      if (!saveResult.success) {
        console.error('❌ 保存失败:', saveResult.error);
        return false;
      }
      console.log('✅ 保存成功');
      
      // 等待500ms确保数据写入
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 加载自定义网站
      console.log('📥 加载自定义网站...');
      const loadedSites = await api.loadCustomSites();
      console.log('✅ 加载结果:', loadedSites.length, '个');
      console.log('  网站列表:', loadedSites.map(s => s.name));
      
      // 验证数据
      if (loadedSites.length === testSites.length) {
        console.log('✅ 测试2通过：自定义网站数量一致');
        return true;
      } else {
        console.error('❌ 测试2失败：数量不一致');
        console.error('  期望:', testSites.length);
        console.error('  实际:', loadedSites.length);
        return false;
      }
    } catch (error) {
      console.error('❌ 测试2异常:', error);
      return false;
    }
  },
  
  // 测试3: 使用统计
  async testUsageStats() {
    console.log('\n=== 测试3: 使用统计功能 ===');
    
    try {
      // 保存统计
      console.log('📤 保存使用统计: google');
      const saveResult = await api.saveUsageStats({
        site_id: 'google',
        action: 'visit'
      });
      
      if (!saveResult.success && saveResult.error !== 'Not logged in') {
        console.error('❌ 保存失败:', saveResult.error);
        return false;
      }
      
      if (saveResult.success) {
        console.log('✅ 保存成功');
        console.log('✅ 测试3通过：使用统计功能正常');
      } else {
        console.log('⚠️ 未登录，跳过统计保存（预期行为）');
        console.log('✅ 测试3通过：未登录处理正确');
      }
      
      return true;
    } catch (error) {
      console.error('❌ 测试3异常:', error);
      return false;
    }
  },
  
  // 测试4: 加载所有数据
  async testLoadAll() {
    console.log('\n=== 测试4: 加载所有数据 ===');
    
    try {
      console.log('📥 加载所有用户数据...');
      const allData = await api.loadAllUserData();
      
      console.log('✅ 加载结果:');
      console.log('  - 收藏:', allData.favorites?.length || 0, '个');
      console.log('  - 自定义网站:', allData.custom_sites?.length || 0, '个');
      console.log('  - 使用统计:', allData.usage_stats?.length || 0, '条');
      
      if (allData.favorites !== undefined && 
          allData.custom_sites !== undefined && 
          allData.usage_stats !== undefined) {
        console.log('✅ 测试4通过：数据结构完整');
        return true;
      } else {
        console.error('❌ 测试4失败：数据结构不完整');
        return false;
      }
    } catch (error) {
      console.error('❌ 测试4异常:', error);
      return false;
    }
  },
  
  // 运行所有测试
  async runAllTests() {
    console.log('🧪 ========================================');
    console.log('🧪 开始API功能测试');
    console.log('🧪 ========================================');
    
    const results = [];
    
    results.push(await this.testFavorites());
    results.push(await this.testCustomSites());
    results.push(await this.testUsageStats());
    results.push(await this.testLoadAll());
    
    console.log('\n🧪 ========================================');
    console.log('🧪 测试完成');
    console.log('🧪 ========================================');
    
    const passedCount = results.filter(r => r).length;
    const totalCount = results.length;
    
    console.log(`\n📊 测试结果: ${passedCount}/${totalCount} 通过`);
    
    if (passedCount === totalCount) {
      console.log('✅ 所有测试通过！API功能正常！');
    } else {
      console.error(`❌ ${totalCount - passedCount} 个测试失败，请检查错误信息`);
    }
    
    return passedCount === totalCount;
  }
};

module.exports = apiTest;







