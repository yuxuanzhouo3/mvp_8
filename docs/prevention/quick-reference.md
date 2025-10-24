# React Hooks 安全快速参考卡 🚀

## ⚡ 5 秒检查清单

提交代码前，快速检查：

```
□ 所有传递为 props 的函数都用 useCallback
□ 所有传递为 props 的对象/数组都用 useMemo  
□ 所有异步操作后都检查 isMountedRef
□ 所有 useEffect 依赖都不包含不稳定引用
□ 函数定义顺序正确（被依赖的先定义）
```

---

## 📝 常用代码片段

### 回调函数模板

```tsx
const handleClick = useCallback(() => {
  // ...
}, [])  // 如果不用外部变量，依赖数组为空
```

### 异步操作模板

```tsx
const fetchData = useCallback(async () => {
  const result = await api.getData()
  if (isMountedRef.current) {
    setState(result)
  }
}, [])
```

### Ref 初始化模板

```tsx
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
  }
}, [])
```

---

## ⚠️ 常见错误

```tsx
// ❌ 错误：内联函数
<Button onClick={() => handleClick()} />

// ✅ 正确：稳定引用
<Button onClick={handleClick} />
```

```tsx
// ❌ 错误：依赖整个数组
useEffect(() => {}, [sites])

// ✅ 正确：只依赖长度
useEffect(() => {}, [sites.length])
```

```tsx
// ❌ 错误：TDZ
const handleClick = useCallback(() => {
  showToast("hello")
}, [showToast])
const showToast = useCallback(() => {}, [])

// ✅ 正确：先定义
const showToast = useCallback(() => {}, [])
const handleClick = useCallback(() => {
  showToast("hello")
}, [showToast])
```

---

## 🎯 一个记住：稳定！稳定！稳定！

**所有传递为 props 的东西都必须稳定！**

- 函数 → useCallback
- 对象 → useMemo
- 数组 → useMemo
- Set/Map → useMemo 或只依赖内容

