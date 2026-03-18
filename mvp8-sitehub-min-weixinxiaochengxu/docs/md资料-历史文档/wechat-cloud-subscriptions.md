# 微信云数据库 - 订阅管理集合定义

## 集合名称：sitehub_subscriptions

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | string | 是 | 自动生成的唯一ID |
| user_id | string | 是 | 用户openid |
| plan_type | string | 是 | 套餐类型：free/pro/team |
| billing_cycle | string | 否 | 计费周期：monthly/yearly |
| status | string | 是 | 状态：active/cancelled/expired/pending |
| payment_method | string | 否 | 支付方式：wechat/alipay |
| transaction_id | string | 否 | 微信支付交易号 |
| amount | number | 否 | 支付金额 |
| currency | string | 否 | 货币类型，默认CNY |
| start_date | date | 是 | 订阅开始时间 |
| current_period_end | date | 是 | 当前周期结束时间 |
| cancel_at_period_end | boolean | 否 | 是否在周期结束时取消，默认false |
| cancelled_at | date | 否 | 取消时间 |
| created_at | date | 是 | 创建时间 |
| updated_at | date | 是 | 更新时间 |

### 索引设置

1. **user_id** - 升序索引
2. **status** - 升序索引
3. **current_period_end** - 降序索引
4. **created_at** - 降序索引

### 权限设置

```javascript
{
  "read": true,  // 所有用户可读（会通过云函数过滤）
  "write": false // 仅云函数可写
}
```

### 创建步骤

1. 登录微信云开发控制台
2. 进入"数据库"
3. 点击"添加集合"
4. 集合名称：`sitehub_subscriptions`
5. 按照上述字段定义添加索引
6. 设置权限

### 示例数据结构

```json
{
  "_id": "subscription_xxx",
  "user_id": "oXXXXXXXXXXXXXX",
  "plan_type": "pro",
  "billing_cycle": "yearly",
  "status": "active",
  "payment_method": "wechat",
  "transaction_id": "4200001234567890",
  "amount": 168,
  "currency": "CNY",
  "start_date": {
    "$date": "2025-01-10T00:00:00.000Z"
  },
  "current_period_end": {
    "$date": "2026-01-10T23:59:59.000Z"
  },
  "cancel_at_period_end": false,
  "cancelled_at": null,
  "created_at": {
    "$date": "2025-01-10T08:30:00.000Z"
  },
  "updated_at": {
    "$date": "2025-01-10T08:30:00.000Z"
  }
}
```

## 同时需要更新的集合：sitehub_users

### 新增字段

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| is_pro | boolean | 否 | 是否为Pro会员，默认false |
| subscription_status | string | 否 | 订阅状态，默认free |
| subscription_expires_at | date | 否 | 订阅到期时间 |

### 更新步骤

1. 进入`sitehub_users`集合
2. 编辑字段，添加上述三个新字段
3. 不影响现有数据

## 使用说明

### 查询用户订阅

```javascript
const db = cloud.database()
const _ = db.command

// 查询用户当前订阅
const result = await db.collection('sitehub_subscriptions')
  .where({
    user_id: userOpenid,
    status: _.in(['active', 'cancelled'])
  })
  .orderBy('created_at', 'desc')
  .limit(1)
  .get()
```

### 查询订阅历史

```javascript
const history = await db.collection('sitehub_subscriptions')
  .where({
    user_id: userOpenid
  })
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()
```

### 取消订阅

```javascript
await db.collection('sitehub_subscriptions')
  .doc(subscriptionId)
  .update({
    data: {
      cancel_at_period_end: true,
      cancelled_at: new Date(),
      updated_at: new Date()
    }
  })
```

### 重新激活订阅

```javascript
await db.collection('sitehub_subscriptions')
  .doc(subscriptionId)
  .update({
    data: {
      cancel_at_period_end: false,
      cancelled_at: null,
      status: 'active',
      updated_at: new Date()
    }
  })
```

## 注意事项

1. ⚠️ 所有写操作应通过云函数进行，不要在前端直接操作
2. ⚠️ 订阅取消是"标记取消"，服务持续到 `current_period_end`
3. ⚠️ 需要定期检查过期订阅，更新 `status` 为 `expired`
4. ⚠️ 支付成功后需要同时更新 `sitehub_users` 表的会员状态







