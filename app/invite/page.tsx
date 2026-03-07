"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, QrCode, Send, Download } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildReferralShareLink, type ShareSource } from "@/lib/market/share-link"
import { canNativeShare, canSystemSharePoster, nativeShareLink, systemSharePoster } from "@/lib/market/share-client"
import { buildReferralPosterDataUrl, downloadReferralPoster } from "@/lib/market/share-poster"
import { ReferralPosterPreview } from "@/components/market/referral-poster-preview"

type InviteSummary = {
  referralCode: string
  shareUrl: string
  clickCount: number
  invitedCount: number
  conversionRate: number
  rewardMembershipDays: number
  inviterSignupDays: number
  invitedSignupDays: number
  inviterFirstUseDays: number
  invitedFirstUseDays: number
}

const COPY_SOURCE: ShareSource = "copy"
const ANDROID_SHARE_SOURCE: ShareSource = "android_share"
const QR_SOURCE: ShareSource = "qr"

export default function InvitePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { language } = useLanguage()
  const isZh = language === "zh"
  const userId = user?.type === "authenticated" ? String(user?.id || "") : ""

  const [summary, setSummary] = useState<InviteSummary | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false)
  const [posterShareAvailable, setPosterShareAvailable] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [savingPoster, setSavingPoster] = useState(false)
  const [sharingPoster, setSharingPoster] = useState(false)

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }, [router])

  const ui = useMemo(
    () =>
      isZh
        ? {
            title: "邀请中心",
            subtitle: "分享你的统一邀请链接，好友点击后可直接进入站点并注册。",
            loginRequiredTitle: "请先登录",
            loginRequiredDesc: "登录后即可查看邀请链接、邀请人数和会员奖励。",
            goLogin: "返回首页登录",
            back: "返回",
            linkLabel: "统一邀请链接",
            statClicks: "总点击",
            statInvites: "累计邀请",
            statRewards: "累计奖励会员天数",
            statRate: "转化率",
            signupReward: "注册奖励",
            firstUseReward: "首次使用奖励",
            inviter: "邀请人",
            invited: "被邀请人",
            copied: "已复制",
            copy: "复制",
            shareViaApps: "系统分享到应用",
            showQr: "二维码分享",
            hideQr: "收起二维码",
            momentsHint: "分享到朋友圈建议使用二维码海报。",
            qrHint: "扫码可直接打开邀请链接",
            qrAlt: "邀请二维码",
            webOnlyHint: "当前为 Web 端，可复制链接或二维码分享。",
            savePoster: "保存海报",
            savingPoster: "保存中...",
            sharePoster: "系统分享海报",
            sharingPoster: "分享中...",
            posterSaved: "海报已保存",
            posterSaveFailed: "保存失败，请重试",
            posterShareFailed: "系统分享失败，请先保存海报再分享",
          }
        : {
            title: "Invite Center",
            subtitle: "Share one unified invite link. Friends can open the site directly and sign up.",
            loginRequiredTitle: "Sign in required",
            loginRequiredDesc: "Sign in to view your invite link, invited users, and membership rewards.",
            goLogin: "Back to Home",
            back: "Back",
            linkLabel: "Unified Invite Link",
            statClicks: "Clicks",
            statInvites: "Invites",
            statRewards: "Reward Membership Days",
            statRate: "Conversion",
            signupReward: "Signup Reward",
            firstUseReward: "First-use Reward",
            inviter: "Inviter",
            invited: "Invited",
            copied: "Copied",
            copy: "Copy",
            shareViaApps: "Share via Apps",
            showQr: "Share QR",
            hideQr: "Hide QR",
            momentsHint: "For Moments/social feed, QR poster sharing works best.",
            qrHint: "Scan to open your invite link directly.",
            qrAlt: "Invite QR Code",
            webOnlyHint: "Web mode supports copy link and QR sharing.",
            savePoster: "Save Poster",
            savingPoster: "Saving...",
            sharePoster: "Share Poster",
            sharingPoster: "Sharing...",
            posterSaved: "Poster saved",
            posterSaveFailed: "Save failed, please retry",
            posterShareFailed: "System share failed. Please save poster first.",
          },
    [isZh],
  )

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoadingData(true)
    setError("")

    try {
      const response = await fetch(`/api/invite/summary?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to load invite summary")
      }
      setSummary(result.summary || null)
    } catch (err: any) {
      setError(err?.message || "Load failed")
    } finally {
      setLoadingData(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setSummary(null)
      return
    }
    void refresh()
  }, [userId, refresh])

  useEffect(() => {
    setNativeShareAvailable(canNativeShare())
    setPosterShareAvailable(canSystemSharePoster())
  }, [])

  const shareText = isZh ? "我在 SiteHub 使用邀请系统，推荐你试试" : "I am using SiteHub invite system, check it out"

  const getShareLinkBySource = (source: ShareSource) => {
    if (!summary?.referralCode || typeof window === "undefined") return ""
    return buildReferralShareLink({
      origin: window.location.origin,
      referralCode: summary.referralCode,
      targetPath: "/",
      source,
    })
  }

  const getQrCodeImageUrl = () => {
    const shareUrl = getShareLinkBySource(QR_SOURCE)
    if (!shareUrl) return ""
    return `/api/tools/qr?size=280&ecc=M&data=${encodeURIComponent(shareUrl)}`
  }

  const posterTitle = isZh ? "SiteHub 邀请海报" : "SiteHub Invite Poster"
  const posterDescription = isZh
    ? "扫码注册并体验 SiteHub，邀请双方都能获得会员奖励天数。"
    : "Scan to join SiteHub. Both inviter and invited users can get membership-day rewards."
  const posterCtaText = isZh ? "扫码打开并开始使用" : "Scan to open and start using"

  const copyLink = async () => {
    const shareUrl = getShareLinkBySource(COPY_SOURCE)
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
      toast.success(isZh ? "链接已复制" : "Link copied")
    } catch {
      setCopied(false)
      toast.error(isZh ? "复制失败" : "Copy failed")
    }
  }

  const onNativeShare = async () => {
    const shareUrl = getShareLinkBySource(ANDROID_SHARE_SOURCE)
    if (!shareUrl) return

    try {
      nativeShareLink({ url: shareUrl, text: shareText })
      toast.success(isZh ? "已打开系统分享" : "System share opened")
    } catch {
      toast.error(isZh ? "当前环境暂不支持系统分享，请复制链接分享" : "Native share unavailable, please copy link")
    }
  }

  const onSavePoster = async () => {
    if (!summary?.referralCode) return

    const qrImageUrl = getQrCodeImageUrl()
    if (!qrImageUrl) return

    setSavingPoster(true)
    try {
      await downloadReferralPoster({
        qrImageUrl,
        title: posterTitle,
        description: posterDescription,
        ctaText: posterCtaText,
        language: isZh ? "zh" : "en",
        fileName: "SiteHub-invite-poster.png",
      })
      toast.success(ui.posterSaved)
    } catch {
      toast.error(ui.posterSaveFailed)
    } finally {
      setSavingPoster(false)
    }
  }

  const onSystemSharePoster = async () => {
    if (!summary?.referralCode) return

    const fallbackShareUrl = getShareLinkBySource(ANDROID_SHARE_SOURCE)
    if (!fallbackShareUrl) return

    setSharingPoster(true)
    try {
      const posterDataUrl = await buildReferralPosterDataUrl({
        qrImageUrl: getQrCodeImageUrl(),
        title: posterTitle,
        description: posterDescription,
        ctaText: posterCtaText,
        language: isZh ? "zh" : "en",
      })

      await systemSharePoster({
        posterDataUrl,
        fileName: "SiteHub-invite-poster.png",
        text: shareText,
        fallbackUrl: fallbackShareUrl,
        allowLinkFallback: false,
      })

      toast.success(isZh ? "已打开系统分享" : "System share opened")
    } catch {
      toast.error(ui.posterShareFailed)
    } finally {
      setSharingPoster(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-4">
        <Button variant="ghost" size="sm" className="h-8 px-1 gap-1" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          {ui.back}
        </Button>
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {isZh ? "正在加载..." : "Loading..."}
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-4">
        <Button variant="ghost" size="sm" className="h-8 px-1 gap-1" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          {ui.back}
        </Button>
        <div className="max-w-lg rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-semibold">{ui.loginRequiredTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{ui.loginRequiredDesc}</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            {ui.goLogin}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 space-y-6">
      <Button variant="ghost" size="sm" className="h-8 px-1 gap-1 w-fit" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        {ui.back}
      </Button>

      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{ui.title}</h1>
        <p className="text-sm text-muted-foreground">{ui.subtitle}</p>
      </section>

      {error ? <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">{ui.statClicks}</div>
          <div className="mt-1 text-2xl font-semibold">{summary?.clickCount ?? 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">{ui.statInvites}</div>
          <div className="mt-1 text-2xl font-semibold">{summary?.invitedCount ?? 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">{ui.statRewards}</div>
          <div className="mt-1 text-2xl font-semibold">{summary?.rewardMembershipDays ?? 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">{ui.statRate}</div>
          <div className="mt-1 text-2xl font-semibold">{summary?.conversionRate ?? 0}%</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{ui.linkLabel}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={getShareLinkBySource(COPY_SOURCE)} readOnly />
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => void copyLink()} disabled={!summary?.referralCode || loadingData}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? ui.copied : ui.copy}
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
            <p className="font-medium">{ui.signupReward}</p>
            <p className="text-muted-foreground">
              {ui.inviter} +{summary?.inviterSignupDays ?? 0} / {ui.invited} +{summary?.invitedSignupDays ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
            <p className="font-medium">{ui.firstUseReward}</p>
            <p className="text-muted-foreground">
              {ui.inviter} +{summary?.inviterFirstUseDays ?? 0} / {ui.invited} +{summary?.invitedFirstUseDays ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {nativeShareAvailable ? (
            <Button className="w-full" onClick={() => void onNativeShare()} disabled={!summary?.referralCode || loadingData}>
              <Send className="mr-2 h-4 w-4" />
              {ui.shareViaApps}
            </Button>
          ) : null}
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setShowQr((current) => !current)}
            disabled={!summary?.referralCode || loadingData}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {showQr ? ui.hideQr : ui.showQr}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{ui.momentsHint}</p>

        {showQr ? (
          <div className="space-y-3 pt-1">
            <ReferralPosterPreview
              qrImageUrl={getQrCodeImageUrl()}
              qrAlt={ui.qrAlt}
              title={posterTitle}
              description={posterDescription}
              ctaText={posterCtaText}
              loadingText={isZh ? "二维码生成中..." : "Generating QR..."}
              errorText={isZh ? "二维码加载失败，请重试" : "Failed to load QR"}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => void onSavePoster()}
                disabled={!summary?.referralCode || loadingData || savingPoster || sharingPoster}
              >
                <Download className="mr-2 h-4 w-4" />
                {savingPoster ? ui.savingPoster : ui.savePoster}
              </Button>
              {posterShareAvailable ? (
                <Button
                  className="w-full"
                  onClick={() => void onSystemSharePoster()}
                  disabled={!summary?.referralCode || loadingData || savingPoster || sharingPoster}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sharingPoster ? ui.sharingPoster : ui.sharePoster}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-left">{ui.qrHint}</p>
          </div>
        ) : null}

        {!nativeShareAvailable ? <p className="text-xs text-muted-foreground">{ui.webOnlyHint}</p> : null}
      </section>
    </div>
  )
}
