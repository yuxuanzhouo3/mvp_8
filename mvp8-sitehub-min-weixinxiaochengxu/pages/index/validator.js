// validator.js - 数据完整性校验和防回归工具
// 确保canonical数据与原网站保持一致，翻译数据完整覆盖

const canonicalData = require('./data/canonical.en.js')
const l10nData = require('./data/l10n.zh.js')

/**
 * 校验数据唯一性（防止重复ID和URL）
 * @returns {Object} - 包含重复项的校验结果
 */
function validateUniqueness() {
  const duplicates = {
    ids: [],
    urls: [],
    names: []
  }
  
  const seenIds = new Set()
  const seenUrls = new Set()
  const seenNames = new Set()
  
  // 检查产品数据
  canonicalData.products.forEach(item => {
    if (seenIds.has(item.id)) {
      duplicates.ids.push({ type: 'products', id: item.id, name_en: item.name_en })
    }
    if (seenUrls.has(item.url)) {
      duplicates.urls.push({ type: 'products', url: item.url, name_en: item.name_en })
    }
    if (seenNames.has(item.name_en)) {
      duplicates.names.push({ type: 'products', name_en: item.name_en })
    }
    
    seenIds.add(item.id)
    seenUrls.add(item.url)
    seenNames.add(item.name_en)
  })
  
  // 检查网站数据
  canonicalData.sites.forEach(item => {
    if (seenIds.has(item.id)) {
      duplicates.ids.push({ type: 'sites', id: item.id, name_en: item.name_en })
    }
    if (seenUrls.has(item.url)) {
      duplicates.urls.push({ type: 'sites', url: item.url, name_en: item.name_en })
    }
    if (seenNames.has(item.name_en)) {
      duplicates.names.push({ type: 'sites', name_en: item.name_en })
    }
    
    seenIds.add(item.id)
    seenUrls.add(item.url)
    seenNames.add(item.name_en)
  })
  
  return duplicates
}

/**
 * 校验翻译覆盖率
 * @returns {Object} - 翻译覆盖统计和缺失项列表
 */
function validateTranslationCoverage() {
  const coverage = {
    products: { total: 0, translated: 0, missing: [] },
    categories: { total: 0, translated: 0, missing: [] },
    sites: { total: 0, translated: 0, missing: [] }
  }
  
  // 检查产品翻译
  coverage.products.total = canonicalData.products.length
  canonicalData.products.forEach(item => {
    if (l10nData.products[item.name_en]) {
      coverage.products.translated++
    } else {
      coverage.products.missing.push({
        id: item.id,
        name_en: item.name_en,
        url: item.url
      })
    }
  })
  
  // 检查分类翻译
  coverage.categories.total = canonicalData.categories.length
  canonicalData.categories.forEach(item => {
    if (l10nData.categories[item.name_en]) {
      coverage.categories.translated++
    } else {
      coverage.categories.missing.push({
        key: item.key,
        name_en: item.name_en
      })
    }
  })
  
  // 检查网站翻译
  coverage.sites.total = canonicalData.sites.length
  canonicalData.sites.forEach(item => {
    if (l10nData.sites[item.name_en]) {
      coverage.sites.translated++
    } else {
      coverage.sites.missing.push({
        id: item.id,
        name_en: item.name_en,
        url: item.url,
        isCN: item.isCN
      })
    }
  })
  
  return coverage
}

/**
 * 校验数据结构完整性
 * @returns {Object} - 数据结构问题列表
 */
function validateDataStructure() {
  const issues = []
  
  // 检查必需字段
  const requiredProductFields = ['id', 'name_en', 'url', 'logo', 'category']
  const requiredSiteFields = ['id', 'name_en', 'url', 'logo', 'category', 'isCN']
  const requiredCategoryFields = ['key', 'name_en']
  
  canonicalData.products.forEach((item, index) => {
    requiredProductFields.forEach(field => {
      if (!item[field]) {
        issues.push({
          type: 'products',
          index,
          field,
          message: `Missing required field: ${field}`,
          item: item.name_en || `index ${index}`
        })
      }
    })
  })
  
  canonicalData.sites.forEach((item, index) => {
    requiredSiteFields.forEach(field => {
      if (item[field] === undefined || item[field] === null) {
        issues.push({
          type: 'sites',
          index,
          field,
          message: `Missing required field: ${field}`,
          item: item.name_en || `index ${index}`
        })
      }
    })
  })
  
  canonicalData.categories.forEach((item, index) => {
    requiredCategoryFields.forEach(field => {
      if (!item[field]) {
        issues.push({
          type: 'categories',
          index,
          field,
          message: `Missing required field: ${field}`,
          item: item.name_en || `index ${index}`
        })
      }
    })
  })
  
  return issues
}

/**
 * 校验URL有效性（简单检查）
 * @returns {Array} - 无效URL列表
 */
function validateUrls() {
  const invalidUrls = []
  
  const checkUrl = (item, type) => {
    if (!item.url) return
    
    if (!item.url.startsWith('http://') && !item.url.startsWith('https://')) {
      invalidUrls.push({
        type,
        name_en: item.name_en,
        url: item.url,
        issue: 'Invalid protocol'
      })
    }
    
    try {
      new URL(item.url)
    } catch (e) {
      invalidUrls.push({
        type,
        name_en: item.name_en,
        url: item.url,
        issue: 'Invalid URL format'
      })
    }
  }
  
  canonicalData.products.forEach(item => checkUrl(item, 'products'))
  canonicalData.sites.forEach(item => checkUrl(item, 'sites'))
  
  return invalidUrls
}

/**
 * 执行完整校验并生成报告
 * @returns {Object} - 完整的校验报告
 */
function runFullValidation() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      products: canonicalData.products.length,
      categories: canonicalData.categories.length,
      sites: canonicalData.sites.length
    },
    uniqueness: validateUniqueness(),
    coverage: validateTranslationCoverage(),
    structure: validateDataStructure(),
    urls: validateUrls()
  }
  
  // 计算总体健康度评分
  const totalIssues = 
    report.uniqueness.ids.length +
    report.uniqueness.urls.length +
    report.uniqueness.names.length +
    report.structure.length +
    report.urls.length
  
  report.healthScore = Math.max(0, 100 - (totalIssues * 5)) // 每个问题扣5分
  
  return report
}

/**
 * 输出格式化的校验报告到控制台
 * @param {boolean} verbose - 是否显示详细信息
 */
function logValidationReport(verbose = false) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return // 生产环境不输出报告
  }
  
  const report = runFullValidation()
  
  console.group('📊 [SiteHub] 数据校验报告')
  
  // 总体统计
  console.log(`📈 数据概览: ${report.summary.products} 产品, ${report.summary.categories} 分类, ${report.summary.sites} 网站`)
  console.log(`🏥 健康评分: ${report.healthScore}/100`)
  
  // 翻译覆盖率
  console.log('\n🌐 翻译覆盖率:')
  Object.entries(report.coverage).forEach(([type, stats]) => {
    const rate = Math.round((stats.translated / stats.total) * 100)
    const status = rate >= 95 ? '✅' : rate >= 80 ? '⚠️' : '❌'
    console.log(`  ${status} ${type}: ${stats.translated}/${stats.total} (${rate}%)`)
  })
  
  // 问题汇总
  let hasIssues = false
  
  if (report.uniqueness.ids.length > 0) {
    hasIssues = true
    console.error('\n❌ 重复ID:')
    report.uniqueness.ids.forEach(item => {
      console.error(`  ${item.type}: ${item.id} (${item.name_en})`)
    })
  }
  
  if (report.uniqueness.urls.length > 0) {
    hasIssues = true
    console.error('\n❌ 重复URL:')
    report.uniqueness.urls.forEach(item => {
      console.error(`  ${item.type}: ${item.url} (${item.name_en})`)
    })
  }
  
  if (report.structure.length > 0) {
    hasIssues = true
    console.error('\n❌ 数据结构问题:')
    report.structure.forEach(issue => {
      console.error(`  ${issue.type}[${issue.index}]: ${issue.message} (${issue.item})`)
    })
  }
  
  if (report.urls.length > 0) {
    hasIssues = true
    console.error('\n❌ 无效URL:')
    report.urls.forEach(item => {
      console.error(`  ${item.type}: ${item.url} - ${item.issue} (${item.name_en})`)
    })
  }
  
  // 缺失翻译（仅在详细模式或有较多缺失时显示）
  const totalMissing = report.coverage.products.missing.length + 
                      report.coverage.categories.missing.length + 
                      report.coverage.sites.missing.length
  
  if (verbose || totalMissing > 10) {
    console.warn('\n⚠️  缺失翻译条目:')
    Object.entries(report.coverage).forEach(([type, stats]) => {
      if (stats.missing.length > 0) {
        console.warn(`  ${type} (${stats.missing.length} 项):`)
        stats.missing.slice(0, 5).forEach(item => {
          console.warn(`    "${item.name_en}" (id: ${item.id || item.key})`)
        })
        if (stats.missing.length > 5) {
          console.warn(`    ... 还有 ${stats.missing.length - 5} 项`)
        }
      }
    })
  }
  
  if (!hasIssues && report.healthScore >= 90) {
    console.log('\n✅ 数据校验通过，质量良好！')
  }
  
  console.groupEnd()
  
  return report
}

module.exports = {
  runFullValidation,
  logValidationReport,
  validateUniqueness,
  validateTranslationCoverage,
  validateDataStructure,
  validateUrls
}