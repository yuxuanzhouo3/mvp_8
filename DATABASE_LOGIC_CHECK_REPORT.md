# 🔍 SiteHub 数据库逻辑完整性检查报告

## 执行日期
2025-01-13

## 检查目的
确保官网前端和数据库表之间的逻辑自洽，包括：
- 收藏功能
- 支付功能
- 自定义网站功能
- 用户认证功能

---

## 🚨 发现的严重问题

### 问题 1: 表名不匹配（会导致功能全部失效！）

#### 前端代码使用的表名（app/page.tsx）
```typescript
// 收藏功能
.from("user_favorites")      // Line 165, 180, 444, 482, 492, 527

// 自定义网站功能
.from("user_custom_sites")   // Line 206, 235, 420, 519
```

#### 我们的清理脚本会创建的表名（SUPABASE_CLEANUP_FIX.sql）
```sql
ALTER TABLE user_favorites RENAME TO web_favorites;
ALTER TABLE user_custom_sites RENAME TO web_custom_sites;
```

#### 结果
❌ **前端会无法找到表，所有收藏和自定义网站功能都会失效！**

---

## 📊 功能逻辑检查

### 1. 收藏功能 ⚠️ 需要修复

#### 数据流程
```
用户点击收藏按钮
  ↓
前端调用: supabase.from("user_favorites").insert(...)
  ↓
数据库: user_favorites 表
  ↓
前端显示: 收藏成功 ⭐
```

#### 当前状态
- ❌ 前端使用 `user_favorites`
- ❌ Supabase 中表名被重命名为 `web_favorites`（如果执行了清理脚本）
- **结果**: 收藏功能失效

#### 数据库表结构检查
```sql
-- user_favorites 表（官网旧表）
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  site_id TEXT NOT NULL,
  created_at TIMESTAMP
);
```

✅ 表结构正确，支持：
- 用户ID关联
- 网站ID存储
- 创建时间

❌ 但表名与前端不匹配！

---

### 2. 自定义网站功能 ⚠️ 需要修复

#### 数据流程
```
用户添加自定义网站
  ↓
前端调用: supabase.from("user_custom_sites").insert(...)
  ↓
数据库: user_custom_sites 表
  ↓
前端显示: 网站已添加 ✨
```

#### 当前状态
- ❌ 前端使用 `user_custom_sites`
- ❌ Supabase 中表名被重命名为 `web_custom_sites`（如果执行了清理脚本）
- **结果**: 添加自定义网站功能失效

#### 数据库表结构检查
```sql
-- user_custom_sites 表（官网旧表）
CREATE TABLE user_custom_sites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

✅ 表结构正确，支持：
- 用户ID关联
- 网站信息存储
- 分类管理

❌ 但表名与前端不匹配！

---

### 3. 支付功能 ✅ 逻辑正确（但需要更新代码）

#### PayPal 支付流程
```
用户选择 PayPal 支付
  ↓
前端: POST /api/payment/paypal/create
  ↓
PayPal: 创建订单，返回 approval URL
  ↓
用户在 PayPal 页面完成支付
  ↓
回调: /payment/success?token=xxx
  ↓
前端: POST /api/payment/paypal/capture
  ↓
后端: capture 订单，写入数据库
  ↓
数据库: subscriptions 表（❌ 应该是 web_subscriptions）
```

#### 当前代码（app/api/payment/paypal/capture/route.ts）
```typescript
// Line 73
const { error } = await supabase.from('subscriptions').upsert({...})
```

❌ **问题**: 引用的是 `subscriptions`（没有前缀），应该是 `web_subscriptions`

#### Stripe 支付流程
```
用户选择 Stripe 支付
  ↓
前端: POST /api/payment/stripe/create
  ↓
Stripe: 创建 Checkout Session
  ↓
用户在 Stripe 页面完成支付
  ↓
Webhook: POST /api/payment/stripe/webhook
  ↓
后端: 验证签名，写入数据库
  ↓
数据库: subscriptions 表（❌ 应该是 web_subscriptions）
```

#### 当前代码（app/api/payment/stripe/webhook/route.ts）
```typescript
// Line 59
const { error } = await supabase.from('subscriptions').upsert({...})
```

❌ **问题**: 引用的是 `subscriptions`（没有前缀），应该是 `web_subscriptions`

---

### 4. 用户认证功能 ✅ 逻辑正确

#### 认证流程
```
用户注册/登录
  ↓
Supabase Auth: 处理认证
  ↓
数据库: auth.users 表（Supabase 自带）
  ↓
前端: 获取用户 session
  ↓
后续操作: 使用 user.id 关联数据
```

✅ 认证功能完全由 Supabase Auth 管理，不需要修改

---

## 🔄 数据关联检查

### 收藏功能 → 用户关联
```sql
-- 检查外键
SELECT * FROM user_favorites WHERE user_id = 'xxx';
```
✅ 正确关联到 `auth.users`

### 自定义网站 → 用户关联
```sql
-- 检查外键
SELECT * FROM user_custom_sites WHERE user_id = 'xxx';
```
✅ 正确关联到 `auth.users`

### 支付记录 → 订阅关联
```sql
-- 检查外键
SELECT * FROM web_payment_transactions WHERE subscription_id = 'xxx';
```
⚠️ 引用 `web_subscriptions`，需要确保表名一致

---

## ✅ 解决方案

### 方案 A: 保持前端代码不变，不重命名表（推荐）

**修改 SUPABASE_CLEANUP_FIX.sql**:

```sql
-- 删除这两行（不重命名官网表）
-- ALTER TABLE IF EXISTS user_favorites RENAME TO web_favorites;
-- ALTER TABLE IF EXISTS user_custom_sites RENAME TO web_custom_sites;
```

**优点**:
- ✅ 前端代码不需要修改
- ✅ 现有功能继续正常工作
- ✅ 只需删除冲突的 `subscriptions` 表

**缺点**:
- ⚠️ 表名不统一（`user_*` vs `web_*`）
- ⚠️ 需要更新文档说明

**最终表命名**:
```
小程序: sitehub_*
官网订阅: web_subscriptions, web_payment_transactions
官网其他: user_favorites, user_custom_sites
```

### 方案 B: 更新前端代码，使用统一的 `web_` 前缀

**需要修改的前端代码（app/page.tsx）**:

```typescript
// 替换所有出现的地方
.from("user_favorites")      → .from("web_favorites")
.from("user_custom_sites")   → .from("web_custom_sites")
```

**需要修改的位置**:
- Line 165: 加载收藏
- Line 180: 迁移收藏到 Supabase
- Line 206: 加载自定义网站
- Line 235: 迁移自定义网站到 Supabase
- Line 420: 添加自定义网站
- Line 444: 自动添加到收藏
- Line 482: 删除收藏
- Line 492: 添加收藏
- Line 519: 删除自定义网站
- Line 527: 删除关联收藏

**优点**:
- ✅ 表名统一，都使用 `web_` 前缀
- ✅ 更清晰的命名规范

**缺点**:
- ⚠️ 需要修改多处前端代码
- ⚠️ 需要重新测试所有功能

---

## 📋 推荐方案：方案 A

### 为什么选择方案 A？

1. **风险最小**: 不需要修改前端代码，避免引入新bug
2. **兼容性好**: 现有功能继续正常工作
3. **快速部署**: 只需修改清理脚本，立即可用

### 最终表命名规范（方案 A）

| 功能模块 | 表名 | 前缀 | 说明 |
|---------|------|------|------|
| **小程序** | | | |
| 用户 | `sitehub_users` | `sitehub_` | 微信用户 |
| 订阅 | `sitehub_subscriptions` | `sitehub_` | 小程序订阅 |
| 收藏 | `sitehub_favorites` | `sitehub_` | 小程序收藏 |
| 自定义网站 | `sitehub_custom_sites` | `sitehub_` | 小程序自定义 |
| **官网（支付相关）** | | | |
| 订阅 | `web_subscriptions` | `web_` | 官网订阅 |
| 支付交易 | `web_payment_transactions` | `web_` | 支付统计 |
| **官网（用户数据）** | | | |
| 收藏 | `user_favorites` | `user_` | 官网收藏 |
| 自定义网站 | `user_custom_sites` | `user_` | 官网自定义 |
| **系统表** | | | |
| 用户认证 | `auth.users` | `auth.` | Supabase Auth |

### 修改后的清理脚本

```sql
-- 只删除冲突的 subscriptions 表
DROP TABLE IF EXISTS subscriptions CASCADE;

-- 不重命名 user_favorites 和 user_custom_sites
-- （保持前端代码兼容）

-- 修复 web_payment_transactions 外键
ALTER TABLE web_payment_transactions
DROP CONSTRAINT IF EXISTS web_payment_transactions_subscription_id_fkey;

ALTER TABLE web_payment_transactions
ADD CONSTRAINT web_payment_transactions_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES web_subscriptions(id)
ON DELETE SET NULL;
```

---

## 🔧 需要修复的代码

### 1. app/api/payment/paypal/capture/route.ts

**Line 73** - 修改前:
```typescript
const { error } = await supabase.from('subscriptions').upsert({...})
```

**修改后**:
```typescript
const { error: subError } = await supabase.from('web_subscriptions').upsert({...})

// 同时添加支付交易记录
const { error: txError } = await supabase.from('web_payment_transactions').insert({...})
```

### 2. app/api/payment/stripe/webhook/route.ts

**Line 59** - 修改前:
```typescript
const { error } = await supabase.from('subscriptions').upsert({...})
```

**修改后**:
```typescript
const { error: subError } = await supabase.from('web_subscriptions').upsert({...})

// 同时添加支付交易记录
const { error: txError } = await supabase.from('web_payment_transactions').insert({...})
```

---

## ✅ 功能测试清单

修复后需要测试以下功能：

### 收藏功能
- [ ] 登录用户点击收藏，数据写入 `user_favorites`
- [ ] 刷新页面，收藏状态保持
- [ ] 取消收藏，数据从 `user_favorites` 删除
- [ ] 游客点击收藏，数据存储在 localStorage

### 自定义网站功能
- [ ] 登录用户添加自定义网站，数据写入 `user_custom_sites`
- [ ] 刷新页面，自定义网站仍然显示
- [ ] 删除自定义网站，数据从 `user_custom_sites` 删除
- [ ] 添加时自动收藏，数据同时写入 `user_favorites`

### 支付功能
- [ ] PayPal 支付成功，数据写入 `web_subscriptions` 和 `web_payment_transactions`
- [ ] Stripe 支付成功，数据写入 `web_subscriptions` 和 `web_payment_transactions`
- [ ] 查询 `web_subscriptions` 可以看到订阅记录
- [ ] 查询 `web_payment_transactions` 可以看到支付记录
- [ ] 统计视图正确显示利润数据

---

## 📊 总结

### 当前问题
1. ❌ `subscriptions` 表没有前缀，需要删除
2. ❌ 支付 API 引用的表名错误
3. ⚠️ 前端使用 `user_*` 表名，但清理脚本会重命名为 `web_*`

### 解决方案（方案 A）
1. ✅ 删除 `subscriptions` 表
2. ✅ 保留 `user_favorites` 和 `user_custom_sites`（不重命名）
3. ✅ 更新支付 API 代码使用 `web_subscriptions`
4. ✅ 添加 `web_payment_transactions` 写入逻辑

### 最终结果
- ✅ 小程序和官网数据完全隔离（`sitehub_*` vs `user_*`/`web_*`）
- ✅ 收藏和自定义网站功能正常工作
- ✅ 支付功能正确写入订阅和交易记录
- ✅ 可以统计各产品的利润数据

---

**下一步**:
1. 修改 `SUPABASE_CLEANUP_FIX.sql`（移除重命名语句）
2. 执行清理脚本
3. 更新支付 API 代码
4. 测试所有功能
