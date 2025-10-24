"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { parseTextToSites, normalizeUrlForComparison, type ParsedSite } from "@/lib/site-parser"
import { Loader2, ListPlus, Globe, CheckCircle2 } from "lucide-react"

interface ParseSitesModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSite: (site: { name: string; url: string; logo: string }) => Promise<boolean>
  existingUrls: Set<string>
  isProUser: boolean
  remainingSlots: number | null
}

type EnrichedParsedSite = ParsedSite & {
  isDuplicate: boolean
  isAdded: boolean
}

export function ParseSitesModal({
  isOpen,
  onClose,
  onAddSite,
  existingUrls,
  isProUser,
  remainingSlots,
}: ParseSitesModalProps) {
  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState<EnrichedParsedSite[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set())
  const [statusMessage, setStatusMessage] = useState("")

  const canAddMore = isProUser || remainingSlots === null || remainingSlots > 0

  // ✅ 修复无限循环：使用 useRef 稳定化依赖，不在 useEffect 中更新
  const existingUrlsRef = useRef(existingUrls)
  const addedUrlsRef = useRef(addedUrls)
  
  // 每次渲染时同步更新 ref（不在 effect 中，避免触发循环）
  existingUrlsRef.current = existingUrls
  addedUrlsRef.current = addedUrls

  // ✅ 关键修复：添加 isMountedRef 来防止组件卸载后设置状态
  const isMountedRef = useRef(true)

  useEffect(() => {
    if (!isOpen) {
      setRawText("")
      setParsed([])
      // ✅ 关键修复：只有当前 addedUrls 不为空时才重置
      setAddedUrls(prev => prev.size > 0 ? new Set() : prev)
      setStatusMessage("")
    }
  }, [isOpen])

  // ✅ 关键修复：清理函数重置 isMountedRef
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!rawText) {
      setParsed([])
      return
    }

    setIsProcessing(true)
    const handler = setTimeout(() => {
      const results = parseTextToSites(rawText)
      const enriched: EnrichedParsedSite[] = results.map((site) => {
        const normalized = normalizeUrlForComparison(site.url)
        const isDuplicate = existingUrlsRef.current.has(normalized)
        return {
          ...site,
          isDuplicate,
          isAdded: addedUrlsRef.current.has(normalized),
        }
      })

      // ✅ 关键修复：只在组件仍挂载时设置状态
      if (isMountedRef.current) {
        setParsed(enriched)
        setIsProcessing(false)
      }
    }, 350)

    return () => clearTimeout(handler)
  }, [rawText])  // ✅ 只依赖 rawText，使用 useRef 访问 existingUrls 和 addedUrls

  const actionableSites = useMemo(
    () => parsed.filter((site) => !site.isDuplicate && !site.isAdded),
    [parsed],
  )

  const hasActionableSites = actionableSites.length > 0

  const handleAddSingle = async (site: EnrichedParsedSite) => {
    const normalized = normalizeUrlForComparison(site.url)
    if (site.isDuplicate || addedUrls.has(normalized)) {
      return false
    }

    const success = await onAddSite({
      name: site.name,
      url: site.url,
      logo: site.logo,
    })

    // ✅ 关键修复：只在组件仍挂载时设置状态
    if (!isMountedRef.current) return false

    if (success) {
      setAddedUrls((prev) => {
        const updated = new Set(prev)
        updated.add(normalized)
        return updated
      })
      setParsed((prev) =>
        prev.map((item) =>
          item.id === site.id ? { ...item, isAdded: true } : item,
        ),
      )
      setStatusMessage(`已添加 ${site.name}`)
      return true
    }

    return false
  }

  const handleAddAll = async () => {
    if (!hasActionableSites) {
      setStatusMessage("没有可添加的新链接")
      return
    }

    let successCount = 0

    for (const site of actionableSites) {
      // ✅ 关键修复：检查组件是否仍挂载
      if (!isMountedRef.current) break
      
      const ok = await handleAddSingle(site)
      if (ok) {
        successCount += 1
      }
    }

    // ✅ 关键修复：只在组件仍挂载时设置状态
    if (isMountedRef.current && successCount > 0) {
      setStatusMessage(`成功添加 ${successCount} 个网站`)
    }
  }

  const duplicateCount = parsed.filter((site) => site.isDuplicate).length
  const addedCount = parsed.filter((site) => site.isAdded).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-slate-900 text-white border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ListPlus className="w-5 h-5 text-blue-400" />
            智能解析链接
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-slate-400">
            粘贴聊天记录或分享文本，自动提取其中的链接，快速批量加入自定义网站。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">粘贴文本</label>
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={`例如：\n- 看看这个工具 https://chatgpt.com/\n- GitHub 上的项目：https://github.com/vercel/next.js\n- 小红书：https://www.xiaohongshu.com/...`}
              className="min-h-[140px] bg-slate-800 border-slate-700 focus-visible:ring-blue-500 resize-vertical"
            />
          </div>

          {/* 统计和操作按钮区 - 移动端优化 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* 统计信息 - 移动端横向滚动 */}
            <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-1">
              <Badge variant="outline" className="border-slate-600 text-slate-200 whitespace-nowrap">
                共 {parsed.length} 条
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-emerald-200 whitespace-nowrap">
                可添加 {actionableSites.length}
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="outline" className="border-slate-600 text-amber-300 whitespace-nowrap">
                  {duplicateCount} 已存在
                </Badge>
              )}
              {addedCount > 0 && (
                <Badge variant="outline" className="border-slate-600 text-blue-300 whitespace-nowrap">
                  已添加 {addedCount}
                </Badge>
              )}
            </div>

            {/* 操作按钮 - 移动端全宽 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                disabled={!hasActionableSites || isProcessing || !canAddMore}
                onClick={handleAddAll}
                className="flex-1 sm:flex-none border-blue-500 text-blue-300 hover:bg-blue-500/10 h-9 text-sm"
              >
                <Globe className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="sm:hidden">添加全部 ({actionableSites.length})</span>
                <span className="hidden sm:inline">一键添加全部</span>
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white h-9 text-sm px-3 sm:px-4">
                关闭
              </Button>
            </div>
          </div>

          {/* Pro提示 - 移动端单独显示 */}
          {!canAddMore && (
            <div className="text-xs sm:text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
              免费用户最多 10 个，升级 Pro 可无限添加
            </div>
          )}

          <div className="relative">
            {isProcessing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            )}

            <ScrollArea className="h-[260px] rounded-md border border-slate-800 bg-slate-900/60 p-2">
              {parsed.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                  粘贴文本后自动解析链接
                </div>
              ) : (
                <div className="space-y-2">
                  {parsed.map((site) => {
                    const isDisabled = site.isDuplicate || site.isAdded || !canAddMore

                    return (
                      <div
                        key={site.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 rounded-md border border-slate-800 bg-slate-800/60 px-3 py-2.5 sm:px-4 sm:py-3"
                      >
                        {/* 左侧：网站信息 */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                          <span className="text-xl sm:text-2xl flex-shrink-0">{site.logo}</span>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-white truncate">{site.name}</span>
                              {site.isDuplicate && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px] sm:text-xs px-1 py-0 h-4 sm:h-5">
                                  已存在
                                </Badge>
                              )}
                              {site.isAdded && (
                                <Badge variant="outline" className="border-blue-500 text-blue-300 text-[10px] sm:text-xs px-1 py-0 h-4 sm:h-5">
                                  已添加
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-400 truncate font-mono">{site.url}</div>
                          </div>
                        </div>

                        {/* 右侧：添加按钮 */}
                        <Button
                          size="sm"
                          disabled={isDisabled}
                          onClick={() => handleAddSingle(site)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
                        >
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">添加</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {statusMessage && (
            <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              {statusMessage}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
