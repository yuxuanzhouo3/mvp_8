"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface DownloadButtonsProps {
  compact?: boolean
}

export function DownloadButtons({ compact = false }: DownloadButtonsProps = {}) {
  const { language } = useLanguage()
  const downloadText = language === "zh" ? "下载客户端" : "Download"

  return (
    <Link href="/download">
      <Button
        variant="ghost"
        size={compact ? "sm" : "lg"}
        className={`text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 ${compact ? "sm:px-3" : ""}`}
      >
        <Download className="w-4 h-4" />
        {!compact && <span className="ml-2 hidden sm:inline">{downloadText}</span>}
      </Button>
    </Link>
  )
}
