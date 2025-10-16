"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { parseTextToSites, normalizeUrlForComparison, type ParsedSite } from "@/lib/site-parser"
import { Loader2, ListPlus, Globe, CheckCircle2, Copy } from "lucide-react"

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

  useEffect(() => {
    if (!isOpen) {
      setRawText("")
      setParsed([])
      setAddedUrls(new Set())
      setStatusMessage("")
    }
  }, [isOpen])

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
        const isDuplicate = existingUrls.has(normalized)
        return {
          ...site,
          isDuplicate,
          isAdded: addedUrls.has(normalized),
        }
      })

      setParsed(enriched)
      setIsProcessing(false)
    }, 350)

    return () => clearTimeout(handler)
  }, [rawText, existingUrls, addedUrls])

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
      const ok = await handleAddSingle(site)
      if (ok) {
        successCount += 1
      }
    }

    if (successCount > 0) {
      setStatusMessage(`成功添加 ${successCount} 个网站`)
    }
  }

  const duplicateCount = parsed.filter((site) => site.isDuplicate).length
  const addedCount = parsed.filter((site) => site.isAdded).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ListPlus className="w-5 h-5 text-blue-400" />
            智能解析链接
          </DialogTitle>
          <DialogDescription className="text-slate-400">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Badge variant="outline" className="border-slate-600 text-slate-200">
                共 {parsed.length} 条链接
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-emerald-200">
                可添加 {actionableSites.length} 条
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="outline" className="border-slate-600 text-amber-300">
                  {duplicateCount} 条已存在
                </Badge>
              )}
              {addedCount > 0 && (
                <Badge variant="outline" className="border-slate-600 text-blue-300">
                  已添加 {addedCount}
                </Badge>
              )}
              {!canAddMore && (
                <Badge variant="destructive">
                  免费用户最多 10 个，升级 Pro 可无限添加
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!hasActionableSites || isProcessing || !canAddMore}
                onClick={handleAddAll}
                className="border-blue-500 text-blue-300 hover:bg-blue-500/10"
              >
                <Globe className="w-4 h-4 mr-2" />
                一键添加全部
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
                关闭
              </Button>
            </div>
          </div>

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
                    const normalized = normalizeUrlForComparison(site.url)
                    const isDisabled = site.isDuplicate || site.isAdded || !canAddMore

                    return (
                      <div
                        key={site.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-800/60 px-4 py-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <span>{site.logo}</span>
                            <span>{site.name}</span>
                            {site.isChina && (
                              <Badge variant="outline" className="border-green-500 text-green-300">
                                中国网站
                              </Badge>
                            )}
                            {site.isDuplicate && (
                              <Badge variant="outline" className="border-slate-600 text-slate-400">
                                已存在
                              </Badge>
                            )}
                            {site.isAdded && (
                              <Badge variant="outline" className="border-blue-500 text-blue-300">
                                已添加
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400">{site.url}</div>
                          <div className="text-xs text-slate-500">{site.description}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            disabled={isDisabled}
                            onClick={() => handleAddSingle(site)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            添加
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => {
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(site.url).then(
                                  () => setStatusMessage("链接已复制"),
                                  () => setStatusMessage("复制失败，请手动复制"),
                                )
                              }
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
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
