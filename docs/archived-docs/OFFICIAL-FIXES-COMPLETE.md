# React Error #185 官方排查 - 完整修复清单

根据 https://react.dev/errors/185

## 核心问题
"Maximum update depth exceeded - 组件在更新期间反复调用 setState"

## 排查发现的所有问题

### ✅ 1. ParseSitesModal - setAddedUrls 创建新 Set
**位置**：`components/parse-sites-modal.tsx` 第 54 行

**问题**：
```tsx
setAddedUrls(new Set())  // ❌ 每次都创建新引用
```

**修复**：
```tsx
setAddedUrls(prev => prev.size > 0 ? new Set() : prev)  // ✅ 只在需要时重置
```

### ✅ 2. AuthModal - setMode 频繁更新
**位置**：`components/auth-modal.tsx` 第 41 行

**问题**：
```tsx
setMode(authMode)  // ❌ 即使值相同也更新
```

**修复**：
```tsx
setMode(prev => prev === authMode ? prev : authMode)  // ✅ 只在值变化时更新
```

### ✅ 3. AuthModal - form reset 重置
**位置**：`components/auth-modal.tsx` 第 47-54 行

**问题**：
```tsx
setEmail("")  // ❌ 即使已经是空也更新
setPassword("")
// ...
```

**修复**：
```tsx
setEmail(prev => prev ? "" : prev)  // ✅ 只在需要时重置
setPassword(prev => prev ? "" : prev)
// ...
```

## 修复原理

根据 React 官方文档，避免无限循环的关键：
1. ✅ **只在值真正变化时才调用 setState**
2. ✅ **使用函数式更新比较值**
3. ✅ **避免创建不必要的对象引用**

## 下一步

✅ 已修复所有发现的无限循环问题
⏳ 需要推送并测试

