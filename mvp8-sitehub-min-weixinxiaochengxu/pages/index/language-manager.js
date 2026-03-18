// language-manager.js - 语言管理和IP自动识别
// 实现英中文兼备，默认中文，IP自动识别功能

/**
 * 支持的语言列表
 */
const SUPPORTED_LANGUAGES = {
  'zh': {
    code: 'zh',
    name: '中文',
    nativeName: '中文',
    flag: '🇨🇳',
    isDefault: true
  },
  'en': {
    code: 'en', 
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isDefault: false
  }
}

/**
 * 基于IP的地区检测规则
 */
const IP_LANGUAGE_MAPPING = {
  // 中文地区（默认）
  'CN': 'zh', // 中国大陆
  'TW': 'zh', // 台湾
  'HK': 'zh', // 香港
  'MO': 'zh', // 澳门
  'SG': 'zh', // 新加坡（华人居多）
  
  // 英文地区
  'US': 'en', // 美国
  'GB': 'en', // 英国
  'CA': 'en', // 加拿大
  'AU': 'en', // 澳大利亚
  'NZ': 'en', // 新西兰
  'IE': 'en', // 爱尔兰
  'ZA': 'en', // 南非
}

/**
 * 语言管理器类
 */
class LanguageManager {
  constructor() {
    this.currentLanguage = 'zh' // 默认中文
    this.detectedCountry = null
    this.isAutoDetected = false
  }

  /**
   * 初始化语言设置 - 默认中文，支持手动切换
   */
  async initialize() {
    try {
      console.log('🌍 [LanguageManager] 初始化语言设置')
      
      // 1. 检查本地存储的语言设置（用户手动切换过的）
      const savedLanguage = this.getSavedLanguage()
      if (savedLanguage) {
        console.log('📱 [LanguageManager] 使用已保存的语言:', savedLanguage)
        this.currentLanguage = savedLanguage
        return {
          language: savedLanguage,
          isAutoDetected: false,
          detectedCountry: null
        }
      }
      
      // 2. 默认使用中文
      console.log('🇨🇳 [LanguageManager] 使用默认中文')
      this.currentLanguage = 'zh'
      return {
        language: 'zh',
        isAutoDetected: false,
        detectedCountry: null
      }
      
    } catch (error) {
      console.error('❌ [LanguageManager] 初始化失败:', error)
      this.currentLanguage = 'zh'
      return {
        language: 'zh',
        isAutoDetected: false,
        detectedCountry: null
      }
    }
  }

  /**
   * IP地理位置检测语言
   */
  async detectLanguageByIP() {
    try {
      console.log('🔍 [LanguageManager] 开始IP地理位置检测')
      
      // 使用免费的IP检测API
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 3000
      })
      
      if (!response.ok) {
        throw new Error('IP检测API请求失败')
      }
      
      const data = await response.json()
      const countryCode = data.country_code
      
      console.log('🗺️ [LanguageManager] 检测到国家代码:', countryCode)
      this.detectedCountry = countryCode
      
      // 根据国家代码映射语言
      const language = IP_LANGUAGE_MAPPING[countryCode] || 'zh'
      
      console.log('🎯 [LanguageManager] 映射到语言:', language)
      return language
      
    } catch (error) {
      console.warn('⚠️ [LanguageManager] IP检测失败，使用默认语言:', error)
      
      // 降级方案：检查微信小程序的系统语言
      try {
        const systemInfo = wx.getSystemInfoSync()
        const systemLanguage = systemInfo.language
        
        if (systemLanguage.startsWith('zh')) {
          return 'zh'
        } else if (systemLanguage.startsWith('en')) {
          return 'en'
        }
      } catch (e) {
        console.warn('⚠️ [LanguageManager] 系统语言检测也失败:', e)
      }
      
      return null // 返回null表示检测失败
    }
  }

  /**
   * 获取保存的语言设置
   */
  getSavedLanguage() {
    try {
      return wx.getStorageSync('sitehub_language') || null
    } catch (error) {
      console.warn('⚠️ [LanguageManager] 读取保存语言失败:', error)
      return null
    }
  }

  /**
   * 保存语言设置
   */
  saveLanguage(languageCode) {
    try {
      wx.setStorageSync('sitehub_language', languageCode)
      console.log('💾 [LanguageManager] 语言已保存:', languageCode)
    } catch (error) {
      console.error('❌ [LanguageManager] 保存语言失败:', error)
    }
  }

  /**
   * 切换语言
   */
  switchLanguage(languageCode) {
    if (!SUPPORTED_LANGUAGES[languageCode]) {
      console.error('❌ [LanguageManager] 不支持的语言:', languageCode)
      return false
    }
    
    this.currentLanguage = languageCode
    this.saveLanguage(languageCode)
    this.isAutoDetected = false
    
    console.log('🔄 [LanguageManager] 语言已切换到:', languageCode)
    
    // 触发语言切换事件
    wx.showToast({
      title: languageCode === 'zh' ? '已切换到中文' : 'Switched to English',
      icon: 'success',
      duration: 1500
    })
    
    return true
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return this.currentLanguage
  }

  /**
   * 获取当前语言信息
   */
  getCurrentLanguageInfo() {
    return SUPPORTED_LANGUAGES[this.currentLanguage]
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES
  }

  /**
   * 检查是否为自动检测的语言
   */
  isLanguageAutoDetected() {
    return this.isAutoDetected
  }

  /**
   * 获取检测到的国家
   */
  getDetectedCountry() {
    return this.detectedCountry
  }
}

// 创建全局实例
const languageManager = new LanguageManager()

module.exports = {
  LanguageManager,
  languageManager,
  SUPPORTED_LANGUAGES,
  IP_LANGUAGE_MAPPING
}