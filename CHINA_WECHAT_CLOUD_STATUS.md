# 🔍 国内微信云数据库配置状态报告

## 执行日期
2025-01-14

## 📊 检查结果总结

### ✅ 已完成的部分

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| **IP 地理检测** | ✅ 完成 | `/api/geo/detect` API 正常工作 |
| **区域分类逻辑** | ✅ 完成 | 可以正确识别 `china` 区域 |
| **GeoContext** | ✅ 完成 | React Context 提供地理位置信息 |
| **前端区域判断** | ✅ 完成 | `app/page.tsx` 可以获取 `regionCategory` |
| **环境变量配置** | ✅ 完成 | `.env.local` 中已配置微信云凭证 |

### ❌ 未完成的部分（关键！）

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| **WeChat Cloud SDK** | ❌ 未安装 | `package.json` 中没有 `@cloudbase/js-sdk` |
| **微信云客户端** | ❌ 未创建 | 没有 `lib/cloudbase/client.ts` 文件 |
| **数据库切换逻辑** | ❌ 未实现 | 前端没有根据 `regionCategory` 切换数据库 |
| **微信云数据库集合** | ❓ 未知 | 需要登录微信云控制台确认 |
| **微信支付集成** | ❌ 未实现 | 官网没有微信支付 API |

---

## 📋 详细检查结果

### 1. IP 检测逻辑 ✅

#### 文件：`app/api/geo/detect/route.ts`

**检测流程**：
```
用户访问官网
    ↓
GET /api/geo/detect
    ↓
调用 ip-api.com 获取 IP 地理位置
    ↓
返回 regionCategory: 'china' | 'usa' | 'india' | 'singapore' | 'europe' | 'other'
```

**测试结果**：✅ API 正常工作

示例返回（中国用户）：
```json
{
  "success": true,
  "data": {
    "countryCode": "CN",
    "regionCategory": "china",
    "currency": "CNY",
    "paymentMethods": ["alipay", "wechatpay", "unionpay", "stripe", "paypal"],
    "language": "zh-CN"
  }
}
```

示例返回（海外用户）：
```json
{
  "success": true,
  "data": {
    "countryCode": "US",
    "regionCategory": "usa",
    "currency": "USD",
    "paymentMethods": ["stripe", "paypal"],
    "language": "en-US"
  }
}
```

#### 文件：`lib/ip-detection.ts`

**区域分类函数**：
```typescript
export function getRegionFromCountryCode(countryCode: string): Region {
  if (countryCode === 'CN') return 'china'  // ✅ 正确识别中国
  if (countryCode === 'US') return 'usa'
  if (countryCode === 'IN') return 'india'
  if (countryCode === 'SG') return 'singapore'
  if (EUROPEAN_COUNTRIES.includes(countryCode)) return 'europe'
  return 'other'
}
```

**支付方式配置**：
```typescript
export function getPaymentMethodsByRegion(region: Region): string[] {
  switch (region) {
    case 'china':
      return ['alipay', 'wechatpay', 'unionpay', 'stripe', 'paypal']  // ✅ 包含微信支付
    case 'usa':
    case 'india':
    case 'singapore':
    case 'other':
      return ['stripe', 'paypal']
    case 'europe':
      return []  // 欧洲地区屏蔽支付
  }
}
```

**结论**：✅ IP 检测逻辑完全正确，可以准确识别中国用户

---

### 2. 前端使用检测结果 ⚠️

#### 文件：`contexts/geo-context.tsx`

**GeoContext 提供的数据**：
```typescript
const {
  regionCategory,  // 'china' | 'usa' | ...
  loading,         // 是否正在加载
  isChina          // 是否中国用户
} = useGeo()
```

**状态**：✅ Context 正常工作

#### 文件：`app/page.tsx`

**当前使用情况**：
```typescript
const { regionCategory, loading: geoLoading } = useGeo()

// Line 154-157: 根据区域设置默认分类
const defaultCategory = regionCategory === "china" ? "china" : "all"
setSelectedCategory(defaultCategory)
```

**问题**：
- ❌ 只用于设置默认网站分类
- ❌ 没有根据 `regionCategory` 切换数据库
- ❌ 所有用户都使用 Supabase，中国用户没有使用微信云

**当前数据库调用**（Line 165-180）：
```typescript
// 收藏功能：所有用户都使用 Supabase
const { data, error } = await supabase
  .from("user_favorites")  // ❌ 中国用户应该使用微信云
  .select("site_id")
  .eq("user_id", user.id)
```

**需要修改为**：
```typescript
// 根据区域选择数据库
if (regionCategory === "china") {
  // 使用微信云数据库
  const favorites = await tcb.collection("china_favorites").where({
    user_id: user.id
  }).get()
} else {
  // 使用 Supabase
  const { data, error } = await supabase
    .from("user_favorites")
    .select("site_id")
    .eq("user_id", user.id)
}
```

---

### 3. 微信云 SDK 配置 ❌

#### package.json 检查

**结果**：❌ **没有安装微信云 SDK**

当前依赖中没有：
- ❌ `@cloudbase/js-sdk`（推荐）
- ❌ `tcb-js-sdk`（旧版）
- ❌ `wx-server-sdk`（小程序专用）

**需要安装**：
```bash
npm install @cloudbase/js-sdk
```

#### lib/cloudbase/ 目录检查

**结果**：❌ **目录不存在**

需要创建文件：`lib/cloudbase/client.ts`

---

### 4. 环境变量检查 ✅

#### 文件：`.env.local`

**微信云配置**（已存在）：
```env
# 微信支付配置（生产环境）
WECHAT_APP_ID=wxf1aca21b5b79581d
WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
WECHAT_MCH_ID=1694786758
WECHAT_API_KEY=mornsciencemornscience2025100705
```

**状态**：✅ 环境变量已配置完整

---

## 🚨 需要立即完成的任务

### 任务 1：安装微信云 SDK（5分钟）

```bash
cd /Users/qinwenyan/Desktop/工作台/Mornhup/morn-mvp/mvp_8
npm install @cloudbase/js-sdk --save
```

### 任务 2：创建微信云客户端（10分钟）

**创建文件**：`lib/cloudbase/client.ts`

```typescript
import cloudbase from '@cloudbase/js-sdk'

// 初始化微信云
const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'
})

// 获取数据库实例
const db = app.database()

// 导出
export { app, db }
export default app
```

**注意**：需要在 `.env.local` 中添加公开环境变量：
```env
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
```

### 任务 3：更新前端代码支持双数据库（1-2小时）

#### 修改 `app/page.tsx`

**需要修改的功能**：
1. 收藏功能（Line 165-180）
2. 自定义网站功能（Line 206-235）
3. 添加收藏（Line 482-492）
4. 删除收藏（Line 492）
5. 添加自定义网站（Line 420）
6. 删除自定义网站（Line 519）

**修改示例（收藏功能）**：

```typescript
import { db as wechatDB } from '@/lib/cloudbase/client'

// Line 165 - 加载收藏
useEffect(() => {
  const loadFavorites = async () => {
    if (!user) return

    if (regionCategory === "china") {
      // 使用微信云数据库
      try {
        const res = await wechatDB.collection("china_favorites")
          .where({ user_id: user.id })
          .get()

        const favoriteIds = res.data.map((fav: any) => fav.site_id)
        setFavorites(favoriteIds)
      } catch (error) {
        console.error("Failed to load favorites from WeChat Cloud:", error)
      }
    } else {
      // 使用 Supabase（海外用户）
      const { data, error } = await supabase
        .from("user_favorites")
        .select("site_id")
        .eq("user_id", user.id)

      if (error) {
        console.error("Failed to load favorites:", error)
        return
      }

      setFavorites(data.map((fav) => fav.site_id))
    }
  }

  loadFavorites()
}, [user, regionCategory])
```

### 任务 4：创建微信云数据库集合（30分钟）

#### 登录微信云控制台

1. 访问：https://console.cloud.tencent.com/tcb
2. 选择环境：`cloudbase-1gnip2iaa08260e5`
3. 进入"数据库" → "集合"
4. 创建以下集合：

#### 集合 1：`china_users`（用户表）

```javascript
{
  _id: String,           // 自动生成
  openid: String,        // 微信 openid（如果使用微信登录）
  email: String,         // Email（如果使用 Email 登录）
  nickname: String,      // 昵称
  avatar: String,        // 头像 URL
  is_pro: Boolean,       // 是否会员
  created_at: Date,      // 创建时间
  updated_at: Date       // 更新时间
}
```

#### 集合 2：`china_favorites`（收藏表）

```javascript
{
  _id: String,           // 自动生成
  user_id: String,       // 关联 china_users._id
  site_id: String,       // 网站 ID
  created_at: Date       // 收藏时间
}
```

**索引**：
- `user_id`（普通索引）
- `user_id + site_id`（唯一索引，防止重复收藏）

#### 集合 3：`china_custom_sites`（自定义网站）

```javascript
{
  _id: String,
  user_id: String,       // 关联 china_users._id
  name: String,          // 网站名称
  url: String,           // 网站 URL
  logo: String,          // Logo URL
  category: String,      // 分类
  description: String,   // 描述（可选）
  created_at: Date,
  updated_at: Date
}
```

**索引**：
- `user_id`（普通索引）

#### 集合 4：`china_subscriptions`（订阅表）

```javascript
{
  _id: String,
  user_id: String,           // 关联 china_users._id
  plan_type: String,         // 'pro' | 'team' | 'enterprise'
  billing_cycle: String,     // 'monthly' | 'yearly'
  status: String,            // 'active' | 'expired' | 'cancelled'
  payment_method: String,    // 'wechat' | 'alipay'
  start_time: Date,          // 开始时间
  expire_time: Date,         // 过期时间
  auto_renew: Boolean,       // 自动续费
  transaction_id: String,    // 微信/支付宝订单号
  created_at: Date,
  updated_at: Date
}
```

**索引**：
- `user_id`（普通索引）
- `transaction_id`（唯一索引）

#### 集合 5：`china_payment_transactions`（支付记录）

```javascript
{
  _id: String,
  user_id: String,
  product_name: String,      // 'sitehub'
  plan_type: String,
  billing_cycle: String,
  payment_method: String,    // 'wechat' | 'alipay'
  payment_status: String,    // 'pending' | 'completed' | 'refunded'
  transaction_type: String,  // 'purchase' | 'renewal' | 'refund'
  currency: String,          // 'CNY'
  gross_amount: Number,      // 金额（分）
  payment_fee: Number,       // 手续费（分）
  net_amount: Number,        // 净收入（分）
  profit: Number,            // 利润（分）
  transaction_id: String,    // 微信/支付宝订单号
  payment_time: Date,        // 支付时间
  created_at: Date
}
```

**索引**：
- `user_id`（普通索引）
- `transaction_id`（唯一索引）

### 任务 5：实现微信支付 API（2-3小时）

#### 创建文件：`app/api/payment/wechat/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
// 微信支付 SDK（需要安装）
// npm install wechatpay-axios-plugin

export async function POST(request: NextRequest) {
  const { planType, billingCycle, userId } = await request.json()

  // 1. 创建微信支付订单
  // 2. 返回支付参数给前端
  // 3. 前端调用微信支付 JSAPI

  return NextResponse.json({
    success: true,
    data: {
      // 微信支付参数
    }
  })
}
```

#### 创建文件：`app/api/payment/wechat/notify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db as wechatDB } from '@/lib/cloudbase/client'

export async function POST(request: NextRequest) {
  // 1. 验证微信支付签名
  // 2. 解析支付结果
  // 3. 写入 china_subscriptions 和 china_payment_transactions

  return NextResponse.json({ success: true })
}
```

---

## 📊 架构现状对比

### 海外系统（Supabase）✅

| 功能 | 状态 | 说明 |
|------|------|------|
| IP 检测 | ✅ | 正常工作 |
| 数据库 | ✅ | Supabase PostgreSQL |
| 用户表 | ✅ | `auth.users` |
| 收藏表 | ✅ | `user_favorites` |
| 自定义网站 | ✅ | `user_custom_sites` |
| 订阅表 | ✅ | `web_subscriptions` |
| 支付记录 | ✅ | `web_payment_transactions` |
| PayPal 支付 | ✅ | 已实现 |
| Stripe 支付 | ✅ | 已实现 |

### 国内系统（微信云）❌

| 功能 | 状态 | 说明 |
|------|------|------|
| IP 检测 | ✅ | 可以识别中国用户 |
| 数据库 | ❌ | 微信云 SDK 未安装 |
| 用户表 | ❓ | `china_users` 集合（需创建） |
| 收藏表 | ❓ | `china_favorites` 集合（需创建） |
| 自定义网站 | ❓ | `china_custom_sites` 集合（需创建） |
| 订阅表 | ❓ | `china_subscriptions` 集合（需创建） |
| 支付记录 | ❓ | `china_payment_transactions` 集合（需创建） |
| 微信支付 | ❌ | 未实现 |
| 支付宝 | ❌ | 未实现 |
| 前端切换逻辑 | ❌ | 未实现 |

---

## ✅ 完成标准

国内系统完全可用需要满足：

1. ✅ 安装微信云 SDK
2. ✅ 创建微信云客户端
3. ✅ 创建所有数据库集合
4. ✅ 前端支持双数据库切换
5. ✅ 实现微信支付 API
6. ✅ 测试中国用户收藏功能
7. ✅ 测试中国用户支付功能

---

## 🎯 总结

### 当前进度：20%

- ✅ IP 检测完全正常
- ✅ 环境变量已配置
- ❌ SDK 未安装
- ❌ 数据库未创建
- ❌ 前端未实现切换逻辑
- ❌ 支付 API 未实现

### 预计工作量

| 任务 | 时间 | 优先级 |
|------|------|--------|
| 安装 SDK | 5 分钟 | 🔴 高 |
| 创建客户端 | 10 分钟 | 🔴 高 |
| 创建数据库集合 | 30 分钟 | 🔴 高 |
| 更新前端代码 | 1-2 小时 | 🔴 高 |
| 实现微信支付 | 2-3 小时 | 🟡 中 |
| 测试功能 | 1 小时 | 🟡 中 |

**总计**：约 5-7 小时

### 下一步建议

1. **立即执行**：安装 `@cloudbase/js-sdk`
2. **第二步**：创建 `lib/cloudbase/client.ts`
3. **第三步**：登录微信云控制台创建数据库集合
4. **第四步**：修改 `app/page.tsx` 实现双数据库切换
5. **第五步**：实现微信支付 API
6. **最后**：完整测试中国用户流程

---

**报告生成时间**：2025-01-14
**检查范围**：官网前端 + 微信云配置
**结论**：IP 检测正常，但微信云集成完全未实现，需要从 SDK 安装开始逐步完成。
