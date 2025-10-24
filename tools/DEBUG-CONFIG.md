# 调试配置说明

## 📋 已启用的调试功能

### 1. Source Map（已启用）
**配置**：`next.config.mjs`
```js
productionBrowserSourceMaps: true
webpack: (config, { dev, isServer }) => {
  if (!dev) {
    config.devtool = 'source-map'
  }
}
```

**效果**：
- ✅ 部署后能看到完整的错误堆栈
- ✅ 不再是 "Error #185"，而是详细的错误信息
- ✅ 包含具体的代码文件、行号、组件名称

**示例**：
```
❌ 之前：Error: Minified React error #185
✅ 现在：Cannot read property 'id' of undefined at SiteHub (page.tsx:123)
```

### 2. Console Logs（已启用）
**配置**：
```js
compiler: {
  removeConsole: false
}
```

**效果**：
- ✅ 部署后保留所有 console.log
- ✅ 能看到详细的调试日志

### 3. isMountedRef 保护（已修复）
**配置**：所有异步操作组件

**效果**：
- ✅ 防止组件卸载后设置状态
- ✅ 避免 React Error #185

## 🚀 如何使用

部署后，在浏览器控制台：
1. 打开开发者工具（F12）
2. 切换到 Console 标签
3. 现在会看到详细的错误信息而不是 Error #185

## 📊 示例输出

### 之前
```
Error: Minified React error #185
visit https://react.dev/errors/185
```

### 现在
```
Error: Cannot read property 'id' of undefined
  at AuthContext (auth-context.tsx:98)
  at SiteHub (page.tsx:205)
  at Array.map (<anonymous>)
```

## ⚠️ 注意事项

- Source map 会增加构建时间（+30-60秒）
- Source map 文件会增加部署大小（+2-5MB）
- 仅用于调试，解决问题后可以关闭

## 🔧 关闭调试模式

解决问题后，可以关闭以优化性能：

```js
// next.config.mjs
productionBrowserSourceMaps: false
compiler: {
  removeConsole: true
}
```

