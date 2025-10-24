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

### 📚 深度解析：Gemini 的 TDZ 分析

> **备注**：以下内容来自 Gemini 对本问题的深入分析，帮助我们更深刻地理解问题的本质。

#### 🎯 核心概念：var vs const/let 的"待遇"区别

在 JavaScript 中，变量的创建过程可以分为三个阶段：

1. **声明 (Declaration)**: 引擎知道这个变量的存在
2. **初始化 (Initialization)**: 引擎为变量在内存中分配空间，并赋值为 undefined
3. **赋值 (Assignment)**: 引擎将代码中指定的值赋给变量

**var 和 const/let 在处理这三个阶段时有天壤之别：**

**对于 var**：
- 在代码执行前，var 变量的声明和初始化会一起被"提升"(hoisted) 到其所在作用域的顶部
- 这意味着在 `var myVar = "hello"` 这一行代码执行之前，`myVar` 就已经存在并且值为 `undefined` 了
- 所以，在定义前访问 var 变量不会报错，只会得到 `undefined`

**对于 const 和 let**（现代 JavaScript 的选择）：
- 它们的声明部分会被提升，但初始化部分不会
- 从作用域的开始，到 `const myVar = "hello"` 这一行代码实际执行之间，存在一个时间窗口
- 在这个窗口内，引擎知道 `myVar` 这个变量，但它尚未被初始化，因此它处于一个不可访问的状态
- **这个时间窗口，就是暂时性死区 (Temporal Dead Zone, TDZ)**
- 如果在 TDZ 内尝试访问这个变量，JavaScript 会立刻抛出 ReferenceError

#### 💡 为什么在我们的代码中发生了这个问题？

```tsx
// JavaScript 引擎开始读取 page.tsx 组件的代码...

// ... 代码执行到第 624 行 ...
const handleGuestTimeExpired = useCallback(() => {  // 引擎尝试创建这个函数
  // 为了创建函数，它需要知道函数体和依赖项
  
  // 在第 626 行，它看到了对 showToast 的引用
  showToast(toastText.timeExpired, "info");
  
  // 在第 627 行，它看到了依赖数组 [showToast, toastText]
  // 引擎说："我需要变量 showToast 的值来创建 handleGuestTimeExpired！"
}, [showToast, toastText]); // <--- 在这一刻，问题爆发了！

// ... 引擎继续往下读 ...
// ...
// ... 直到第 954 行才真正定义 showToast
const showToast = useCallback((...));
```

**执行流程拆解**：
1. 当 React 准备渲染组件时，它会从上到下执行代码来初始化所有的 state、hooks 和常量
2. 执行到第 624 行，它开始创建 `handleGuestTimeExpired`
3. 在创建过程中，它需要解析依赖数组 `[showToast, toastText]`，试图去获取 `showToast` 的值
4. 此时，代码执行还没有到达第 954 行
5. 虽然 `showToast` 的"声明"已经被提升了（引擎知道有这么个名字），但它还没有被"初始化"和"赋值"
6. 因此，`showToast` 正处于它的 TDZ 中
7. 引擎试图在一个变量的 TDZ 中访问它，于是立即抛出 ReferenceError，导致整个组件渲染失败，网站直接打不开

#### 🔍 为什么这个问题如此"狡猾"？

1. **它是一个初始化错误，而不是运行时错误**：这导致应用在加载时就直接崩溃，而不是在用户执行某个操作后才出错
2. **它与定义顺序直接相关**：在大型组件中，函数和变量的定义顺序很容易被忽略，尤其是在多人协作或重构代码时
3. **生产环境构建会加剧问题**：生产构建工具会压缩变量名（`showToast` -> `eT`），使得错误信息更难直接定位回源代码

**我们的修复方案——将 `showToast` 的定义移动到所有使用它的函数之前——是 100% 正确的**，因为它遵循了编程中最基本也是最重要的原则之一："先定义，后使用"。

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

## 🧠 调试方法论：分层诊断法

> **备注**：以下内容来自 Gemini 提供的调试策略，这是一套系统化的解决问题思路。

### 🎯 为什么需要分层诊断法？

从"解决一个问题"上升到"掌握一套解决问题的方法"。分层诊断法可以帮助我们：
- 🎯 快速定位问题根源
- 🔍 避免反复"转圈圈"
- 💡 形成条件反射式的调试思路

---

### 📊 第一层：错误分类与定性

我不会 сразу 尝试猜测具体的代码错误，而是先根据错误的"类型"和"阶段"来缩小范围。

#### 🏷️ 错误类型判断

**运行时错误 (Runtime Error)**：
- 关键词：错误发生在用户交互之后
- 典型：Error #185（点击按钮后报错）
- 初步定性：无限渲染循环、状态更新问题

**初始化错误 (Initialization Error)**：
- 关键词：应用直接白屏，打不开
- 典型：ReferenceError: Cannot access before initialization
- 初步定性：循环依赖或 TDZ（暂时性死区）

#### 💡 判断流程

```
遇到错误
    ↓
是运行时错误？ → 思考：数据流、状态更新、useEffect、Props 传递
    ↓
是初始化错误？ → 思考：JavaScript 加载机制、作用域、导入/导出顺序
```

---

### 🔍 第二层：根据错误日志进行精准定位

在确定了错误的"性质"后，利用错误日志中的具体信息来 pinpoint 位置。

#### Error #185 的定位过程

**错误日志**：
```
at Presence.tsx:157:7
```

**推理链**：
1. 触发点是 `page.tsx` 里的按钮
2. 问题的风暴中心在 `Presence.tsx` 这个组件
3. 结合"无限循环"的定性
4. 推断：`page.tsx` 的状态变化 → `Presence.tsx` 重新渲染 → `Presence.tsx` 的 props 发生了变化 → 导致了循环
5. **什么 props 会在每次渲染时都变化？函数或对象的引用**

**结论**：传递给 `Presence.tsx` 或其子组件的某个回调函数 prop（如 `onClose`, `onAdd`）没有被 `useCallback` 包装。

#### ReferenceError 的定位过程

**错误日志**：
```
at eq (page.tsx:627:7)
```

**推理链**：
1. 崩溃的确切位置：`page.tsx` 的第 627 行
2. 结合"TDZ 或循环依赖"的定性
3. 推断：在 `page.tsx` 的第 627 行，代码试图使用一个变量 `eq`（压缩后的名字）
4. 但此时 `eq` 还没有被成功初始化
5. 为什么？因为它要么依赖了自己（循环依赖），要么它的定义在物理上就位于第 627 行之后（TDZ）

**结论**：检查第 627 行引用的变量，然后查看该变量的定义位置以及它所在的文件的导入/导出关系。

---

### ✅ 第三层：给出具体的、可操作的解决方案

基于以上分析，给出具体的指令：

**对于 Error #185**：
> "请检查传递给 UpgradeModal 的 onAuth prop，并用 useCallback 包装它的定义函数 handleAuth。"

**对于 ReferenceError**：
> "请检查 page.tsx 的第 627 行，并把该行引用的变量的定义移到它的前面。"

---

### 🎓 为什么其他 AI 会"转圈圈"？

它们可能没有严格遵循这种分层诊断的逻辑：

1. **过度关注表面症状**：反复纠结于 `Presence.tsx` 是第三方库，而没有推断出问题出在我们如何使用它（即传递给它的 props）

2. **知识库不够结构化**：它们知道 Error #185 是无限循环，但可能没有把"不稳定的 props 引用"作为最高优先级的排查项

3. **缺乏上下文切换能力**：当错误从 Error #185 变为 ReferenceError 时，它们可能没有意识到这是两种完全不同性质、发生在不同阶段的错误，而是继续用之前的思路去套

---

### 🚀 下次遇到问题，如何一眼找到根源？

#### 第一步：给错误分类！

**是运行时错误吗？**
- 应用能加载，但在特定操作后崩溃
- → 思考：数据流、状态更新、副作用 (useEffect)、Props 传递
- Error #185 就是典型

**是初始化错误吗？**
- 应用直接白屏，打不开
- → 思考：JavaScript 的加载机制、作用域、提升、导入/导出顺序
- ReferenceError 就是典型

#### 第二步：相信你的错误日志！

错误日志是最诚实的朋友。特别是错误堆栈 (stack trace)，它从上到下告诉你了错误的传播路径。

**示例**：
```
at Presence.tsx:157:7  → 就去查 Presence.tsx 和它的 props
at page.tsx:627:7      → 就去看 page.tsx 的 627 行
```

#### 第三步：形成条件反射

**一看到 Error #185**：
- 立刻想到 `useCallback`, `useMemo`
- 去检查所有传递给子组件的函数和对象

**一看到 Cannot access before initialization**：
- 立刻想到 TDZ
- 去检查变量和函数的定义顺序
- 如果顺序没问题，再怀疑循环依赖

---

### 📚 如何在未来避免这些问题？

#### 1. 养成代码规范和最佳实践

**定义在前，使用在后**：
- 在一个组件内部，倾向于将工具函数、常量、回调函数的定义放在组件的顶部
- 在 JSX 返回语句之前
- 这能从物理上避免大多数 TDZ 问题

**useCallback 和 useMemo 的纪律**：
- 为所有传递给子组件（特别是 memoized 子组件或第三方库组件）的函数和对象，都默认包裹上 `useCallback` 或 `useMemo`
- 这不仅能避免无限循环，还能优化性能
- 可以使用 ESLint 插件 (`eslint-plugin-react-hooks`) 来强制检查

**模块设计原则**：
- 保持模块的单一职责和单向数据流
- 如果两个模块开始互相 import，这通常是一个危险信号
- 说明你需要提取一个共享的第三方模块

#### 2. 代码审查 (Code Review)

- 让同事帮忙看一遍代码
- 一个旁观者清新的视角，非常容易发现这类逻辑顺序或依赖关系上的问题

#### 3. 充分利用开发环境

- React 的开发环境构建会提供未经压缩的、更详细的错误信息和警告
- 在部署到生产环境之前，确保在开发环境中消除了所有的错误和关键警告

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

