'use client'
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  errorInfo: any
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorInfo: error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [React Error Boundary]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      // 在生产环境中只记录错误，不显示错误UI
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-red-800 font-bold mb-4">🚨 Application Error</h2>
            <div className="text-red-700 text-sm">
              <p><strong>Message:</strong> {this.state.errorInfo?.message}</p>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                {this.state.errorInfo?.stack}
              </pre>
            </div>
          </div>
        )
      } else {
        // 生产环境：显示友好的错误页面
        return (
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're working to fix this issue.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        )
      }
    }

    return this.props.children
  }
}

// 全局错误捕获Hook
export function useGlobalErrorHandler() {
  React.useEffect(() => {
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
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 [Unhandled Promise Rejection]', {
        reason: event.reason,
        promise: event.promise,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}
