# 国内用户邮箱认证 API 测试指南

## 📍 API 地址
```
POST http://localhost:3000/api/auth-cn
```

## 🔧 前置准备

### 1. 确保环境变量已配置
在 `.env.local` 文件中需要配置以下环境变量：

```bash
# 腾讯云 CloudBase 配置
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
CLOUDBASE_SECRET_ID=你的SecretId
CLOUDBASE_SECRET_KEY=你的SecretKey

# 或者使用新的环境变量名称（二选一）
TENCENT_ENV_ID=cloudbase-1gnip2iaa08260e5
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
```

### 2. 确保数据库集合已创建
在腾讯云 CloudBase 控制台中，确保已创建 `web_users` 集合。

---

## 🧪 测试用例

### 测试 1: 用户注册（首次）

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "action": "signup"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "注册成功",
  "user": {
    "id": "xxx",
    "email": "test@example.com",
    "name": "test",
    "pro": false,
    "region": "china"
  }
}
```

---

### 测试 2: 重复注册（应该失败）

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "action": "signup"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "message": "该邮箱已被注册"
}
```

**状态码：** 400

---

### 测试 3: 用户登录（成功）

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "action": "login"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "id": "xxx",
    "email": "test@example.com",
    "name": "test",
    "pro": false,
    "region": "china"
  }
}
```

---

### 测试 4: 用户登录（密码错误）

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword",
    "action": "login"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "message": "用户不存在或密码错误"
}
```

**状态码：** 400

---

### 测试 5: 密码长度验证

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "12345",
    "action": "signup"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "message": "密码至少需要6位"
}
```

**状态码：** 400

---

### 测试 6: 必填字段验证

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "message": "请提供邮箱和密码"
}
```

**状态码：** 400

---

## 🛠️ 使用 Postman 测试

### 1. 创建新请求
- 方法：`POST`
- URL：`http://localhost:3000/api/auth-cn`

### 2. 设置 Headers
```
Content-Type: application/json
```

### 3. 设置 Body（raw JSON）
```json
{
  "email": "test@example.com",
  "password": "test123456",
  "action": "signup"
}
```

### 4. 测试登录
将 `action` 改为 `login`：
```json
{
  "email": "test@example.com",
  "password": "test123456",
  "action": "login"
}
```

---

## 🔍 验证清单

- [ ] 注册新用户成功，返回用户信息
- [ ] 重复注册失败，返回"该邮箱已被注册"
- [ ] 登录成功，返回用户信息
- [ ] 密码错误时登录失败
- [ ] 密码长度验证工作正常
- [ ] 必填字段验证工作正常
- [ ] 非 POST 请求返回 405 错误
- [ ] 数据库中能看到创建的用户记录

---

## 📝 数据库验证

在腾讯云 CloudBase 控制台中，进入 `web_users` 集合，你应该能看到：

```json
{
  "_id": "自动生成的ID",
  "email": "test@example.com",
  "password": "bcrypt加密后的密码",
  "name": "test",
  "pro": false,
  "region": "china",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**注意：** `password` 字段应该是加密后的字符串，而不是明文密码。

---

## 🎯 完成标准

如果以上所有测试都通过，说明：
1. ✅ API 接口独立可用
2. ✅ 国内认证逻辑工作正常
3. ✅ 数据库操作正确
4. ✅ 错误处理完善
5. ✅ 与前端 UI 和海外逻辑完全解耦

这样你就拥有了一个经过独立验证、可以稳定工作的、纯粹的国内认证后端 API！





