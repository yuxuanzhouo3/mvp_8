import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { GeoProvider } from "@/contexts/geo-context"
import { LanguageProvider } from "@/contexts/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SiteHub - Your Personal Web Dashboard",
  description: "Access 300+ top websites instantly. Chrome-like new tab page with customization.",
  generator: 'v0.dev',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SiteHub'
  },
  formatDetection: {
    telephone: false,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <GeoProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </GeoProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
