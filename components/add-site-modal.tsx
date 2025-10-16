"use client"

import { useMemo, useState } from "react"
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

  const usedCount = useMemo(() => customCount, [customCount])
  const remainingCount = user.pro ? null : Math.max(0, limit - usedCount)
  const canAddSite = user.pro || (remainingCount !== null && remainingCount > 0)

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

    setIsLoading(false)

    if (success) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            添加自定义网站
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            添加常用链接，快速访问您的专属站点。
          </DialogDescription>
        </DialogHeader>

        {!canAddSite ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🚫</div>
            <h3 className="text-lg font-semibold">已达免费配额</h3>
            <p className="text-slate-400">免费用户最多保存 10 个自定义网站，升级 Pro 即可无限添加。</p>
            <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
              <Crown className="w-4 h-4 mr-2" />
              升级 Pro
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                {user.pro ? "Pro • 无限制" : `${Math.min(usedCount, limit)} / ${limit} 已使用`}
              </Badge>
              {user.pro && <Crown className="w-4 h-4 text-yellow-400" />}
            </div>

            <div>
              <Label htmlFor="url">网站地址</Label>
              <Input
                id="url"
                type="url"
                placeholder="example.com 或 https://example.com"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">网站名称</Label>
              <Input
                id="name"
                type="text"
                placeholder="网站名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>

            <div>
              <Label htmlFor="logo">图标 (Emoji)</Label>
              <div className="flex gap-2">
                <Input
                  id="logo"
                  type="text"
                  placeholder="🌐"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="bg-slate-700 border-slate-600 w-20 text-center text-xl"
                />
                <div className="flex-1 flex items-center justify-center bg-slate-700 rounded-md border border-slate-600">
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
                className="flex-1 bg-transparent border-slate-600 text-white hover:bg-slate-700"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !url || !name}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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
