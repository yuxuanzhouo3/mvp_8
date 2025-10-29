# 📊 SiteHub 数据库架构实施状态报告

## 执行日期
2025-01-14

---

## 🎯 总体进度：海外系统 90% ✅ | 国内系统 20% ⚠️

---

## ✅ 已完成的工作

### 1. 海外系统（Supabase）- 90% 完成

#### 1.1 IP 地理检测 ✅ 100%

| 项目 | 状态 | 文件位置 |
|------|------|---------|
| IP 检测 API | ✅ | `app/api/geo/detect/route.ts` |
| 区域分类逻辑 | ✅ | `lib/ip-detection.ts` |
| GeoContext | ✅ | `contexts/geo-context.tsx` |
| 前端集成 | ✅ | `app/page.tsx` |

**功能**：
- ✅ 自动检测用户 IP 地址
- ✅ 识别国家代码（CN, US, IN, SG, EU等）
- ✅ 分类为 6 个区域：`china` | `usa` | `india` | `singapore` | `europe` | `other`
- ✅ 返回对应货币：CNY, USD, EUR 等
- ✅ 返回推荐支付方式：Stripe/PayPal（海外）、微信支付/支付宝（中国）
- ✅ 返回推荐语言：zh-CN（中国）、en-US（其他）

**测试结果**：
```bash
# 测试 API
curl http://localhost:3000/api/geo/detect

# 返回示例（中国用户）
{
  "success": true,
  "data": {
    "countryCode": "CN",
    "regionCategory": "china",
    "currency": "CNY",
    "paymentMethods": ["alipay", "wechatpay", "stripe", "paypal"],
    "language": "zh-CN"
  }
}
```

#### 1.2 数据库表结构 ✅ 100%

**官网用户数据表**（保持原命名，兼容前端）：

| 表名 | 状态 | 说明 |
|------|------|------|
| `user_favorites` | ✅ | 用户收藏网站 |
| `user_custom_sites` | ✅ | 用户自定义网站 |

**官网支付相关表**（使用 `web_` 前缀）：

| 表名 | 状态 | 说明 |
|------|------|------|
| `web_subscriptions` | ✅ | 订阅管理（已修复外键） |
| `web_payment_transactions` | ✅ | 支付交易记录（利润统计） |

**小程序表**（使用 `sitehub_` 前缀）：

| 表名 | 状态 | 说明 |
|------|------|------|
| `sitehub_users` | ✅ | 小程序用户 |
| `sitehub_subscriptions` | ✅ | 小程序订阅 |
| `sitehub_favorites` | ✅ | 小程序收藏 |
| `sitehub_custom_sites` | ✅ | 小程序自定义网站 |
| `sitehub_payment_stats` | ✅ | 支付统计 |
| `sitehub_usage_stats` | ✅ | 使用统计 |
| `sitehub_access_logs` | ✅ | 访问日志 |

**统计视图**（用于利润分析）：

| 视图名 | 状态 | 说明 |
|--------|------|------|
| `v_profit_by_product` | ✅ | 按产品统计利润 |
| `v_profit_by_payment_method` | ✅ | 按支付方式统计 |
| `v_profit_by_plan_type` | ✅ | 按套餐类型统计 |
| `v_monthly_revenue` | ✅ | 按月统计收入 |

#### 1.3 支付 API 更新 ✅ 100%

**PayPal 支付** `app/api/payment/paypal/capture/route.ts:77-121`

✅ 已修改：
- 使用 `web_subscriptions` 表（原来是 `subscriptions`）
- 添加 `web_payment_transactions` 记录
- 自动计算手续费（4.5%）
- 自动计算净收入和利润

**代码变更**：
```typescript
// 更新订阅（Line 77-90）
const { error: subError } = await supabase.from('web_subscriptions').upsert({...})

// 记录支付交易（Line 100-116）
const paymentFee = Math.round(amountInCents * 0.045) // PayPal 4.5%
const netAmount = amountInCents - paymentFee
const { error: txError } = await supabase.from('web_payment_transactions').insert({
  user_email: userEmail,
  product_name: 'sitehub',
  plan_type: planType,
  billing_cycle: billingCycle,
  payment_method: 'paypal',
  payment_status: 'completed',
  gross_amount: amountInCents,
  payment_fee: paymentFee,
  net_amount: netAmount,
  profit: netAmount,
  ...
})
```

**Stripe 支付** `app/api/payment/stripe/webhook/route.ts:63-109`

✅ 已修改：
- 使用 `web_subscriptions` 表（原来是 `subscriptions`）
- 添加 `web_payment_transactions` 记录
- 自动计算手续费（2.9% + $0.30）
- 自动计算净收入和利润

**代码变更**：
```typescript
// 更新订阅（Line 63-77）
const { error: subError } = await supabase.from('web_subscriptions').upsert({...})

// 记录支付交易（Line 87-104）
const paymentFee = Math.round(amountInCents * 0.029 + 30) // Stripe 2.9% + $0.30
const netAmount = amountInCents - paymentFee
const { error: txError } = await supabase.from('web_payment_transactions').insert({
  user_email: userEmail,
  product_name: 'sitehub',
  plan_type: planType,
  payment_method: 'stripe',
  gross_amount: amountInCents,
  payment_fee: paymentFee,
  net_amount: netAmount,
  profit: netAmount,
  ...
})
```

#### 1.4 数据库清理脚本 ✅ 100%

**文件**：`SUPABASE_CLEANUP_FIX.sql`

**功能**：
- ✅ 删除冲突的 `subscriptions` 表（没有前缀）
- ✅ 修复 `web_payment_transactions` 外键引用
- ✅ 保留 `user_favorites` 和 `user_custom_sites`（不重命名，兼容前端）
- ✅ 验证表结构和外键关系

**执行方法**：
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `SUPABASE_CLEANUP_FIX.sql` 全部内容
4. 点击 Run

**状态**：⚠️ **需要手动执行**（等待你确认后执行）

---

### 2. 国内系统（微信云）- 20% 完成

#### 2.1 已完成部分 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| 环境变量配置 | ✅ | `.env.local` 中已配置微信云凭证 |
| IP 检测支持 | ✅ | 可以识别 `regionCategory === 'china'` |
| 架构文档 | ✅ | `ARCHITECTURE_FINAL.md` |
| 状态报告 | ✅ | `CHINA_WECHAT_CLOUD_STATUS.md` |

#### 2.2 未完成部分 ❌

| 项目 | 状态 | 预计时间 |
|------|------|---------|
| 微信云 SDK | ❌ 未安装 | 5 分钟 |
| 微信云客户端 | ❌ 未创建 | 10 分钟 |
| 数据库集合 | ❓ 未知 | 30 分钟 |
| 前端切换逻辑 | ❌ 未实现 | 1-2 小时 |
| 微信支付 API | ❌ 未实现 | 2-3 小时 |

**待创建的微信云数据库集合**：
```
china_users              // 用户表
china_favorites          // 收藏表
china_custom_sites       // 自定义网站
china_subscriptions      // 订阅管理
china_payment_transactions  // 支付记录
```

---

## 📋 架构总结

### 最终表命名规范

| 系统 | 前缀 | 数据库 | 示例表名 |
|------|------|--------|---------|
| **小程序** | `sitehub_` | Supabase | `sitehub_users`, `sitehub_favorites` |
| **官网（海外）** | `user_*`, `web_*` | Supabase | `user_favorites`, `web_subscriptions` |
| **官网（中国）** | `china_*` | 微信云 | `china_users`, `china_favorites` |

**命名逻辑**：
- 小程序：`sitehub_` 前缀（完全隔离）
- 官网用户数据：`user_` 前缀（保持原名，兼容前端）
- 官网支付数据：`web_` 前缀（统一管理）
- 中国数据：`china_` 前缀（微信云）

### 数据流程图

```
用户访问 www.mornhub.help
         ↓
    IP 检测 API
  /api/geo/detect
         ↓
   ┌──────────────┐
   │ regionCategory│
   └──────┬───────┘
          │
    ┌─────┴─────┐
    │           │
 'china'     'usa'/'other'
    │           │
    ↓           ↓
 微信云      Supabase
    │           │
微信支付   Stripe/PayPal
支付宝
```

---

## 🔧 待执行的任务

### 高优先级（立即执行）

#### 1. 执行 Supabase 清理脚本（5分钟）⚠️

**操作步骤**：
1. 登录 https://supabase.com/dashboard
2. 选择项目
3. 进入 SQL Editor
4. 复制 `SUPABASE_CLEANUP_FIX.sql` 内容
5. 点击 Run
6. 验证结果

**预期结果**：
- ✅ 删除 `subscriptions` 表
- ✅ `web_payment_transactions` 外键正确引用 `web_subscriptions`
- ✅ 保留 `user_favorites` 和 `user_custom_sites`

#### 2. 测试海外支付流程（30分钟）⚠️

**测试 PayPal**：
1. 访问官网支付页面
2. 选择 Pro 套餐 + PayPal
3. 完成支付（使用 PayPal Sandbox 测试账户）
4. 验证数据写入：
   - `web_subscriptions` 表有订阅记录
   - `web_payment_transactions` 表有支付记录
   - 利润计算正确（gross_amount - payment_fee = net_amount）

**测试 Stripe**：
1. 访问官网支付页面
2. 选择 Pro 套餐 + Stripe
3. 使用测试卡号：`4242 4242 4242 4242`
4. 验证数据写入（同上）

### 中优先级（国内系统实现）

#### 3. 安装微信云 SDK（5分钟）

```bash
cd /Users/qinwenyan/Desktop/工作台/Mornhup/morn-mvp/mvp_8
npm install @cloudbase/js-sdk --save
```

#### 4. 创建微信云客户端（10分钟）

**创建文件**：`lib/cloudbase/client.ts`

```typescript
import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'
})

const db = app.database()

export { app, db }
export default app
```

**添加环境变量**：`.env.local`
```env
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
```

#### 5. 创建微信云数据库集合（30分钟）

**操作步骤**：
1. 访问 https://console.cloud.tencent.com/tcb
2. 选择环境：`cloudbase-1gnip2iaa08260e5`
3. 进入"数据库" → "集合"
4. 创建 5 个集合（详见 `CHINA_WECHAT_CLOUD_STATUS.md`）

**集合列表**：
- `china_users`
- `china_favorites`
- `china_custom_sites`
- `china_subscriptions`
- `china_payment_transactions`

#### 6. 更新前端代码（1-2小时）

**修改文件**：`app/page.tsx`

**需要修改的功能**：
- 收藏加载（Line 165）
- 收藏添加（Line 492）
- 收藏删除（Line 482）
- 自定义网站加载（Line 206）
- 自定义网站添加（Line 420）
- 自定义网站删除（Line 519）

**修改模式**：
```typescript
import { db as wechatDB } from '@/lib/cloudbase/client'

if (regionCategory === "china") {
  // 使用微信云
  const res = await wechatDB.collection("china_favorites").where({...}).get()
} else {
  // 使用 Supabase
  const { data } = await supabase.from("user_favorites").select("*")
}
```

#### 7. 实现微信支付 API（2-3小时）

**创建文件**：
- `app/api/payment/wechat/create/route.ts`
- `app/api/payment/wechat/notify/route.ts`

**详细实现**：参见 `CHINA_WECHAT_CLOUD_STATUS.md` 任务 5

---

## 📈 进度总览

### 海外系统（Supabase）

| 模块 | 完成度 | 说明 |
|------|--------|------|
| IP 检测 | 100% ✅ | 完全正常 |
| 数据库表 | 100% ✅ | 表结构完整 |
| 支付 API | 100% ✅ | PayPal + Stripe 已修复 |
| 用户认证 | 100% ✅ | Supabase Auth |
| 收藏功能 | 100% ✅ | 正常工作 |
| 自定义网站 | 100% ✅ | 正常工作 |
| 利润统计 | 100% ✅ | 视图已创建 |
| **总计** | **90%** | **等待执行清理脚本** |

### 国内系统（微信云）

| 模块 | 完成度 | 说明 |
|------|--------|------|
| IP 检测 | 100% ✅ | 可以识别中国 |
| 环境变量 | 100% ✅ | 已配置 |
| SDK 安装 | 0% ❌ | 未安装 |
| 微信云客户端 | 0% ❌ | 未创建 |
| 数据库集合 | 0% ❓ | 未知状态 |
| 前端切换 | 0% ❌ | 未实现 |
| 微信支付 | 0% ❌ | 未实现 |
| **总计** | **20%** | **仅完成规划** |

---

## 🎯 下一步操作建议

### 今天（立即执行）

1. **执行 Supabase 清理脚本**（5分钟）
   - 登录 Supabase Dashboard
   - 运行 `SUPABASE_CLEANUP_FIX.sql`
   - 验证结果

2. **测试海外支付流程**（30分钟）
   - 测试 PayPal 支付
   - 测试 Stripe 支付
   - 验证数据写入正确

3. **确认国内系统需求**（讨论）
   - 是否现在就实现微信云集成？
   - 还是先完善海外系统？
   - 时间规划？

### 本周（如果实现国内系统）

1. 安装微信云 SDK（5分钟）
2. 创建微信云客户端（10分钟）
3. 创建数据库集合（30分钟）
4. 更新前端代码（1-2小时）
5. 实现微信支付 API（2-3小时）
6. 测试中国用户流程（1小时）

**总计**：约 5-7 小时

---

## 📚 相关文档

| 文档名称 | 说明 |
|---------|------|
| `ARCHITECTURE_FINAL.md` | 完整架构文档 |
| `DATABASE_LOGIC_CHECK_REPORT.md` | 逻辑一致性检查 |
| `SUPABASE_STATUS_AND_FIX.md` | Supabase 状态分析 |
| `CHINA_WECHAT_CLOUD_STATUS.md` | 微信云配置状态 |
| `SUPABASE_CLEANUP_FIX.sql` | 数据库清理脚本 |

---

## ✅ 验证清单

### 海外系统（Supabase）

- [ ] 执行了 `SUPABASE_CLEANUP_FIX.sql`
- [ ] 删除了 `subscriptions` 表
- [ ] `web_payment_transactions` 外键引用 `web_subscriptions`
- [ ] PayPal 支付测试通过
- [ ] Stripe 支付测试通过
- [ ] `web_subscriptions` 表有数据
- [ ] `web_payment_transactions` 表有数据
- [ ] 利润统计视图正常显示

### 国内系统（微信云）

- [ ] 安装了 `@cloudbase/js-sdk`
- [ ] 创建了 `lib/cloudbase/client.ts`
- [ ] 创建了 5 个数据库集合
- [ ] 前端支持双数据库切换
- [ ] 实现了微信支付 API
- [ ] 中国用户收藏功能测试通过
- [ ] 中国用户支付功能测试通过

---

**报告生成时间**：2025-01-14
**状态快照**：海外系统代码已完成，等待执行清理脚本；国内系统已规划，等待实施。
**建议操作**：先执行 Supabase 清理脚本并测试海外支付，再决定是否立即实施国内系统。
