# 🔧 环境变量配置指南

## 📋 文件说明

### 1️⃣ `.env.local` (本地开发,**不推送**)
- **位置**: 项目根目录
- **用途**: 本地开发时使用,包含真实密钥
- **状态**: ✅ 已在`.gitignore`中,不会被推送到GitHub
- **谁需要**: 所有开发者本地电脑

### 2️⃣ `.env.example` (模板,**可推送**)
- **位置**: 项目根目录
- **用途**: 配置模板,不包含真实值
- **状态**: ✅ 已推送到GitHub
- **谁需要**: 新加入项目的开发者

---

## 🚀 本地开发设置

### 步骤1: 复制模板
```bash
cp .env.example .env.local
```

### 步骤2: 填写真实值

打开`.env.local`,填写以下内容:

```env
# Supabase配置 (海外用户)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 腾讯云CloudBase配置 (国内用户)
CLOUDBASE_ENV=cloudbaselogin
NEXT_PUBLIC_CLOUDBASE_ENV=cloudbaselogin

# CloudBase密钥 (服务端专用)
CLOUDBASE_SECRET_ID=your_cloudbase_secret_id_here
CLOUDBASE_SECRET_KEY=your_cloudbase_secret_key_here

# 网站URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 步骤3: 重启开发服务器
```bash
npm run dev
```

---

## 🌐 生产环境(Vercel)部署

### 在Vercel Dashboard设置环境变量:

1. 进入项目 Settings → Environment Variables
2. 添加以下变量:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | Supabase项目URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbG... | Supabase匿名密钥 |
| `CLOUDBASE_ENV` | cloudbaselogin | CloudBase环境ID |
| `NEXT_PUBLIC_CLOUDBASE_ENV` | cloudbaselogin | 客户端使用 |
| `CLOUDBASE_SECRET_ID` | your_secret_id | CloudBase密钥ID |
| `CLOUDBASE_SECRET_KEY` | your_secret_key | CloudBase密钥Key |
| `NEXT_PUBLIC_SITE_URL` | https://yourdomain.com | 生产域名 |

**⚠️ 安全提示:**
- `CLOUDBASE_SECRET_*` 只在服务端使用,不要加`NEXT_PUBLIC_`前缀
- Vercel会自动加密这些变量

---

## 🔐 密钥管理最佳实践

### ✅ 正确做法:
- `.env.local` → 本地开发,**不推送**
- `.env.example` → 模板,**可推送**
- Vercel/生产环境 → 在Dashboard配置

### ❌ 错误做法:
- ❌ 把`.env.local`推送到Git
- ❌ 在代码中硬编码密钥
- ❌ 把密钥写在README中

---

## 📊 当前配置状态

| 配置项 | 本地 | GitHub | Vercel |
|--------|------|--------|--------|
| `.env.local` | ✅ 已创建 | 🚫 被忽略 | ➖ 不需要 |
| `.env.example` | ✅ 已创建 | ✅ 已推送 | ➖ 不需要 |
| 环境变量 | ✅ 本地读取 | ➖ 不存储 | ⏳ 待配置 |

---

## 🧪 验证配置

### 检查本地环境变量:
```bash
# 检查文件是否存在
test -f .env.local && echo "✅ .env.local 存在" || echo "❌ 未找到"

# 检查是否被gitignore
git check-ignore .env.local && echo "✅ 安全(会被忽略)" || echo "⚠️ 可能会被推送"
```

### 测试API是否能读取密钥:
访问: `http://localhost:3000/api/test-env`

---

## 🆘 常见问题

### Q1: 为什么我本地运行报错"缺少环境变量"?
**A:** 您需要创建`.env.local`文件并填写真实值。执行:
```bash
cp .env.example .env.local
# 然后编辑.env.local填写真实密钥
```

### Q2: 我可以把`.env.local`推送到GitHub吗?
**A:** ❌ **绝对不可以!** 这会泄露密钥。`.env.local`已在`.gitignore`中被忽略。

### Q3: Vercel部署后为什么报错"未找到密钥"?
**A:** 需要在Vercel Dashboard手动配置环境变量,不会自动读取`.env.local`。

### Q4: 如何更换CloudBase密钥?
**A:**
1. 本地: 修改`.env.local`
2. Vercel: 在Dashboard更新环境变量
3. ⚠️ 不要修改代码中的硬编码值

---

## 📝 相关文件

- `.env.local` - 本地开发配置(不推送)
- `.env.example` - 配置模板(已推送)
- `.gitignore` - 确保`.env.local`被忽略
- `app/api/auth/email/route.ts` - 使用CloudBase密钥
- `lib/cloudbase-auth.ts` - CloudBase客户端配置

---

**✅ 配置完成后,您就可以:**
- 在本地测试国内用户CloudBase登录
- 在Vercel部署生产环境
- 安全地管理所有密钥

**需要帮助?** 联系: mornscience@gmail.com
