# 国内用户邮箱认证客户端使用指南

## 📁 文件位置
`lib/auth-client-cn.ts`

## 🎯 功能说明

这个文件提供了两个客户端函数，用于前端调用国内用户邮箱认证 API：

1. **`signupWithEmailCN`** - 邮箱注册
2. **`loginWithEmailCN`** - 邮箱登录

---

## 📖 使用方法

### 1. 导入函数

```typescript
import { signupWithEmailCN, loginWithEmailCN } from '@/lib/auth-client-cn'
```

---

### 2. 注册示例

```typescript
async function handleSignup() {
  const email = 'user@example.com'
  const password = 'password123'

  const result = await signupWithEmailCN(email, password)

  if (result.success) {
    console.log('注册成功！', result.user)
    // 保存用户信息到本地存储或状态管理
  } else {
    console.error('注册失败:', result.message)
    // 显示错误提示
  }
}
```

**成功响应示例：**
```typescript
{
  success: true,
  message: "注册成功",
  user: {
    id: "4798591468fca29700ac2fc14a7cab7b",
    email: "user@example.com",
    name: "user",
    pro: false,
    region: "china"
  }
}
```

**失败响应示例：**
```typescript
{
  success: false,
  message: "该邮箱已被注册"
}
```

---

### 3. 登录示例

```typescript
async function handleLogin() {
  const email = 'user@example.com'
  const password = 'password123'

  const result = await loginWithEmailCN(email, password)

  if (result.success) {
    console.log('登录成功！', result.user)
    // 保存用户信息到本地存储或状态管理
  } else {
    console.error('登录失败:', result.message)
    // 显示错误提示
  }
}
```

**成功响应示例：**
```typescript
{
  success: true,
  message: "登录成功",
  user: {
    id: "4798591468fca29700ac2fc14a7cab7b",
    email: "user@example.com",
    name: "user",
    pro: false,
    region: "china"
  }
}
```

**失败响应示例：**
```typescript
{
  success: false,
  message: "用户不存在或密码错误"
}
```

---

## 🎨 React 组件集成示例

### 注册表单组件

```typescript
'use client'

import { useState } from 'react'
import { signupWithEmailCN } from '@/lib/auth-client-cn'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signupWithEmailCN(email, password)

    if (result.success) {
      console.log('注册成功:', result.user)
      // 跳转到登录页面或首页
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  )
}
```

### 登录表单组件

```typescript
'use client'

import { useState } from 'react'
import { loginWithEmailCN } from '@/lib/auth-client-cn'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginWithEmailCN(email, password)

    if (result.success) {
      console.log('登录成功:', result.user)
      // 保存用户信息，跳转到首页
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  )
}
```

---

## 📝 TypeScript 类型定义

```typescript
// 注册响应类型
interface SignupResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    name: string
    pro: boolean
    region: string
  }
}

// 登录响应类型
interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    name: string
    pro: boolean
    region: string
  }
}
```

---

## ⚠️ 注意事项

1. **密码长度**：API 要求密码至少 6 位
2. **邮箱格式**：使用 HTML5 `type="email"` 进行基本验证
3. **错误处理**：始终检查 `result.success` 来判断操作是否成功
4. **网络错误**：如果网络请求失败，函数会返回 `{ success: false, message: '网络错误，请稍后重试' }`
5. **用户信息**：成功后保存 `result.user` 到你的状态管理系统（如 Context、Redux 等）

---

## 🔗 相关文件

- API 实现：`pages/api/auth-cn.ts`
- 测试脚本：`test-auth-api.js`
- 测试文件：`test-auth-cn.http`

---

## ✅ 验证测试

在创建客户端函数后，你可以：

1. 在 React 组件中导入并使用这些函数
2. 创建注册/登录表单进行测试
3. 验证用户信息是否正确返回
4. 检查错误处理是否正常工作





