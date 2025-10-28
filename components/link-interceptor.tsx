"use client"

import { useEffect } from "react"

/**
 * LinkInterceptor 组件
 *
 * 功能：拦截所有链接点击，根据链接类型决定跳转方式
 * - 内部链接（mornhub.help 或相对路径）：使用默认跳转
 * - 外部链接（支付链接、第三方网站等）：在系统浏览器中打开
 *
 * 支持的环境：
 * - Tauri：使用 window.__TAURI__.shell.open()
 * - TWA/Capacitor：使用 window.open(_blank)
 * - Web：使用 window.open(_blank)
 */
export function LinkInterceptor() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // 找到被点击的元素或其父级中的 <a> 标签
      let target = event.target as HTMLElement | null
      let anchor: HTMLAnchorElement | null = null

      // 向上遍历 DOM 树，查找 <a> 标签
      while (target && target !== document.body) {
        if (target.tagName === "A") {
          anchor = target as HTMLAnchorElement
          break
        }
        target = target.parentElement
      }

      // 如果没有找到链接，直接返回
      if (!anchor || !anchor.href) {
        return
      }

      try {
        const url = new URL(anchor.href, window.location.href)
        const currentHostname = window.location.hostname
        const targetHostname = url.hostname

        // 判断是否为内部链接
        const isInternalLink =
          targetHostname === currentHostname || // 同域名
          targetHostname === "mornhub.help" || // 明确的内部域名
          targetHostname === "www.mornhub.help" || // 带 www 的内部域名
          url.protocol === "javascript:" || // JavaScript 伪协议
          url.protocol === "mailto:" || // 邮件链接
          url.protocol === "tel:" // 电话链接

        // 内部链接不做处理，使用默认行为
        if (isInternalLink) {
          return
        }

        // 外部链接：阻止默认行为，在系统浏览器中打开
        event.preventDefault()

        console.log(`[LinkInterceptor] 拦截外部链接: ${anchor.href}`)

        // 检测环境并打开链接
        if (typeof window !== "undefined") {
          // Tauri 环境
          if ((window as any).__TAURI__) {
            console.log("[LinkInterceptor] 使用 Tauri 打开外部链接")
            ;(window as any).__TAURI__.shell.open(anchor.href)
          }
          // 其他环境（TWA、Capacitor、Web）
          else {
            console.log("[LinkInterceptor] 使用 window.open 打开外部链接")
            window.open(anchor.href, "_blank", "noopener,noreferrer")
          }
        }
      } catch (error) {
        // 如果 URL 解析失败，不拦截，让浏览器处理
        console.error("[LinkInterceptor] URL 解析失败:", error)
      }
    }

    // 添加全局点击监听器
    document.addEventListener("click", handleClick, true)

    // 清理函数
    return () => {
      document.removeEventListener("click", handleClick, true)
    }
  }, [])

  // 这个组件不渲染任何内容
  return null
}
