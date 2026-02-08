"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  User, 
  Palette, 
  Layout, 
  Bell, 
  Shield, 
  Download, 
  Upload,
  Save,
  Loader2,
  Check,
  X
} from "lucide-react"
import { useSettings } from "@/contexts/settings-context"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [localSettings, setLocalSettings] = useState(settings)

  // Load display name and sync local settings
  useEffect(() => {
    setDisplayName(user?.name || "")
    setLocalSettings(settings)
  }, [user, settings, open]) // Add open to dependencies to reset when modal opens

  const handleSave = async () => {
    setLoading(true)
    try {
      // Update settings in context
      updateSettings(localSettings)
      
      // Save display name
      if (user?.type === "authenticated") {
        // Update user name in localStorage
        const userKey = `sitehub-user-${user.email}`
        const userData = localStorage.getItem(userKey)
        if (userData) {
          const parsed = JSON.parse(userData)
          parsed.name = displayName
          localStorage.setItem(userKey, JSON.stringify(parsed))
        }
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      // Get user data
      const userSitesKey = user?.email ? `sitehub-sites-${user.email}` : "sitehub-sites"
      const userFavoritesKey = user?.email ? `sitehub-favorites-${user.email}` : "sitehub-favorites"
      
      const sites = localStorage.getItem(userSitesKey) || "[]"
      const favorites = localStorage.getItem(userFavoritesKey) || "[]"
      
      const exportData = {
        user: user,
        settings: localSettings,
        sites: JSON.parse(sites),
        favorites: JSON.parse(favorites),
        exportDate: new Date().toISOString()
      }
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sitehub-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error("Failed to export data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      // Create file input
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target?.result as string)
              
              // Import settings
              if (data.settings) {
                updateSettings(data.settings)
              }
              
              // Import sites and favorites
              if (data.sites && user?.email) {
                localStorage.setItem(`sitehub-sites-${user.email}`, JSON.stringify(data.sites))
              }
              if (data.favorites && user?.email) {
                localStorage.setItem(`sitehub-favorites-${user.email}`, JSON.stringify(data.favorites))
              }
              
              console.log("Data imported successfully")
            } catch (error) {
              console.error("Failed to parse import file:", error)
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
      
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error("Failed to import data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xl transition-colors">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Customize your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Profile
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs text-slate-500 dark:text-slate-400">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-8 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-slate-500 dark:text-slate-400">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white opacity-60 h-8"
                />
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Appearance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="theme" className="text-xs text-slate-500 dark:text-slate-400">Theme</Label>
                <Select value={localSettings.theme} onValueChange={(value) => setLocalSettings({...localSettings, theme: value as "dark" | "light" | "auto"})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="layout" className="text-xs text-slate-500 dark:text-slate-400">Layout</Label>
                <Select value={localSettings.layout} onValueChange={(value) => setLocalSettings({...localSettings, layout: value as "grid" | "list" | "compact"})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
              <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Preferences
            </h3>
            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-slate-700 dark:text-slate-300">Show favorites first</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prioritize favorites</p>
                  </div>
                  <Switch
                    checked={localSettings.showFavoritesFirst}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, showFavoritesFirst: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-slate-700 dark:text-slate-300">Auto-sync</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sync across devices</p>
                  </div>
                  <Switch
                    checked={localSettings.autoSync}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, autoSync: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-slate-700 dark:text-slate-300">Notifications</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable notifications</p>
                  </div>
                  <Switch
                    checked={localSettings.notifications}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, notifications: checked})}
                  />
                </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Data
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={loading}
                className="bg-slate-50 dark:bg-transparent border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 h-8"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={loading}
                className="bg-slate-50 dark:bg-transparent border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 h-8"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-1" />
                )}
                Import
              </Button>
            </div>
          </div>

          {/* Account Status */}
          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-slate-900 dark:text-white">Account</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                <Badge variant={user?.pro ? "default" : "secondary"} className="text-xs">
                  {user?.pro ? "Pro" : "Free"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Custom Sites:</span>
                <span className="text-slate-900 dark:text-white">{user?.customCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 h-8"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 h-8 text-white shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : saved ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <Save className="w-3 h-3 mr-1" />
              )}
              {loading ? "Saving..." : saved ? "Saved!" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 