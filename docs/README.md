# 📚 代码问题知识库

> **从错误中学习，在成长中减少错误**

本知识库记录了项目中遇到的所有问题、解决方案和预防措施，是团队的宝贵财富。

---

## 🎯 知识库结构

```
docs/
├── README.md                           # 本文件 - 知识库总览
├── issues/                             # 问题分析
│   ├── react-error-185.md              # React Error #185 完整分析
│   └── ...
├── solutions/                          # 解决方案
│   ├── hooks-safety.md                 # Hooks 安全使用指南
│   └── ...
├── prevention/                         # 预防措施
│   ├── code-review-checklist.md        # 代码审查清单
│   └── ...
└── templates/                          # 代码模板
    ├── component-template.tsx           # 标准组件模板
    └── ...
```

---

## 🔍 快速导航

### 遇到问题？
1. 查看 [问题分析](#问题分析)
2. 查找 [解决方案](#解决方案)
3. 使用 [代码模板](#代码模板)

### 编写新代码？
1. 参考 [最佳实践](#最佳实践)
2. 使用 [代码模板](#代码模板)
3. 运行 [检查清单](#检查清单)

### 代码审查？
1. 使用 [审查清单](prevention/code-review-checklist.md)
2. 检查 [常见陷阱](issues/react-error-185.md#常见陷阱)

---

## 📖 文档索引

### 问题分析

| 文档 | 描述 | 链接 |
|------|------|------|
| React Error #185 | Hook 数量不一致、无限循环 | [查看](./issues/react-error-185.md) |
| React is not defined | 模块导入错误 | [查看](./issues/react-error-185.md#问题-2-react-is-not-defined) |
| Cannot access before initialization | TDZ 问题 | [查看](./issues/react-error-185.md#问题-3-cannot-access-before-initialization) |

### 解决方案

| 文档 | 描述 | 链接 |
|------|------|------|
| Hooks 安全使用指南 | 核心原则和最佳实践 | [查看](./solutions/hooks-safety.md) |
| 代码模板 | 标准化代码模板 | [查看](./templates/) |

### 预防措施

| 文档 | 描述 | 链接 |
|------|------|------|
| 代码审查清单 | 提交前必查清单 | [查看](./prevention/code-review-checklist.md) |
| ESLint 配置 | 自动检查配置 | [查看](./prevention/eslint-config.md) |

---

## 🎓 核心原则

### 1. Hook 一致性原则
✅ 所有 Hook 必须在组件顶层无条件调用

### 2. 引用稳定性原则
✅ 所有传递为 props 的函数用 useCallback，对象/数组用 useMemo

### 3. 异步安全原则
✅ 所有异步操作后检查 isMountedRef

### 4. 依赖稳定性原则
✅ useEffect 依赖不包含不稳定引用

### 5. 函数顺序原则
✅ 被依赖的函数必须先定义

---

## 🚀 快速开始

### 1. 学习问题案例

```bash
# 阅读完整的问题分析
cat docs/issues/react-error-185.md
```

### 2. 学习解决方案

```bash
# 学习 Hooks 安全使用
cat docs/solutions/hooks-safety.md
```

### 3. 使用代码模板

```bash
# 复制标准组件模板
cp docs/templates/component-template.tsx src/components/MyComponent.tsx
```

### 4. 运行检查清单

```bash
# 代码审查前运行
pnpm lint
```

---

## 📝 贡献指南

### 添加新问题

1. 在 `docs/issues/` 创建新文件
2. 按照模板记录：
   - 问题描述
   - 根本原因
   - 解决方案
   - 预防措施
3. 更新本 README.md 的索引

### 添加新模板

1. 在 `docs/templates/` 创建模板文件
2. 添加清晰注释
3. 更新本 README.md 的索引

---

## 🎯 使用建议

### 日常开发
1. 编写代码前：查看代码模板
2. 提交代码前：运行检查清单
3. 遇到问题：查阅问题库

### 代码审查
1. 使用审查清单逐项检查
2. 特别注意常见陷阱
3. 确保遵循核心原则

### 学习成长
1. 定期回顾问题库
2. 理解每个问题背后的原理
3. 将经验转化为最佳实践

---

## 📊 问题统计

### 已解决问题
- ✅ React Error #185 (Hook 数量不一致)
- ✅ React is not defined (模块导入)
- ✅ Cannot access before initialization (TDZ)

### 修复文件数
- **14** 个文件已修复
- **5** 个核心原则总结
- **3** 个代码模板创建

---

## 🔗 相关资源

- [React 官方文档](https://react.dev)
- [React Hooks 文档](https://react.dev/reference/react)
- [React Error #185](https://react.dev/errors/185)
- [ESLint React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

## 💡 最后的话

> **"从错误中学习，在成长中减少错误"**

每一次问题的解决都是成长的契机，每一份文档都是团队的财富。

让我们把知识传承下去，让未来的开发更顺畅！

---

**最后更新**: 2024年

