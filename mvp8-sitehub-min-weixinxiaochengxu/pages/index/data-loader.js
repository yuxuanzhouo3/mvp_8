// data-loader.js - 数据加载和合并工具
// 实现"单一事实来源"的数据架构，支持中英文显示和回退机制
// 新增：多语言支持，IP自动检测语言

const canonicalData = require('./data/canonical.en.js')
const l10nZhData = require('./data/l10n.zh.js')
const l10nEnData = require('./data/l10n.en.js')
const { languageManager } = require('./language-manager.js')

// 根据当前语言获取对应的本土化数据
function getCurrentL10nData() {
  const currentLanguage = languageManager.getCurrentLanguage()
  // 默认返回中文数据，只有明确切换到英文时才返回英文数据
  return (currentLanguage === 'en') ? l10nEnData : l10nZhData
}

/**
 * 数据合并策略：以canonical为权威源，l10n提供显示文本
 * @param {Object} canonicalItem - 权威英文数据项
 * @param {string} type - 数据类型 ('products', 'categories', 'sites')
 * @returns {Object} - 合并后的数据项
 */
function mergeWithLocalization(canonicalItem, type) {
  const l10nData = getCurrentL10nData()
  const l10nMap = l10nData[type] || {}
  const tagsCNMap = l10nData.tagsCN || l10nData.tagsEN || {}
  
  // 基础合并：保持原有结构，添加中文显示名
  const merged = {
    ...canonicalItem,
    // 显示名：中文优先，英文兜底
    name_zh: l10nMap[canonicalItem.name_en] || canonicalItem.name_en,
    // 保持原英文名不变（作为稳定标识）
    // name_en 保持原值
  }
  
  // 为sites类型添加中文标签
  if (type === 'sites' && canonicalItem.name_en) {
    const chineseTags = tagsCNMap[canonicalItem.name_en] || []
    merged.tagsCN = chineseTags
  }
  
  return merged
}

/**
 * 加载并合并所有数据
 * @returns {Object} - 包含products, categories, sites的合并数据
 */
function loadMergedData() {
  try {
    const products = canonicalData.products.map(item => 
      mergeWithLocalization(item, 'products')
    )
    
    const categories = canonicalData.categories.map(item => 
      mergeWithLocalization(item, 'categories')
    )
    
    const sites = canonicalData.sites.map(item => 
      mergeWithLocalization(item, 'sites')
    )
    
    return {
      products,
      categories, 
      sites,
      _meta: {
        ...canonicalData._meta,
        l10n_version: l10nZhData._meta.version,
        merged_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('[DataLoader] Failed to merge data:', error)
    // 降级处理：返回原始数据结构
    return {
      products: canonicalData.products || [],
      categories: canonicalData.categories || [],
      sites: canonicalData.sites || [],
      _meta: { error: error.message }
    }
  }
}

/**
 * 获取本土化UI文本
 * @param {string} key - UI文本键名
 * @param {Object} params - 模板参数（如{count: 300}）
 * @returns {string} - 本土化文本
 */
function getUIText(key, params = {}) {
  const l10nData = getCurrentL10nData()
  const template = l10nData.ui[key] || key
  
  // 简单的模板替换
  return template.replace(/\{(\w+)\}/g, (match, paramKey) => {
    return params[paramKey] || match
  })
}

/**
 * 导入专门的校验器
 */
const validator = require('./validator')

/**
 * 数据完整性校验（使用专门的校验器）
 * @returns {Object} - 完整的校验报告
 */
function validateDataIntegrity() {
  return validator.runFullValidation()
}

/**
 * 控制台输出校验报告（使用专门的校验器）
 * @param {boolean} verbose - 是否显示详细信息
 */
function logValidationReport(verbose = false) {
  return validator.logValidationReport(verbose)
}

module.exports = {
  loadMergedData,
  getUIText,
  validateDataIntegrity,
  logValidationReport,
  languageManager,
  getCurrentL10nData
}