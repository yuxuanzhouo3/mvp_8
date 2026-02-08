"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Crown, Plus } from "lucide-react"

const ensureProtocol = (value: string) => {
  if (!value) return ""
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`
}

const extractDomain = (raw: string) => {
  try {
    const url = new URL(ensureProtocol(raw))
    return url.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

const defaultLogoForDomain = (domain: string) => {
  const logoMap: Record<string, string> = {
    "google.com": "🔍",
    "youtube.com": "📺",
    "facebook.com": "👥",
    "twitter.com": "🐦",
    "instagram.com": "📸",
    "linkedin.com": "💼",
    "github.com": "🐙",
    "stackoverflow.com": "📚",
    "medium.com": "📝",
    "dev.to": "👨‍💻",
  }
  return logoMap[domain] || "🌐"
}

interface AddSiteModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (site: { name: string; url: string; logo: string }) => Promise<boolean>
  user: { pro: boolean }
  customCount?: number
  limit?: number
}

export function AddSiteModal({
  isOpen,
  onClose,
  onAdd,
  user,
  customCount = 0,
  limit = 10,
}: AddSiteModalProps) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [logo, setLogo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ✅ 关键修复：添加 isMountedRef 来防止组件卸载后设置状态
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 简化计算，避免 hydration mismatch
  const canAddSite = true // 暂时移除限制，与小程序保持一致

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (!value) {
      setName("")
      setLogo("")
      return
    }

    const domain = extractDomain(value)
    if (domain) {
      const base = domain.split(".")[0]
      setName(base.charAt(0).toUpperCase() + base.slice(1))
      setLogo(defaultLogoForDomain(domain))
    }
  }

  const resetForm = () => {
    setUrl("")
    setName("")
    setLogo("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!url || !name) return

    setIsLoading(true)
    const finalUrl = ensureProtocol(url.trim())

    const success = await onAdd({
      name: name.trim(),
      url: finalUrl,
      logo: (logo || "🌐").trim() || "🌐",
    })

    // ✅ 关键修复：只在组件仍挂载时设置状态
    if (isMountedRef.current) {
      setIsLoading(false)

      if (success) {
        resetForm()
        onClose()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            添加自定义网站
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            添加常用链接，快速访问您的专属站点。
          </DialogDescription>
        </DialogHeader>

        {!canAddSite ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🚫</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">已达免费配额</h3>
            <p className="text-slate-500 dark:text-slate-400">免费用户最多保存 10 个自定义网站，升级 Pro 即可无限添加。</p>
            <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              升级 Pro
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 font-medium">
                {user.pro ? "Pro • 无限制" : "自定义网站"}
              </Badge>
              {user.pro && <Crown className="w-4 h-4 text-yellow-500" />}
            </div>

            <div>
              <Label htmlFor="url" className="text-slate-700 dark:text-slate-300">网站地址</Label>
              <Input
                id="url"
                type="url"
                placeholder="example.com 或 https://example.com"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">网站名称</Label>
              <Input
                id="name"
                type="text"
                placeholder="网站名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="logo" className="text-slate-700 dark:text-slate-300">图标 (Emoji)</Label>
              <div className="flex gap-2">
                <Input
                  id="logo"
                  type="text"
                  placeholder="🌐"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 w-20 text-center text-xl text-slate-900 dark:text-white"
                />
                <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                  <span className="text-2xl">{logo || "🌐"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  onClose()
                }}
                className="flex-1 bg-slate-50 dark:bg-transparent border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !url || !name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {isLoading ? "添加中..." : "添加网站"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
