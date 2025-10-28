import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { GeoProvider } from "@/contexts/geo-context"
import { LanguageProvider } from "@/contexts/language-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { LinkInterceptor } from "@/components/link-interceptor"

// Force dynamic rendering to prevent hydration issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      <head>
        <meta charSet="UTF-8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[SW] Registered:', reg.scope))
                    .catch(err => console.log('[SW] Registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <GeoProvider>
              <LanguageProvider>
                <LinkInterceptor />
                {children}
              </LanguageProvider>
            </GeoProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
