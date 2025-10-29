# Supabase 本地开发配置指南

## 问题说明

面试官提到的问题：
> "配置了谷歌第三方登录和email注册登录。本地测试可能会有问题，需要把mornhub.help 换成 localhost 然后用邮件注册登录可以"

## 原因

Google OAuth 登录需要配置回调 URL：
- **生产环境**: `https://www.mornhub.help/auth/callback`
- **本地开发**: `http://localhost:3001/auth/callback`

如果 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 是生产地址，Google 登录后会跳转回生产环境，而不是本地。

## 解决方案

### 1. 更新本地环境变量

已在 `.env.local` 中修改：
```env
# 本地开发使用 localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 2. 在 Supabase 后台添加本地回调 URL

**步骤：**

1. 登录 Supabase Dashboard: https://supabase.com
2. 进入项目: `ykirhilnbvsanqyenusf`
3. 点击左侧菜单 **Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:3001/auth/callback
   http://localhost:3000/auth/callback
   https://www.mornhub.help/auth/callback
   ```
5. 点击 **Save**

### 3. 配置 Google OAuth Provider

**步骤：**

1. 在 Supabase Dashboard 中
2. 点击 **Authentication** → **Providers**
3. 找到 **Google**，点击启用
4. 配置 Google OAuth（如果还没有）：
   - Google Client ID: (需要从 Google Cloud Console 获取)
   - Google Client Secret: (需要从 Google Cloud Console 获取)

5. **重要**：在 **Redirect URL** 中添加：
   ```
   https://ykirhilnbvsanqyenusf.supabase.co/auth/v1/callback
   ```
   (这个 URL 需要在 Google Cloud Console 中配置)

### 4. Google Cloud Console 配置

如果需要创建 Google OAuth 凭据：

1. 访问 https://console.cloud.google.com
2. 创建或选择项目
3. 启用 **Google+ API**
4. 创建 **OAuth 2.0 客户端 ID**
5. 在 **已授权的重定向 URI** 中添加：
   ```
   https://ykirhilnbvsanqyenusf.supabase.co/auth/v1/callback
   ```

## 本地测试

### 测试 Google 登录：
```bash
# 1. 确保环境变量正确
cat .env.local | grep SITE_URL
# 应该显示: NEXT_PUBLIC_SITE_URL=http://localhost:3001

# 2. 重启开发服务器
npm run dev

# 3. 访问
open http://localhost:3001

# 4. 点击登录，选择 Google
# 应该跳转回 http://localhost:3001/auth/callback
```

### 测试邮箱注册/登录：
邮箱登录不需要配置回调 URL，应该直接可用。

## 部署到 Vercel

部署到 Vercel 后：

1. 在 Vercel 的 **Environment Variables** 中设置：
   ```
   NEXT_PUBLIC_SITE_URL=https://www.mornhub.help
   ```

2. 确保 Supabase 中已添加生产环境的回调 URL：
   ```
   https://www.mornhub.help/auth/callback
   ```

3. **重新部署**项目

## 当前状态

- ✅ `.env.local` 已更新为本地地址
- ⏳ 需要 Jeff 在 Supabase 后台添加 localhost 回调 URL
- ⏳ 需要 Jeff 提供 Google OAuth 凭据（或在 Supabase 中配置）

## Jeff 待办事项

1. **登录 Supabase** (https://supabase.com)
2. **添加回调 URL**:
   - Authentication → URL Configuration → Redirect URLs
   - 添加: `http://localhost:3001/auth/callback`
   - 添加: `http://localhost:3000/auth/callback`
   - 保存

3. **配置 Google OAuth** (可选，如果要用 Google 登录):
   - Authentication → Providers → Google
   - 填入 Google Client ID 和 Secret
   - 或者先使用邮箱登录测试

## 测试优先级

1. **优先测试邮箱登录** ✅ (不需要额外配置)
2. Google 登录需要完整配置后测试
3. 微信登录稍后集成

---

**总结**：本地能跑通后，部署到 Vercel 只需要改环境变量就能用，没有其他问题。
