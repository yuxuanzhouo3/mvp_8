/**
 * 标准 Context 组件模板
 * 
 * 重点关注：
 * - 监听器清理
 * - setState 值比较
 * - 异步操作检查挂载状态
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

// ==========================================
// 1. 定义 Context 类型
// ==========================================
interface ContextType {
  value: any
  loading: boolean
  error: string | null
  updateValue: (newValue: any) => void
}

// ==========================================
// 2. 创建 Context
// ==========================================
const MyContext = createContext<ContextType | undefined>(undefined)

// ==========================================
// 3. Provider 组件
// ==========================================
export function MyContextProvider({ children }: { children: React.ReactNode }) {
  // 状态
  const [value, setValue] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)

  // ==========================================
  // 4. useEffect - 挂载管理
  // ==========================================
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ==========================================
  // 5. useEffect - 监听器（带清理）
  // ==========================================
  useEffect(() => {
    // 订阅或监听
    const subscription = someService.subscribe((data) => {
      // ✅ 检查挂载状态
      if (isMountedRef.current) {
        // ✅ 值比较
        setValue(prev => {
          if (prev === data) return prev
          return data
        })
      }
    })

    // ✅ 清理函数
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ==========================================
  // 6. useCallback - 更新函数
  // ==========================================
  const updateValue = useCallback((newValue: any) => {
    if (!isMountedRef.current) return
    
    // ✅ 值比较
    setValue(prev => {
      if (prev === newValue) return prev
      return newValue
    })
  }, [])

  // ==========================================
  // 7. 异步操作
  // ==========================================
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.getData()
      
      // ✅ 检查挂载状态
      if (isMountedRef.current) {
        setValue(result)
        setLoading(false)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
        setLoading(false)
      }
    }
  }, [])

  // ==========================================
  // 8. Context 值
  // ==========================================
  const contextValue = {
    value,
    loading,
    error,
    updateValue,
  }

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  )
}

// ==========================================
// 9. Hook - 使用 Context
// ==========================================
export function useMyContext() {
  const context = useContext(MyContext)
  
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyContextProvider')
  }
  
  return context
}

