# 微信云数据库集合结构 - 订阅管理

## 1. sitehub_subscriptions 集合

### 字段结构
```javascript
{
  _id: "subscription_id",                    // 自动生成的订阅ID
  _openid: "user_openid",                   // 用户OpenID（自动添加）
  
  // 订阅基本信息
  plan_type: "personal",                    // 套餐类型: "personal" | "team"
  billing_cycle: "monthly",                 // 计费周期: "monthly" | "yearly"
  status: "active",                         // 状态: "pending" | "active" | "cancelled" | "expired" | "failed"
  auto_renew: true,                         // 是否自动续费
  
  // 微信支付信息
  wechat_order_id: "wx_order_123456",      // 微信订单号
  wechat_transaction_id: "wx_txn_789",     // 微信交易号
  wechat_prepay_id: "wx_prepay_456",       // 微信预支付ID
  payment_method: "wechat",                // 支付方式
  
  // 金额信息
  amount: 19.99,                           // 金额（元）
  currency: "CNY",                         // 货币
  
  // 时间信息
  start_date: "2025-01-01T00:00:00.000Z", // 开始时间
  current_period_end: "2025-02-01T00:00:00.000Z", // 当前周期结束时间
  cancel_at_period_end: false,             // 是否在周期结束时取消
  cancelled_at: null,                      // 取消时间
  
  // 系统字段
  created_at: "2025-01-01T00:00:00.000Z", // 创建时间
  updated_at: "2025-01-01T00:00:00.000Z"  // 更新时间
}
```

### 索引设置
```javascript
// 用户订阅查询
db.collection('sitehub_subscriptions').createIndex({
  _openid: 1,
  status: 1
})

// 自动续费查询
db.collection('sitehub_subscriptions').createIndex({
  status: 1,
  auto_renew: 1,
  current_period_end: 1
})

// 微信订单查询
db.collection('sitehub_subscriptions').createIndex({
  wechat_order_id: 1
})
```

### 权限设置
```javascript
{
  "read": "auth.openid == resource._openid",
  "write": "auth.openid == resource._openid",
  "create": "auth != null",
  "update": "auth.openid == resource._openid"
}
```

## 2. sitehub_subscription_history 集合

### 字段结构
```javascript
{
  _id: "history_id",                       // 自动生成的历史记录ID
  _openid: "user_openid",                 // 用户OpenID
  
  // 关联信息
  subscription_id: "subscription_id",      // 关联的订阅ID
  action: "created",                       // 操作类型: "created" | "renewed" | "cancelled" | "expired" | "failed" | "refunded"
  
  // 金额信息
  amount: 19.99,                          // 金额
  transaction_id: "txn_123456",           // 交易ID
  
  // 备注信息
  notes: "Initial subscription",          // 备注
  
  // 时间
  created_at: "2025-01-01T00:00:00.000Z" // 创建时间
}
```

### 索引设置
```javascript
// 订阅历史查询
db.collection('sitehub_subscription_history').createIndex({
  subscription_id: 1,
  created_at: -1
})

// 用户历史查询
db.collection('sitehub_subscription_history').createIndex({
  _openid: 1,
  created_at: -1
})
```

### 权限设置
```javascript
{
  "read": "auth.openid == resource._openid",
  "write": "auth.openid == resource._openid",
  "create": "auth != null",
  "update": false,
  "delete": false
}
```

## 3. sitehub_payments 集合

### 字段结构
```javascript
{
  _id: "payment_id",                      // 自动生成的支付记录ID
  _openid: "user_openid",                // 用户OpenID
  
  // 关联信息
  subscription_id: "subscription_id",     // 关联的订阅ID（可选）
  order_id: "order_123456",              // 订单ID
  transaction_id: "txn_789",             // 交易ID
  
  // 支付信息
  amount: 19.99,                         // 金额
  currency: "CNY",                       // 货币
  payment_method: "wechat",              // 支付方式
  payment_status: "success",             // 支付状态: "pending" | "success" | "failed" | "refunded"
  
  // 时间信息
  created_at: "2025-01-01T00:00:00.000Z", // 创建时间
  paid_at: "2025-01-01T00:01:00.000Z"    // 支付完成时间
}
```

### 索引设置
```javascript
// 订单查询
db.collection('sitehub_payments').createIndex({
  order_id: 1
})

// 用户支付记录
db.collection('sitehub_payments').createIndex({
  _openid: 1,
  created_at: -1
})

// 支付状态查询
db.collection('sitehub_payments').createIndex({
  payment_status: 1,
  created_at: -1
})
```

### 权限设置
```javascript
{
  "read": "auth.openid == resource._openid",
  "write": "auth.openid == resource._openid",
  "create": "auth != null",
  "update": "auth.openid == resource._openid",
  "delete": false
}
```

## 4. sitehub_pricing 集合

### 字段结构
```javascript
{
  _id: "pricing_id",                      // 自动生成的价格ID
  
  // 价格配置
  plan_type: "personal",                  // 套餐类型: "personal" | "team"
  billing_cycle: "monthly",               // 计费周期: "monthly" | "yearly"
  amount: 19.99,                         // 价格
  currency: "CNY",                       // 货币
  is_active: true,                       // 是否激活
  
  // 时间信息
  created_at: "2025-01-01T00:00:00.000Z", // 创建时间
  updated_at: "2025-01-01T00:00:00.000Z"  // 更新时间
}
```

### 索引设置
```javascript
// 价格查询
db.collection('sitehub_pricing').createIndex({
  plan_type: 1,
  billing_cycle: 1,
  is_active: 1
})
```

### 权限设置
```javascript
{
  "read": true,                          // 公开读取
  "write": false,                        // 禁止写入
  "create": false,                       // 禁止创建
  "update": false,                       // 禁止更新
  "delete": false                        // 禁止删除
}
```

## 5. sitehub_renewal_tasks 集合

### 字段结构
```javascript
{
  _id: "task_id",                        // 自动生成的任务ID
  _openid: "user_openid",               // 用户OpenID
  
  // 任务信息
  subscription_id: "subscription_id",    // 关联的订阅ID
  task_type: "renewal",                  // 任务类型: "renewal" | "reminder" | "expiry_notice"
  scheduled_at: "2025-01-01T02:00:00.000Z", // 计划执行时间
  status: "pending",                     // 状态: "pending" | "processing" | "completed" | "failed"
  
  // 重试信息
  attempts: 0,                           // 尝试次数
  max_attempts: 3,                       // 最大尝试次数
  last_attempt_at: null,                 // 最后尝试时间
  error_message: null,                   // 错误信息
  
  // 时间信息
  created_at: "2025-01-01T00:00:00.000Z" // 创建时间
}
```

### 索引设置
```javascript
// 任务调度查询
db.collection('sitehub_renewal_tasks').createIndex({
  scheduled_at: 1,
  status: 1
})

// 订阅任务查询
db.collection('sitehub_renewal_tasks').createIndex({
  subscription_id: 1,
  created_at: -1
})
```

### 权限设置
```javascript
{
  "read": "auth.openid == resource._openid",
  "write": false,                        // 只能通过云函数写入
  "create": false,                       // 只能通过云函数创建
  "update": false,                       // 只能通过云函数更新
  "delete": false                        // 只能通过云函数删除
}
```

## 6. 数据初始化

### 价格数据初始化
```javascript
// 在云函数中执行初始化
const pricingData = [
  { plan_type: 'personal', billing_cycle: 'monthly', amount: 19.99, currency: 'CNY', is_active: true },
  { plan_type: 'personal', billing_cycle: 'yearly', amount: 168.00, currency: 'CNY', is_active: true },
  { plan_type: 'team', billing_cycle: 'monthly', amount: 299.99, currency: 'CNY', is_active: true },
  { plan_type: 'team', billing_cycle: 'yearly', amount: 2520.00, currency: 'CNY', is_active: true }
]

// 批量插入价格数据
const db = cloud.database()
for (const pricing of pricingData) {
  await db.collection('sitehub_pricing').add({
    data: {
      ...pricing,
      created_at: new Date(),
      updated_at: new Date()
    }
  })
}
```

## 7. 数据迁移脚本

### 从现有用户数据迁移
```javascript
// 迁移现有用户到订阅系统
async function migrateExistingUsers() {
  const db = cloud.database()
  
  // 获取所有现有用户
  const users = await db.collection('sitehub_users').get()
  
  for (const user of users.data) {
    // 为Pro用户创建订阅记录
    if (user.is_pro) {
      await db.collection('sitehub_subscriptions').add({
        data: {
          plan_type: 'personal',
          billing_cycle: 'monthly',
          status: 'active',
          auto_renew: false,
          amount: 19.99,
          currency: 'CNY',
          start_date: user.created_at || new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
          cancel_at_period_end: true, // 标记为到期取消
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }
  }
}
```

## 8. 查询示例

### 获取用户活跃订阅
```javascript
async function getUserActiveSubscription(openid) {
  const db = cloud.database()
  const result = await db.collection('sitehub_subscriptions')
    .where({
      _openid: openid,
      status: 'active'
    })
    .orderBy('created_at', 'desc')
    .limit(1)
    .get()
  
  return result.data[0] || null
}
```

### 获取即将到期的订阅
```javascript
async function getExpiringSubscriptions() {
  const db = cloud.database()
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  
  const result = await db.collection('sitehub_subscriptions')
    .where({
      status: 'active',
      auto_renew: true,
      cancel_at_period_end: false,
      current_period_end: db.command.lte(tomorrow)
    })
    .get()
  
  return result.data
}
```

### 获取订阅统计
```javascript
async function getSubscriptionStats() {
  const db = cloud.database()
  
  // 活跃订阅统计
  const activeSubs = await db.collection('sitehub_subscriptions')
    .where({ status: 'active' })
    .get()
  
  // 按套餐类型分组统计
  const stats = {
    personal: { monthly: 0, yearly: 0 },
    team: { monthly: 0, yearly: 0 },
    total: 0,
    revenue: 0
  }
  
  for (const sub of activeSubs.data) {
    stats[sub.plan_type][sub.billing_cycle]++
    stats.total++
    stats.revenue += sub.amount
  }
  
  return stats
}
```






