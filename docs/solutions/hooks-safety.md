# React Hooks 安全使用手册

## 🛡️ 防止 React Error #185 的完整规范

---

## 📋 核心原则

### 1. 所有回调函数都用 useCallback 包装

```tsx
// ❌ 错误
const handleClick = () => setState(true)

// ✅ 正确
const handleClick = useCallback(() => setState(true), [])
```

**规则**：任何作为 props 传递给子组件的函数，都必须用 useCallback 包装。

---

### 2. 所有对象/数组 props 都用 useMemo 包装

```tsx
// ❌ 错误
<Component items={[1, 2, 3]} />

// ✅ 正确
const items = useMemo(() => [1, 2, 3], [])
<Component items={items} />
```

**规则**：任何作为 props 传递的对象或数组，都必须用 useMemo 包装或来自稳定的引用。

---

### 3. useEffect 依赖数组稳定性

```tsx
// ❌ 错误
useEffect(() => {
  // ...
}, [sites])  // sites 每次都是新数组

// ✅ 正确 - 只依赖长度
useEffect(() => {
  // ...
}, [sites.length])

// ✅ 正确 - 只依赖 ID
useEffect(() => {
  // ...
}, [sites.map(s => s.id).join(',')])
```

**规则**：避免在依赖数组中使用不稳定的引用（Set、Map、数组、对象）。

---

### 4. 异步操作后检查组件挂载状态

```tsx
// ✅ 标准模式
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
  }
}, [])

// 在异步操作后
const result = await someAsyncOperation()
if (isMountedRef.current) {
  setState(result)
}
```

**规则**：所有异步操作（setTimeout、fetch、async/await）完成后都必须检查组件是否仍挂载。

---

### 5. 函数定义顺序

```tsx
// ❌ 错误 - TDZ
const handleClick = useCallback(() => {
  showToast("hello")  // showToast 还未定义
}, [showToast])

const showToast = useCallback(() => {}, [])

// ✅ 正确 - 先定义基础函数
const showToast = useCallback(() => {}, [])

const handleClick = useCallback(() => {
  showToast("hello")  // showToast 已定义
}, [showToast])
```

**规则**：被依赖的函数必须先定义。

---

## 🔍 代码审查清单

在提交代码前，请检查以下项目：

### 组件文件检查

- [ ] 所有传递给子组件的函数都用 `useCallback` 包装
- [ ] 所有传递给子组件的对象/数组都用 `useMemo` 包装
- [ ] 所有异步操作后都检查 `isMountedRef.current`
- [ ] 所有 setTimeout/setInterval 都有清理函数
- [ ] 所有 useEffect 的依赖数组都不包含不稳定的引用
- [ ] 函数定义顺序正确（被依赖的先定义）

### Context 文件检查

- [ ] Context 中的监听器都有清理函数
- [ ] Context 中的 setState 都有值比较
- [ ] Context 中的异步操作都检查挂载状态

### Modal/Dialog 组件检查

- [ ] Modal 的 onClose 回调是稳定的引用
- [ ] Modal 内部的所有异步操作都检查挂载状态
- [ ] Modal 的动画期间不会有状态更新

---

## 📝 代码模板

### 标准组件模板

```tsx
export function MyComponent({ onAction, data }: Props) {
  // 1. 状态
  const [state, setState] = useState(initialState)
  
  // 2. Refs
  const isMountedRef = useRef(true)
  
  // 3. useEffect - 清理
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  // 4. 内部辅助函数（用 useCallback）
  const handleClick = useCallback(() => {
    if (!isMountedRef.current) return
    setState(newValue)
  }, [])
  
  // 5. 异步操作
  const fetchData = useCallback(async () => {
    const result = await api.getData()
    if (isMountedRef.current) {
      setState(result)
    }
  }, [])
  
  // 6. 渲染
  return <div onClick={handleClick}>...</div>
}
```

### 模态框组件模板

```tsx
export function MyModal({ isOpen, onClose, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  const handleSave = useCallback(async () => {
    setIsLoading(true)
    const success = await onSave(data)
    
    // ✅ 检查挂载状态
    if (isMountedRef.current) {
      setIsLoading(false)
      if (success) {
        onClose()
      }
    }
  }, [onSave, onClose, data])
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* ... */}
    </Dialog>
  )
}
```

### 自定义 Hook 模板

```tsx
export function useCustomHook() {
  const [state, setState] = useState()
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  // 所有状态更新都用函数式更新 + 值比较
  const updateState = useCallback((newValue) => {
    setState(prev => {
      if (prev === newValue) return prev
      return newValue
    })
  }, [])
  
  return { state, updateState }
}
```

---

## ⚠️ 常见陷阱

### 陷阱 1：在 JSX 中直接创建函数

```tsx
// ❌ 每次渲染都创建新函数
<Button onClick={() => handleClick()} />

// ✅ 使用稳定的引用
<Button onClick={handleClick} />
```

### 陷阱 2：依赖数组包含整个对象

```tsx
// ❌ 对象每次都是新引用
useEffect(() => {
  // ...
}, [user])  // user 对象每次不同

// ✅ 只依赖需要的属性
useEffect(() => {
  // ...
}, [user.id, user.name])
```

### 陷阱 3：忘记清理异步操作

```tsx
// ❌ 没有清理
useEffect(() => {
  const timer = setTimeout(() => {
    setState(value)
  }, 1000)
}, [])

// ✅ 有清理
useEffect(() => {
  const timer = setTimeout(() => {
    if (isMountedRef.current) {
      setState(value)
    }
  }, 1000)
  
  return () => clearTimeout(timer)
}, [])
```

### 陷阱 4：在条件中使用 Hooks

```tsx
// ❌ 错误 - 条件 Hook
if (condition) {
  const [state, setState] = useState()  // ❌
}

// ✅ 正确 - Hook 始终在最顶层
const [state, setState] = useState()
if (condition) {
  return <OtherComponent />
}
```

---

## 🎯 ESLint 规则配置

在 `.eslintrc.json` 中添加：

```json
{
  "extends": "next/core-web-vitals",
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

这些规则会：
- ✅ 自动检测 Hook 调用顺序问题
- ✅ 警告不稳定的依赖数组
- ✅ 防止在条件中使用 Hooks

---

## 🔧 开发工具

### 安装 ESLint

```bash
pnpm add -D eslint eslint-plugin-react-hooks
```

### 运行检查

```bash
# 检查所有文件
pnpm lint

# 自动修复
pnpm lint --fix
```

---

## 📚 参考资源

- [React Hooks 官方文档](https://react.dev/reference/react)
- [useCallback 文档](https://react.dev/reference/react/useCallback)
- [useMemo 文档](https://react.dev/reference/react/useMemo)
- [React Error #185](https://react.dev/errors/185)
- [ESLint React Hooks 插件](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

## ✅ 总结

### 记住这 5 个黄金规则：

1. ✅ **所有回调都用 useCallback**
2. ✅ **所有对象/数组 props 都用 useMemo**
3. ✅ **异步操作检查 isMountedRef**
4. ✅ **useEffect 依赖稳定**
5. ✅ **函数定义顺序正确**

遵循这些规则，就不会再遇到 React Error #185！

