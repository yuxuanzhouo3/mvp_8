# React Error #185 调试信息

## 1. Presence.tsx

**Presence.tsx 不在我们的项目中，它是 Radix UI 的内部组件。**

它是 `@radix-ui/react-dialog` 包的一部分，位于 `node_modules` 中。

**关键点**：
- Presence 是 Dialog 的动画组件
- 它负责管理模态框的出现/消失动画
- 错误发生在 Presence 的动画过程中

**相关文档**：
- [Radix UI Dialog 源码](https://github.com/radix-ui/primitives/tree/main/packages/react/dialog)
- Presence 在第 157 行附近处理动画状态

## 2. AddSiteModal.tsx

这是点击"AddSite"按钮后弹出的模态框组件：

```tsx
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
                {user.pro ? "Pro • 无限制" : "自定义网站"}
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
```

## 3. page.tsx 中模态框相关的部分

### 状态定义（第 258-274 行）

```tsx
const [sites, setSites] = useState<Site[]>([])
const [searchQuery, setSearchQuery] = useState("")
const [selectedCategory, setSelectedCategory] = useState("all")
const [categoryInitialized, setCategoryInitialized] = useState(false)
const [isShuffled, setIsShuffled] = useState(false)
const [showAddModal, setShowAddModal] = useState(false)           // ← AddSite 模态框状态
const [showParseModal, setShowParseModal] = useState(false)
const [showUpgradeModal, setShowUpgradeModal] = useState(false)
const [showAuthModal, setShowAuthModal] = useState(false)
const [authMode, setAuthMode] = useState<"login" | "signup">("login")
const [toast, setToast] = useState<any>(null)
const [isGuestTimeExpired, setIsGuestTimeExpired] = useState(false)
const [favorites, setFavorites] = useState<string[]>([])
const [regionPriorityApplied, setRegionPriorityApplied] = useState(false)
const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null)
const [dbAdapter, setDbAdapter] = useState<IDatabaseAdapter | null>(null)
const [mounted, setMounted] = useState(false)
```

### 回调函数定义（第 959-967 行）

```tsx
// ✅ 关键修复：所有模态框回调函数都用 useCallback 包装
const handleCloseAddModal = useCallback(() => setShowAddModal(false), [])
const handleCloseParseModal = useCallback(() => setShowParseModal(false), [])
const handleCloseUpgradeModal = useCallback(() => setShowUpgradeModal(false), [])
const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), [])
const handleAuthSuccess = useCallback((userData: any) => {
  console.log('🔍 [Auth] 用户认证成功:', userData)
  setShowAuthModal(false)
}, [])
```

### 模态框渲染（第 1149-1179 行）

```tsx
{/* 模态框总是渲染，保持 Hook 数量一致 */}
<AddSiteModal
  isOpen={showAddModal}
  onClose={handleCloseAddModal}
  onAdd={addCustomSite}
  user={user}
  customCount={customSitesCount}
  limit={10}
/>

<ParseSitesModal
  isOpen={showParseModal}
  onClose={handleCloseParseModal}
  onAddSite={addCustomSite}
  existingUrls={existingUrls}
  isProUser={user.pro}
  remainingSlots={remainingCustomSlots}
/>

<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={handleCloseUpgradeModal}
  onAuth={handleAuth}
  isTimeExpired={isGuestTimeExpired}
/>

<AuthModal
  open={showAuthModal}
  onOpenChange={handleCloseAuthModal}
  onAuth={handleAuthSuccess}
  authMode={authMode}
/>
```

## 🎯 问题分析

### 循环路径

1. **点击按钮** → `setShowAddModal(true)`
2. **Presence 检测到 isOpen 变化** → 开始动画
3. **AddSiteModal 接收 onClose prop** → 如果 prop 引用不稳定，每次渲染都不同
4. **Presence 检测到 props 变化** → 重新渲染子组件
5. **重新渲染触发状态更新** → 回到步骤 2

### 已修复的关键点

✅ **onClose 用 useCallback 包装** - 稳定引用
✅ **addCustomSite 用 useCallback 包装** - 稳定引用
✅ **existingUrls 只依赖 sites.length** - 避免数组引用变化
✅ **AddSiteModal 内部使用 isMountedRef** - 防止卸载后 setState

## 📝 最新提交

Commit: b6f8b24 - 修复 Presence 无限循环的根本原因 - 不稳定回调函数

