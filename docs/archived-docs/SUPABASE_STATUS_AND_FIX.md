# 🔍 Supabase 数据库状态分析和修复指南

## 📊 当前 Supabase 表状态分析

根据你提供的截图，当前 Supabase 中的表结构如下：

### ✅ 正确的表

| 表名 | 类型 | 前缀 | 用途 | 状态 |
|------|------|------|------|------|
| `sitehub_users` | 表 | `sitehub_` | 小程序用户 | ✅ 正确 |
| `sitehub_subscriptions` | 表 | `sitehub_` | 小程序订阅 | ✅ 正确 |
| `sitehub_favorites` | 表 | `sitehub_` | 小程序收藏 | ✅ 正确 |
| `sitehub_custom_sites` | 表 | `sitehub_` | 小程序自定义网站 | ✅ 正确 |
| `sitehub_payment_stats` | 表 | `sitehub_` | 小程序支付统计 | ✅ 正确 |
| `sitehub_usage_stats` | 表 | `sitehub_` | 小程序使用统计 | ✅ 正确 |
| `sitehub_access_logs` | 表 | `sitehub_` | 小程序访问日志 | ✅ 正确 |
| `web_subscriptions` | 表 | `web_` | 官网订阅 | ✅ 正确 |
| `web_payment_transactions` | 表 | `web_` | 官网支付交易 | ✅ 正确 |

### ⚠️ 需要处理的表

| 表名 | 问题 | 建议操作 |
|------|------|---------|
| `subscriptions` | ❌ 没有前缀，会导致混淆 | **删除**（数据为空或迁移后删除） |
| `user_favorites` | ⚠️ 官网旧表，应该是 `web_favorites` | 重命名或删除 |
| `user_custom_sites` | ⚠️ 官网旧表，应该是 `web_custom_sites` | 重命名或删除 |

### 🔴 红色 "Unrestricted" 的含义

截图中显示红色 "Unrestricted" 的项目是**视图（Views）**，不是表：

| 视图名 | 用途 | 为什么显示 Unrestricted |
|--------|------|----------------------|
| `v_profit_by_product` | 按产品统计利润 | 视图没有 RLS 保护 |
| `v_profit_by_payment_method` | 按支付方式统计 | 视图没有 RLS 保护 |
| `v_profit_by_plan_type` | 按套餐类型统计 | 视图没有 RLS 保护 |
| `v_monthly_revenue` | 按月统计收入 | 视图没有 RLS 保护 |

**这是正常的！** 统计视图不需要 RLS 保护，因为它们通常用于后台管理界面，管理员可以访问。

---

## 🚨 发现的问题

### 问题 1: `web_payment_transactions` 表的外键引用错误

**位置**: `web_payment_transactions_table.sql` 第 18 行

**错误代码**:
```sql
subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
```

**问题**: 引用了没有前缀的 `subscriptions` 表，应该引用 `web_subscriptions`。

**修复后的代码**:
```sql
subscription_id UUID REFERENCES web_subscriptions(id) ON DELETE SET NULL,
```

**状态**: ✅ 已修复（我已经更新了 `web_payment_transactions_table.sql` 文件）

### 问题 2: 存在没有前缀的 `subscriptions` 表

**问题**: Supabase 中存在一个没有前缀的 `subscriptions` 表，这会导致混淆。

**影响**:
- 如果这个表有数据，可能是测试数据
- 会和 `web_subscriptions` 冲突
- 代码中引用 `subscriptions` 会不知道指的是哪个表

**解决方案**: 执行 `SUPABASE_CLEANUP_FIX.sql` 脚本删除它。

---

## ✅ 修复步骤

### 步骤 1: 检查 `subscriptions` 表是否有数据

在 Supabase SQL Editor 中执行：

```sql
SELECT COUNT(*) as row_count FROM subscriptions;
```

- **如果返回 0**：表示没有数据，可以安全删除
- **如果返回 > 0**：需要先迁移数据到 `web_subscriptions`

### 步骤 2: 执行清理脚本

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 点击 **New query**
4. 复制 `SUPABASE_CLEANUP_FIX.sql` 的全部内容
5. 点击 **Run**

这个脚本会：
- ✅ 删除没有前缀的 `subscriptions` 表
- ✅ 修复 `web_payment_transactions` 的外键
- ✅ 重命名 `user_favorites` → `web_favorites`
- ✅ 重命名 `user_custom_sites` → `web_custom_sites`
- ✅ 验证表结构

### 步骤 3: 验证修复结果

执行以下查询验证：

```sql
-- 1. 检查所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**预期结果**：应该只看到带前缀的表（`sitehub_*` 和 `web_*`）

```sql
-- 2. 检查外键
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'web_payment_transactions';
```

**预期结果**：`subscription_id` 应该引用 `web_subscriptions`

---

## 📝 更新支付 API 代码

修复数据库后，需要更新以下文件中的表名：

### 文件 1: `app/api/payment/paypal/capture/route.ts`

**需要修改的地方**（第 73 行）：

```typescript
// 修改前
const { error } = await supabase.from('subscriptions').upsert({...})

// 修改后
const { error } = await supabase.from('web_subscriptions').upsert({...})
```

**完整修改示例**：

```typescript
// 更新Supabase订阅状态
const { error: subError } = await supabase.from('web_subscriptions').upsert({
  user_id: userId,  // 需要获取 user_id
  user_email: userEmail,
  platform: 'web',
  payment_method: 'paypal',
  plan_type: planType,
  billing_cycle: billingCycle,
  status: 'active',
  purchase_time: now.toISOString(),
  start_time: now.toISOString(),
  expire_time: expireTime.toISOString(),
  auto_renew: false,
  paypal_order_id: orderId,
}, {
  onConflict: 'user_email'
})

// 同时写入支付交易记录
const { error: txError } = await supabase.from('web_payment_transactions').insert({
  user_email: userEmail,
  product_name: 'sitehub',
  plan_type: planType,
  billing_cycle: billingCycle,
  payment_method: 'paypal',
  payment_status: 'completed',
  transaction_type: 'purchase',
  currency: 'USD',
  gross_amount: Math.round(parseFloat(amount) * 100),  // 转换为美分
  payment_fee: Math.round(parseFloat(amount) * 100 * 0.045),  // PayPal 4.5% 手续费
  net_amount: Math.round(parseFloat(amount) * 100 * 0.955),
  service_cost: 0,
  profit: Math.round(parseFloat(amount) * 100 * 0.955),
  paypal_order_id: orderId,
  payment_time: now.toISOString()
})
```

### 文件 2: `app/api/payment/stripe/webhook/route.ts`

**需要修改的地方**（第 59 行）：

```typescript
// 修改前
const { error } = await supabase.from('subscriptions').upsert({...})

// 修改后
const { error: subError } = await supabase.from('web_subscriptions').upsert({...})

// 同时添加支付交易记录
const { error: txError } = await supabase.from('web_payment_transactions').insert({...})
```

---

## 📊 最终的表结构

执行完修复后，Supabase 中应该只有以下表：

### 小程序表（`sitehub_` 前缀）
```
sitehub_users
sitehub_subscriptions
sitehub_favorites
sitehub_custom_sites
sitehub_payment_stats
sitehub_usage_stats
sitehub_access_logs
```

### 官网表（`web_` 前缀）
```
web_subscriptions
web_payment_transactions
web_favorites (重命名自 user_favorites)
web_custom_sites (重命名自 user_custom_sites)
```

### 共享表/系统表
```
profiles
user_settings
```

### 统计视图（红色 Unrestricted 是正常的）
```
v_profit_by_product
v_profit_by_payment_method
v_profit_by_plan_type
v_monthly_revenue
```

---

## ✅ 检查清单

在完成所有修复后，请确认：

- [ ] ✅ 删除了没有前缀的 `subscriptions` 表
- [ ] ✅ `web_payment_transactions` 的外键引用 `web_subscriptions`
- [ ] ✅ `user_favorites` 重命名为 `web_favorites`
- [ ] ✅ `user_custom_sites` 重命名为 `web_custom_sites`
- [ ] ✅ 更新了 `app/api/payment/paypal/capture/route.ts` 中的表名
- [ ] ✅ 更新了 `app/api/payment/stripe/webhook/route.ts` 中的表名
- [ ] ✅ 测试 PayPal 支付流程
- [ ] ✅ 测试 Stripe 支付流程
- [ ] ✅ 验证数据正确写入 `web_subscriptions` 和 `web_payment_transactions`

---

## 🎯 总结

### 当前状态
- ✅ 小程序表都有 `sitehub_` 前缀，完全正确
- ✅ 官网表都有 `web_` 前缀，已创建
- ⚠️ 存在一个没有前缀的 `subscriptions` 表，需要删除
- ⚠️ `web_payment_transactions` 的外键引用错误，需要修复

### 下一步操作
1. 执行 `SUPABASE_CLEANUP_FIX.sql` 脚本
2. 更新支付 API 代码中的表名
3. 测试支付流程

执行完这些步骤后，小程序和官网的数据库就完全区分开了，不会有任何冲突！🎉
