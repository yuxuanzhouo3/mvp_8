"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Download, Smartphone, Monitor, ChevronDown } from "lucide-react"
import { useGeo } from "@/contexts/geo-context"

interface DownloadLink {
  name: string
  url: string
  icon: React.ReactNode
  description: string
}

interface DownloadButtonsProps {
  compact?: boolean // 是否为紧凑模式（只显示图标）
}

export function DownloadButtons({ compact = false }: DownloadButtonsProps = {}) {
  const { isChina } = useGeo()
  const [isOpen, setIsOpen] = useState(false)

  // 从环境变量获取下载链接，如果没有设置则使用默认值
  const getDownloadUrl = (envVar: string, defaultUrl: string) => {
    return process.env[envVar] || defaultUrl
  }

  // 国内版本下载链接配置
  const chinaDownloads: DownloadLink[] = [
    {
      name: "Android 应用",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_ANDROID_CN', 'https://mornhub.help/downloads/sitehub-android.apk'),
      icon: <Smartphone className="w-4 h-4" />,
      description: "适用于 Android 设备的 APK 安装包"
    },
    {
      name: "iOS 应用",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_IOS_CN', 'https://apps.apple.com/cn/app/sitehub/id1234567890'),
      icon: <Smartphone className="w-4 h-4" />,
      description: "App Store 下载（中国区）"
    },
    {
      name: "Windows 客户端",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_WINDOWS_CN', 'https://mornhub.help/downloads/sitehub-windows-x64.msi'),
      icon: <Monitor className="w-4 h-4" />,
      description: "适用于 Windows 系统的 MSI 安装包"
    },
    {
      name: "macOS 客户端 (Intel)",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_MACOS_X64_CN', 'https://mornhub.help/downloads/sitehub-macos-x64.dmg'),
      icon: <Monitor className="w-4 h-4" />,
      description: "适用于 Intel 芯片 Mac 的 DMG 安装包"
    },
    {
      name: "macOS 客户端 (M 芯片)",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_MACOS_ARM64_CN', 'https://mornhub.help/downloads/sitehub-macos-arm64.dmg'),
      icon: <Monitor className="w-4 h-4" />,
      description: "适用于 Apple Silicon M 芯片 Mac 的 DMG 安装包"
    }
  ]

  // 国外版本下载链接配置
  const overseasDownloads: DownloadLink[] = [
    {
      name: "Android App",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_ANDROID_OVERSEAS', 'https://mornhub.help/downloads/sitehub-android.apk'),
      icon: <Smartphone className="w-4 h-4" />,
      description: "APK installer for Android devices"
    },
    {
      name: "iOS App",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_IOS_OVERSEAS', 'https://apps.apple.com/us/app/sitehub/id1234567890'),
      icon: <Smartphone className="w-4 h-4" />,
      description: "Download from App Store (US)"
    },
    {
      name: "Windows Client",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_WINDOWS_OVERSEAS', 'https://mornhub.help/downloads/sitehub-windows-x64.msi'),
      icon: <Monitor className="w-4 h-4" />,
      description: "MSI installer for Windows systems"
    },
    {
      name: "macOS Client (Intel)",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_MACOS_X64_OVERSEAS', 'https://mornhub.help/downloads/sitehub-macos-x64.dmg'),
      icon: <Monitor className="w-4 h-4" />,
      description: "DMG installer for Intel Mac"
    },
    {
      name: "macOS Client (M Chip)",
      url: getDownloadUrl('NEXT_PUBLIC_DOWNLOAD_MACOS_ARM64_OVERSEAS', 'https://mornhub.help/downloads/sitehub-macos-arm64.dmg'),
      icon: <Monitor className="w-4 h-4" />,
      description: "DMG installer for Apple Silicon Mac"
    }
  ]

  const downloads = isChina ? chinaDownloads : overseasDownloads
  const downloadText = isChina ? "下载客户端" : "Download Client"

  const handleDownload = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "sm" : "lg"}
          className={`text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 ${compact ? 'sm:px-3' : ''}`}
        >
          <Download className="w-4 h-4" />
          {!compact && (
            <>
              <span className="ml-2 hidden sm:inline">{downloadText}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-white/95 dark:bg-black/95 border-slate-200 dark:border-white/20 backdrop-blur-sm shadow-xl"
      >
        <DropdownMenuLabel className="text-slate-900 dark:text-white">
          {isChina ? "选择下载版本" : "Choose Download Version"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/20" />

        {downloads.map((download, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleDownload(download.url)}
            className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer py-3 px-4"
          >
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                {download.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{download.name}</div>
                <div className="text-sm text-slate-500 dark:text-white/60 mt-1">
                  {download.description}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
