/**
 * 标准 Modal/Dialog 组件模板
 * 
 * 重点关注：
 * - isMountedRef 保护异步操作
 * - onClose 是稳定引用
 * - 动画期间不更新状态
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (data: any) => Promise<boolean>
}

export function ModalTemplate({ isOpen, onClose, onSave }: ModalProps) {
  // ==========================================
  // 1. 状态
  // ==========================================
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({})

  // ==========================================
  // 2. Refs
  // ==========================================
  const isMountedRef = useRef(true)

  // ==========================================
  // 3. useEffect - 挂载管理
  // ==========================================
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ==========================================
  // 4. useEffect - 重置表单
  // ==========================================
  useEffect(() => {
    if (!isOpen) {
      // ✅ 重置状态
      if (isMountedRef.current) {
        setFormData({})
        setError(null)
        setIsLoading(false)
      }
    }
  }, [isOpen])

  // ==========================================
  // 5. useCallback - 表单处理
  // ==========================================
  const handleSubmit = useCallback(async () => {
    if (!isMountedRef.current) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const success = await onSave?.(formData)
      
      // ✅ 检查挂载状态
      if (isMountedRef.current) {
        setIsLoading(false)
        if (success) {
          onClose()
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
        setIsLoading(false)
      }
    }
  }, [formData, onSave, onClose])

  const handleClose = useCallback(() => {
    if (!isMountedRef.current) return
    onClose()
  }, [onClose])

  // ==========================================
  // 6. 渲染
  // ==========================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500">{error}</div>
        )}
        
        <form onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}>
          {/* 表单内容 */}
          
          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

