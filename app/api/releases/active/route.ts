import { NextRequest, NextResponse } from "next/server"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { listDownloadPackages } from "@/lib/downloads/repository"
import { PackageRegion } from "@/lib/downloads/types"

export const runtime = "nodejs"

type PlatformType = "android" | "ios" | "windows" | "macos" | "linux"

type ActiveRelease = {
  platform: PlatformType
  version: string
  cloudbase_file_id?: string | null
  download_filename?: string | null
  file_url?: string | null
  file_size?: number | null
}

const PLATFORM_ORDER: PlatformType[] = ["android", "ios", "windows", "macos", "linux"]

function normalizePlatform(value?: string | null): PlatformType | null {
  const platform = String(value || "").toLowerCase().trim()
  if (!platform) return null
  if (platform === "android" || platform.startsWith("android-")) return "android"
  if (platform === "ios" || platform.startsWith("ios-")) return "ios"
  if (platform === "windows" || platform.startsWith("windows-")) return "windows"
  if (platform === "macos" || platform.startsWith("macos-")) return "macos"
  if (platform === "linux" || platform.startsWith("linux-")) return "linux"
  return null
}

function normalizeRegion(value?: string | null): PackageRegion {
  const normalized = String(value || "").toUpperCase()
  if (normalized === "INTL") return "INTL"
  if (normalized === "CN") return "CN"
  return resolveDeploymentRegion()
}

export async function GET(request: NextRequest) {
  try {
    const region = normalizeRegion(request.nextUrl.searchParams.get("region"))
    const packages = await listDownloadPackages({ region, onlyActive: true })

    const releaseMap = new Map<PlatformType, ActiveRelease>()

    for (const pkg of packages) {
      const platform = normalizePlatform(pkg.platform)
      if (!platform) continue
      if (releaseMap.has(platform)) continue

      releaseMap.set(platform, {
        platform,
        version: String(pkg.version || "0.0.0"),
        cloudbase_file_id: pkg.region === "CN" ? pkg.storagePath : null,
        download_filename: pkg.fileName || null,
        file_url: pkg.region === "INTL" ? pkg.storagePath : null,
        file_size: Number.isFinite(pkg.fileSize) ? Number(pkg.fileSize) : null,
      })
    }

    const releases = PLATFORM_ORDER.map((platform) => releaseMap.get(platform)).filter(Boolean)
    return NextResponse.json({ success: true, releases })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "获取版本信息失败" },
      { status: 500 }
    )
  }
}
