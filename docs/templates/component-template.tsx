/**
 * 标准 React 组件模板
 * 
 * 使用方法：
 * 1. 复制此文件到你的组件目录
 * 2. 替换 ComponentName 为你的组件名
 * 3. 替换 Props 接口
 * 4. 实现你的业务逻辑
 * 
 * 核心原则：
 * - 所有 Hook 在顶层无条件调用
 * - 所有回调用 useCallback
 * - 所有异步操作检查 isMountedRef
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// Props 接口定义
interface ComponentNameProps {
  // 添加你的 props
  onAction?: () => void
}

/**
 * 组件描述
 */
export function ComponentName({ onAction }: ComponentNameProps) {
  // ==========================================
  // 1. 状态定义
  // ==========================================
  const [state, setState] = useState<Type>(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ==========================================
  // 2. Refs 定义
  // ==========================================
  const isMountedRef = useRef(true)

  // ==========================================
  // 3. useEffect - 挂载/卸载管理
  // ==========================================
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ==========================================
  // 4. useEffect - 数据获取
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await api.getData()
        
        // ✅ 检查挂载状态
        if (isMountedRef.current) {
          setState(result)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, []) // 依赖数组

  // ==========================================
  // 5. useCallback - 事件处理函数
  // ==========================================
  const handleClick = useCallback(() => {
    // ✅ 检查挂载状态
    if (!isMountedRef.current) return
    
    // ✅ 值比较
    setState(prev => {
      const newValue = calculateNewValue(prev)
      if (prev === newValue) return prev
      return newValue
    })
  }, []) // 依赖数组

  const handleSubmit = useCallback(async () => {
    if (!isMountedRef.current) return
    
    setLoading(true)
    try {
      const result = await api.submit()
      if (isMountedRef.current) {
        setState(result)
        onAction?.()
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [onAction])

  // ==========================================
  // 6. useMemo - 计算值
  // ==========================================
  const computedValue = useMemo(() => {
    return computeSomething(state)
  }, [state])

  // ==========================================
  // 7. 渲染
  // ==========================================
  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="component-name">
      <button onClick={handleClick}>Click me</button>
      <p>{computedValue}</p>
    </div>
  )
}

