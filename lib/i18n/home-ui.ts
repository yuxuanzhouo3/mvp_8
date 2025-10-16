import type { SupportedLanguage } from "@/contexts/language-context"

interface HeaderText {
  badgeLabel: string
  guestUser: string
  guestAccount: string
  limitedFeatures: string
  signUp: string
  login: string
  upgrade: string
  proAccount: string
  freeAccount: string
  settings: string
  support: string
  signOut: string
  contactEmailSubject: string
  proBadge: string
  badgeSuffix: string
  languageMenuTitle: string
  languageChinese: string
  languageChineseDesc: string
  languageEnglish: string
  languageEnglishDesc: string
  languageAutoNote: string
}

interface HeroText {
  title: string
  subtitle: string
  productLabel: string
}

interface SearchText {
  placeholder: string
  categoriesLabel: string
  sitesSuffix: string
  favoritesLabel: string
  customLabel: string
  allSites: string
  chinaSites: string
}

interface StatsText {
  heading: string
  summaryDefault: string
  summaryFavorites: string
  summaryCustom: string
}

interface ButtonText {
  addSite: string
  smartParse: string
  shuffle: string
}

interface ToastText {
  timeExpired: string
  duplicateSite: string
  limitReached: string
  guestLimit: string
  addedFavorite: string
  guestCustomAdded: string
  addFailed: string
  favoriteAdded: string
  favoriteRemoved: string
  guestFavoriteAdded: string
  shuffled: string
  reordered: string
  removed: string
}

interface GuestTimerText {
  expired: string
  warningHigh: string
  warningMid: string
  warningLow: string
  upgradeCtaActive: string
  upgradeCtaExpired: string
  upgradeHintActive: string
  upgradeHintExpired: string
}

interface GuestBannerText {
  title: string
  description: string
  cta: string
}

export interface HomeUiText {
  header: HeaderText
  hero: HeroText
  search: SearchText
  stats: StatsText
  buttons: ButtonText
  toasts: ToastText
  guestTimer: GuestTimerText
  guestBanner: GuestBannerText
}

const countPlaceholder = "{count}"
const totalPlaceholder = "{total}"
const visiblePlaceholder = "{visible}"
const namePlaceholder = "{name}"

export const homeUiText: Record<SupportedLanguage, HomeUiText> = {
  zh: {
    header: {
      badgeLabel: "300+ 网站",
      badgeSuffix: "辰汇科技",
      guestUser: "游客用户",
      guestAccount: "游客账号",
      limitedFeatures: "功能受限",
      signUp: "注册",
      login: "登录",
      upgrade: "升级 Pro 会员",
      proAccount: "Pro 会员",
      freeAccount: "免费用户",
      settings: "设置",
      support: "联系我们",
      signOut: "退出登录",
      contactEmailSubject: "辰汇客服支持",
      proBadge: "Pro 会员",
      languageMenuTitle: "语言切换",
      languageChinese: "中文",
      languageChineseDesc: "简体中文 · 默认",
      languageEnglish: "English",
      languageEnglishDesc: "English · International",
      languageAutoNote: "已根据您的位置自动匹配语言"
    },
    hero: {
      title: "SiteHub 工具集",
      subtitle: "一站式网站导航平台",
      productLabel: "辰汇科技产品集"
    },
    search: {
      placeholder: `搜索 ${countPlaceholder}+ 网站...`,
      categoriesLabel: "分类",
      sitesSuffix: "个网站",
      favoritesLabel: "收藏网站",
      customLabel: "自定义网站",
      allSites: "全部网站",
      chinaSites: "中国网站"
    },
    stats: {
      heading: "300+ 网站 · 单页尽览",
      summaryDefault: `${visiblePlaceholder} / ${totalPlaceholder} 个网站`,
      summaryFavorites: `${visiblePlaceholder} 个收藏网站`,
      summaryCustom: `${visiblePlaceholder} 个自定义网站`
    },
    buttons: {
      addSite: "添加网站",
      smartParse: "智能解析",
      shuffle: "随机排序"
    },
    toasts: {
      timeExpired: "时间已到！注册后继续使用拖拽功能。",
      duplicateSite: "该链接已在列表中。",
      limitReached: "免费额度已满，升级 Pro 解锁无限自定义。",
      guestLimit: "请注册后继续添加自定义网站。",
      addedFavorite: `${namePlaceholder} 已加入收藏 ⭐`,
      guestCustomAdded: `${namePlaceholder} 已添加！⭐ 注册后即可永久保存！`,
      addFailed: "添加失败，请稍后重试。",
      favoriteAdded: `${namePlaceholder} 已加入收藏`,
      favoriteRemoved: `${namePlaceholder} 已从收藏移除`,
      guestFavoriteAdded: `${namePlaceholder} 已加入收藏！⭐ 注册后即可永久保存！`,
      shuffled: "网站已随机排序 ✨",
      reordered: "已保存新排序 📝",
      removed: "网站已移除"
    },
    guestTimer: {
      expired: "已过期",
      warningHigh: "",
      warningMid: "⚠️ 收藏和自定义网站即将丢失！",
      warningLow: "🚨 立即注册以保存数据！",
      upgradeCtaActive: "保存我的数据",
      upgradeCtaExpired: "注册以继续",
      upgradeHintActive: "💾 不要丢失你的数据！",
      upgradeHintExpired: "✨ 注册即可永久保存收藏"
    },
    guestBanner: {
      title: "游客模式 - 数据将会丢失！",
      description: `你已有 {favorites} 个收藏、{custom} 个自定义网站。注册账户即可永久保存！`,
      cta: "保存我的数据"
    }
  },
  en: {
    header: {
      badgeLabel: "300+ Sites",
      badgeSuffix: "MornHub",
      guestUser: "Guest User",
      guestAccount: "Guest Account",
      limitedFeatures: "Limited features",
      signUp: "Sign Up",
      login: "Login",
      upgrade: "Upgrade to Pro",
      proAccount: "Pro Account",
      freeAccount: "Free Account",
      settings: "Settings",
      support: "Contact Support",
      signOut: "Sign Out",
      contactEmailSubject: "SiteHub Support",
      proBadge: "Pro Member",
      languageMenuTitle: "Language",
      languageChinese: "中文",
      languageChineseDesc: "Simplified Chinese · Default",
      languageEnglish: "English",
      languageEnglishDesc: "English · International",
      languageAutoNote: "Automatically matched to your location"
    },
    hero: {
      title: "SiteHub Dashboard",
      subtitle: "All-in-one website navigation hub",
      productLabel: "MornHub Products"
    },
    search: {
      placeholder: `Search ${countPlaceholder}+ websites...`,
      categoriesLabel: "Categories",
      sitesSuffix: "sites",
      favoritesLabel: "favorite sites",
      customLabel: "custom sites",
      allSites: "All Sites",
      chinaSites: "China Sites"
    },
    stats: {
      heading: "300+ Sites · One Page View",
      summaryDefault: `${visiblePlaceholder} of ${totalPlaceholder} websites`,
      summaryFavorites: `${visiblePlaceholder} favorite sites`,
      summaryCustom: `${visiblePlaceholder} custom sites`
    },
    buttons: {
      addSite: "Add Site",
      smartParse: "Smart Parse",
      shuffle: "Shuffle"
    },
    toasts: {
      timeExpired: "Time's up! Sign up to continue using drag & drop.",
      duplicateSite: "This link already exists in your collection.",
      limitReached: "Free limit reached! Upgrade to Pro for unlimited sites.",
      guestLimit: "Sign up to keep adding custom sites.",
      addedFavorite: `${namePlaceholder} added to favorites! ⭐`,
      guestCustomAdded: `${namePlaceholder} added! ⭐ Sign up to keep your data forever!`,
      addFailed: "Failed to add site. Please try again.",
      favoriteAdded: `${namePlaceholder} added to favorites`,
      favoriteRemoved: `${namePlaceholder} removed from favorites`,
      guestFavoriteAdded: `${namePlaceholder} favorited! ⭐ Sign up to keep it forever!`,
      shuffled: "Sites shuffled! ✨",
      reordered: "Sites reordered! 📝",
      removed: "Site removed"
    },
    guestTimer: {
      expired: "Expired",
      warningHigh: "",
      warningMid: "⚠️ Your favorites & custom sites will be lost soon!",
      warningLow: "🚨 Sign up now to save your data!",
      upgradeCtaActive: "Save My Data",
      upgradeCtaExpired: "Sign Up to Continue",
      upgradeHintActive: "💾 Don't lose your data!",
      upgradeHintExpired: "✨ Keep your favorites forever!"
    },
    guestBanner: {
      title: "Guest session - data will be lost!",
      description: `You have {favorites} favorites and {custom} custom sites. Sign up to keep them forever!`,
      cta: "Save My Data"
    }
  }
}

export const uiPlaceholders = {
  count: countPlaceholder,
  total: totalPlaceholder,
  visible: visiblePlaceholder,
  name: namePlaceholder
}
