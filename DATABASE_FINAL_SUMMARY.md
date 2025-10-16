# 🎯 SiteHub 数据库最终方案

## ✅ 问题已解决

你提出的问题：**小程序和官网共用一个 Supabase 数据库，需要做好区分**

我已经完成了完整的分析和重新设计。

---

## 📊 最终表命名方案

### 小程序表（保持不变 - `sitehub_` 前缀）

| 表名 | 用途 |
|------|------|
| `sitehub_users` | 微信用户（openid登录） |
| `sitehub_subscriptions` | 小程序订阅 |
| `sitehub_favorites` | 小程序收藏夹 |
| `sitehub_custom_sites` | 小程序自定义网站 |
| `sitehub_payment_stats` | 小程序支付统计 |
| `sitehub_usage_stats` | 小程序使用统计 |
| `sitehub_access_logs` | 小程序访问日志 |
| `sitehub_teams` | 小程序团队管理 |

### 官网表（新设计 - `web_` 前缀）

| 表名 | 用途 | 对应文件 |
|------|------|----------|
| `web_subscriptions` | 官网订阅（会员管理） | `web_subscriptions_table.sql` |
| `web_payment_transactions` | 官网支付交易（利润统计） | `web_payment_transactions_table.sql` |
| `auth.users` | 官网用户（Supabase 自带，email/OAuth） | 无需创建 |

---

## 🔍 区分机制

### 1. 表名前缀区分

| 平台 | 表前缀 | 示例 |
|------|--------|------|
| 小程序 | `sitehub_` | `sitehub_users`, `sitehub_subscriptions` |
| 官网 | `web_` | `web_subscriptions`, `web_payment_transactions` |

### 2. 用户认证方式区分

| 平台 | 用户表 | 登录方式 | 用户标识 |
|------|--------|---------|---------|
| 小程序 | `sitehub_users` | 微信 OpenID | `openid` |
| 官网 | `auth.users` (Supabase) | Email/Google OAuth | `email` |

### 3. Platform 字段区分

在共享统计表中，使用 `platform` 字段：

```sql
platform TEXT CHECK (platform IN ('miniprogram', 'web', 'ios', 'android'))
```

### 4. 支付方式区分

| 平台 | 支付方式 |
|------|---------|
| 小程序 | `wechat`（微信支付）、`alipay`（支付宝） |
| 官网 | `stripe`、`paypal`、`alipay` |

---

## 📋 创建的文件清单

### SQL 脚本文件

1. **web_subscriptions_table.sql** - 官网订阅表
   - 包含会员管理所有字段
   - 支持自动续费
   - 包含会员权益 JSON

2. **web_payment_transactions_table.sql** - 官网支付交易表
   - 记录每笔支付详情
   - 计算利润（收入 - 手续费 - 成本）
   - 支持多产品统计

### 文档文件

3. **PLATFORM_DATABASE_SEPARATION.md** - 平台分离详细文档
   - 问题分析
   - 解决方案
   - 数据关系图
   - 查询示例

4. **DATABASE_TABLES_SUMMARY.md** - 数据库表设计总结（旧版，包含详细字段说明）

5. **DATABASE_FINAL_SUMMARY.md** - 最终方案总结（当前文件）

---

## 🗂️ 官网数据库表结构

### web_subscriptions（会员管理）

```sql
CREATE TABLE web_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),        -- 关联 Supabase Auth
  user_email TEXT UNIQUE NOT NULL,

  -- 订阅信息
  platform TEXT DEFAULT 'web',
  payment_method TEXT,                            -- stripe/paypal/alipay
  plan_type TEXT,                                 -- pro/team
  billing_cycle TEXT,                             -- monthly/yearly
  status TEXT DEFAULT 'active',                   -- active/expired/cancelled/pending

  -- 时间（Jeff 需求）
  purchase_time TIMESTAMP,                        -- 购买时间 ✅
  start_time TIMESTAMP NOT NULL,                  -- 付费开始时间 ✅
  expire_time TIMESTAMP NOT NULL,                 -- 结束时间 ✅

  -- 自动续费（Jeff 需求）
  auto_renew BOOLEAN DEFAULT false,               -- 是否自动续费 ✅
  auto_renew_method TEXT,                         -- 自动续费支付方式 ✅
  next_billing_date TIMESTAMP,                    -- 下次扣费日期 ✅

  -- 会员权益（Jeff 需求）
  benefits JSONB,                                 -- 权益详情 JSON ✅

  -- 支付订单 ID
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  paypal_order_id TEXT,
  paypal_subscription_id TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### web_payment_transactions（支付统计）

```sql
CREATE TABLE web_payment_transactions (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES web_subscriptions(id),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,

  -- 产品信息（支持多产品统计 - Jeff 需求）
  product_name TEXT NOT NULL DEFAULT 'sitehub',  -- sitehub/morngpt/securefiles ✅
  product_category TEXT,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT,

  -- 支付信息
  payment_method TEXT NOT NULL,                   -- stripe/paypal/alipay
  payment_status TEXT DEFAULT 'pending',          -- pending/completed/failed/refunded
  transaction_type TEXT DEFAULT 'purchase',       -- purchase/renewal/refund

  -- 金额（单位：美分，避免浮点数精度问题）
  currency TEXT DEFAULT 'USD',
  gross_amount INTEGER NOT NULL,                  -- 总金额（用户支付）
  payment_fee INTEGER DEFAULT 0,                  -- 手续费（Stripe/PayPal收取）
  net_amount INTEGER NOT NULL,                    -- 净收入（总金额 - 手续费）
  refund_amount INTEGER DEFAULT 0,                -- 退款金额

  -- 利润分析（Jeff 需求）
  service_cost INTEGER DEFAULT 0,                 -- 服务成本 ✅
  profit INTEGER NOT NULL,                        -- 利润（净收入 - 成本 - 退款）✅

  -- 支付平台订单 ID
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,

  -- 时间
  payment_time TIMESTAMP,
  refund_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  notes TEXT,
  metadata JSONB
);
```

---

## 📊 统计视图

`web_payment_transactions_table.sql` 包含 4 个自动统计视图：

### 1. v_profit_by_product
按产品统计利润（支持多产品 - Jeff 需求 ✅）

```sql
SELECT * FROM v_profit_by_product;
```

| product_name | total_revenue | total_profit | profit_margin_percent |
|--------------|---------------|--------------|----------------------|
| sitehub      | $7,500.00     | $6,200.00    | 82.67%               |
| morngpt      | $4,000.00     | $3,100.00    | 77.50%               |

### 2. v_profit_by_payment_method
按支付方式统计手续费

```sql
SELECT * FROM v_profit_by_payment_method;
```

| payment_method | total_fees | avg_fee_percent |
|----------------|-----------|----------------|
| stripe         | $315.00   | 3.50%          |
| paypal         | $180.00   | 4.50%          |

### 3. v_monthly_revenue
按月统计收入

```sql
SELECT * FROM v_monthly_revenue;
```

| month       | total_revenue | total_profit |
|-------------|---------------|--------------|
| 2025-01-01  | $2,500.00     | $2,000.00    |

### 4. v_profit_by_plan_type
按套餐类型统计

```sql
SELECT * FROM v_profit_by_plan_type;
```

---

## ✅ Jeff 需求对照表

| Jeff 需求 | 解决方案 | 表/字段 | 状态 |
|----------|---------|---------|------|
| 会员情况 | 订阅状态、套餐类型、权益 | `web_subscriptions.status`, `plan_type`, `benefits` | ✅ |
| 账户密码 | Supabase Auth | `auth.users` | ✅ |
| 登录 session | Supabase Auth 自动管理 | `auth.sessions` | ✅ |
| 购买时间 | 订阅购买时间 | `web_subscriptions.purchase_time` | ✅ |
| 付费时间 | 订阅生效时间 | `web_subscriptions.start_time` | ✅ |
| 结束时间 | 订阅到期时间 | `web_subscriptions.expire_time` | ✅ |
| 自动续费 | 续费开关 + 支付方式 + 下次扣费日期 | `web_subscriptions.auto_renew`, `auto_renew_method`, `next_billing_date` | ✅ |
| 权益 | JSON 格式详细权益 | `web_subscriptions.benefits` | ✅ |
| 支付数据统计 | 完整交易记录 + 利润计算 | `web_payment_transactions` | ✅ |
| 子产品利润 | product_name 字段 + 统计视图 | `web_payment_transactions.product_name` | ✅ |
| 平台区分 | 表名前缀（web_ vs sitehub_） | 所有表 | ✅ |

---

## 🚀 下一步操作

### 步骤 1: 在 Supabase 中创建表

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下两个脚本：
   - `web_subscriptions_table.sql`
   - `web_payment_transactions_table.sql`

### 步骤 2: 更新支付 API 代码

需要修改的文件：

1. **app/api/payment/paypal/capture/route.ts**
   - 将 `subscriptions` 改为 `web_subscriptions`
   - 添加写入 `web_payment_transactions` 的代码

2. **app/api/payment/stripe/webhook/route.ts**
   - 将 `subscriptions` 改为 `web_subscriptions`
   - 添加写入 `web_payment_transactions` 的代码

### 步骤 3: 测试

- 测试 PayPal 支付
- 测试 Stripe 支付
- 验证数据写入 `web_subscriptions` 和 `web_payment_transactions`

---

## 🔐 数据安全

### Row Level Security (RLS) 已配置

- **web_subscriptions**: 用户只能查看自己的订阅
- **web_payment_transactions**: 用户只能查看自己的交易
- 服务端使用 `service_role_key` 可以操作所有数据

### 数据隔离

- ✅ 小程序用户和官网用户完全隔离
- ✅ 小程序订阅和官网订阅完全隔离
- ✅ 支付记录分别存储
- ✅ 可以通过 `product_name` 和 `platform` 字段统计各平台数据

---

## 📊 跨平台统计

### 查询小程序 + 官网总收入

```sql
-- 小程序收入
SELECT SUM(amount) as miniprogram_revenue
FROM sitehub_payment_stats;

-- 官网收入
SELECT SUM(gross_amount) / 100.0 as web_revenue
FROM web_payment_transactions
WHERE payment_status = 'completed';

-- 合计（需要注意货币转换：小程序用CNY，官网用USD）
```

### 查询所有平台活跃会员数

```sql
-- 小程序活跃会员
SELECT COUNT(*) FROM sitehub_subscriptions WHERE status = 'active';

-- 官网活跃会员
SELECT COUNT(*) FROM web_subscriptions WHERE status = 'active';
```

---

## 🎉 总结

### 已完成 ✅

1. ✅ 分析了小程序数据库表结构（使用 `sitehub_` 前缀）
2. ✅ 重新设计了官网表结构（使用 `web_` 前缀）
3. ✅ 创建了完整的 SQL 脚本
4. ✅ 添加了所有 Jeff 要求的字段
5. ✅ 创建了利润统计视图
6. ✅ 确保了小程序和官网数据完全隔离

### 待完成 ⏳

1. ⏳ 在 Supabase 中执行 SQL 脚本
2. ⏳ 更新支付 API 代码（将 `subscriptions` 改为 `web_subscriptions`）
3. ⏳ 测试支付流程
4. ⏳ 配置 Stripe Webhook

---

## 📞 如有问题

请参考以下文档：
- **PLATFORM_DATABASE_SEPARATION.md** - 详细的平台分离方案
- **DATABASE_TABLES_SUMMARY.md** - 字段详细说明
- **web_subscriptions_table.sql** - 订阅表 SQL 脚本
- **web_payment_transactions_table.sql** - 支付交易表 SQL 脚本

---

**总结**: 现在官网使用 `web_` 前缀，小程序使用 `sitehub_` 前缀，完全区分，互不影响！✅
