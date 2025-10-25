# JWT Token 前端处理指南

## 📝 概述

已为前端添加了 JWT Token 的保存、验证和持久化登录功能。

## 🔧 修改的文件

### 1. `components/auth-modal.tsx`
**修改位置**: `handleEmailAuth` 函数（第 113-124 行）

**功能**: 登录成功后保存 JWT Token 和用户信息到 localStorage

```typescript
// ✅ 保存 JWT Token 和用户信息到 localStorage
if (typeof window !== 'undefined') {
  if (result.token) {
    localStorage.setItem('user_token', result.token)
    console.log('✅ [Token Saved]: JWT token saved to localStorage')
  }
  
  if (result.user) {
    localStorage.setItem('user_info', JSON.stringify(result.user))
    console.log('✅ [User Info Saved]: User info saved to localStorage')
  }
}
```

### 2. `contexts/auth-context.tsx`
**修改位置**: `getInitialSession` 函数（第 45-73 行）

**功能**: 应用加载时检查并恢复 JWT Token 会话

```typescript
// ✅ 检查国内用户 JWT Token 会话
const jwtToken = localStorage.getItem('user_token')
const userInfoStr = localStorage.getItem('user_info')

if (jwtToken && userInfoStr) {
  // 恢复用户状态
  const userInfo = JSON.parse(userInfoStr)
  // 创建用户对象并更新全局状态
}
```

**修改位置**: `signOut` 函数（第 204-207 行）

**功能**: 登出时清除 JWT Token

```typescript
// ✅ 清除 JWT Token 相关数据
localStorage.removeItem('user_token')
localStorage.removeItem('user_info')
```

## 🎯 工作流程

### 登录流程

1. **用户提交登录表单**
   - 邮箱和密码发送到 `/api/auth-cn`

2. **后端验证并返回 Token**
   ```json
   {
     "success": true,
     "message": "登录成功",
     "user": { ... },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **前端保存 Token**
   - 保存到 `localStorage` 的 `user_token`
   - 保存用户信息到 `localStorage` 的 `user_info`

4. **刷新页面**
   - 模态框关闭
   - 页面刷新
   - 用户状态更新为已登录

### 会话恢复流程

1. **应用加载**
   - `AuthProvider` 的 `useEffect` 检查 localStorage

2. **发现 JWT Token**
   - 读取 `user_token` 和 `user_info`
   - 解析用户信息
   - 更新全局用户状态

3. **用户状态恢复**
   - 用户保持登录状态
   - 无需重新登录

### 登出流程

1. **用户点击登出**
   - 调用 `signOut()` 函数

2. **清除数据**
   - 删除 `user_token`
   - 删除 `user_info`
   - 清除 Supabase session

3. **状态更新**
   - 用户状态重置为 guest
   - 重定向到首页

## 📋 LocalStorage 数据结构

### `user_token`
存储的 JWT Token 字符串：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI... 
```

### `user_info`
存储的用户信息 JSON：
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "username",
  "pro": false,
  "region": "china"
}
```

## 🔍 控制台日志

### 登录成功
```
✅ 认证成功，准备关闭模态框并刷新页面
✅ [Token Saved]: JWT token saved to localStorage
✅ [User Info Saved]: User info saved to localStorage
```

### 会话恢复
```
✅ [Session Restore]: Found JWT session, restoring user: user@example.com
```
或
```
ℹ️ [Session Restore]: No JWT session found
```

### 登出
```
✅ [Logout]: JWT token cleared
```

## 🧪 测试步骤

### 1. 测试登录
1. 打开网站：http://localhost:3000
2. 点击登录按钮
3. 输入邮箱和密码
4. 提交表单
5. 检查浏览器控制台，应该看到 Token 保存的日志
6. 页面刷新后，应该保持登录状态

### 2. 测试会话恢复
1. 关闭浏览器标签页
2. 重新打开网站
3. 不应该需要重新登录
4. 检查控制台，应该看到会话恢复的日志

### 3. 测试登出
1. 点击登出按钮
2. 检查 localStorage，token 和 user_info 应该被删除
3. 用户状态应该重置为 guest

## ⚠️ 注意事项

### Token 安全性
- JWT Token 存储在 localStorage，容易受到 XSS 攻击
- 生产环境建议使用 httpOnly cookie
- Token 有效期 7 天，过期后需要重新登录

### Token 验证
当前实现只检查 Token 是否存在，没有验证：
- Token 是否过期
- Token 是否被篡改
- Token 签名是否有效

建议在后端添加中间件验证 Token。

### 跨浏览器同步
localStorage 是浏览器特定的，不会跨设备同步。

## 🚀 后续改进

1. **添加 Token 刷新机制**
   - 在 Token 过期前自动刷新
   - 减少用户重新登录次数

2. **实现 Token 验证中间件**
   - 在后端验证 Token 有效性
   - 自动拒绝无效或过期的 Token

3. **使用 httpOnly Cookie**
   - 提高安全性
   - 防止 XSS 攻击

4. **添加多设备管理**
   - 显示当前登录的设备
   - 允许撤销特定设备的访问

---

**创建时间**: 2025-01-27  
**最后更新**: 2025-01-27


