// utils/text-parser.js - 智能文本解析工具

/**
 * 智能文本解析工具
 * 支持从聊天记录、分享文本中提取URL并自动识别网站信息
 */

class TextParser {
  constructor() {
    // URL正则表达式 - 支持各种格式
    this.urlRegex = /(https?:\/\/[^\s]+)/gi;
    
    // 常见网站图标映射 - 扩展Jeff需要的平台
    this.iconMap = {
      // AI平台
      'chatgpt.com': '🤖',
      'openai.com': '🤖',
      'claude.ai': '🧠',
      'gemini.google.com': '💎',
      'perplexity.ai': '🔮',
      'copilot.microsoft.com': '🛠️',
      
      // 开发平台
      'github.com': '🐙',
      'gitlab.com': '🦊',
      'gitee.com': '🐎',
      'stackoverflow.com': '📚',
      'juejin.cn': '💎',
      'csdn.net': '💻',
      'segmentfault.com': '🏗️',
      
      // 社交媒体
      'douyin.com': '🎵',
      'tiktok.com': '🎵',
      'weibo.com': '🐦',
      'twitter.com': '🐦',
      'x.com': '🐦',
      'instagram.com': '📷',
      'facebook.com': '📘',
      'linkedin.com': '💼',
      'xiaohongshu.com': '📖',
      
      // 视频平台
      'youtube.com': '📺',
      'youtu.be': '📺',
      'bilibili.com': '📺',
      'vimeo.com': '🎬',
      
      // 知识平台
      'zhihu.com': '💭',
      'jianshu.com': '📝',
      'quora.com': '❓',
      'medium.com': '📄',
      
      // 购物平台
      'taobao.com': '🛒',
      'tmall.com': '🛒',
      'jd.com': '🛒',
      'amazon.com': '🛒',
      'amazon.cn': '🛒',
      
      // 搜索平台
      'baidu.com': '🔍',
      'google.com': '🌐',
      'bing.com': '🔍',
      'sogou.com': '🔍',
      
      // 办公协作
      'notion.so': '📋',
      'feishu.cn': '🦆',
      'dingtalk.com': '🔔',
      'teams.microsoft.com': '👥',
      'slack.com': '💬',
      
      // 设计工具
      'figma.com': '🎨',
      'canva.com': '🖼️',
      'sketch.com': '✏️',
      
      // 云服务
      'vercel.com': '☁️',
      'netlify.com': '🌐',
      'heroku.com': '🚀',
      'aws.amazon.com': '☁️',
      'aliyun.com': '☁️',
      
      // 文档平台
      'docs.google.com': '📄',
      'office.com': '📊',
      'wps.cn': '📝',
      
      // 其他常用
      'apple.com': '🍎',
      'microsoft.com': '🪟',
      'adobe.com': '🎨',
      'obsidian.md': '🔮',
      'reddit.com': '🔴',
      'v2ex.com': '💬'
    };
    
    // 网站分类映射 - 扩展Jeff需要的平台
    this.categoryMap = {
      // AI平台
      'chatgpt.com': 'AI工具',
      'openai.com': 'AI工具',
      'claude.ai': 'AI工具',
      'gemini.google.com': 'AI工具',
      'perplexity.ai': 'AI工具',
      'copilot.microsoft.com': 'AI工具',
      
      // 开发平台
      'github.com': '开发工具',
      'gitlab.com': '开发工具',
      'gitee.com': '开发工具',
      'stackoverflow.com': '开发工具',
      'juejin.cn': '技术',
      'csdn.net': '技术',
      'segmentfault.com': '技术',
      
      // 社交媒体
      'douyin.com': '社交',
      'tiktok.com': '社交',
      'weibo.com': '社交',
      'twitter.com': '社交',
      'x.com': '社交',
      'instagram.com': '社交',
      'facebook.com': '社交',
      'linkedin.com': '职场',
      'xiaohongshu.com': '社交',
      
      // 视频平台
      'youtube.com': '视频',
      'youtu.be': '视频',
      'bilibili.com': '视频',
      'vimeo.com': '视频',
      
      // 知识平台
      'zhihu.com': '问答',
      'jianshu.com': '博客',
      'quora.com': '问答',
      'medium.com': '博客',
      
      // 购物平台
      'taobao.com': '购物',
      'tmall.com': '购物',
      'jd.com': '购物',
      'amazon.com': '购物',
      'amazon.cn': '购物',
      
      // 搜索平台
      'baidu.com': '搜索引擎',
      'google.com': '搜索引擎',
      'bing.com': '搜索引擎',
      'sogou.com': '搜索引擎',
      
      // 办公协作
      'notion.so': '效率工具',
      'feishu.cn': '办公协作',
      'dingtalk.com': '办公协作',
      'teams.microsoft.com': '办公协作',
      'slack.com': '办公协作',
      
      // 设计工具
      'figma.com': '设计',
      'canva.com': '设计',
      'sketch.com': '设计',
      
      // 云服务
      'vercel.com': '云服务',
      'netlify.com': '云服务',
      'heroku.com': '云服务',
      'aws.amazon.com': '云服务',
      'aliyun.com': '云服务',
      
      // 文档平台
      'docs.google.com': '文档',
      'office.com': '办公',
      'wps.cn': '办公',
      
      // 其他常用
      'apple.com': '科技',
      'microsoft.com': '科技',
      'adobe.com': '设计',
      'obsidian.md': '效率工具',
      'reddit.com': '社区',
      'v2ex.com': '社区'
    };
  }

  /**
   * 解析文本中的URL
   * @param {string} text - 输入文本
   * @returns {Array} URL数组
   */
  extractUrls(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const urls = text.match(this.urlRegex) || [];
    return urls.map(url => url.trim());
  }

  /**
   * 获取网站图标
   * @param {string} url - 网站URL
   * @returns {string} 图标emoji
   */
  getSiteIcon(url) {
    try {
      // 微信小程序兼容：手动提取主机名
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/);
      if (!hostnameMatch) return '🌐';
      
      const hostname = hostnameMatch[1].toLowerCase();
      
      // 检查子域名匹配
      for (const [domain, icon] of Object.entries(this.iconMap)) {
        if (hostname.includes(domain)) {
          return icon;
        }
      }
      
      // 默认图标
      return '🌐';
    } catch (error) {
      return '🌐';
    }
  }

  /**
   * 获取网站分类
   * @param {string} url - 网站URL
   * @returns {string} 分类名称
   */
  getSiteCategory(url) {
    try {
      // 微信小程序兼容：手动提取主机名
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/);
      if (!hostnameMatch) return '其他';
      
      const hostname = hostnameMatch[1].toLowerCase();
      
      // 检查子域名匹配
      for (const [domain, category] of Object.entries(this.categoryMap)) {
        if (hostname.includes(domain)) {
          return category;
        }
      }
      
      // 默认分类
      return '其他';
    } catch (error) {
      return '其他';
    }
  }

  /**
   * 生成网站标题（从URL推断）
   * @param {string} url - 网站URL
   * @returns {string} 推断的标题
   */
  generateSiteTitle(url) {
    try {
      // 微信小程序兼容：手动提取主机名
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/);
      if (!hostnameMatch) return '网页链接';
      
      let hostname = hostnameMatch[1].toLowerCase();
      
      // 移除www前缀
      const cleanHostname = hostname.replace(/^www\./, '');
      
      // 根据域名生成标题 - 扩展Jeff需要的平台
      const titleMap = {
        // AI平台
        'chatgpt.com': 'ChatGPT对话',
        'openai.com': 'OpenAI',
        'claude.ai': 'Claude对话',
        'gemini.google.com': 'Gemini AI',
        'perplexity.ai': 'Perplexity搜索',
        'copilot.microsoft.com': 'GitHub Copilot',
        
        // 开发平台
        'github.com': 'GitHub项目',
        'gitlab.com': 'GitLab项目',
        'gitee.com': 'Gitee项目',
        'stackoverflow.com': 'Stack Overflow问答',
        'juejin.cn': '掘金文章',
        'csdn.net': 'CSDN博客',
        'segmentfault.com': '思否问答',
        
        // 社交媒体
        'douyin.com': '抖音视频',
        'tiktok.com': 'TikTok视频',
        'weibo.com': '微博',
        'twitter.com': 'Twitter',
        'x.com': 'X (Twitter)',
        'instagram.com': 'Instagram',
        'facebook.com': 'Facebook',
        'linkedin.com': 'LinkedIn',
        'xiaohongshu.com': '小红书',
        
        // 视频平台
        'youtube.com': 'YouTube视频',
        'youtu.be': 'YouTube视频',
        'bilibili.com': 'B站视频',
        'vimeo.com': 'Vimeo视频',
        
        // 知识平台
        'zhihu.com': '知乎问答',
        'jianshu.com': '简书文章',
        'quora.com': 'Quora问答',
        'medium.com': 'Medium文章',
        
        // 购物平台
        'taobao.com': '淘宝商品',
        'tmall.com': '天猫商品',
        'jd.com': '京东商品',
        'amazon.com': 'Amazon商品',
        'amazon.cn': 'Amazon中国',
        
        // 搜索平台
        'baidu.com': '百度搜索',
        'google.com': 'Google搜索',
        'bing.com': 'Bing搜索',
        'sogou.com': '搜狗搜索',
        
        // 办公协作
        'notion.so': 'Notion页面',
        'feishu.cn': '飞书文档',
        'dingtalk.com': '钉钉',
        'teams.microsoft.com': 'Microsoft Teams',
        'slack.com': 'Slack',
        
        // 设计工具
        'figma.com': 'Figma设计',
        'canva.com': 'Canva设计',
        'sketch.com': 'Sketch设计',
        
        // 云服务
        'vercel.com': 'Vercel部署',
        'netlify.com': 'Netlify部署',
        'heroku.com': 'Heroku部署',
        'aws.amazon.com': 'AWS云服务',
        'aliyun.com': '阿里云服务',
        
        // 文档平台
        'docs.google.com': 'Google文档',
        'office.com': 'Microsoft Office',
        'wps.cn': 'WPS办公',
        
        // 其他常用
        'apple.com': 'Apple官网',
        'microsoft.com': 'Microsoft官网',
        'adobe.com': 'Adobe官网',
        'obsidian.md': 'Obsidian笔记',
        'reddit.com': 'Reddit讨论',
        'v2ex.com': 'V2EX讨论'
      };
      
      return titleMap[cleanHostname] || `${cleanHostname} - 网页链接`;
    } catch (error) {
      return '网页链接';
    }
  }

  /**
   * 解析文本并生成网站信息
   * @param {string} text - 输入文本
   * @returns {Array} 解析结果数组
   */
  parseText(text) {
    const urls = this.extractUrls(text);
    
    return urls.map((url, index) => {
      return {
        id: `parsed_${Date.now()}_${index}`,
        name: this.generateSiteTitle(url),
        url: url,
        logo: this.getSiteIcon(url),
        description: `从文本中自动解析的链接`,
        category: this.getSiteCategory(url),
        isCN: this.isChineseSite(url),
        tags: ['parsed'],
        sort_order: index
      };
    });
  }

  /**
   * 判断是否为中国网站
   * @param {string} url - 网站URL
   * @returns {boolean} 是否为中国网站
   */
  isChineseSite(url) {
    try {
      // 微信小程序兼容：手动提取主机名
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/);
      if (!hostnameMatch) return false;
      
      const hostname = hostnameMatch[1].toLowerCase();
      
      const chineseDomains = [
        'baidu.com', 'taobao.com', 'tmall.com', 'jd.com',
        'weibo.com', 'douyin.com', 'bilibili.com', 'zhihu.com',
        'jianshu.com', 'csdn.net', 'segmentfault.com', 'juejin.cn',
        'v2ex.com', 'qq.com', 'weixin.qq.com', 'tencent.com',
        'gitee.com', 'xiaohongshu.com', 'feishu.cn', 'dingtalk.com',
        'sogou.com', 'wps.cn', 'aliyun.com', 'amazon.cn'
      ];
      
      return chineseDomains.some(domain => hostname.includes(domain));
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证URL是否有效
   * @param {string} url - 网站URL
   * @returns {boolean} 是否有效
   */
  isValidUrl(url) {
    try {
      // 微信小程序兼容：使用正则验证URL
      const urlPattern = /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(:\d+)?(\/.*)?$/;
      
      if (!urlPattern.test(url)) {
        return false;
      }
      
      // 检查协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      
      // 提取主机名
      const hostnameMatch = url.match(/^https?:\/\/([^\/:]+)/);
      if (!hostnameMatch) {
        return false;
      }
      
      const hostname = hostnameMatch[1];
      
      return hostname.length >= 3 && 
             (hostname.includes('.') || hostname === 'localhost');
    } catch (error) {
      return false;
    }
  }

  /**
   * 过滤有效URL
   * @param {Array} urls - URL数组
   * @returns {Array} 有效URL数组
   */
  filterValidUrls(urls) {
    return urls.filter(url => this.isValidUrl(url));
  }
}

// 导出单例实例
const textParser = new TextParser();
module.exports = textParser;
