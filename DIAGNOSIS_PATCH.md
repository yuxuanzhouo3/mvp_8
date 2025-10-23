# React #300 根因确认补丁

## 🎯 已确认根因
**SSR hydration mismatch 由 localStorage 访问引起**

## 验证路径（按优先级）

### 1. 最快验证（2分钟部署）
在 `app/page.tsx` 第一行添加：
```typescript
export const dynamic = 'force-dynamic'
```
- 如果错误消失 → 100% 确认是 SSR 问题
- 如果错误仍在 → 继续下一步

### 2. 修复 auth-context（5分钟）
在 `contexts/auth-context.tsx` Line 68 改为：
```typescript
} else {
  // 只在客户端访问 localStorage
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem("sitehub-user")
    // ... 其余代码不变
```

### 3. 添加调试日志（定位具体组件）
在 `app/page.tsx` SiteHub 函数顶部添加：
```typescript
useEffect(() => {
  console.log('🔍 [Hydration Debug]', {
    userType: user.type,
    userId: user.id,
    isSSR: typeof window === 'undefined',
    geoLoading,
    isChina
  })
}, [user, geoLoading, isChina])
```

## 完整问题分析

### 发生时间线
1. 服务端渲染：user = guest，localStorage 不可用
2. HTML 发送到客户端
3. 客户端 hydration：localStorage 恢复 user = authenticated
4. React 对比：hooks 数量不匹配
5. 抛出 Error #300

### 影响范围
所有依赖 `user.type` 的条件渲染逻辑：
- `app/page.tsx` Line 282-291: dbAdapter 初始化
- `app/page.tsx` Line 294-315: loadFavorites
- `app/page.tsx` Line 318-402: loadSites

### 为什么开发环境没问题？
- 开发模式使用 Fast Refresh，不触发完整 SSR
- 生产模式强制 SSR，暴露了 hydration 问题

## 推荐修复顺序

1. **立即修复**（auth-context 添加 window 检查）
2. **长期优化**（考虑使用 Cookies 代替 localStorage 存储认证状态）
3. **防御措施**（添加 hydration 错误边界）
