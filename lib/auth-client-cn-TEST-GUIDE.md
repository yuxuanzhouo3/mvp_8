# 国内邮箱认证测试指南

## 📝 当前状态

已成功添加 IP 判断逻辑，支持根据用户地理位置自动选择认证服务：
- 🇨🇳 **国内用户**：使用腾讯云 CloudBase 认证
- 🌍 **海外用户**：使用 Supabase 认证

## ⚠️ 重要：临时测试硬编码（共有3处）

### 1. 认证服务选择（后端）
**位置**: `components/auth-modal.tsx` 第 32 行

```typescript
const FORCE_CHINA_FOR_TESTING = true  // <--- 测试用：强制国内认证服务
```

### 2. 前端地区检测（伪造中国地区）
**位置**: `contexts/geo-context.tsx` 第 79 行

```typescript
const FORCE_CHINA_REGION = true  // <--- 测试用：强制国内地区
```

### 3. 允许国内用户使用登录功能
**位置**: `app/page.tsx` 第 210 行

```typescript
const ALLOW_CHINA_AUTH_TESTING = true  // <--- 测试用：允许国内认证
```

**⚠️ 部署前必须操作**：
1. 将所有三个硬编码常量改为 `false` 或删除
2. 确保使用真实的 IP 判断
3. 恢复国内用户的"待开发"限制

## 🧪 测试步骤

### 1. 启动应用
```bash
npm run dev
```

### 2. 打开浏览器
访问：http://localhost:3000

### 3. 打开开发者工具
- Windows/Linux: 按 `F12`
- Mac: 按 `Cmd + Option + I`
- 切换到 "Console"（控制台）标签

### 4. 测试国内认证
1. 点击页面上的"登录"或"注册"按钮
2. 填写邮箱和密码（如 `test@example.com` / `test123456`）
3. 点击提交

### 5. 查看控制台输出

**成功时的输出**：
```
✅ 国内注册成功: { success: true, message: '注册成功', user: {...} }
```

**失败时的输出**：
```
❌ 认证失败: [错误信息]
```

## 📂 相关文件

| 文件 | 说明 |
|------|------|
| `pages/api/auth-cn.ts` | 国内认证 API 接口 |
| `lib/auth-client-cn.ts` | 客户端函数（signupWithEmailCN, loginWithEmailCN） |
| `components/auth-modal.tsx` | 登录/注册模态框组件（已集成 IP 判断）|
| `contexts/geo-context.tsx` | 地理位置检测上下文 |
| `lib/supabase.ts` | Supabase 认证函数 |

## 🔄 代码逻辑

```typescript
// 判断地区
const isChinaRegion = FORCE_CHINA_FOR_TESTING || isChina

if (isChinaRegion) {
  // 🇨🇳 国内：CloudBase
  if (mode === "signup") {
    result = await signupWithEmailCN(email, password)
  } else {
    result = await loginWithEmailCN(email, password)
  }
} else {
  // 🌍 海外：Supabase
  if (mode === "signup") {
    const { data, error } = await auth.signUp(email, password)
  } else {
    const { data, error } = await auth.signIn(email, password)
  }
}
```

## ✅ 完成标志

测试成功后，您应该看到：
- 控制台显示"✅ 国内注册成功"或"✅ 国内登录成功"
- 用户信息被成功创建/查询
- 表单字段被清空

## 🚀 部署检查清单

- [ ] 删除或禁用 `FORCE_CHINA_FOR_TESTING` 硬编码
- [ ] 确保 `isChina` 从 `useGeo()` 正确获取
- [ ] 测试真实 IP 场景（使用 VPN 切换测试）
- [ ] 确认 CloudBase 环境变量配置正确
- [ ] 确认 Supabase 环境变量配置正确

## 📞 需要帮助？

如果遇到问题，请检查：
1. 控制台是否有错误信息
2. API 接口是否正常运行
3. 环境变量是否配置正确
4. 数据库连接是否正常

