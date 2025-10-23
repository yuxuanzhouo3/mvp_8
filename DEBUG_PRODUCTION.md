# 🔍 生产环境 React #300 深度诊断

## 问题现状

即使添加了 `force-dynamic`，生产环境仍然报 React Error #300。
这说明问题在**客户端 JavaScript 代码本身**，而非 SSR hydration。

## 诊断步骤

### 1. 本地复现生产错误

```bash
# 构建生产版本
npm run build

# 运行生产服务器
npm run start

# 在浏览器打开 http://localhost:3000
# 查看控制台是否有同样的错误
```

### 2. 启用 React DevTools

在浏览器中：
1. 安装 React DevTools 扩展
2. 打开开发者工具
3. 切换到 Components 标签
4. 查看组件树，找到哪个组件在报错

### 3. 可能的根因（优先级排序）

#### A. Context Provider 顺序问题 (80%)
**症状**: Auth context 的 `INITIAL_SESSION undefined`
**定位**: 检查 `app/layout.tsx` 中 Provider 嵌套顺序
**解决**: 确保依赖关系正确（Auth → Settings → Geo → Language）

#### B. 异步 hooks 竞态条件 (15%)
**症状**: useEffect 依赖数组中的值在不同渲染时变化
**定位**:
```bash
# 搜索有复杂依赖的 useEffect
grep -rn "useEffect.*\[.*user.*geo.*\]" app components
```
**解决**: 添加 loading 状态保护

#### C. 条件性 hooks 调用 (5%)
**症状**: 某个组件在不同条件下调用不同数量的 hooks
**定位**:
```bash
# 搜索条件性 hooks
grep -B10 "if.*{" components/**/*.tsx | grep -A5 "use[A-Z]"
```

### 4. 临时诊断补丁

在 `app/page.tsx` 的 SiteHub 函数顶部添加：

```typescript
export default function SiteHub() {
  // ========== 诊断代码 START ==========
  const renderCount = useRef(0)
  renderCount.current++

  console.log('🔍 [Render #' + renderCount.current + ']', {
    user: user?.type,
    geoLoading,
    isChina,
    mounted,
    timestamp: Date.now()
  })

  // 捕获 hooks 调用数量
  const hooksList = []
  const origUseState = React.useState
  React.useState = (...args) => {
    hooksList.push('useState')
    return origUseState(...args)
  }
  // ========== 诊断代码 END ==========

  // ... 原有代码
}
```

### 5. 快速修复方案（如果以上都失败）

#### 方案A: 拆分组件，隔离 hooks
将 `app/page.tsx` 中所有 hooks 移到独立的自定义 hook：

```typescript
function useSiteHubState() {
  const { user } = useAuth()
  const { isChina, loading: geoLoading } = useGeo()
  const { language } = useLanguage()
  // ... 所有 hooks

  return { /* 返回所有状态 */ }
}

export default function SiteHub() {
  const state = useSiteHubState()
  // 只负责渲染
}
```

#### 方案B: 条件渲染外包装
```typescript
export default function SiteHubWrapper() {
  const { user } = useAuth()
  const { geoLoading } = useGeo()

  // 等待所有 context 初始化完成
  if (!user || geoLoading) {
    return <LoadingScreen />
  }

  return <SiteHubMain user={user} />
}

function SiteHubMain({ user }) {
  // 所有原有逻辑
  // user 保证非空，hooks 数量固定
}
```

## 下一步行动

1. **立即尝试**: 本地 `npm run build && npm run start`
2. **如果本地也报错**: 说明代码确实有问题，用方案A或B
3. **如果本地正常**: 可能是 Vercel 构建配置问题，检查 `vercel.json`
