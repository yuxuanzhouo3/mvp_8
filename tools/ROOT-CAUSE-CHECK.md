# React Error #185 根源检查

## 根据 React 官方文档

错误原因：
**"组件在更新期间反复调用 setState"**

## 系统检查方法

1. 搜索所有 setState 调用
2. 追踪调用路径
3. 找到循环链

## 可能的问题源

### 问题1：existingUrls 每次都创建新 Set
- 位置：app/page.tsx 第 309-316 行
- 问题：即使内容相同，引用也不同
- 影响：传递给 ParseSitesModal 会导致重渲染

### 问题2：sites 数组变化导致连锁反应
- 位置：app/page.tsx 多处
- 问题：sites 变化 → existingUrls 变化 → ParseSitesModal 重渲染

### 问题3：addCustomSite 函数引用变化
- 位置：app/page.tsx 第 736 行
- 问题：每次渲染都创建新函数

## 检查结论

真正的根源应该是：**existingUrls 的不稳定引用**

