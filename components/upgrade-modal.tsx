"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Crown, Chrome, Mail, Clock, Zap, Heart, Shield } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onAuth: (provider: string) => void
  isTimeExpired: boolean
}

export function UpgradeModal({ isOpen, onClose, onAuth, isTimeExpired }: UpgradeModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const features = [
    { icon: Zap, text: "Unlimited drag & drop reordering", premium: false },
    { icon: Heart, text: "Save unlimited custom sites", premium: true },
    { icon: Shield, text: "Cloud sync across devices", premium: true },
    { icon: Crown, text: "Premium themes & layouts", premium: true },
  ]

  const handleEmailSignup = () => {
    if (!email || !password) {
      alert("Please fill in both email and password")
      return
    }
    onAuth("email")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-4xl">💾</div>
            <DialogTitle className="text-xl">{isTimeExpired ? "Save Your Data!" : "Unlock Full Access"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {isTimeExpired
                ? "Your session expired! Sign up now to save your favorites & custom sites permanently"
                : "Get unlimited access to all features with a free account"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center">What you'll get:</h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className="w-4 h-4 text-blue-400" />
                <span className="text-sm">{feature.text}</span>
                {feature.premium && (
                  <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Quick Sign Up */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="bg-white text-black hover:bg-gray-100"
                onClick={() => onAuth("google")}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Or with email</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-slate-700 border-slate-600" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-slate-700 border-slate-600" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmailSignup}>
              <Mail className="w-4 h-4 mr-2" />
              Create Free Account
            </Button>

            <div className="text-center text-xs text-slate-400">
              Already have an account?{" "}
              <button className="text-blue-400 hover:underline" onClick={() => onAuth("login")}>
                Sign in
              </button>
            </div>
          </div>

          {/* Data Loss Warning */}
          {isTimeExpired && (
            <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-red-200">
                <Clock className="w-4 h-4" />
                <span>Your favorites & custom sites will be lost! Sign up to save them!</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
