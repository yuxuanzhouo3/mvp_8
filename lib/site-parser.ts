const URL_REGEX = /(https?:\/\/[^\s]+)/gi

const ICON_MAP: Record<string, string> = {
  "chatgpt.com": "🤖",
  "openai.com": "🤖",
  "claude.ai": "🧠",
  "gemini.google.com": "💎",
  "perplexity.ai": "🔮",
  "copilot.microsoft.com": "🛠️",
  "github.com": "🐙",
  "gitlab.com": "🦊",
  "gitee.com": "🐎",
  "stackoverflow.com": "📚",
  "juejin.cn": "💎",
  "csdn.net": "💻",
  "segmentfault.com": "🏗️",
  "douyin.com": "🎵",
  "tiktok.com": "🎵",
  "weibo.com": "🐦",
  "twitter.com": "🐦",
  "x.com": "🐦",
  "instagram.com": "📷",
  "facebook.com": "📘",
  "linkedin.com": "💼",
  "xiaohongshu.com": "📖",
  "youtube.com": "📺",
  "youtu.be": "📺",
  "bilibili.com": "📺",
  "vimeo.com": "🎬",
  "zhihu.com": "💭",
  "jianshu.com": "📝",
  "medium.com": "📄",
  "taobao.com": "🛒",
  "tmall.com": "🛒",
  "jd.com": "🛒",
  "amazon.com": "🛒",
  "amazon.cn": "🛒",
  "baidu.com": "🔍",
  "google.com": "🌐",
  "bing.com": "🔍",
  "sogou.com": "🔍",
  "notion.so": "📋",
  "feishu.cn": "🦆",
  "dingtalk.com": "🔔",
  "teams.microsoft.com": "👥",
  "slack.com": "💬",
  "figma.com": "🎨",
  "canva.com": "🖼️",
  "sketch.com": "✏️",
  "vercel.com": "☁️",
  "netlify.com": "🌐",
  "heroku.com": "🚀",
  "aws.amazon.com": "☁️",
  "aliyun.com": "☁️",
  "docs.google.com": "📄",
  "office.com": "📊",
  "wps.cn": "📝",
  "apple.com": "🍎",
  "microsoft.com": "🪟",
  "adobe.com": "🎨",
  "obsidian.md": "🔮",
  "reddit.com": "🔴",
  "v2ex.com": "💬",
}

const TITLE_MAP: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "openai.com": "OpenAI",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "perplexity.ai": "Perplexity",
  "copilot.microsoft.com": "GitHub Copilot",
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "gitee.com": "Gitee",
  "stackoverflow.com": "Stack Overflow",
  "juejin.cn": "掘金",
  "csdn.net": "CSDN",
  "segmentfault.com": "思否",
  "douyin.com": "抖音",
  "tiktok.com": "TikTok",
  "weibo.com": "微博",
  "twitter.com": "Twitter",
  "x.com": "X (Twitter)",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "linkedin.com": "LinkedIn",
  "xiaohongshu.com": "小红书",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "bilibili.com": "哔哩哔哩",
  "vimeo.com": "Vimeo",
  "zhihu.com": "知乎",
  "jianshu.com": "简书",
  "medium.com": "Medium",
  "taobao.com": "淘宝",
  "tmall.com": "天猫",
  "jd.com": "京东",
  "amazon.com": "Amazon",
  "amazon.cn": "Amazon中国",
  "baidu.com": "百度",
  "google.com": "Google",
  "bing.com": "Bing",
  "sogou.com": "搜狗",
  "notion.so": "Notion",
  "feishu.cn": "飞书",
  "dingtalk.com": "钉钉",
  "teams.microsoft.com": "Microsoft Teams",
  "slack.com": "Slack",
  "figma.com": "Figma",
  "canva.com": "Canva",
  "sketch.com": "Sketch",
  "vercel.com": "Vercel",
  "netlify.com": "Netlify",
  "heroku.com": "Heroku",
  "aws.amazon.com": "AWS",
  "aliyun.com": "阿里云",
  "docs.google.com": "Google Docs",
  "office.com": "Microsoft Office",
  "wps.cn": "WPS",
  "apple.com": "Apple",
  "microsoft.com": "Microsoft",
  "adobe.com": "Adobe",
  "obsidian.md": "Obsidian",
  "reddit.com": "Reddit",
  "v2ex.com": "V2EX",
}

const CHINESE_DOMAINS = [
  "baidu.com",
  "taobao.com",
  "tmall.com",
  "jd.com",
  "weibo.com",
  "douyin.com",
  "bilibili.com",
  "zhihu.com",
  "jianshu.com",
  "csdn.net",
  "segmentfault.com",
  "juejin.cn",
  "v2ex.com",
  "qq.com",
  "weixin.qq.com",
  "tencent.com",
  "gitee.com",
  "xiaohongshu.com",
  "feishu.cn",
  "dingtalk.com",
  "sogou.com",
  "wps.cn",
  "aliyun.com",
  "amazon.cn",
]

export interface ParsedSite {
  id: string
  name: string
  url: string
  logo: string
  description: string
  isChina: boolean
  hostname: string
}

const ensureProtocol = (value: string) => {
  if (!value) return ""
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`
}

const extractHostname = (url: string) => {
  try {
    const normalized = ensureProtocol(url)
    const parsed = new URL(normalized)
    return parsed.hostname.toLowerCase()
  } catch {
    return ""
  }
}

const generateTitle = (hostname: string) => {
  const clean = hostname.replace(/^www\./, "")
  return TITLE_MAP[clean] || clean || "网页链接"
}

const pickIcon = (hostname: string) => {
  const clean = hostname.replace(/^www\./, "")
  const entry = Object.entries(ICON_MAP).find(([domain]) => clean.includes(domain))
  return entry ? entry[1] : "🌐"
}

const isChineseDomain = (hostname: string) => {
  const clean = hostname.replace(/^www\./, "")
  return CHINESE_DOMAINS.some((domain) => clean.includes(domain))
}

const isValidUrl = (value: string) => {
  try {
    const normalized = ensureProtocol(value)
    const parsed = new URL(normalized)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false
    }
    return !!parsed.hostname
  } catch {
    return false
  }
}

const dedupe = (urls: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of urls) {
    const normalized = ensureProtocol(raw.trim())
    try {
      const href = new URL(normalized).href
      if (!seen.has(href)) {
        seen.add(href)
        result.push(href)
      }
    } catch {
      // ignore malformed url
    }
  }
  return result
}

export const parseTextToSites = (text: string): ParsedSite[] => {
  if (!text || typeof text !== "string") {
    return []
  }

  const matches = text.match(URL_REGEX) || []
  const uniqueUrls = dedupe(matches.filter((candidate) => isValidUrl(candidate)))

  return uniqueUrls.map((url, index) => {
    const hostname = extractHostname(url)
    const cleanHost = hostname.replace(/^www\./, "")

    return {
      id: `parsed-${Date.now()}-${index}`,
      name: generateTitle(hostname),
      url: ensureProtocol(url),
      logo: pickIcon(hostname),
      description: `自动解析：${cleanHost}`,
      isChina: isChineseDomain(hostname),
      hostname: cleanHost,
    }
  })
}

export const normalizeUrlForComparison = (url: string) => {
  try {
    const normalized = ensureProtocol(url.trim())
    const parsed = new URL(normalized)
    const path = parsed.pathname === "/" ? "" : parsed.pathname
    const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path
    return `${parsed.hostname.toLowerCase()}${normalizedPath}${parsed.search || ""}`
  } catch {
    return url.trim().toLowerCase()
  }
}

