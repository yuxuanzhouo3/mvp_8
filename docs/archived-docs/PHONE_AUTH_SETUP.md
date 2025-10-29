# 📱 Supabase 手机验证设置指南

## 🎯 概述

本项目已集成 Supabase 手机验证功能，使用 Supabase 原生的短信服务，无需额外配置第三方服务。

## ✅ 免费额度

- **每月 50,000 次短信** - 完全免费
- **超出后**: 约 $0.0075/次
- **覆盖范围**: 全球

## 🔧 Supabase 配置步骤

### 1. 启用手机验证

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** → **Settings**
4. 在 **Phone Auth** 部分：
   - ✅ 启用 **Enable phone confirmations**
   - ✅ 启用 **Enable phone change confirmations**

### 2. 配置短信模板

在 **Authentication** → **Templates** 中：

#### SMS 模板示例：
```
Your verification code is: {{ .Code }}

Valid for 10 minutes.
```

#### 自定义消息（可选）：
```
SiteHub: Your verification code is {{ .Code }}. Valid for 10 minutes.
```

### 3. 设置重定向 URL

在 **Authentication** → **URL Configuration** 中：
- 添加你的域名到 **Site URL**
- 确保 **Redirect URLs** 包含你的回调地址

## 🚀 功能特性

### 已实现的功能：
- ✅ 手机号输入和验证
- ✅ 6位数字OTP验证
- ✅ 自动格式化手机号
- ✅ 错误处理和重试
- ✅ 用户友好的界面
- ✅ 与现有认证系统集成

### 用户体验：
- 📱 两步验证流程
- 🔄 可重新发送验证码
- ⚡ 实时验证反馈
- 🎨 现代化UI设计

## 📋 使用流程

### 用户注册/登录流程：
1. 用户点击 "Continue with Phone"
2. 输入手机号（带国家代码）
3. 点击 "Send Verification Code"
4. 接收SMS验证码
5. 输入6位验证码
6. 点击 "Verify & Sign In"
7. 自动登录并跳转

### 示例手机号格式：
- `+1 (555) 123-4567` (美国)
- `+86 138 0013 8000` (中国)
- `+44 20 7946 0958` (英国)

## 🔒 安全特性

- **OTP有效期**: 10分钟
- **重试限制**: 防止滥用
- **手机号验证**: 确保真实手机号
- **会话管理**: 安全的用户会话

## 🛠️ 技术实现

### 核心文件：
- `lib/supabase.ts` - 手机验证API
- `components/phone-auth-modal.tsx` - 手机验证界面
- `components/auth-modal.tsx` - 集成手机登录选项

### API 方法：
```javascript
// 发送验证码
await auth.signInWithPhone(phoneNumber)

// 验证OTP
await auth.verifyPhoneOTP(phoneNumber, otpCode)
```

## 📊 监控和统计

### 在 Supabase Dashboard 中查看：
- **Authentication** → **Users** - 查看手机验证用户
- **Authentication** → **Logs** - 查看验证日志
- **Usage** - 查看短信使用量

## 🚨 注意事项

### 开发环境：
- 确保 `.env.local` 包含正确的 Supabase 配置
- 测试时使用真实手机号
- 注意短信发送频率限制

### 生产环境：
- 配置正确的域名和重定向URL
- 监控短信使用量和成本
- 设置适当的错误处理

## 🔄 故障排除

### 常见问题：

1. **验证码未收到**
   - 检查手机号格式
   - 确认国家代码正确
   - 检查垃圾短信文件夹

2. **验证失败**
   - 确认输入的是6位数字
   - 检查是否在10分钟内完成
   - 尝试重新发送验证码

3. **API错误**
   - 检查 Supabase 配置
   - 确认手机验证已启用
   - 查看 Supabase 日志

## 📞 支持

如果遇到问题：
1. 检查 Supabase Dashboard 日志
2. 确认配置正确
3. 查看浏览器控制台错误
4. 联系技术支持

---

**注意**: 手机验证功能已完全集成到现有认证系统中，用户可以选择 Google、邮箱或手机号登录。 