// pages/index/geo-filter.js - 地域化数据过滤器
// 根据用户地域智能过滤和排序网站数据

const geoFilter = {
  // 根据地域过滤网站
  filterSitesByRegion(allSites, region) {
    console.log(`🌍 [GeoFilter] 开始按地域过滤网站: ${region}`);
    
    // 不再按地域过滤，保留所有网站供Tab切换使用
    // 地域化逻辑移到Tab选择逻辑中处理
    console.log(`✅ [GeoFilter] 保留所有网站: ${allSites.length}个`);
    return allSites;
  },

  // 根据地域过滤分类
  filterCategoriesByRegion(allCategories, region) {
    console.log(`🏷️ [GeoFilter] 开始按地域过滤分类: ${region}`);
    
    // 所有用户都显示所有分类，包括新的China分类
    // 分类顺序已经在canonical.en.js中调整：收藏 → 自定义网站 → 全部网站 → 中国网站
    console.log(`✅ [GeoFilter] 分类过滤完成: ${allCategories.length}个`);
    return allCategories;
  },

  // 智能排序（根据地域优化）
  sortSitesByRegion(sites, region, searchQuery = '') {
    console.log(`🔄 [GeoFilter] 开始智能排序: ${region} 地域, 搜索: "${searchQuery}"`);
    
    return sites.sort((a, b) => {
      // 1. 地域匹配优先级
      const regionMatchA = (region === 'china') ? a.isCN : !a.isCN;
      const regionMatchB = (region === 'china') ? b.isCN : !b.isCN;
      
      if (regionMatchA !== regionMatchB) {
        return regionMatchB ? 1 : -1;
      }

      // 2. 搜索匹配度
      if (searchQuery) {
        const scoreA = this.getSearchScore(a, searchQuery);
        const scoreB = this.getSearchScore(b, searchQuery);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      // 3. 地域化排序规则
      if (region === 'china') {
        // 中国用户：中文名称优先，按中文排序
        const nameA = (a.name_zh || a.name_en).toLowerCase();
        const nameB = (b.name_zh || b.name_en).toLowerCase();
        return nameA.localeCompare(nameB, 'zh-CN');
      } else {
        // 国际用户：英文名称优先，按英文排序
        const nameA = (a.name_en || a.name_zh).toLowerCase();
        const nameB = (b.name_en || b.name_zh).toLowerCase();
        return nameA.localeCompare(nameB, 'en-US');
      }
    });
  },

  // 搜索匹配度计算
  getSearchScore(site, query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    const nameZh = (site.name_zh || '').toLowerCase();
    const nameEn = (site.name_en || '').toLowerCase();
    const tags = ((site.tagsCN || []).concat(site.tags || [])).join(' ').toLowerCase();
    
    // 中文名称匹配（优先级更高）
    if (nameZh === lowerQuery) score += 15;
    else if (nameZh.startsWith(lowerQuery)) score += 8;
    else if (nameZh.includes(lowerQuery)) score += 4;
    
    // 英文名称匹配
    if (nameEn === lowerQuery) score += 10;
    else if (nameEn.startsWith(lowerQuery)) score += 5;
    else if (nameEn.includes(lowerQuery)) score += 2;
    
    // 标签匹配
    if (tags.includes(lowerQuery)) score += 1;
    
    return score;
  },

  // 根据地域获取UI文本
  getRegionUIText(region, language = 'zh') {
    const texts = {
      zh: {
        china: {
          regionText: '为您推荐中国网站',
          regionHint: '根据您的IP位置，为您展示中国可访问的网站',
          switchText: '切换到国际网站',
          sitesCount: '共 {count} 个中国网站'
        },
        international: {
          regionText: '为您推荐国际网站',
          regionHint: '根据您的IP位置，为您展示国际网站',
          switchText: '切换到中国网站',
          sitesCount: '共 {count} 个国际网站'
        }
      },
      en: {
        china: {
          regionText: 'Showing Chinese websites',
          regionHint: 'Based on your location, showing Chinese accessible websites',
          switchText: 'Switch to International',
          sitesCount: '{count} Chinese websites'
        },
        international: {
          regionText: 'Showing international websites',
          regionHint: 'Based on your location, showing international websites',
          switchText: 'Switch to Chinese',
          sitesCount: '{count} international websites'
        }
      }
    };
    
    return texts[language][region] || texts.zh.international;
  },

  // 根据地域获取推荐网站
  getRecommendedSites(sites, region, count = 6) {
    if (region === 'china') {
      // 中国用户：推荐热门中国网站
      const chinaSites = sites.filter(site => site.isCN === true);
      const popularSites = ['baidu', 'wechat', 'taobao', 'jd', 'bilibili', 'douyin'];
      
      const recommended = popularSites
        .map(id => chinaSites.find(site => site.id === id))
        .filter(site => site)
        .slice(0, count);
      
      return recommended;
    } else {
      // 国际用户：推荐热门国际网站
      const internationalSites = sites.filter(site => site.isCN === false);
      const popularSites = ['google', 'youtube', 'facebook', 'instagram', 'twitter', 'github'];
      
      const recommended = popularSites
        .map(id => internationalSites.find(site => site.id === id))
        .filter(site => site)
        .slice(0, count);
      
      return recommended;
    }
  },

  // 根据地域过滤产品推荐
  filterProductsByRegion(products, region) {
    // 所有用户都显示所有产品，因为这些都是辰汇科技的产品
    console.log(`✅ [GeoFilter] 显示所有辰汇产品: ${products.length}个`);
    return products;
  },

  // 统计地域化数据
  getRegionStats(allSites) {
    const stats = {
      total: allSites.length,
      china: allSites.filter(site => site.isCN === true).length,
      international: allSites.filter(site => site.isCN === false).length
    };
    
    console.log('📊 [GeoFilter] 地域化统计:', stats);
    return stats;
  },

  // 验证地域化配置
  validateRegionConfig(region) {
    const validRegions = ['china', 'international'];
    const isValid = validRegions.includes(region);
    
    if (!isValid) {
      console.warn(`⚠️ [GeoFilter] 无效的地域配置: ${region}, 使用默认值: china`);
      return 'china';
    }
    
    return region;
  }
};

module.exports = geoFilter;
