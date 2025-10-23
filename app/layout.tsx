import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { GeoProvider } from "@/contexts/geo-context"
import { LanguageProvider } from "@/contexts/language-context"

// 全局错误捕获组件
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false)
  const [errorInfo, setErrorInfo] = React.useState<any>(null)

  React.useEffect(() => {
    // 全局错误捕获
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 [Global Error]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
      setHasError(true)
      setErrorInfo({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 [Unhandled Promise Rejection]', {
        reason: event.reason,
        promise: event.promise,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }
  }, [])

  if (hasError) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-bold mb-4">🚨 Application Error</h2>
        <div className="text-red-700 text-sm">
          <p><strong>Message:</strong> {errorInfo?.message}</p>
          <p><strong>File:</strong> {errorInfo?.filename}:{errorInfo?.lineno}</p>
          <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
            {errorInfo?.stack}
          </pre>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

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
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <GeoProvider>
                <LanguageProvider>
                  {children}
                </LanguageProvider>
              </GeoProvider>
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
