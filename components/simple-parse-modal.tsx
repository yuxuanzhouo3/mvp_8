"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { parseTextToSites } from "@/lib/site-parser"
import { Loader2, ListPlus } from "lucide-react"

interface SimpleParseModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSite: (site: { name: string; url: string; logo: string }) => Promise<boolean>
}

export function SimpleParseModal({
  isOpen,
  onClose,
  onAddSite,
}: SimpleParseModalProps) {
  const [rawText, setRawText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const handleParse = async () => {
    if (!rawText.trim()) {
      setStatusMessage("请输入要解析的文本")
      return
    }

    setIsProcessing(true)
    setStatusMessage("")

    try {
      const results = parseTextToSites(rawText)
      
      if (results.length === 0) {
        setStatusMessage("未检测到有效链接")
        return
      }

      let successCount = 0
      for (const site of results) {
        const success = await onAddSite({
          name: site.name,
          url: site.url,
          logo: site.logo,
        })
        if (success) {
          successCount++
        }
      }

      setStatusMessage(`成功添加 ${successCount} 个网站`)
      
      // 清空输入
      setRawText("")
      
      // 延迟关闭
      setTimeout(() => {
        onClose()
        setStatusMessage("")
      }, 1500)

    } catch (error) {
      console.error('解析失败:', error)
      setStatusMessage("解析失败，请重试")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setRawText("")
    setStatusMessage("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ListPlus className="w-5 h-5 text-blue-400" />
            智能解析链接
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-slate-400">
            粘贴聊天记录或分享文本，自动提取其中的链接。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">粘贴文本</label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="例如：\n- 看看这个工具 https://chatgpt.com/\n- GitHub 上的项目：https://github.com/vercel/next.js"
              className="min-h-[120px] bg-slate-800 border-slate-700 focus-visible:ring-blue-500 resize-vertical"
            />
          </div>

          {statusMessage && (
            <div className="text-sm text-blue-300 text-center">
              {statusMessage}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              取消
            </Button>
            <Button
              onClick={handleParse}
              disabled={!rawText.trim() || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  解析中...
                </>
              ) : (
                "解析并添加"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
