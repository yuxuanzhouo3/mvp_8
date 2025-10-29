# 🔀 SiteHub 数据库平台分离方案

## 问题背景

SiteHub 有两个平台：
1. **微信小程序**（mvp8-sitehub-min-02）
2. **Web 官网**（当前项目）

两个平台共用一个 Supabase 数据库，但用户登录方式不同：
- **小程序**: 微信 OpenID 登录
- **官网**: Email/Password 登录 + Google OAuth

需要做好数据库表的区分，避免冲突。

---

## 📊 现有表结构分析

### 小程序已使用的表（`sitehub_` 前缀）

| 表名 | 用途 | 主键 |
|------|------|------|
| `sitehub_users` | 用户表（微信OpenID） | openid |
| `sitehub_subscriptions` | 订阅管理 | id, user_id |
| `sitehub_favorites` | 收藏夹 | id, user_id |
| `sitehub_custom_sites` | 自定义网站 | id, user_id |
| `sitehub_usage_stats` | 使用统计 | id |
| `sitehub_access_logs` | 访问日志 | id |
| `sitehub_payment_stats` | 支付统计 | id |
| `sitehub_teams` | 团队管理 | id |
| `sitehub_team_members` | 团队成员 | id |

### 官网已有的表（部分无前缀）

| 表名 | 用途 | 问题 |
|------|------|------|
| `user_favorites` | 收藏夹 | ⚠️ 与小程序功能重复 |
| `user_custom_sites` | 自定义网站 | ⚠️ 与小程序功能重复 |
| `auth.users` | Supabase 用户认证 | ✅ 官网专用 |

### 我刚设计的表（❌ 没有前缀，会冲突）

| 表名 | 用途 | 问题 |
|------|------|------|
| ❌ `subscriptions` | 订阅管理 | **与小程序 `sitehub_subscriptions` 冲突** |
| ❌ `payment_transactions` | 支付交易 | **可能与小程序支付统计冲突** |

---

## ✅ 解决方案：统一命名规范

### 方案对比

| 方案 | 小程序前缀 | 官网前缀 | 共享表前缀 | 优点 | 缺点 |
|------|-----------|---------|-----------|------|------|
| 方案A | `sitehub_` | `web_` | `shared_` | 清晰区分，易于维护 | 需要创建共享表视图 |
| 方案B | `mp_` | `web_` | 无前缀 | 更简洁 | 需要改小程序代码 |
| 方案C | `sitehub_mp_` | `sitehub_web_` | `sitehub_` | 统一 sitehub 品牌 | 表名过长 |

### **推荐：方案A**

保持小程序不变（`sitehub_`），官网使用 `web_` 前缀，共享统计使用 `shared_` 前缀。

---

## 📋 新的表命名规范

### 1. 小程序表（保持不变）

前缀：`sitehub_`

```
sitehub_users               # 微信用户（openid）
sitehub_subscriptions       # 小程序订阅
sitehub_favorites           # 小程序收藏
sitehub_custom_sites        # 小程序自定义网站
sitehub_usage_stats         # 小程序使用统计
sitehub_access_logs         # 小程序访问日志
sitehub_payment_stats       # 小程序支付统计
sitehub_teams               # 小程序团队
sitehub_team_members        # 小程序团队成员
```

### 2. 官网表（新增 `web_` 前缀）

前缀：`web_`

```
web_subscriptions           # 官网订阅（关联 auth.users）
web_payment_transactions    # 官网支付交易
web_favorites               # 官网收藏（关联 auth.users）
web_custom_sites            # 官网自定义网站（关联 auth.users）
```

**注意**：官网用户使用 Supabase 自带的 `auth.users` 表，不需要单独的 `web_users` 表。

### 3. 共享统计表（新增 `shared_` 前缀）

前缀：`shared_`

用于跨平台统计和数据分析：

```
shared_payment_transactions  # 所有平台的支付交易记录
shared_product_revenue       # 各产品收入统计（sitehub/morngpt等）
shared_user_growth           # 用户增长统计
shared_platform_comparison   # 平台对比数据
```

---

## 🔗 数据关系图

```
┌─────────────────────────────────┐
│      Supabase Database          │
└─────────────────────────────────┘
          │
          ├──────────────────────────────────────┐
          │                                      │
   ┌──────▼──────┐                      ┌───────▼──────┐
   │  小程序平台  │                      │   官网平台    │
   │  (WeChat)   │                      │    (Web)     │
   └──────┬──────┘                      └───────┬──────┘
          │                                      │
          ├─ sitehub_users                       ├─ auth.users (Supabase)
          ├─ sitehub_subscriptions               ├─ web_subscriptions
          ├─ sitehub_favorites                   ├─ web_favorites
          ├─ sitehub_custom_sites                ├─ web_custom_sites
          ├─ sitehub_payment_stats               ├─ web_payment_transactions
          └─ sitehub_teams                       │
                                                  │
          ┌───────────────────────────────────────┘
          │
   ┌──────▼──────────────────┐
   │    共享统计层 (Shared)   │
   └──────┬──────────────────┘
          │
          ├─ shared_payment_transactions  (汇总所有支付)
          ├─ shared_product_revenue       (产品收入统计)
          └─ shared_platform_comparison   (平台对比)
```

---

## 📝 字段映射关系

### 用户字段映射

| 概念 | 小程序字段 | 官网字段 | 共享字段 |
|------|-----------|---------|---------|
| 用户ID | `sitehub_users.id` | `auth.users.id` | `user_id` + `platform` |
| 用户标识 | `sitehub_users.openid` | `auth.users.email` | `user_identifier` |
| 昵称 | `sitehub_users.nickname` | `auth.users.raw_user_meta_data->>'full_name'` | `username` |
| 头像 | `sitehub_users.avatar` | `auth.users.raw_user_meta_data->>'avatar_url'` | `avatar_url` |

### 订阅字段映射

| 概念 | 小程序字段 | 官网字段 | 共享字段 |
|------|-----------|---------|---------|
| 订阅ID | `sitehub_subscriptions.id` | `web_subscriptions.id` | `subscription_id` |
| 用户ID | `sitehub_subscriptions.user_id` | `web_subscriptions.user_id` | `user_id` |
| 套餐类型 | `sitehub_subscriptions.plan_type` | `web_subscriptions.plan_type` | `plan_type` |
| 支付方式 | `sitehub_subscriptions.payment_method` (wechat/alipay) | `web_subscriptions.payment_method` (stripe/paypal) | `payment_method` |

---

## 🔧 迁移步骤

### 步骤 1: 重命名官网已有表

```sql
-- 重命名现有官网表
ALTER TABLE user_favorites RENAME TO web_favorites;
ALTER TABLE user_custom_sites RENAME TO web_custom_sites;

-- 更新外键引用（如果有）
-- 这里需要根据实际情况调整
```

### 步骤 2: 创建新的官网表

执行更新后的 SQL 脚本：
- `web_subscriptions_table.sql`
- `web_payment_transactions_table.sql`

### 步骤 3: 创建共享统计表

执行共享表 SQL 脚本：
- `shared_payment_transactions_table.sql`

### 步骤 4: 创建数据同步触发器

```sql
-- 当官网有新支付时，自动同步到共享表
CREATE OR REPLACE FUNCTION sync_web_payment_to_shared()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shared_payment_transactions (
    platform,
    user_id,
    user_identifier,
    product_name,
    plan_type,
    payment_method,
    gross_amount,
    payment_fee,
    profit,
    payment_time
  )
  VALUES (
    'web',
    NEW.user_id,
    NEW.user_email,
    NEW.product_name,
    NEW.plan_type,
    NEW.payment_method,
    NEW.gross_amount,
    NEW.payment_fee,
    NEW.profit,
    NEW.payment_time
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_web_payment_trigger
  AFTER INSERT ON web_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_web_payment_to_shared();
```

### 步骤 5: 更新官网 API 代码

将所有表名从：
- `subscriptions` → `web_subscriptions`
- `payment_transactions` → `web_payment_transactions`

---

## 📊 跨平台查询示例

### 1. 查询所有平台的总收入

```sql
SELECT
  SUM(gross_amount) / 100.0 as total_revenue,
  SUM(profit) / 100.0 as total_profit
FROM shared_payment_transactions
WHERE payment_status = 'completed';
```

### 2. 对比小程序和官网的收入

```sql
SELECT
  platform,
  COUNT(*) as transaction_count,
  SUM(gross_amount) / 100.0 as revenue,
  SUM(profit) / 100.0 as profit
FROM shared_payment_transactions
WHERE payment_status = 'completed'
GROUP BY platform;
```

**预期输出**：
| platform | transaction_count | revenue | profit |
|----------|------------------|---------|--------|
| miniprogram | 150 | $7,500.00 | $6,000.00 |
| web | 80 | $4,000.00 | $3,200.00 |

### 3. 查询所有平台的活跃会员数

```sql
-- 小程序活跃会员
SELECT COUNT(*) as mp_active_users
FROM sitehub_subscriptions
WHERE status = 'active';

-- 官网活跃会员
SELECT COUNT(*) as web_active_users
FROM web_subscriptions
WHERE status = 'active';

-- 合计（使用 UNION）
SELECT
  'miniprogram' as platform,
  COUNT(*) as active_users
FROM sitehub_subscriptions
WHERE status = 'active'

UNION ALL

SELECT
  'web' as platform,
  COUNT(*) as active_users
FROM web_subscriptions
WHERE status = 'active';
```

---

## ⚠️ 注意事项

### 1. 用户账号不互通

- **小程序用户**: 只能在小程序内使用，基于微信 OpenID
- **官网用户**: 只能在官网使用，基于 Email/Password 或 Google OAuth
- **未来扩展**: 可以通过绑定邮箱实现账号互通

### 2. 订阅不互通

- 小程序购买的会员不能在官网使用（反之亦然）
- 如需互通，需要实现账号绑定功能

### 3. 支付方式不同

- **小程序**: 微信支付、支付宝
- **官网**: Stripe、PayPal（、支付宝）

### 4. 数据同步策略

- **实时同步**: 使用触发器同步关键数据到 `shared_` 表
- **定时同步**: 使用 Cron Job 定时汇总统计数据
- **按需查询**: Dashboard 页面实时查询各平台数据

---

## 📋 待办事项

- [ ] 更新官网表名（加 `web_` 前缀）
- [ ] 创建共享统计表（`shared_` 前缀）
- [ ] 更新官网 API 代码中的表名
- [ ] 创建数据同步触发器
- [ ] 测试跨平台数据查询
- [ ] 创建 Dashboard 展示两个平台的数据对比

---

## ✅ 总结

| 方面 | 小程序 | 官网 | 共享 |
|------|--------|------|------|
| **表前缀** | `sitehub_` | `web_` | `shared_` |
| **用户表** | `sitehub_users` | `auth.users` | - |
| **订阅表** | `sitehub_subscriptions` | `web_subscriptions` | - |
| **支付记录** | `sitehub_payment_stats` | `web_payment_transactions` | `shared_payment_transactions` |
| **登录方式** | 微信 OpenID | Email/Google OAuth | - |
| **支付方式** | 微信支付、支付宝 | Stripe、PayPal | 所有 |
| **货币** | CNY（人民币） | USD（美元） | 多币种 |

这样的设计确保了：
- ✅ 小程序和官网数据完全隔离，互不影响
- ✅ 可以单独统计各平台数据
- ✅ 可以汇总查看总体数据
- ✅ 未来可以扩展账号绑定功能
