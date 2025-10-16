"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useGeo } from "@/contexts/geo-context"
import { wxStorage } from "@/lib/adapters/wechat-web"

export type SupportedLanguage = "zh" | "en"

interface LanguageContextValue {
  language: SupportedLanguage
  isAuto: boolean
  setLanguage: (lang: SupportedLanguage | "auto") => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { languageCode: geoLanguageCode } = useGeo()
  const [language, setLanguageState] = useState<SupportedLanguage>("en")
  const [isAuto, setIsAuto] = useState<boolean>(true)

  const effectiveGeoLanguage: SupportedLanguage = geoLanguageCode === "zh" ? "zh" : "en"

  useEffect(() => {
    const stored = wxStorage.get<string>("sitehub_language")
    if (stored === "zh" || stored === "en") {
      setLanguageState(stored)
      setIsAuto(false)
    } else {
      setLanguageState(effectiveGeoLanguage)
      setIsAuto(true)
    }
  }, [effectiveGeoLanguage])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language === "zh" ? "zh-CN" : "en-US"
    }
  }, [language])

  const updateLanguage = (lang: SupportedLanguage | "auto") => {
    if (lang === "auto") {
      wxStorage.remove("sitehub_language")
      setLanguageState(effectiveGeoLanguage)
      setIsAuto(true)
      window.dispatchEvent(new CustomEvent("sitehub-language-change", { detail: { language: effectiveGeoLanguage, mode: "auto" } }))
      return
    }

    wxStorage.set("sitehub_language", lang)
    setLanguageState(lang)
    setIsAuto(false)
    window.dispatchEvent(new CustomEvent("sitehub-language-change", { detail: { language: lang, mode: "manual" } }))
  }

  const toggleLanguage = () => {
    updateLanguage(language === "zh" ? "en" : "zh")
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isAuto,
      setLanguage: updateLanguage,
      toggleLanguage
    }),
    [language, isAuto]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
