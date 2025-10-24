# 代码问题自洽手册 📚

## 问题 1: React Error #185 - Hook 数量不一致

### 🔴 问题表现

**错误信息**：
```
Error: Minified React error #185
Maximum update depth exceeded
```

**症状**：
- 本地开发环境正常
- 生产环境报错
- 点击某些功能（登录、收藏、添加站点）时崩溃
- 网站完全打不开

---

### 🔍 根本原因

#### 1. Hook 调用顺序不一致

**问题**：在第一个 Hook 调用之前有 `return` 语句，导致 Hook 数量在 SSR 和 CSR 中不一致。

**示例代码**：
```tsx
function MyComponent() {
  if (someCondition) return <div>Loading</div>  // ❌ 在 Hook 之前 return
  
  const [state, setState] = useState(0)  // Hook 被条件跳过
  return <div>{state}</div>
}
```

**为什么会出错**：
- SSR 时：`someCondition` 为 true，返回加载 UI，调用 0 个 Hook
- CSR 时：`someCondition` 为 false，返回正常 UI，调用 1 个 Hook
- React 发现 Hook 数量不一致，报错！

---

#### 2. 无限重新渲染循环

**问题**：`setState` 被反复调用，触发无限循环。

**原因 1：useEffect 依赖不稳定**
```tsx
useEffect(() => {
  setState(data)
}, [data])  // ❌ data 每次都是新对象引用
```

**原因 2：setState 没有值比较**
```tsx
// ❌ 即使值相同也更新
setState(newValue)

// ✅ 先比较再更新
setState(prev => prev === newValue ? prev : newValue)
```

---

#### 3. 卸载组件后调用 setState

**问题**：异步操作完成后，组件已卸载，仍尝试更新状态。

**示例**：
```tsx
const fetchData = async () => {
  const result = await api.getData()
  setState(result)  // ❌ 组件可能已卸载
}
```

---

### ✅ 解决方案

#### 方案 1：移除早期 return，改为条件渲染

**修改前**：
```tsx
function MyComponent() {
  if (loading) return <Loading />
  
  const [state, setState] = useState(0)
  return <div>{state}</div>
}
```

**修改后**：
```tsx
function MyComponent() {
  const [state, setState] = useState(0)  // ✅ Hook 始终被调用
  
  if (loading) return <Loading />
  return <div>{state}</div>
}
```

**或使用 className**：
```tsx
function MyComponent() {
  const [state, setState] = useState(0)
  
  return (
    <div className={loading ? "hidden" : ""}>
      {state}
    </div>
  )
}
```

---

#### 方案 2：稳定 useEffect 依赖

**修改前**：
```tsx
useEffect(() => {
  doSomething(data)
}, [data])  // ❌ data 每次都是新对象
```

**修改后**：
```tsx
// 方案 A：只依赖需要的属性
useEffect(() => {
  doSomething(data)
}, [data.id, data.name])  // ✅ 只依赖属性

// 方案 B：使用 useRef 稳定引用
const dataRef = useRef(data)
useEffect(() => {
  dataRef.current = data
}, [data])

useEffect(() => {
  doSomething(dataRef.current)
}, [])  // ✅ 不需要依赖
```

---

#### 方案 3：√ 值比较 + isMountedRef

**修改前**：
```tsx
const fetchData = async () => {
  const result = await api.getData()
  setState(result)  // ❌ 可能已卸载
}
```

**修改后**：
```tsx
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
  }
}, [])

const fetchData = async () => {
  const result = await api.getData()
  if (isMountedRef.current) {  // ✅ 检查挂载状态
    setState(result)
  }
}
```

**值比较版本**：
```tsx
setState(prev => {
  if (prev === newValue) return prev  // ✅ 避免不必要的更新
  return newValue
})
```

---

#### 方案 4：使用 useCallback 稳定函数引用

**修改前**：
```tsx
const handleClick = () => {
  console.log('clicked')
}

<ChildComponent onClick={handleClick} />  // ❌ 每次渲染都是新函数
```

**修改后**：
```tsx
const handleClick = useCallback(() => {
  console.log('clicked')
}, [])  // ✅ 依赖数组为空，函数引用稳定

<ChildComponent onClick={handleClick} />
```

---

### 📊 修复清单

#### ✅ 已修复的文件

1. **`components/auth-modal.tsx`**
   - 移除 `if (isEurope) return`
   - 改为条件渲染

2. **`components/header.tsx`**
   - 移除 `if (loading) return`
   - 改为条件渲染

3. **`components/guest-timer.tsx`**
   - 移除 `if (user.type !== "guest") return`
   - 改为 `className="hidden"`

4. **`components/guest-limitation-banner.tsx`**
   - 移除早期 return
   - 改为条件渲染

5. **`components/featured-products.tsx`**
   - 移除 `if (!safeSites?.length) return`
   - 改为条件渲染

6. **`components/toast.tsx`**
   - 移除 `if (!isVisible) return`
   - 改为条件渲染

7. **`components/site-details-modal.tsx`**
   - 移除 `if (!site) return`
   - 改为条件渲染

8. **`app/page.tsx`**
   - 移除 `{isHydrated && (...)` 包裹模态框
   - 所有回调函数用 useCallback 包装
   - existingUrls 依赖改为 sites.length

9. **`contexts/auth-context.tsx`**
   - 添加 isMountedRef
   - setState 添加值比较

10. **`contexts/language-context.tsx`**
    - setState 添加值比较

11. **`components/parse-sites-modal.tsx`**
    - 使用 useRef 稳定 Set 引用
    - 添加 isMountedRef

12. **`components/add-site-modal.tsx`**
    - 添加 isMountedRef

13. **`components/upgrade-modal.tsx`**
    - 添加 isMountedRef

14. **`components/ui/dialog.tsx`**
    - 添加 `modal={true}` 到 DialogPortal

---

## 问题 2: ReferenceError - React is not defined

### 🔴 问题表现

```
ReferenceError: React is not defined
at u (auth-context.tsx:36:24)
```

### 🔍 根本原因

**问题**：使用了 `React.useRef` 但没有导入 `React`。

**错误代码**：
```tsx
import { useState, useEffect } from 'react'  // ❌ 没有导入 React

const ref = React.useRef(true)  // ❌ React 未定义
```

**为什么会出错**：
- 只导入了特定的 Hook（useState, useEffect）
- 但没有导入 `React` 本身
- 使用 `React.useRef` 时报错

### ✅ 解决方案

**修改后**：
```tsx
import { useState, useEffect, useRef } from 'react'  // ✅ 直接导入 useRef

const ref = useRef(true)  // ✅ 直接使用 useRef
```

---

## 问题 3: ReferenceError - Cannot access before initialization

### 🔴 问题表现

```
ReferenceError: Cannot access 'eT' before initialization
```

### 🔍 根本原因

**问题**：函数在定义之前被使用（TDZ - Temporal Dead Zone）。

**错误代码**：
```tsx
const handleClick = useCallback(() => {
  showToast("hello")  // ❌ showToast 还未定义
}, [showToast])

const showToast = useCallback(() => {}, [])  // showToast 在后面定义
```

**为什么会出错**：
- JavaScript 的 TDZ 规则
- `const` 和 `let` 变量在初始化前不能被访问
- 即使函数提升也不适用

### ✅ 解决方案

**修改后**：
```tsx
// ✅ 先定义基础函数
const showToast = useCallback(() => {}, [])

// ✅ 然后定义依赖它的函数
const handleClick = useCallback(() => {
  showToast("hello")
}, [showToast])
```

**规则**：被依赖的函数必须先定义！

---

## 🎯 核心原则总结

### 1. Hook 使用原则

✅ **所有 Hook 必须在组件顶层无条件调用**
```tsx
// ✅ 正确
function Component() {
  const [state, setState] = useState(0)
  if (loading) return <Loading />
  return <div>{state}</div>
}

// ❌ 错误
function Component() {
  if (loading) return <Loading />
  const [state, setState] = useState(0)  // Hook 在条件后
  return <div>{state}</div>
}
```

---

### 2. 函数引用稳定性

✅ **所有传递为 props 的函数都用 useCallback**
```tsx
const handleClick = useCallback(() => {
  // ...
}, [])  // 如果不依赖外部变量，依赖数组为空
```

✅ **所有传递为 props 的对象/数组都用 useMemo**
```tsx
const items = useMemo(() => [1, 2, 3], [])
<Component items={items} />
```

---

### 3. useEffect 依赖管理

✅ **避免不稳定的依赖**
```tsx
// ❌ 错误
useEffect(() => {}, [sites])  // sites 每次都是新数组

// ✅ 正确
useEffect(() => {}, [sites.length])  // 只依赖长度
```

✅ **使用 useRef 稳定复杂对象**
```tsx
const dataRef = useRef(data)
useEffect(() => {
  dataRef.current = data
}, [data])

useEffect(() => {
  console.log(dataRef.current)
}, [])  // 不需要依赖
```

---

### 4. 异步操作安全

✅ **所有异步操作后检查挂载状态**
```tsx
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
  }
}, [])

const fetchData = async () => {
  const result = await api.getData()
  if (isMountedRef.current) {
    setState(result)
  }
}
```

---

### 5. setState 优化

✅ **添加值比较避免不必要的更新**
```tsx
setState(prev => {
  if (prev === newValue) return prev
  return newValue
})
```

---

## 📝 代码模板

### 标准组件模板

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'

export function MyComponent({ onAction }: Props) {
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
  
  // 4. 回调函数（用 useCallback）
  const handleClick = useCallback(() => {
    if (!isMountedRef.current) return
    setState(prev => {
      const newValue = calculateNewValue(prev)
      if (prev === newValue) return prev
      return newValue
    })
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

---

## ⚠️ 常见陷阱

### 陷阱 1：内联函数

```tsx
// ❌ 每次渲染都创建新函数
<Button onClick={() => handleClick()} />

// ✅ 使用稳定的引用
<Button onClick={handleClick} />
```

### 陷阱 2：在 JSX 中创建对象

```tsx
// ❌ 每次渲染都创建新对象
<Component config={{ a: 1, b: 2 }} />

// ✅ 使用 useMemo
const config = useMemo(() => ({ a: 1, b: 2 }), [])
<Component config={config} />
```

### 陷阱 3：忘记清理异步操作

```tsx
// ❌ 没有清理
useEffect(() => {
  const timer = setTimeout(() => setState(true), 1000)
}, [])

// ✅ 有清理
useEffect(() => {
  const timer = setTimeout(() => {
    if (isMountedRef.current) {
      setState(true)
    }
  }, 1000)
  
  return () => clearTimeout(timer)
}, [])
```

---

## 🔧 调试技巧

### 1. 启用开发模式获取详细错误

在 `next.config.mjs` 中：
```js
const nextConfig = {
  productionBrowserSourceMaps: true,  // 生产环境也生成源码映射
}
```

### 2. 添加哨兵日志

```tsx
useEffect(() => {
  console.log('🟢 Effect 触发', Date.now())
  return () => {
    console.log('🔴 Effect 清理', Date.now())
  }
}, [deps])
```

### 3. 使用 React DevTools

安装 React DevTools 浏览器扩展，可以：
- 查看组件树
- 监控 Hook 调用
- 追踪状态变化

---

## 📚 学习资源

- [React Hooks 官方文档](https://react.dev/reference/react)
- [React Error #185](https://react.dev/errors/185)
- [useCallback 详解](https://react.dev/reference/react/useCallback)
- [useMemo 详解](https://react.dev/reference/react/useMemo)
- [ESLint React Hooks 插件](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

## ✅ 快速检查清单

提交代码前检查：

- [ ] 所有传递为 props 的函数都用 useCallback
- [ ] 所有传递为 props 的对象/数组都用 useMemo
- [ ] 所有异步操作后都检查 isMountedRef
- [ ] 所有 useEffect 依赖都不包含不稳定引用
- [ ] 函数定义顺序正确（被依赖的先定义）
- [ ] 所有 Hook 都在组件顶层无条件调用
- [ ] 所有 setTimeout/setInterval 都有清理函数
- [ ] 所有 setState 都考虑值比较

---

## 🎓 经验总结

### 1. 本地能跑 ≠ 生产能用

**原因**：
- 本地和生产的网络延迟不同
- SSR/CSR 渲染策略不同
- 代码压缩和优化不同

**教训**：每次修改后都要在模拟生产环境测试

---

### 2. 小改动可能引发大问题

**原因**：
- 看似安全的修改可能改变 Hook 调用顺序
- 添加一个条件可能暴露隐藏的时序问题

**教训**：任何修改都要考虑对整体渲染的影响

---

### 3. 工具很重要

**使用的工具**：
- ESLint - 自动检测问题
- React DevTools - 可视化调试
- 源码映射 - 生产环境调试

**教训**：用好工具可以事半功倍

---

### 4. 文档和规范是救命稻草

**创建的文档**：
- REACT-SAFETY-QUICK-REF.md - 快速参考
- REACT-HOOKS-SAFETY-MANUAL.md - 详细手册
- CODE-PROBLEM-SOLUTION-MANUAL.md - 本文档

**教训** any 好记性不如烂笔头，记录问题和解决方案

---

## 🎯 下一步行动

1. ✅ 阅读本手册
2. ✅ 理解每个问题背后的原理
3. ✅ 练习使用提供的代码模板
4. ✅ 在代码审查时使用检查清单
5. ✅ 遇到问题时查阅本手册

---

**记住**：React Error #185 的核心是**一致性**！确保 SSR 和 CSR 的 Hook 调用完全一致！

