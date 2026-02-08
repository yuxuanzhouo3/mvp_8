"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useTheme } from "next-themes"

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
  const { setTheme } = useTheme()

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("sitehub-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
        
        // Apply theme immediately if possible to reduce flicker
        if (parsed.theme) {
          setTheme(parsed.theme)
        }
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    }
    setIsLoaded(true)
  }, [setTheme])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("sitehub-settings", JSON.stringify(settings))
        
        // Sync with next-themes
        setTheme(settings.theme)
      } catch (error) {
        console.error("Error saving settings:", error)
      }
    }
  }, [settings, isLoaded, setTheme])

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