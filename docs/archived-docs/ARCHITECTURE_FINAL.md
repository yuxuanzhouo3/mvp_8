# 🏗️ SiteHub 完整架构文档

## 📊 系统架构概览

SiteHub 采用**双数据库架构**，根据用户IP地理位置自动选择数据存储方案。

```
                    ┌─────────────────┐
                    │   用户访问      │
                    │  www.mornhub.help│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  IP 地理检测    │
                    │ /api/geo/detect │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │  IP 在海外      │       │  IP 在中国      │
        │  (非中国大陆)    │       │  (中国大陆)     │
        └───────┬────────┘       └───────┬────────┘
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │  Supabase      │       │  微信云数据库   │
        │  PostgreSQL    │       │  (CloudBase)   │
        └───────┬────────┘       └───────┬────────┘
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │ Stripe/PayPal  │       │ 微信支付/支付宝 │
        └────────────────┘       └────────────────┘
```

---

## 🌍 海外系统（Supabase）

### 适用用户
- IP 地址在**中国大陆以外**
- 自动检测：`regionCategory !== 'china'`

### 数据库：Supabase PostgreSQL

#### 表命名规范

| 功能模块 | 表名 | 前缀 | 说明 |
|---------|------|------|------|
| **用户认证** | | | |
| 用户账户 | `auth.users` | `auth.` | Supabase Auth（Email/OAuth） |
| 用户 Session | `auth.sessions` | `auth.` | 登录会话管理 |
| **用户数据** | | | |
| 收藏夹 | `user_favorites` | `user_` | 用户收藏的网站 |
| 自定义网站 | `user_custom_sites` | `user_` | 用户添加的自定义网站 |
| **订阅和支付** | | | |
| 订阅管理 | `web_subscriptions` | `web_` | 会员订阅信息 |
| 支付交易 | `web_payment_transactions` | `web_` | 支付记录和利润统计 |

#### 支付方式
- **Stripe**（信用卡/借记卡）
  - 测试价格：Pro $0.50/月，Team $1.00/月
  - 正式价格：Pro $168/年，Team $2520/年
  - 环境：生产环境（Live Mode）

- **PayPal**（PayPal账户）
  - 测试价格：Pro $0.50/月，Team $1.00/月
  - 正式价格：Pro $168/年，Team $2520/年
  - 环境：生产环境（Production）

#### 货币
USD（美元）

---

## 🇨🇳 国内系统（微信云数据库）

### 适用用户
- IP 地址在**中国大陆**
- 自动检测：`regionCategory === 'china'`

### 数据库：微信云数据库 (CloudBase)

#### 环境变量配置
```env
# 微信支付配置（生产环境）
WECHAT_APP_ID=wxf1aca21b5b79581d
WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
WECHAT_MCH_ID=1694786758
WECHAT_API_KEY=mornsciencemornscience2025100705
```

#### 表命名规范（需要在微信云数据库中创建）

| 功能模块 | 集合名 | 说明 |
|---------|-------|------|
| **用户认证** | | |
| 用户账户 | `china_users` | 微信用户（openid） |
| **用户数据** | | |
| 收藏夹 | `china_favorites` | 用户收藏的网站 |
| 自定义网站 | `china_custom_sites` | 用户添加的自定义网站 |
| **订阅和支付** | | |
| 订阅管理 | `china_subscriptions` | 会员订阅信息 |
| 支付交易 | `china_payment_transactions` | 支付记录和利润统计 |

#### 支付方式
- **微信支付**
  - 商户号：1694786758
  - API密钥：已配置
  - 支持：扫码支付、H5支付、JSAPI支付

- **支付宝**（待配置）
  - 环境：沙盒环境（需要升级为生产环境）
  - 网关：`https://openapi.alipaydev.com/gateway.do`
  - 需要：ICP备案（2-4周）

#### 货币
CNY（人民币）

---

## 📱 小程序系统（独立）

### 平台
微信小程序（WeChat Mini Program）

### 数据库：Supabase PostgreSQL

#### 表命名规范

| 功能模块 | 表名 | 前缀 | 说明 |
|---------|------|------|------|
| **用户** | | | |
| 用户账户 | `sitehub_users` | `sitehub_` | 微信用户（openid） |
| **用户数据** | | | |
| 收藏夹 | `sitehub_favorites` | `sitehub_` | 小程序收藏 |
| 自定义网站 | `sitehub_custom_sites` | `sitehub_` | 小程序自定义网站 |
| **订阅和支付** | | | |
| 订阅管理 | `sitehub_subscriptions` | `sitehub_` | 小程序订阅 |
| 支付统计 | `sitehub_payment_stats` | `sitehub_` | 支付统计 |
| **其他** | | | |
| 使用统计 | `sitehub_usage_stats` | `sitehub_` | 使用数据统计 |
| 访问日志 | `sitehub_access_logs` | `sitehub_` | 访问日志 |
| 团队管理 | `sitehub_teams` | `sitehub_` | 团队功能 |
| 团队成员 | `sitehub_team_members` | `sitehub_` | 团队成员 |

#### 支付方式
- 微信支付
- 支付宝

#### 货币
CNY（人民币）

---

## 🔀 IP 检测逻辑

### API 端点
`GET /api/geo/detect`

### 检测流程
```typescript
// 1. 获取用户真实 IP
const clientIP = getClientIP(request)
  // 优先级：cf-connecting-ip > x-real-ip > x-forwarded-for

// 2. 调用 ip-api.com 获取地理位置
const response = await fetch(`http://ip-api.com/json/${clientIP}`)

// 3. 解析国家代码
const countryCode = data.countryCode // 例如：'CN', 'US', 'JP'

// 4. 分类区域
const regionCategory = getRegionFromCountryCode(countryCode)
  // 返回：'china' | 'usa' | 'india' | 'singapore' | 'europe' | 'other'

// 5. 返回配置
{
  regionCategory: 'china',
  currency: 'CNY',
  paymentMethods: ['alipay', 'wechatpay'],
  language: 'zh-CN'
}
```

### 区域分类规则

| 国家代码 | 区域分类 | 数据库 | 支付方式 | 货币 |
|---------|---------|--------|---------|-----|
| CN | `china` | 微信云 | 微信支付、支付宝 | CNY |
| US | `usa` | Supabase | Stripe、PayPal | USD |
| IN | `india` | Supabase | Stripe、PayPal | USD |
| SG | `singapore` | Supabase | Stripe、PayPal | USD |
| EU | `europe` | Supabase | 🚫 屏蔽支付（GDPR） | EUR |
| 其他 | `other` | Supabase | Stripe、PayPal | USD |

---

## 📝 数据流程示例

### 1. 海外用户收藏网站

```
用户（美国）访问官网
  ↓
IP 检测：regionCategory = 'usa'
  ↓
前端加载：使用 Supabase 客户端
  ↓
用户点击收藏按钮
  ↓
supabase.from("user_favorites").insert({
  user_id: user.id,
  site_id: 'google'
})
  ↓
数据写入：Supabase user_favorites 表
  ↓
前端显示：收藏成功 ⭐
```

### 2. 国内用户收藏网站

```
用户（中国）访问官网
  ↓
IP 检测：regionCategory = 'china'
  ↓
前端加载：使用微信云数据库 SDK
  ↓
用户点击收藏按钮
  ↓
tcb.collection('china_favorites').add({
  user_id: user.openid,
  site_id: 'baidu'
})
  ↓
数据写入：微信云 china_favorites 集合
  ↓
前端显示：收藏成功 ⭐
```

### 3. 海外用户购买会员（PayPal）

```
用户选择 Pro 套餐 + PayPal
  ↓
POST /api/payment/paypal/create
  ↓
PayPal 创建订单，返回 approval URL
  ↓
用户跳转到 PayPal 支付页面
  ↓
用户完成支付
  ↓
PayPal 回调：/payment/success?token=xxx
  ↓
POST /api/payment/paypal/capture
  ↓
写入数据库：
  - web_subscriptions（订阅记录）
  - web_payment_transactions（支付记录）
  ↓
前端显示：支付成功 ✅
```

### 4. 国内用户购买会员（微信支付）

```
用户选择 Pro 套餐 + 微信支付
  ↓
POST /api/payment/wechat/create
  ↓
微信支付创建订单，返回支付参数
  ↓
前端调用微信支付 JSAPI
  ↓
用户完成支付
  ↓
微信回调：/api/payment/wechat/notify
  ↓
写入数据库：
  - china_subscriptions（订阅记录）
  - china_payment_transactions（支付记录）
  ↓
前端显示：支付成功 ✅
```

---

## ⚠️ 待完成的任务

### 国内系统（微信云）

#### 1. 创建微信云数据库集合

登录微信云控制台，创建以下集合：

```javascript
// 集合 1: china_users（用户表）
{
  _id: String,
  openid: String,       // 微信 openid（唯一）
  nickname: String,     // 昵称
  avatar: String,       // 头像
  is_pro: Boolean,      // 是否会员
  created_at: Date,
  updated_at: Date
}

// 集合 2: china_favorites（收藏表）
{
  _id: String,
  user_id: String,      // 关联 china_users._id
  site_id: String,      // 网站ID
  created_at: Date
}

// 集合 3: china_custom_sites（自定义网站）
{
  _id: String,
  user_id: String,      // 关联 china_users._id
  name: String,
  url: String,
  logo: String,
  category: String,
  created_at: Date,
  updated_at: Date
}

// 集合 4: china_subscriptions（订阅表）
{
  _id: String,
  user_id: String,      // 关联 china_users._id
  plan_type: String,    // 'pro' | 'team'
  billing_cycle: String, // 'monthly' | 'yearly'
  status: String,       // 'active' | 'expired'
  payment_method: String, // 'wechat' | 'alipay'
  start_time: Date,
  expire_time: Date,
  auto_renew: Boolean,
  transaction_id: String, // 微信/支付宝订单号
  created_at: Date,
  updated_at: Date
}

// 集合 5: china_payment_transactions（支付记录）
{
  _id: String,
  user_id: String,
  product_name: String, // 'sitehub'
  plan_type: String,
  billing_cycle: String,
  payment_method: String,
  payment_status: String, // 'pending' | 'completed' | 'refunded'
  transaction_type: String, // 'purchase' | 'renewal' | 'refund'
  currency: String,     // 'CNY'
  gross_amount: Number, // 单位：分
  payment_fee: Number,  // 手续费（分）
  net_amount: Number,   // 净收入（分）
  profit: Number,       // 利润（分）
  transaction_id: String, // 微信/支付宝订单号
  payment_time: Date,
  created_at: Date
}
```

#### 2. 实现微信云数据库 SDK 调用

在前端代码中添加微信云数据库逻辑：

```typescript
// lib/cloudbase/client.ts（需要创建）
import tcb from '@cloudbase/js-sdk'

// 初始化微信云
const app = tcb.init({
  env: 'cloudbase-1gnip2iaa08260e5'
})

const auth = app.auth()
const db = app.database()

export { app, auth, db }
```

#### 3. 更新前端代码支持双数据库

修改 `app/page.tsx`，根据 `regionCategory` 选择数据库：

```typescript
// 伪代码示例
if (regionCategory === 'china') {
  // 使用微信云数据库
  await db.collection('china_favorites').add({...})
} else {
  // 使用 Supabase
  await supabase.from('user_favorites').insert({...})
}
```

---

## ✅ 已完成的任务

### 海外系统（Supabase）

- ✅ IP 地理检测 API
- ✅ Supabase 数据库表设计
- ✅ PayPal 支付集成
- ✅ Stripe 支付集成
- ✅ 用户认证（Email/Google OAuth）
- ✅ 收藏功能
- ✅ 自定义网站功能
- ✅ 订阅管理
- ✅ 支付统计视图

---

## 📊 数据库表对比

| 功能 | 海外（Supabase） | 国内（微信云） | 小程序（Supabase） |
|------|-----------------|--------------|-------------------|
| 前缀 | `user_*`, `web_*` | `china_*` | `sitehub_*` |
| 用户表 | `auth.users` | `china_users` | `sitehub_users` |
| 收藏表 | `user_favorites` | `china_favorites` | `sitehub_favorites` |
| 自定义网站 | `user_custom_sites` | `china_custom_sites` | `sitehub_custom_sites` |
| 订阅表 | `web_subscriptions` | `china_subscriptions` | `sitehub_subscriptions` |
| 支付记录 | `web_payment_transactions` | `china_payment_transactions` | `sitehub_payment_stats` |

---

## 🎯 总结

### 架构优势
- ✅ **合规性**：国内数据存储在微信云，符合数据本地化要求
- ✅ **性能**：用户访问最近的数据库，降低延迟
- ✅ **支付**：每个地区使用本地化支付方式
- ✅ **隔离性**：三套系统数据完全隔离

### 下一步
1. 完成微信云数据库集合创建
2. 实现微信云 SDK 集成
3. 更新前端代码支持双数据库切换
4. 测试国内和海外两套系统
5. 配置微信支付生产环境
