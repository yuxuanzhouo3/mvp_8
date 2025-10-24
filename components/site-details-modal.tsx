"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, Star, Shield, Eye, EyeOff, Chrome } from "lucide-react"

interface Site {
  id: string
  name: string
  url: string
  logo: string
  category: string
  rating: number
  supportsLogin: boolean
  description: string
  bgColor: string
}

interface SiteDetailsModalProps {
  site: Site | null
  isOpen: boolean
  onClose: () => void
}

export function SiteDetailsModal({ site, isOpen, onClose }: SiteDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState({ email: "", password: "" })

  const handleVisit = () => {
    if (site) {
      window.open(site.url, "_blank")
    }
  }

  const handleSaveCredentials = () => {
    // TODO: Implement credential saving
    if (site) {
      console.log("Saving credentials for", site.name, credentials)
    }
  }

  // Always return the same structure, handle null site gracefully
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${!site ? "hidden" : ""}`}>
        <DialogHeader>
          <div className="text-center space-y-4">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl ${site?.bgColor || "bg-gray-200"} shadow-xl`}
            >
              {site?.logo || "🌐"}
            </div>
            <DialogTitle className="text-2xl">{site?.name || "Unknown"}</DialogTitle>
            <DialogDescription className="text-base">{site?.description || ""}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Site Info */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{site?.rating || 0}</span>
            </div>
            <Badge variant="outline">{site?.category || "Unknown"}</Badge>
            {site?.supportsLogin && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Login Enabled
              </Badge>
            )}
          </div>

          {/* Primary Action */}
          <Button
            onClick={handleVisit}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg py-3"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Instant Visit
          </Button>

          {/* Login Section */}
          {site?.supportsLogin && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900">Save Login Credentials</h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">Email or Username</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleSaveCredentials}
                  disabled={!credentials.email || !credentials.password}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Save & Login
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Chrome className="w-4 h-4 mr-2" />
                  Sign in with Google
                </Button>
              </div>
            </div>
          )}

          {/* User Reviews */}
          <div className="text-center text-sm text-gray-500">
            <p>⭐ Trusted by 50,000+ users</p>
            <p className="mt-1">"Fast and reliable access" - Sarah M.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
