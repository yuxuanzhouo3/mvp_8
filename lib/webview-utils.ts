/**
 * WebView环境检测和链接处理工具
 * 用于优化在原生应用WebView中的用户体验
 */

/**
 * 检测当前是否在WebView环境中运行
 */
export function isWebView(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // 检测常见的WebView标识
  const webViewIndicators = [
    // Android WebView
    /wv/i,
    /WebView/i,
    // iOS WebView
    /(iPhone|iPod|iPad)(?!.*Safari\/)/i,
    // React Native
    /ReactNativeWebView/i,
    // Electron
    /Electron/i,
    // 微信内置浏览器
    /MicroMessenger/i,
    // QQ内置浏览器
    /QQ\//i,
    // 微博内置浏览器
    /Weibo/i,
  ]

  // 检查是否匹配任何WebView标识
  const isWebViewUA = webViewIndicators.some(regex => regex.test(userAgent))

  // 检查是否存在WebView相关的全局对象
  const hasWebViewObject = !!(
    (window as any).ReactNativeWebView ||
    (window as any).webkit?.messageHandlers ||
    (window as any).Android
  )

  // 检测是否为独立应用（PWA或WebView）
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone ||
    document.referrer.includes('android-app://')

  return isWebViewUA || hasWebViewObject || isStandalone
}

/**
 * 检测WebView的具体类型
 */
export function getWebViewType(): 'android' | 'ios' | 'electron' | 'wechat' | 'browser' | 'unknown' {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  const userAgent = navigator.userAgent || ''

  if (/MicroMessenger/i.test(userAgent)) {
    return 'wechat'
  }

  if (/Electron/i.test(userAgent)) {
    return 'electron'
  }

  if ((window as any).ReactNativeWebView || /Android/i.test(userAgent)) {
    return 'android'
  }

  if (/(iPhone|iPod|iPad)/i.test(userAgent) && !/(Safari)/i.test(userAgent)) {
    return 'ios'
  }

  if (!isWebView()) {
    return 'browser'
  }

  return 'unknown'
}

/**
 * 判断链接是否为内部链接
 */
export function isInternalLink(url: string): boolean {
  if (!url) return false

  try {
    const link = new URL(url, window.location.origin)
    return link.origin === window.location.origin
  } catch {
    // 相对路径视为内部链接
    return !url.startsWith('http://') && !url.startsWith('https://')
  }
}

/**
 * 判断链接是否为SiteHub管理的站点链接
 * （即用户添加的网站链接，这些应该在新标签页打开）
 */
export function isSiteHubManagedLink(element: HTMLElement): boolean {
  // 检查是否在网站卡片或特定组件内
  return !!(
    element.closest('[data-site-card]') ||
    element.closest('[data-external-link]') ||
    element.closest('.site-card') ||
    element.classList.contains('external-link')
  )
}

/**
 * 在WebView中打开链接的策略
 */
export interface WebViewLinkOptions {
  /**
   * 是否强制在WebView内部打开
   */
  forceInternal?: boolean

  /**
   * 是否强制在外部浏览器打开
   */
  forceExternal?: boolean

  /**
   * 自定义处理函数
   */
  customHandler?: (url: string) => void
}

/**
 * 在WebView环境中处理链接点击
 */
export function handleWebViewLink(url: string, options: WebViewLinkOptions = {}): void {
  const { forceInternal = false, forceExternal = false, customHandler } = options

  // 如果有自定义处理函数，优先使用
  if (customHandler) {
    customHandler(url)
    return
  }

  const webViewType = getWebViewType()
  const isInternal = isInternalLink(url)

  // 策略1：内部链接在WebView内打开
  if (isInternal || forceInternal) {
    window.location.href = url
    return
  }

  // 策略2：强制外部打开
  if (forceExternal) {
    openInExternalBrowser(url, webViewType)
    return
  }

  // 策略3：WebView中默认在当前窗口打开（避免跳转外部浏览器）
  if (isWebView()) {
    // 在WebView中，用户添加的网站链接应该在新窗口打开
    // 但由于WebView限制，我们在当前窗口打开
    window.location.href = url
  } else {
    // 浏览器环境，在新标签页打开
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * 在外部浏览器中打开链接（针对WebView环境）
 */
function openInExternalBrowser(url: string, webViewType: ReturnType<typeof getWebViewType>): void {
  // 尝试通过WebView提供的接口打开外部浏览器

  // React Native WebView
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({
      type: 'OPEN_EXTERNAL',
      url: url
    }))
    return
  }

  // iOS WKWebView
  if ((window as any).webkit?.messageHandlers?.openExternal) {
    (window as any).webkit.messageHandlers.openExternal.postMessage({ url })
    return
  }

  // Android WebView
  if ((window as any).Android?.openExternal) {
    (window as any).Android.openExternal(url)
    return
  }

  // 微信环境
  if (webViewType === 'wechat') {
    // 微信中无法直接打开外部浏览器，提示用户在浏览器中打开
    alert('请点击右上角菜单，选择"在浏览器中打开"')
    return
  }

  // 默认：在当前窗口打开
  window.location.href = url
}

/**
 * 为所有外部链接添加WebView兼容处理
 * 在应用初始化时调用一次
 */
export function setupWebViewLinkHandlers(): void {
  if (typeof window === 'undefined' || !isWebView()) {
    return
  }

  // 拦截所有链接点击
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('a') as HTMLAnchorElement

    if (!link || !link.href) {
      return
    }

    // 检查是否为SiteHub管理的站点链接
    if (isSiteHubManagedLink(link)) {
      // 让组件自己的onClick处理
      return
    }

    // 检查链接是否有特殊属性
    const forceInternal = link.hasAttribute('data-webview-internal')
    const forceExternal = link.hasAttribute('data-webview-external')

    // 如果是普通的外部链接，在WebView中默认当前窗口打开
    if (!isInternalLink(link.href) && !forceExternal) {
      e.preventDefault()
      handleWebViewLink(link.href, { forceInternal })
    }
  }, true)

  console.log('[WebView] Link handlers initialized for', getWebViewType())
}

/**
 * 获取WebView环境信息（用于调试）
 */
export function getWebViewInfo() {
  return {
    isWebView: isWebView(),
    type: getWebViewType(),
    userAgent: navigator.userAgent,
    standalone: (navigator as any).standalone,
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
  }
}
