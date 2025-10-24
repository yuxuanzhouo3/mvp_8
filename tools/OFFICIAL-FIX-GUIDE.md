# React Error #185 官方解决方案

根据 [React 官方文档](https://react.dev/errors/185)：

## 错误信息

```
Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

## 官方原因分析

当一个组件在**更新期间**反复调用 `setState` 时会发生这个问题。

### 常见触发场景：

1. **useEffect 无限循环**
   ```tsx
   // ❌ 错误
   useEffect(() => {
     setState(newValue)  // 触发更新
   }, [state])  // state 变了又触发 effect
   ```

2. **Context 更新触发重渲染**
   ```tsx
   // ❌ 错误
   const { value } = useContext(MyContext)
   useEffect(() => {
     setValue(newValue)  // 更新 Context 导致所有使用者重渲染
   }, [value])
   ```

3. **组件更新期间调用 setState**
   ```tsx
   // ❌ 错误（在 render 中）
   if (condition) {
     setState(true)  // 渲染时直接调用 setState
   }
   ```

## 我们的问题分析

### ✅ 已修复：AuthContext
```tsx
// 之前：每次都会触发更新
setUser(customUser)

// 现在：只在值变化时更新
setUser(prev => {
  if (prev.id === customUser.id) return prev
  return customUser
})
```

### 🔍 可能还有问题的地方

让我检查一下还有没有其他触发无限更新的地方...

