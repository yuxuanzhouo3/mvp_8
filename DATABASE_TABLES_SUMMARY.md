# 📊 SiteHub 数据库表设计总结

## 概述

根据 Jeff 的需求，我们设计了两个核心数据库表：

1. **subscriptions** - 会员管理表（管理用户订阅和会员权益）
2. **payment_transactions** - 支付统计表（记录所有交易并统计利润）

这两个表通过前缀区分，职责清晰：
- `subscriptions` 管理**会员状态**
- `payment_transactions` 记录**支付数据**

---

## 📋 表 1: subscriptions（会员管理表）

### 用途
存储用户订阅信息，包括会员状态、权益、自动续费等。

### 核心字段

#### 用户信息
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | UUID | 关联到 auth.users（账户密码由 Supabase Auth 管理） |
| `user_email` | TEXT | 用户邮箱（唯一标识） |

#### 订阅信息
| 字段 | 类型 | 说明 |
|------|------|------|
| `plan_type` | TEXT | 套餐类型（pro/team） |
| `billing_cycle` | TEXT | 计费周期（monthly/yearly） |
| `status` | TEXT | 订阅状态（active/expired/cancelled/pending） |
| `payment_method` | TEXT | 支付方式（stripe/paypal/alipay/wechat） |

#### 时间信息（Jeff 需求）
| 字段 | 类型 | 说明 |
|------|------|------|
| `purchase_time` | TIMESTAMP | 购买时间 ✅ |
| `start_time` | TIMESTAMP | 付费开始时间 ✅ |
| `expire_time` | TIMESTAMP | 结束时间 ✅ |

#### 自动续费（Jeff 需求）
| 字段 | 类型 | 说明 |
|------|------|------|
| `auto_renew` | BOOLEAN | 是否自动续费 ✅ |
| `auto_renew_method` | TEXT | 自动续费支付方式 ✅ |
| `next_billing_date` | TIMESTAMP | 下次扣费日期 ✅ |

#### 会员权益（Jeff 需求）
| 字段 | 类型 | 说明 |
|------|------|------|
| `benefits` | JSONB | 会员权益（JSON 格式） ✅ |

**权益示例**：
```json
{
  "unlimited_favorites": true,
  "custom_sites": true,
  "cloud_sync": true,
  "ad_free": true,
  "priority_support": true,
  "advanced_search": true,
  "data_export": true,
  "api_access": false,        // Pro 会员没有
  "team_collaboration": false  // 只有 Team 会员有
}
```

#### 支付平台订单 ID
- `stripe_session_id`, `stripe_subscription_id`
- `paypal_order_id`, `paypal_subscription_id`
- `alipay_order_id`, `wechat_order_id`

### 查询示例

```sql
-- 查看所有活跃会员
SELECT user_email, plan_type, expire_time, auto_renew
FROM subscriptions
WHERE status = 'active'
ORDER BY expire_time DESC;

-- 查看即将过期的会员（7天内）
SELECT user_email, plan_type, expire_time
FROM subscriptions
WHERE status = 'active'
  AND expire_time < NOW() + INTERVAL '7 days'
ORDER BY expire_time ASC;

-- 查看会员权益
SELECT user_email, plan_type, benefits
FROM subscriptions
WHERE user_email = 'user@example.com';
```

---

## 💰 表 2: payment_transactions（支付统计表）

### 用途
记录每一笔支付交易，用于统计各子产品的利润和财务分析。

### 核心字段

#### 产品信息（支持多产品统计）
| 字段 | 类型 | 说明 |
|------|------|------|
| `product_name` | TEXT | 产品名称（sitehub/morngpt/securefiles等） |
| `product_category` | TEXT | 产品分类 |
| `plan_type` | TEXT | 套餐类型（pro/team） |
| `billing_cycle` | TEXT | 计费周期（monthly/yearly） |

#### 支付信息
| 字段 | 类型 | 说明 |
|------|------|------|
| `payment_method` | TEXT | 支付方式 |
| `payment_status` | TEXT | 支付状态（pending/completed/failed/refunded） |
| `transaction_type` | TEXT | 交易类型（purchase/renewal/refund） |

#### 金额信息（单位：美分，避免浮点数精度问题）
| 字段 | 类型 | 说明 |
|------|------|------|
| `currency` | TEXT | 货币类型（USD） |
| `gross_amount` | INTEGER | 总金额（用户支付的金额） |
| `payment_fee` | INTEGER | 支付手续费（Stripe/PayPal 收取） |
| `net_amount` | INTEGER | 净收入（总金额 - 手续费） |
| `refund_amount` | INTEGER | 退款金额 |

#### 成本和利润分析
| 字段 | 类型 | 说明 |
|------|------|------|
| `service_cost` | INTEGER | 服务成本（服务器、API调用等） |
| `profit` | INTEGER | **利润**（净收入 - 服务成本 - 退款） |

**计算公式**：
```
利润 = 净收入 - 服务成本 - 退款金额
净收入 = 总金额 - 支付手续费
```

### 自动统计视图

我们创建了 4 个视图，方便快速查询利润数据：

#### 1. v_profit_by_product（按产品统计）
```sql
SELECT * FROM v_profit_by_product;
```
**输出示例**：
| product_name | total_transactions | total_revenue | total_profit | profit_margin_percent |
|--------------|-------------------|---------------|--------------|----------------------|
| sitehub      | 150               | $7,500.00     | $6,200.00    | 82.67%               |
| morngpt      | 80                | $4,000.00     | $3,100.00    | 77.50%               |
| securefiles  | 40                | $2,000.00     | $1,600.00    | 80.00%               |

#### 2. v_profit_by_payment_method（按支付方式统计）
```sql
SELECT * FROM v_profit_by_payment_method;
```
**输出示例**：
| payment_method | total_transactions | total_revenue | total_fees | avg_fee_percent |
|----------------|-------------------|---------------|------------|----------------|
| stripe         | 180               | $9,000.00     | $315.00    | 3.50%          |
| paypal         | 80                | $4,000.00     | $180.00    | 4.50%          |
| alipay         | 10                | $500.00       | $12.50     | 2.50%          |

#### 3. v_monthly_revenue（按月统计）
```sql
SELECT * FROM v_monthly_revenue;
```
**输出示例**：
| month       | total_transactions | total_revenue | total_profit |
|-------------|-------------------|---------------|--------------|
| 2025-01-01  | 50                | $2,500.00     | $2,000.00    |
| 2024-12-01  | 45                | $2,250.00     | $1,800.00    |

#### 4. v_profit_by_plan_type（按套餐类型统计）
```sql
SELECT * FROM v_profit_by_plan_type;
```
**输出示例**：
| product_name | plan_type | billing_cycle | total_transactions | total_profit |
|--------------|-----------|---------------|-------------------|--------------|
| sitehub      | team      | yearly        | 30                | $2,400.00    |
| sitehub      | pro       | yearly        | 50                | $1,680.00    |
| sitehub      | pro       | monthly       | 70                | $140.00      |

### 查询函数

#### 获取指定时间范围的利润统计
```sql
-- 查询 2025 年全年利润
SELECT * FROM get_profit_stats('2025-01-01', '2025-12-31');
```

**输出示例**：
| total_revenue | total_fees | total_net_income | total_profit | transaction_count |
|---------------|-----------|------------------|--------------|------------------|
| $13,500.00    | $507.50   | $12,992.50       | $10,900.00   | 270              |

### 实际使用示例

```sql
-- 查看 SiteHub 产品的总利润
SELECT
  product_name,
  SUM(profit) / 100.0 as total_profit_usd
FROM payment_transactions
WHERE product_name = 'sitehub'
  AND payment_status = 'completed'
GROUP BY product_name;

-- 查看今天的收入
SELECT
  COUNT(*) as today_transactions,
  SUM(gross_amount) / 100.0 as today_revenue,
  SUM(profit) / 100.0 as today_profit
FROM payment_transactions
WHERE DATE(payment_time) = CURRENT_DATE
  AND payment_status = 'completed';

-- 比较不同支付方式的手续费
SELECT
  payment_method,
  AVG(payment_fee::FLOAT / gross_amount * 100) as avg_fee_percent,
  SUM(payment_fee) / 100.0 as total_fees_usd
FROM payment_transactions
WHERE payment_status = 'completed'
GROUP BY payment_method
ORDER BY avg_fee_percent ASC;
```

---

## 🔗 两个表的关系

```
┌─────────────────┐         ┌──────────────────────────┐
│  subscriptions  │         │  payment_transactions    │
│  (会员管理)      │◄───────│  (支付统计)               │
└─────────────────┘         └──────────────────────────┘
      │                              │
      │ user_id                      │ user_id
      │                              │
      ▼                              ▼
┌─────────────────┐
│   auth.users    │
│  (账户密码)      │
└─────────────────┘
```

- **subscriptions** 记录用户的**当前订阅状态**（会员情况）
- **payment_transactions** 记录**所有支付历史**（利润统计）
- 两个表都关联到 `auth.users`（Supabase 自带的用户认证表，管理账户密码和登录 session）

### 数据流程

1. **用户购买**：
   - 前端调用 `/api/payment/stripe/create` 或 `/api/payment/paypal/create`
   - 支付完成后，webhook/capture 同时写入两个表：
     - `subscriptions` 表：创建/更新订阅记录
     - `payment_transactions` 表：创建交易记录

2. **查询会员状态**：
   ```sql
   SELECT * FROM subscriptions WHERE user_email = 'user@example.com';
   ```

3. **查询支付历史**：
   ```sql
   SELECT * FROM payment_transactions WHERE user_email = 'user@example.com';
   ```

4. **统计产品利润**：
   ```sql
   SELECT * FROM v_profit_by_product;
   ```

---

## 📦 安装步骤

### 1. 登录 Supabase Dashboard
- 访问 https://supabase.com/dashboard
- 选择项目: `ykirhilnbvsanqyenusf`

### 2. 执行 SQL 脚本

#### 步骤 1: 创建 subscriptions 表
1. 点击左侧菜单 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase_subscriptions_table.sql` 的全部内容
4. 点击 **Run**

#### 步骤 2: 创建 payment_transactions 表
1. 再次点击 **New query**
2. 复制 `supabase_payment_transactions_table.sql` 的全部内容
3. 点击 **Run**

### 3. 验证安装

```sql
-- 检查表是否创建成功
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payment_transactions');

-- 检查视图是否创建成功
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_profit%';

-- 测试插入数据
INSERT INTO subscriptions (
  user_email, plan_type, billing_cycle, payment_method,
  status, start_time, expire_time
)
VALUES (
  'test@example.com', 'pro', 'monthly', 'stripe',
  'active', NOW(), NOW() + INTERVAL '1 month'
);

-- 测试查询
SELECT * FROM subscriptions WHERE user_email = 'test@example.com';
```

---

## 🔄 下一步：更新支付 API 代码

当前的支付 API 代码需要更新以使用新的表结构：

### 需要修改的文件：

1. **app/api/payment/paypal/capture/route.ts**
   - 添加 `user_id` 字段
   - 添加 `purchase_time` 字段
   - 添加 `auto_renew` 相关字段
   - 同时写入 `payment_transactions` 表

2. **app/api/payment/stripe/webhook/route.ts**
   - 添加 `user_id` 字段
   - 同时写入 `payment_transactions` 表

### 示例代码（PayPal Capture）：

```typescript
// 写入 subscriptions 表
const { error: subError } = await supabase.from('subscriptions').upsert({
  user_id: userId,  // 需要从 auth.users 获取
  user_email: userEmail,
  platform: 'web',
  payment_method: 'paypal',
  plan_type: planType,
  billing_cycle: billingCycle,
  status: 'active',
  purchase_time: now.toISOString(),
  start_time: now.toISOString(),
  expire_time: expireTime.toISOString(),
  auto_renew: false,  // PayPal 单次支付不自动续费
  paypal_order_id: orderId,
  benefits: getPlanBenefits(planType),  // 根据套餐类型获取权益
}, {
  onConflict: 'user_email'
})

// 同时写入 payment_transactions 表
const { error: txError } = await supabase.from('payment_transactions').insert({
  user_id: userId,
  user_email: userEmail,
  product_name: 'sitehub',
  plan_type: planType,
  billing_cycle: billingCycle,
  payment_method: 'paypal',
  payment_status: 'completed',
  transaction_type: 'purchase',
  currency: 'USD',
  gross_amount: amountInCents,
  payment_fee: calculatePayPalFee(amountInCents),  // PayPal 手续费约 4.5%
  net_amount: amountInCents - paypalFee,
  service_cost: 0,  // 可以根据实际情况设置
  profit: netAmount - serviceCost,
  paypal_order_id: orderId,
  paypal_capture_id: captureId,
  payment_time: now.toISOString()
})
```

---

## 📊 后台管理界面建议

可以创建一个管理页面展示统计数据：

### Dashboard 页面结构

```
/admin/dashboard
├── 总览卡片
│   ├── 总收入
│   ├── 总利润
│   ├── 活跃会员数
│   └── 本月新增会员
├── 图表
│   ├── 月度收入趋势图
│   ├── 产品利润占比（饼图）
│   └── 支付方式分布（柱状图）
└── 表格
    ├── 最近交易记录
    └── 即将过期的会员
```

### 查询示例代码

```typescript
// 获取总览数据
const { data: overview } = await supabase.rpc('get_profit_stats', {
  start_date: '2025-01-01',
  end_date: '2025-12-31'
})

// 获取产品利润
const { data: productProfit } = await supabase
  .from('v_profit_by_product')
  .select('*')

// 获取月度收入
const { data: monthlyRevenue } = await supabase
  .from('v_monthly_revenue')
  .select('*')
  .order('month', { ascending: false })
  .limit(12)
```

---

## ✅ 总结

| Jeff 需求 | 解决方案 | 表名 |
|----------|---------|------|
| 会员情况 | `plan_type`, `status`, `benefits` | subscriptions |
| 账户密码 | Supabase `auth.users` 表 | auth.users |
| 登录 session | Supabase Auth 自动管理 | auth.sessions |
| 购买时间 | `purchase_time` | subscriptions |
| 付费时间 | `start_time` | subscriptions |
| 结束时间 | `expire_time` | subscriptions |
| 自动续费 | `auto_renew`, `next_billing_date` | subscriptions |
| 权益 | `benefits` (JSONB) | subscriptions |
| 支付统计 | 完整的交易记录和利润分析 | payment_transactions |
| 子产品利润 | `product_name` 字段 + 统计视图 | payment_transactions |

**文件清单**：
- ✅ `supabase_subscriptions_table.sql` - 会员管理表
- ✅ `supabase_payment_transactions_table.sql` - 支付统计表
- ⏳ 待更新：支付 API 代码以使用新表结构

**下一步**：
1. 在 Supabase 中执行两个 SQL 脚本
2. 更新支付 API 代码
3. 测试支付流程
4. 验证数据正确写入两个表
