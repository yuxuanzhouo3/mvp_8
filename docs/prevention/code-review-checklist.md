# 📋 代码审查清单

提交代码前，请逐项检查以下内容。

---

## ✅ Hook 使用检查

- [ ] **所有 Hook 都在组件顶层无条件调用**
  - [ ] 没有在 `if` 之后调用 Hook
  - [ ] 没有在 `for` 循环中调用 Hook
  - [ ] 没有在函数中条件调用 Hook

- [ ] **所有传递为 props 的函数都用 useCallback**
  ```tsx
  const handleClick = useCallback(() => {}, [])
  ```

- [ ] **所有传递为 props 的对象/数组都用 useMemo**
  ```tsx
  const items = useMemo(() => [...], [])
  ```

---

## ✅ useEffect 检查

- [ ] **依赖数组稳定**
  - [ ] 没有依赖整个对象/数组
  - [ ] 使用 useRef 稳定复杂对象
  - [ ] 只依赖实际需要的属性

- [ ] **有清理函数**
  - [ ] setTimeout/setInterval 都有 clearTimeout/clearInterval
  - [ ] 事件监听器都有 removeEventListener
  - [ ] 订阅都有 unsubscribe

- [ ] **异步操作检查挂载状态**
  ```tsx
  if (isMountedRef.current) {
    setState(result)
  }
  ```

---

## ✅ 状态更新检查

- [ ] **setState 考虑值比较**
  ```tsx
  setState(prev => prev === newValue ? prev : newValue)
  ```

- [ ] **没有在条件中调用 setState**
  - [ ] 没有在循环中无条件调用 setState
  - [ ] 没有在异步回调中无条件调用 setState

---

## ✅ 函数定义检查

- [ ] **函数定义顺序正确**
  - [ ] 被依赖的函数先定义
  - [ ] 没有 TDZ 问题

- [ ] **所有导入正确**
  - [ ] 没有使用未导入的函数
  - [ ] 没有错误的导入路径

---

## ✅ 异步操作检查

- [ ] **所有 async/await 都有错误处理**
  ```tsx
  try {
    const result = await api.getData()
  } catch (error) {
    console.error(error)
  }
  ```

- [ ] **异步操作后检查挂载状态**
  ```tsx
  const result = await api.getData()
  if (isMountedRef.current) {
    setState(result)
  }
  ```

---

## ✅ 组件检查

- [ ] **Modal/Dialog 组件**
  - [ ] onClose 回调是稳定引用
  - [ ] 内部异步操作检查挂载状态
  - [ ] 动画期间不会有状态更新

- [ ] **Context 组件**
  - [ ] 监听器都有清理函数
  - [ ] setState 都有值比较
  - [ ] 异步操作检查挂载状态

---

## ✅ 代码质量检查

- [ ] **没有 console.log 残留**
  - [ ] 生产代码中没有调试日志
  - [ ] 临时代码已删除

- [ ] **没有 TODO/FIXME 残留**
  - [ ] 所有 TODO 都有明确的计划
  - [ ] 所有 FIXME 都已修复

- [ ] **代码格式统一**
  - [ ] 使用统一的代码风格
  - [ ] 使用统一的命名规范

---

## ✅ 测试检查

- [ ] **本地测试通过**
  ```bash
  pnpm dev
  ```

- [ ] **构建测试通过**
  ```bash
  pnpm build
  ```

- [ ] **Lint 检查通过**
  ```bash
  pnpm lint
  ```

---

## 🚨 高风险场景检查

检查以下高风险场景：

- [ ] **条件渲染场景**
  - [ ] 没有在第一个 Hook 之前 return
  - [ ] 使用条件 className 而不是条件 return

- [ ] **动态数据场景**
  - [ ] useEffect 依赖处理正确
  - [ ] 没有不必要的重新渲染

- [ ] **异步数据场景**
  - [ ] 有加载状态处理
  - [ ] 有错误状态处理
  - [ ] 有挂载状态检查

- [ ] **用户交互场景**
  - [ ] 按钮点击后立即反馈
  - [ ] 防止重复点击
  - [ ] 操作失败有错误提示

---

## 📝 提交前最终检查

- [ ] 代码通过所有检查项
- [ ] 本地测试通过
- [ ] 构建测试通过
- [ ] Git 提交信息清晰
- [ ] 相关文档已更新

---

## 🔧 快速检查命令

```bash
# 1. 运行 Lint
pnpm lint

# 2. 运行构建
pnpm build

# 3. 运行测试（如果有）
pnpm test

# 4. 检查 Git 状态
git status

# 5. 查看差异
git diff
```

---

## 💡 提示

### 遇到问题？
1. 查阅 [问题库](../issues/react-error-185.md)
2. 查看 [解决方案](../solutions/hooks-safety.md)
3. 使用 [代码模板](../templates/)

### 不确定？
- 参考现有代码的写法
- 查阅 React 官方文档
- 与团队成员讨论

---

**记住**：多花一分钟检查，少花一小时调试！

