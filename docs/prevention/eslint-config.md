# 🔧 ESLint 配置指南

自动检查 Hook 使用问题，防止常见错误。

---

## 📦 安装

```bash
pnpm add -D eslint eslint-plugin-react-hooks
```

---

## ⚙️ 配置

### 创建 `.eslintrc.json`

```json
{
  "extends": "next/core-web-vitals",
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## 🎯 规则说明

### 1. rules-of-hooks

**作用**：检查 Hook 调用规则

**错误示例**：
```tsx
// ❌ 错误：在条件中调用 Hook
if (condition) {
  const [state, setState] = useState(0)
}

// ❌ 错误：在循环中调用 Hook
for (let i = 0; i < 10; i++) {
  const [state, setState] = useState(0)
}
```

**修复**：
```tsx
// ✅ 正确：在顶层调用 Hook
const [state, setState] = useState(0)
if (condition) {
  // ...
}
```

---

### 2. exhaustive-deps

**作用**：检查 useEffect 依赖数组

**警告示例**：
```tsx
// ⚠️ 警告：缺少依赖
useEffect(() => {
  console.log(value)
}, [])  // value 应该添加到依赖数组

// ⚠️ 警告：依赖不稳定
useEffect(() => {
  // ...
}, [obj])  // obj 每次都是新对象
```

**修复**：
```tsx
// ✅ 正确：添加所有依赖
useEffect(() => {
  console.log(value)
}, [value])

// ✅ 正确：稳定依赖
useEffect(() => {
  // ...
}, [obj.id, obj.name])  // 只依赖属性
```

---

## 🚀 使用

### 检查代码

```bash
# 检查所有文件
pnpm lint

# 检查特定文件
pnpm lint src/components/MyComponent.tsx

# 自动修复可修复的问题
pnpm lint --fix
```

---

## 💡 最佳实践

### 1. 提交前运行 Lint

```bash
# 提交前
pnpm lint && git commit -m "feat: add new feature"
```

### 2. CI/CD 中运行 Lint

在 GitHub Actions 或 CI 中：

```yaml
- name: Run Lint
  run: pnpm lint
```

### 3. VS Code 集成

安装 ESLint 扩展：
- 实时显示错误
- 自动修复保存
- 代码提示

---

## 📊 常见错误与修复

### 错误 1: React Hook "useEffect" is called conditionally

**原因**：在条件中调用 Hook

**修复**：将 Hook 移到条件外

### 错误 2: React Hook useEffect has missing dependencies

**原因**：依赖数组不完整

**修复**：添加所有依赖或使用 eslint-disable

### 错误 3: React Hook useEffect has unnecessary dependencies

**原因**：依赖了不必要的变量

**修复**：移除不必要的依赖

---

## 🎓 总结

ESLint 是你的安全网：
- ✅ 自动检测 Hook 问题
- ✅ 防止常见错误
- ✅ 提供修复建议

**配置好 ESLint，让它在开发过程中保护你！**

