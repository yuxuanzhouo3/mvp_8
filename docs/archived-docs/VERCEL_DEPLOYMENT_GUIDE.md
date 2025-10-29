# Vercel 部署问题解决方案

## 🔴 问题 1：Vercel 部署后支付失败

### 错误现象：
点击支付按钮后显示：**"Failed to start checkout. Please try again."**

### 根本原因：
Vercel 部署时，`.env.local` 文件**不会自动上传**。所有环境变量需要在 Vercel 后台手动配置。

---

## ✅ 解决方案：在 Vercel 添加环境变量

### 步骤 1：登录 Vercel Dashboard
1. 访问：https://vercel.com/dashboard
2. 选择你的项目（SiteHub）
3. 点击 **Settings** → **Environment Variables**

### 步骤 2：添加所有必需的环境变量

**重要：需要添加以下所有变量**

#### Supabase 配置（3个）
```
NEXT_PUBLIC_SUPABASE_URL=https://ykirhilnbvsanqyenusf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3MDk5NCwiZXhwIjoyMDY4NTQ2OTk0fQ.hHRg85NvVmz6gbqCaWbRNyeOLDF-Ch1dUKoScl9vzJA
```

#### Stripe 配置（3个）
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

#### PayPal 配置（3个）
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET
PAYPAL_MODE=production
```

#### Site URL（1个）⚠️ 重要：需要改成生产域名
```
NEXT_PUBLIC_SITE_URL=https://www.mornhub.help
```

**注意：**
- `NEXT_PUBLIC_SITE_URL` 必须改成你的**生产域名**（例如：`https://www.mornhub.help`）
- 如果是 Vercel 提供的域名，格式为：`https://your-project.vercel.app`
- **不能用** `localhost:3001`，否则支付回调会失败

### 步骤 3：为每个环境变量选择适用环境

对于每个环境变量，勾选：
- ✅ **Production** (生产环境，必选)
- ✅ **Preview** (预览环境，可选)
- ✅ **Development** (开发环境，可选)

### 步骤 4：重新部署

添加完所有环境变量后：
1. 点击 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 等待部署完成（约2-3分钟）

---

## 🔴 问题 2：用户数据丢失（收藏夹和自定义网站）

### 错误现象：
推送新代码到 Vercel 后，用户的收藏夹和自定义网站数据丢失。

### 根本原因：

**当前数据存储方式：**
目前 SiteHub 使用 **localStorage（浏览器本地存储）** 来保存用户数据：
- 收藏夹：`sitehub-favorites`
- 自定义网站：`sitehub-sites`

**为什么会丢失数据：**
1. ❌ **localStorage 绑定到域名**：不同的域名有独立的 localStorage
2. ❌ **没有使用 Supabase 数据库**：数据只存在用户浏览器中
3. ❌ **清除浏览器缓存会丢失**：用户清除缓存或换设备就丢失

### 问题分析：

查看代码（`app/page.tsx` 第 46-63 行）：

```typescript
// 当前实现：只使用 localStorage
useEffect(() => {
  const savedSites = localStorage.getItem("sitehub-sites")
  const savedFavorites = localStorage.getItem("sitehub-favorites")

  if (savedSites) {
    setSites(JSON.parse(savedSites))
  }

  if (savedFavorites) {
    setFavorites(JSON.parse(savedFavorites))
  }
}, [user.type])
```

**问题：**
- 没有使用 Supabase 数据库存储
- 数据无法跨设备同步
- 推送新代码、更换域名、清除缓存都会导致数据丢失

---

## ✅ 解决方案：迁移到 Supabase 数据库

### 当前状态：
- ❌ 收藏夹和自定义网站数据存储在 localStorage
- ❌ 没有使用 Supabase 数据库表
- ❌ 无法跨设备同步

### 需要做的改动：

#### 1. 在 Supabase 创建数据表

**需要创建 2 个表：**

##### 表 1：`user_favorites` (用户收藏夹)

```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- 创建索引提升查询速度
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的收藏
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);
```

##### 表 2：`user_custom_sites` (用户自定义网站)

```sql
CREATE TABLE user_custom_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询速度
CREATE INDEX idx_user_custom_sites_user_id ON user_custom_sites(user_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_custom_sites ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的自定义网站
CREATE POLICY "Users can view their own custom sites"
  ON user_custom_sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom sites"
  ON user_custom_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom sites"
  ON user_custom_sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom sites"
  ON user_custom_sites FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2. 修改代码使用 Supabase

需要修改以下文件：
- `app/page.tsx` - 主页面，加载收藏和自定义网站
- `components/add-site-modal.tsx` - 添加自定义网站
- `components/ultra-compact-site-grid.tsx` - 显示网站和收藏按钮

**示例代码修改：**

```typescript
// app/page.tsx 修改后的代码片段

import { createClient } from '@/lib/supabase/client'

export default function SiteHub() {
  const { user } = useAuth()
  const supabase = createClient()

  // 加载收藏夹（从 Supabase）
  useEffect(() => {
    async function loadFavorites() {
      if (user.type === 'authenticated' && user.id) {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('site_id')
          .eq('user_id', user.id)

        if (data) {
          const favoriteSiteIds = data.map(fav => fav.site_id)
          setFavorites(favoriteSiteIds)
        }
      } else {
        // Guest users: use localStorage
        const savedFavorites = localStorage.getItem('sitehub-favorites')
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites))
        }
      }
    }

    loadFavorites()
  }, [user])

  // 加载自定义网站（从 Supabase）
  useEffect(() => {
    async function loadCustomSites() {
      if (user.type === 'authenticated' && user.id) {
        const { data, error } = await supabase
          .from('user_custom_sites')
          .select('*')
          .eq('user_id', user.id)

        if (data) {
          const customSites = data.map(site => ({
            id: site.id,
            name: site.name,
            url: site.url,
            logo: site.logo,
            category: site.category,
            custom: true,
          }))

          // 合并默认网站和自定义网站
          setSites([...getDefaultSites(), ...customSites])
        }
      } else {
        // Guest users: use localStorage
        const savedSites = localStorage.getItem('sitehub-sites')
        if (savedSites) {
          setSites(JSON.parse(savedSites))
        } else {
          setSites(getDefaultSites())
        }
      }
    }

    loadCustomSites()
  }, [user])

  // 添加收藏（保存到 Supabase）
  const handleAddFavorite = async (siteId: string) => {
    if (user.type === 'authenticated' && user.id) {
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, site_id: siteId })

      setFavorites([...favorites, siteId])
    } else {
      // Guest users: use localStorage
      const newFavorites = [...favorites, siteId]
      setFavorites(newFavorites)
      localStorage.setItem('sitehub-favorites', JSON.stringify(newFavorites))
    }
  }

  // 移除收藏（从 Supabase 删除）
  const handleRemoveFavorite = async (siteId: string) => {
    if (user.type === 'authenticated' && user.id) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('site_id', siteId)

      setFavorites(favorites.filter(id => id !== siteId))
    } else {
      // Guest users: use localStorage
      const newFavorites = favorites.filter(id => id !== siteId)
      setFavorites(newFavorites)
      localStorage.setItem('sitehub-favorites', JSON.stringify(newFavorites))
    }
  }
}
```

---

## 📊 总结：两个问题的完整解决方案

### 问题 1：Vercel 支付失败
**解决方案：** 在 Vercel 后台添加所有环境变量
- ✅ Supabase 配置（3个）
- ✅ Stripe 配置（3个）
- ✅ PayPal 配置（3个）
- ✅ Site URL（改成生产域名）

### 问题 2：用户数据丢失
**根本原因：** 使用 localStorage 存储，没有用 Supabase 数据库

**解决方案分两步：**

#### 临时方案（快速）：
告知用户数据存储在浏览器本地，建议：
- 不要清除浏览器缓存
- 不要更换设备
- 定期导出收藏和自定义网站

#### 永久方案（推荐）✅
1. **在 Supabase 创建数据表**
   - `user_favorites` - 用户收藏夹
   - `user_custom_sites` - 用户自定义网站

2. **修改代码使用数据库**
   - 登录用户：数据保存到 Supabase
   - 游客用户：数据保存到 localStorage

3. **数据迁移脚本**
   - 一次性将 localStorage 数据迁移到 Supabase
   - 避免用户数据丢失

---

## 🚀 建议行动步骤

### 立即执行（解决支付问题）：
1. ✅ Jeff 在 Vercel 后台添加所有环境变量
2. ✅ 修改 `NEXT_PUBLIC_SITE_URL` 为生产域名
3. ✅ 重新部署 Vercel
4. ✅ 测试 Stripe 和 PayPal 支付

**预计时间：** 15 分钟

### 后续执行（解决数据丢失）：
1. 在 Supabase 创建 2 个数据表
2. 修改代码使用数据库存储
3. 编写数据迁移脚本
4. 重新部署

**预计时间：** 4-6 小时

---

## ❓ 回答 Jeff 的问题

### Q1: 是否对 Supabase 相关的数据表做了什么改动？
**答：没有。**
- 当前代码**没有使用** Supabase 数据库表存储收藏和自定义网站
- 所有数据都存在 `localStorage`（浏览器本地）
- 这就是为什么推送新代码或换域名后数据会丢失

### Q2: 可能本身就有这个 bug？
**答：是的，这是设计缺陷。**
- 不是 bug，而是**初始设计就没有用数据库**
- `localStorage` 无法跨设备同步，推送新代码也容易丢失
- 需要改用 **Supabase 数据库**才能彻底解决

### Q3: 存到了什么 DB table？
**答：目前没有存到任何数据库表。**
- 收藏夹：存在 `localStorage` 的 `sitehub-favorites` 键
- 自定义网站：存在 `localStorage` 的 `sitehub-sites` 键
- **建议创建**：
  - `user_favorites` 表（收藏夹）
  - `user_custom_sites` 表（自定义网站）

---

**生成时间：** 2025-01-07
**作者：** SiteHub Development Team
