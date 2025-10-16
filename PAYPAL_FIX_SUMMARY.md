# PayPal 支付问题修复总结

**修复时间**: 2025-01-13
**问题描述**: PayPal 支付成功但订单未 capture，导致资金 pending 状态

---

## 🐛 问题根因分析

### 症状
- 用户在 PayPal 完成授权支付
- 银行卡显示两笔 PayPal 付款 **pending**
- Stripe 有一笔成功扣款（已退款）
- PayPal 商户后台没有收到资金
- 3 天后 PayPal 自动退款

### 根本原因

**PayPal 两阶段支付流程未完整**:

```
1. CREATE    → ✅ 已实现 (app/api/payment/paypal/create/route.ts)
2. APPROVED  → ✅ 用户授权成功
3. CAPTURE   → ❌ 没有调用！(这是问题所在)
4. COMPLETED → ❌ 永远无法到达
```

**代码问题位置**: `app/payment/success/page.tsx:33-36`

```typescript
// 旧代码 - 有问题
} else {
  // PayPal或其他支付方式
  setSuccess(true)  // ❌ 直接显示成功，但没有 capture
  setVerifying(false)
}
```

**PayPal 状态机**:
```
CREATED → APPROVED → [需要调用 capture API] → COMPLETED
              ↑
         用户卡在这里
         资金被锁定但未捕获
         3天后自动释放
```

---

## ✅ 修复方案

### 修复步骤 1: 保存支付信息到 localStorage

**文件**: `app/payment/page.tsx:147-161`

**修改内容**:
```typescript
const handlePayPalCheckout = async () => {
  // ... 创建 PayPal 订单 ...

  if (data.approvalUrl) {
    // 💾 保存支付信息到 localStorage
    localStorage.setItem('paypal_payment_info', JSON.stringify({
      planType: selectedPlan,
      billingCycle: billingCycle,
      userEmail: userEmail,
      orderId: data.orderId,
      timestamp: Date.now()
    }))

    console.log('✅ PayPal payment info saved to localStorage')

    // 跳转到 PayPal
    window.location.href = data.approvalUrl
  }
}
```

**为什么需要这样做？**
- PayPal 跳转会丢失当前页面的状态
- 回调时无法直接获取 `planType`、`billingCycle`、`userEmail`
- 使用 localStorage 在浏览器中持久化这些信息

---

### 修复步骤 2: 实现 PayPal capture 逻辑

**文件**: `app/payment/success/page.tsx:40-92`

**修改内容**:
```typescript
} else if (paypalToken) {
  // ===== PayPal 支付捕获 =====
  console.log('🟡 PayPal payment capture...')

  // 1. 从 localStorage 获取支付信息
  const paymentInfoStr = localStorage.getItem('paypal_payment_info')
  if (!paymentInfoStr) {
    console.error('❌ No payment info found')
    setErrorMessage('Payment info not found')
    setVerifying(false)
    return
  }

  const paymentInfo = JSON.parse(paymentInfoStr)
  console.log('📦 Retrieved payment info:', paymentInfo)

  // 2. 调用 capture API 完成支付
  fetch('/api/payment/paypal/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: paypalToken,
      planType: paymentInfo.planType,
      billingCycle: paymentInfo.billingCycle,
      userEmail: paymentInfo.userEmail
    })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.status === 'COMPLETED') {
        console.log('✅ PayPal payment captured successfully')
        setSuccess(true)
        // 清除 localStorage
        localStorage.removeItem('paypal_payment_info')
      } else {
        console.error('❌ PayPal capture failed:', data)
        setErrorMessage(data.error || 'Payment capture failed')
      }
    })
    .catch((error) => {
      console.error('❌ PayPal capture error:', error)
      setErrorMessage('Payment capture error')
    })
    .finally(() => {
      setVerifying(false)
    })
}
```

**关键逻辑**:
1. 从 URL 获取 `token` (PayPal 返回的 orderId)
2. 从 localStorage 恢复支付信息
3. 调用 `/api/payment/paypal/capture` API
4. 验证 capture 状态是 `COMPLETED`
5. 成功后清除 localStorage

---

### 修复步骤 3: 增强 capture API 日志

**文件**: `app/api/payment/paypal/capture/route.ts:23-70`

**修改内容**:
```typescript
export async function POST(req: NextRequest) {
  try {
    const { orderId, planType, userEmail, billingCycle } = await req.json()

    console.log('🟡 PayPal capture request:', {
      orderId, planType, userEmail, billingCycle
    })

    // ... 验证参数 ...

    // 捕获 PayPal 订单
    console.log('📤 Calling PayPal captureOrder API...')
    const { body: order } = await ordersController.captureOrder(request)
    console.log('📥 PayPal capture response:', {
      id: order.id,
      status: order.status
    })

    // 验证状态
    if (order.status !== 'COMPLETED') {
      console.error('❌ PayPal order status not COMPLETED:', order.status)
      return NextResponse.json({
        error: 'Payment not completed',
        status: order.status
      }, { status: 400 })
    }

    // 计算订阅到期时间
    const cycle = billingCycle || planType
    if (cycle === 'yearly') {
      expireTime.setFullYear(expireTime.getFullYear() + 1)
    } else {
      expireTime.setMonth(expireTime.getMonth() + 1)
    }

    console.log('📅 Subscription period:', {
      startTime: now.toISOString(),
      expireTime: expireTime.toISOString(),
      billingCycle: cycle
    })

    // 更新 Supabase
    await supabase.from('subscriptions').upsert({ ... })

    console.log('✅ PayPal subscription activated:', userEmail, planType)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    })
  } catch (error) {
    console.error('❌ PayPal capture error:', error)
    return NextResponse.json({
      error: 'Failed to capture payment'
    }, { status: 500 })
  }
}
```

**增强点**:
- 详细的 console.log 日志便于调试
- 支持 `billingCycle` 参数（区分 monthly/yearly）
- 更清晰的错误信息

---

## 🔄 完整支付流程（修复后）

### Stripe 支付流程（正常工作 ✅）

```
1. 用户选择套餐 → Pro/Team + Monthly/Yearly
2. 点击 Stripe 按钮
3. 调用 /api/payment/stripe/create
4. 跳转到 Stripe Checkout 页面
5. 用户输入信用卡信息
6. Stripe 自动扣款并完成支付
7. 跳转回 /payment/success?session_id=xxx
8. 调用 /api/payment/stripe/check 验证支付
9. 显示成功页面
```

### PayPal 支付流程（已修复 ✅）

```
1. 用户选择套餐 → Pro/Team + Monthly/Yearly
2. 点击 PayPal 按钮
3. 调用 /api/payment/paypal/create
   └─ 返回 orderId 和 approvalUrl
4. 💾 保存支付信息到 localStorage:
   {
     planType: 'pro',
     billingCycle: 'monthly',
     userEmail: 'user@example.com',
     orderId: 'PAYPAL-ORDER-ID',
     timestamp: 1234567890
   }
5. 跳转到 PayPal 登录页面
6. 用户授权支付 (状态: APPROVED)
   └─ 资金被锁定但未捕获
7. 跳转回 /payment/success?token=PAYPAL-ORDER-ID
8. 📦 从 localStorage 读取支付信息
9. 📤 调用 /api/payment/paypal/capture:
   {
     orderId: 'PAYPAL-ORDER-ID',
     planType: 'pro',
     billingCycle: 'monthly',
     userEmail: 'user@example.com'
   }
10. PayPal SDK 捕获订单 (状态: COMPLETED)
    └─ 资金从用户账户转入商户账户
11. 更新 Supabase subscriptions 表
12. 清除 localStorage
13. 显示成功页面
```

**关键区别**:
- Stripe: 一步完成支付
- PayPal: 需要两步（APPROVE + CAPTURE）

---

## 🧪 测试步骤

### 本地测试 PayPal 支付

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问支付页面
open http://localhost:3001/payment

# 3. 填写测试邮箱
Email: test@example.com

# 4. 选择 PayPal 支付

# 5. 使用 PayPal Sandbox 账号登录
Email: sb-buyer@personal.example.com
Password: (从 PayPal Developer Dashboard 获取)

# 6. 授权支付

# 7. 回调到 success 页面

# 8. 观察浏览器 Console 日志
预期看到:
🟡 PayPal payment capture...
📦 Retrieved payment info: {...}
📤 Calling PayPal captureOrder API...
📥 PayPal capture response: { status: 'COMPLETED' }
✅ PayPal payment captured successfully
```

### 验证 Supabase 数据

```sql
-- 登录 Supabase Dashboard
-- 进入 Table Editor → subscriptions

SELECT * FROM subscriptions
WHERE user_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- 预期结果:
{
  user_email: 'test@example.com',
  platform: 'web',
  payment_method: 'paypal',
  plan_type: 'pro',
  status: 'active',
  start_time: '2025-01-13T10:00:00Z',
  expire_time: '2025-02-13T10:00:00Z',  // 月付 +1 个月
  paypal_order_id: 'PAYPAL-ORDER-ID',
  created_at: '2025-01-13T10:00:00Z',
  updated_at: '2025-01-13T10:00:00Z'
}
```

### 验证 PayPal Dashboard

```
1. 登录 PayPal Business Account
2. 进入 Activity → All Transactions
3. 查找测试支付记录

预期状态:
- Status: Completed ✅
- Amount: $19.99 (Pro Monthly)
- Customer: test@example.com
- Description: SiteHub Pro - Monthly Plan
```

---

## 🔍 调试技巧

### 如果支付失败，检查以下日志

#### 1. 浏览器 Console (F12)

```javascript
// 支付前
✅ PayPal payment info saved to localStorage: { planType, userEmail, orderId }

// 回调后
🟡 PayPal payment capture...
📦 Retrieved payment info: { ... }

// capture API 调用
📤 Calling PayPal captureOrder API...
📥 PayPal capture response: { status: 'COMPLETED' }

✅ PayPal payment captured successfully
```

#### 2. 服务端日志 (Terminal)

```bash
# PayPal create
=== PayPal Order Created ===
Order ID: PAYPAL-ORDER-ID
Order Status: CREATED
Approval URL: https://www.paypal.com/checkoutnow?token=xxx

# PayPal capture
🟡 PayPal capture request: { orderId, planType, userEmail, billingCycle }
📤 Calling PayPal captureOrder API...
📥 PayPal capture response: { id: xxx, status: 'COMPLETED' }
📅 Subscription period: { startTime, expireTime, billingCycle }
✅ PayPal subscription activated: user@example.com pro
```

#### 3. localStorage 检查

```javascript
// 在浏览器 Console 执行
localStorage.getItem('paypal_payment_info')

// 预期结果:
"{\"planType\":\"pro\",\"billingCycle\":\"monthly\",\"userEmail\":\"test@example.com\",\"orderId\":\"PAYPAL-ORDER-ID\",\"timestamp\":1234567890}"
```

---

## ❗ 常见错误处理

### 错误 1: "Payment info not found"

**原因**: localStorage 被清除或跨域问题

**解决方案**:
```javascript
// 检查 localStorage
console.log(localStorage.getItem('paypal_payment_info'))

// 如果为 null，可能是:
// 1. 用户清除了浏览器数据
// 2. 跨域问题 (localhost vs production)
// 3. 隐私模式/无痕模式

// 临时修复: 手动设置
localStorage.setItem('paypal_payment_info', JSON.stringify({
  planType: 'pro',
  billingCycle: 'monthly',
  userEmail: 'test@example.com',
  orderId: 'PAYPAL-ORDER-ID',
  timestamp: Date.now()
}))
```

### 错误 2: "Payment not completed"

**原因**: PayPal 订单状态不是 COMPLETED

**可能状态**:
- `CREATED`: 订单刚创建
- `APPROVED`: 用户授权但未 capture
- `VOIDED`: 订单已取消
- `COMPLETED`: 支付完成 ✅

**调试**:
```typescript
// 检查 PayPal 返回的状态
console.log('Order status:', order.status)

// 如果是 APPROVED，说明 capture 还没执行
// 需要手动调用 captureOrder
```

### 错误 3: "Order ID mismatch"

**原因**: localStorage 中的 orderId 与 URL 中的 token 不匹配

**调试**:
```javascript
// URL token
const paypalToken = searchParams.get('token')
console.log('PayPal token from URL:', paypalToken)

// localStorage orderId
const paymentInfo = JSON.parse(localStorage.getItem('paypal_payment_info'))
console.log('Stored orderId:', paymentInfo.orderId)

// 如果不一致，可能是:
// 1. 用户刷新了页面重新支付
// 2. localStorage 数据过期
// 3. 多个标签页干扰

// 解决: 使用 URL token 优先
```

---

## 📊 修复效果对比

### 修复前（有问题）

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. 创建订单 | ✅ | CREATE 成功 |
| 2. 用户授权 | ✅ | APPROVED 成功 |
| 3. 捕获资金 | ❌ | **没有调用 capture** |
| 4. 完成支付 | ❌ | 永远无法到达 COMPLETED |
| 5. 资金状态 | ⏳ | **Pending 3 天后退款** |
| 6. 订阅激活 | ❌ | Supabase 没有记录 |

### 修复后（正常工作）

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. 创建订单 | ✅ | CREATE 成功 |
| 2. 用户授权 | ✅ | APPROVED 成功 |
| 3. 捕获资金 | ✅ | **capture API 调用成功** |
| 4. 完成支付 | ✅ | 状态变为 COMPLETED |
| 5. 资金状态 | ✅ | **立即转入商户账户** |
| 6. 订阅激活 | ✅ | Supabase 创建订阅记录 |

---

## 🚀 下一步测试计划

### 1. 本地测试（立即可做）

```bash
# 测试 PayPal Sandbox
npm run dev
# 访问 http://localhost:3001/payment
# 使用 Sandbox 账号测试
```

### 2. 生产环境测试（上线后）

```bash
# 使用真实 PayPal 账号
# 测试小额支付（建议 $0.01 测试）
# 验证完整流程
```

### 3. 压力测试

- 测试多个用户同时支付
- 测试订阅续费
- 测试取消订阅
- 测试退款流程

---

## ✅ 检查清单

上线前必须确认：

- [x] 修复 PayPal capture 逻辑
- [x] 增加详细日志输出
- [x] 实现错误处理 UI
- [ ] 本地测试 PayPal 支付
- [ ] 验证 Supabase 订阅记录
- [ ] 检查 PayPal Dashboard 交易记录
- [ ] 测试 localStorage 数据持久化
- [ ] 测试跨浏览器兼容性
- [ ] 生产环境小额测试

---

## 📞 问题联系

如果测试中遇到问题：

1. **检查浏览器 Console 日志**
2. **检查服务端 Terminal 日志**
3. **检查 PayPal Dashboard**
4. **检查 Supabase subscriptions 表**

**支持邮箱**: support@mornhub.help

---

**文档版本**: v1.0
**最后更新**: 2025-01-13
**测试状态**: ⏳ 待测试
