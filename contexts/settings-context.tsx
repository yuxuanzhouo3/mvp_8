"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface Settings {
  theme: "dark" | "light" | "auto"
  layout: "grid" | "list" | "compact"
  showFavoritesFirst: boolean
  autoSync: boolean
  notifications: boolean
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  theme: "dark",
  layout: "grid",
  showFavoritesFirst: true,
  autoSync: true,
  notifications: true
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("sitehub-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("sitehub-settings", JSON.stringify(settings))
        
        // Apply theme
        if (settings.theme === "dark" || (settings.theme === "auto" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } catch (error) {
        console.error("Error saving settings:", error)
      }
    }
  }, [settings, isLoaded])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const value = {
    settings,
    updateSettings,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 