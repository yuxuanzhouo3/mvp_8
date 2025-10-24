# React Hooks 安全指南

## 问题根源

React Error #185: "Hydration failed because the initial UI does not match what was rendered on the server"

这是因为在组件中，Hook 调用后出现了早期返回（early return），导致：
- SSR 时：执行了 Hook
- CSR 时：提前返回，跳过了 Hook
- 结果：Hook 数量不一致

## 已修复的组件（7个）

1. ✅ `components/header.tsx` - 移除 `if (loading) return`
2. ✅ `components/guest-timer.tsx` - 移除 `if (user.type !== "guest") return`
3. ✅ `components/auth-modal.tsx` - 移除 `if (isEurope) return`
4. ✅ `components/guest-limitation-banner.tsx` - 移除早期返回
5. ✅ `components/featured-products.tsx` - 移除 `if (!safeSites?.length) return`
6. ✅ `components/toast.tsx` - 移除 `if (!isVisible) return`
7. ✅ `components/site-details-modal.tsx` - 移除 `if (!site) return`

## 防御机制

### 1. Lint 规则
```json
{
  "rules": {
    "react-hooks/rules-of-hooks": "error"
  }
}
```

### 2. 自动检查脚本
```bash
# 检查所有早期返回
./tools/grep-early-returns.sh

# 检查风险文件
./tools/check-early-returns.sh
```

### 3. Codemod 自动修复（备用）
```bash
git switch codemod/fix-early-return
npx jscodeshift -t tools/fix-early-return-before-hooks.ts "components/*.tsx"
```

## 最佳实践

### ❌ 错误写法
```tsx
export function MyComponent() {
  if (someCondition) return <div>Hidden</div>  // 在 Hook 之前返回
  
  const [state, setState] = useState(0)  // Hook 不一致
  return <div>{state}</div>
}
```

### ✅ 正确写法
```tsx
export function MyComponent() {
  const [state, setState] = useState(0)  // Hook 总是被调用
  
  if (someCondition) return <div>Hidden</div>  // 在 Hook 之后返回
  return <div>{state}</div>
}
```

### ✅ 使用条件渲染（推荐）
```tsx
export function MyComponent() {
  const [state, setState] = useState(0)
  
  return (
    <div className={someCondition ? "hidden" : ""}>
      {state}
    </div>
  )
}
```

## 高风险场景

以下场景需要特别注意：

1. **登录/认证** - 依赖 session 状态
2. **自动解析** - 依赖数据加载
3. **收藏功能** - 依赖用户状态
4. **动态数据** - 依赖 API 返回

### 推荐做法：添加"就绪占位"

```tsx
const [ready, setReady] = useState(false);
useEffect(() => { setReady(true); }, []);

if (!ready) return null;  // 或 <Skeleton/>

// 继续处理业务逻辑
const { session, isLoading } = useSession();
if (isLoading) return null;
return session ? <AuthedApp/> : <Login/>;
```

## 验证部署

部署后检查：
1. ✅ 网站能正常打开
2. ✅ 登录功能正常
3. ✅ 自动解析功能正常
4. ✅ 收藏功能正常
5. ✅ 添加网站功能正常

如有问题，运行 `./tools/grep-early-returns.sh` 排查。

