"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SidebarProvider } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const handleGuestTimeExpired = () => {
    // No-op for dashboard pages
  }
  
  const handleUpgradeClick = () => {
    // No-op for dashboard pages
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header 
            onGuestTimeExpired={handleGuestTimeExpired} 
            onUpgradeClick={handleUpgradeClick} 
          />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
