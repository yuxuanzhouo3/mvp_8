import { NextRequest, NextResponse } from "next/server"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { listDownloadPackages } from "@/lib/downloads/repository"
import { PackageRegion } from "@/lib/downloads/types"

export const runtime = "nodejs"

const SUPPORTED_PLATFORMS = new Set(["android", "ios", "windows", "macos", "linux"])

function normalizeRegion(value?: string | null): PackageRegion {
  const normalized = String(value || "").toUpperCase()
  if (normalized === "INTL") return "INTL"
  if (normalized === "CN") return "CN"
  return resolveDeploymentRegion()
}

function normalizePlatform(value?: string | null): string {
  return String(value || "").toLowerCase().trim()
}

function normalizePackagePlatform(value?: string | null): string {
  const platform = normalizePlatform(value)
  if (platform === "android" || platform.startsWith("android-")) return "android"
  if (platform === "ios" || platform.startsWith("ios-")) return "ios"
  if (platform === "windows" || platform.startsWith("windows-")) return "windows"
  if (platform === "macos" || platform.startsWith("macos-")) return "macos"
  if (platform === "linux" || platform.startsWith("linux-")) return "linux"
  return platform
}

export async function GET(request: NextRequest) {
  try {
    const platform = normalizePlatform(request.nextUrl.searchParams.get("platform"))
    const region = normalizeRegion(request.nextUrl.searchParams.get("region"))
    const arch = String(request.nextUrl.searchParams.get("arch") || "").toLowerCase()

    if (!platform) {
      return NextResponse.json({ error: "缺少 platform 参数" }, { status: 400 })
    }

    if (!SUPPORTED_PLATFORMS.has(platform)) {
      return NextResponse.json({ error: "不支持的 platform 参数" }, { status: 400 })
    }

    const packages = await listDownloadPackages({ region, onlyActive: true })
    const platformPackages = packages.filter(
      (pkg) => normalizePackagePlatform(pkg.platform) === platform
    )

    if (!platformPackages.length) {
      return NextResponse.json({ error: `未找到 ${platform} 的可下载包` }, { status: 404 })
    }

    const preferred = arch === "apple-silicon" || arch === "intel"
      ? platformPackages.find((pkg) =>
          String(pkg.title || "").toLowerCase().includes(arch)
        ) || platformPackages[0]
      : platformPackages[0]

    const redirectUrl = new URL(
      `/api/downloads/file/${encodeURIComponent(preferred.id)}`,
      request.url
    )
    redirectUrl.searchParams.set("region", region)

    const userId = request.nextUrl.searchParams.get("userId")
    const userEmail = request.nextUrl.searchParams.get("userEmail")
    if (userId) redirectUrl.searchParams.set("userId", userId)
    if (userEmail) redirectUrl.searchParams.set("userEmail", userEmail)

    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "下载请求失败，请稍后重试" },
      { status: 500 }
    )
  }
}
