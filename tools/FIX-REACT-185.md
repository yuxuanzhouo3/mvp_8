# React Error #185 修复记录

## 问题诊断

### 第一阶段：Hook 数量不一致
- **症状**：网站能打开，但点击功能按钮报错
- **原因**：7个组件有早期返回，导致 SSR/CSR Hook 数量不一致
- **修复**：移除早期返回，改用条件渲染

### 第二阶段：更新死循环（真正的根因）
- **症状**：点击"登录"、"自动解析"、"升级"等按钮时，浏览器卡死
- **错误**：React Error #185 - Maximum update depth exceeded
- **原因**：`AuthContext` 中的 `onAuthStateChange` 监听器导致无限更新循环

## 根本原因

```tsx
// ❌ 问题代码
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    setSession(session)          // 每次都会触发更新
    setSupabaseUser(session?.user ?? null)  // 每次都会触发更新
    setUser(customUser)          // 每次都会触发更新
  }
)
```

**循环流程**：
1. `onAuthStateChange` 触发 → `setUser` → 组件重渲染
2. 组件重渲染 → Context 更新 → 所有子组件重渲染
3. 某些子组件可能再次触发 auth 状态检查
4. 回到步骤 1，形成无限循环

## 修复方案

### 核心修复（contexts/auth-context.tsx）

```tsx
// ✅ 修复代码 - 只在值真正变化时才更新
setSession(prev => {
  if (prev?.user?.id === session?.user?.id) return prev
  return session
})

setSupabaseUser(prev => {
  if (prev?.id === session?.user?.id) return prev
  return session?.user ?? null
})

setUser(prev => {
  if (prev.id === customUser.id) return prev
  return customUser
})
```

**原理**：
- 使用函数式更新（function updater）
- 比较 `prev` 和 `new` 的值
- 只在值真正变化时才返回新值
- 避免不必要的重渲染

### 其他修复

1. **移除模态框的 isHydrated 条件**（app/page.tsx）
   - 确保模态框始终渲染，保持 Hook 数量一致

2. **优化 UltraCompactSiteGrid**（components/ultra-compact-site-grid.tsx）
   - 处理空状态，避免数组长度变化导致的问题

## 测试清单

部署后需要测试：
- [ ] 网站首页加载正常
- [ ] 点击"登录"按钮不卡死
- [ ] 点击"自动解析"按钮不卡死
- [ ] 点击"升级"按钮不卡死
- [ ] 点击"添加网站"按钮正常
- [ ] 点击"收藏"功能正常
- [ ] 切换页面不卡死

## 预防措施

### 1. ESLint 规则
已添加 `.eslintrc.json`：
```json
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 2. 检查脚本
```bash
# 检查早期返回
./tools/grep-early-returns.sh

# 检查风险文件
./tools/check-early-returns.sh
```

### 3. 代码规范

❌ **避免**：
```tsx
useEffect(() => {
  setState(newValue)  // 可能重复设置
}, [someDep])
```

✅ **推荐**：
```tsx
useEffect(() => {
  setState(prev => {
    if (prev === newValue) return prev
    return newValue
  })
}, [someDep])
```

## 相关文件

- `contexts/auth-context.tsx` - 鉴权上下文（核心修复）
- `app/page.tsx` - 主页面
- `components/auth-modal.tsx` - 登录模态框
- `components/parse-sites-modal.tsx` - 解析模态框
- `components/upgrade-modal.tsx` - 升级模态框
- `components/ultra-compact-site-grid.tsx` - 网站网格

## 修复提交

- `423bd82` - 移除模态框的 isHydrated 条件
- `49f73f3` - 修复更新死循环

