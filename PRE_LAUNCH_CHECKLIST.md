# SiteHub 官网上线前检查清单

**生成时间**: 2025-01-13
**项目状态**: 准备上线 - 需要完成关键配置

---

## 🎯 总体状况评估

### ✅ 已完成的核心功能
1. **网站基础架构** - Next.js 14.2.16 + TypeScript + Tailwind CSS
2. **用户认证系统** - Supabase Auth (邮箱、Google OAuth)
3. **支付集成** - Stripe (✅ 已配置) + PayPal (✅ 已配置)
4. **地理位置检测** - IP 地理定位和 GDPR 合规屏蔽
5. **多语言支持** - 中文/英文国际化
6. **响应式设计** - 移动端和桌面端适配
7. **密码重置流程** - 完整的邮箱验证流程

### ⚠️ 发现的关键问题

#### 🔴 高优先级 - 必须修复才能上线

1. **Alipay 构建错误** (已修复 ✅)
   - 问题：`alipay-sdk` 导入错误导致构建失败
   - 解决方案：已临时禁用 Alipay，返回 503 状态码并提示用户使用 Stripe/PayPal
   - 状态：✅ 已修复，不再阻塞上线

2. **Stripe Webhook 未配置** (🔴 阻塞上线)
   - 问题：`.env.local` 中 `STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE` (未配置)
   - 影响：无法接收支付成功/失败的异步通知
   - 解决方案：需要在 Stripe Dashboard 配置 webhook 端点

3. **生产环境 URL 配置** (🔴 阻塞上线)
   - 当前：`NEXT_PUBLIC_SITE_URL=http://localhost:3001`
   - 需要：`NEXT_PUBLIC_SITE_URL=https://www.mornhub.help`
   - 影响：支付回调 URL、OAuth 回调都会失败

#### 🟡 中优先级 - 建议上线前完成

4. **PayPal 支付回调未完善**
   - 问题：PayPal success 页面未处理 `capture` 订单逻辑
   - 影响：用户支付成功后订阅状态可能不会自动激活
   - 位置：`app/payment/success/page.tsx:33` (PayPal 分支逻辑不完整)

5. **Supabase 订阅表可能未创建**
   - 代码依赖 `subscriptions` 表，但未提供建表 SQL
   - 需要确认表结构是否存在

6. **Dashboard 页面未实现**
   - 用户支付成功后跳转到 `/dashboard`，但该页面功能不完整
   - 建议：至少显示订阅状态和到期时间

#### 🟢 低优先级 - 可以上线后优化

7. **Alipay 支付未完成**
   - 需要：ICP 备案 + 支付宝企业账号 (预计 2-4 周)
   - 当前：已禁用，不影响国际用户

8. **微信支付未集成**
   - `.env.local` 中有微信配置，但代码未使用
   - 可以作为未来功能迭代

---

## 📋 上线前必须完成的任务

### 第一步：修复 Stripe Webhook (15-30 分钟)

#### 操作步骤：

1. **登录 Stripe Dashboard**
   - 访问: https://dashboard.stripe.com/webhooks
   - 使用生产环境账号登录

2. **创建 Webhook 端点**
   ```
   端点 URL: https://www.mornhub.help/api/payment/stripe/webhook
   监听事件:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - customer.subscription.updated
   - customer.subscription.deleted
   ```

3. **复制 Webhook Secret**
   - 格式类似: `whsec_xxxxxxxxxxxxxxxxxxxxx`
   - 更新 `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_实际的密钥
   ```

4. **重新部署应用**

---

### 第二步：更新生产环境配置 (5 分钟)

#### 编辑 `.env.local` 或 Vercel 环境变量：

```bash
# 更新网站 URL
NEXT_PUBLIC_SITE_URL=https://www.mornhub.help

# 确认 Stripe 生产环境密钥已配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY

# 确认 PayPal 生产环境密钥已配置
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET
PAYPAL_MODE=production

# Supabase 配置（已正确）
NEXT_PUBLIC_SUPABASE_URL=https://ykirhilnbvsanqyenusf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 第三步：完善 PayPal 支付回调 (30 分钟)

#### 问题分析：
当前 `app/payment/success/page.tsx` 的 PayPal 分支逻辑：
```typescript
// Line 33-36
} else {
  // PayPal或其他支付方式
  setSuccess(true)
  setVerifying(false)
}
```

**问题**: 没有调用 `/api/payment/paypal/capture` 来完成订单捕获和订阅激活。

#### 解决方案：

修改 `app/payment/success/page.tsx`，在 PayPal 分支添加捕获逻辑：

```typescript
} else {
  // PayPal 支付回调
  const orderId = searchParams.get('token') // PayPal 返回的 order ID

  if (orderId) {
    // 调用 capture API 完成支付
    fetch('/api/payment/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        planType: 'pro', // TODO: 从 localStorage 或 session 获取
        userEmail: 'user@example.com' // TODO: 从认证状态获取
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccess(true)
        }
      })
      .catch(error => console.error('PayPal capture failed:', error))
      .finally(() => setVerifying(false))
  } else {
    setSuccess(true)
    setVerifying(false)
  }
}
```

**注意**: 需要解决 `planType` 和 `userEmail` 的获取问题，建议：
- 使用 `localStorage` 在支付前保存
- 或者从 Supabase Auth 获取当前登录用户

---

### 第四步：验证 Supabase 订阅表 (10 分钟)

#### 检查表是否存在：

1. 登录 Supabase Dashboard: https://ykirhilnbvsanqyenusf.supabase.co
2. 进入 Table Editor
3. 查找 `subscriptions` 表

#### 如果表不存在，创建表：

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'web',
  payment_method TEXT NOT NULL, -- 'stripe', 'paypal', 'alipay'
  plan_type TEXT NOT NULL, -- 'pro', 'team'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expire_time TIMESTAMPTZ NOT NULL,
  stripe_session_id TEXT,
  paypal_order_id TEXT,
  alipay_trade_no TEXT,
  alipay_out_trade_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expire ON subscriptions(expire_time);

-- 启用 Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的订阅
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- 允许 service_role 完全访问（用于 API）
CREATE POLICY "Service role can manage all" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

---

### 第五步：完善 Dashboard 页面 (1-2 小时)

#### 当前状态：
`app/dashboard/page.tsx` 存在但功能不完整

#### 建议实现的功能：
1. **显示订阅状态**
   - 当前套餐 (Pro / Team)
   - 订阅到期时间
   - 支付方式

2. **订阅管理**
   - 升级/降级套餐
   - 取消订阅
   - 续费按钮

3. **账户设置**
   - 修改邮箱
   - 修改密码
   - 注销账号

#### 示例代码框架：

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_email', user.email)
        .single()

      setSubscription(data)
      setLoading(false)
    }

    fetchSubscription()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {subscription ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Subscription</h2>
          <div className="space-y-2">
            <p><strong>Plan:</strong> {subscription.plan_type}</p>
            <p><strong>Status:</strong> {subscription.status}</p>
            <p><strong>Expires:</strong> {new Date(subscription.expire_time).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> {subscription.payment_method}</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No active subscription found.</p>
          <a href="/payment" className="text-blue-600 hover:underline">
            Subscribe now
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## 🧪 上线前测试清单

### Stripe 支付测试

- [ ] 选择 Pro 月付，使用测试卡 `4242 4242 4242 4242` 完成支付
- [ ] 选择 Pro 年付，验证价格正确显示 ($168/年)
- [ ] 选择 Team 月付，验证价格正确 ($299.99/月)
- [ ] 支付成功后跳转到 `/payment/success`
- [ ] 在 Stripe Dashboard 查看交易记录
- [ ] 取消支付，验证跳转到 `/payment/cancel`
- [ ] 检查 Supabase `subscriptions` 表是否正确创建记录

### PayPal 支付测试

- [ ] 选择 Pro 月付，点击 PayPal 按钮
- [ ] 跳转到 PayPal 登录页面
- [ ] 使用沙盒账号或真实 PayPal 账号登录
- [ ] 完成支付
- [ ] 支付成功后跳转到 `/payment/success`
- [ ] 验证订阅状态在 Supabase 中正确激活
- [ ] 在 PayPal Dashboard 查看交易记录

### Alipay 测试（暂时跳过）

- [ ] 点击支付宝支付
- [ ] 验证是否显示 "Alipay payment is currently unavailable" 错误信息
- [ ] 验证是否提示用户使用 Stripe 或 PayPal

### 用户认证测试

- [ ] 邮箱注册新用户
- [ ] 邮箱登录
- [ ] Google OAuth 登录
- [ ] 忘记密码 → 重置密码流程
- [ ] 登出功能

### 地理位置屏蔽测试

- [ ] 从欧洲 IP 访问 `/payment` 页面
- [ ] 验证是否显示 GDPR 合规屏蔽页面
- [ ] 从美国/中国 IP 访问，验证正常显示

### 响应式设计测试

- [ ] 在 iPhone (375px) 上测试所有页面
- [ ] 在 iPad (768px) 上测试
- [ ] 在桌面浏览器 (1920px) 上测试
- [ ] 验证所有按钮可点击
- [ ] 验证表单可正常提交

---

## 🚀 部署到 Vercel 的步骤

### 1. 检查 Vercel 项目配置

```bash
# 查看当前 Vercel 配置
vercel env ls
```

### 2. 添加生产环境变量

```bash
# 在 Vercel Dashboard 或通过 CLI 添加
vercel env add NEXT_PUBLIC_SITE_URL production
# 输入: https://www.mornhub.help

vercel env add STRIPE_WEBHOOK_SECRET production
# 输入: whsec_实际的密钥

# 确认其他环境变量已存在
vercel env ls
```

### 3. 部署到生产环境

```bash
# 方法 1: 推送到 main 分支（自动部署）
git add .
git commit -m "Fix payment integration and prepare for production"
git push origin main

# 方法 2: 手动部署
vercel --prod
```

### 4. 部署后验证

```bash
# 访问生产网站
open https://www.mornhub.help

# 检查健康状态
curl https://www.mornhub.help/api/health
```

### 5. 配置自定义域名

如果还没有配置域名：
1. 进入 Vercel Dashboard → Settings → Domains
2. 添加 `www.mornhub.help` 和 `mornhub.help`
3. 配置 DNS 记录指向 Vercel

---

## 📊 监控和日志

### 关键指标监控

1. **支付成功率**
   - Stripe Dashboard: https://dashboard.stripe.com/payments
   - PayPal Dashboard: https://www.paypal.com/activity

2. **错误日志**
   - Vercel Logs: https://vercel.com/logs
   - Supabase Logs: Supabase Dashboard → Logs

3. **用户注册数**
   - Supabase Dashboard → Authentication → Users

### 设置告警（可选）

- Vercel 集成 Slack/Email 告警
- Stripe Webhook 失败通知
- Supabase 数据库异常告警

---

## 🐛 已知问题和限制

### 1. PayPal 回调需要用户数据传递
   - **问题**: 支付成功页面无法自动获取 `planType` 和 `userEmail`
   - **临时方案**: 使用 `localStorage` 传递
   - **长期方案**: 实现完整的 session 管理

### 2. Alipay 需要 ICP 备案
   - **时间**: 2-4 周
   - **要求**:
     - 深圳公司营业执照
     - ICP 备案号
     - 支付宝企业账号
   - **当前**: 已禁用，返回 503 错误

### 3. Dashboard 功能不完整
   - **建议**: 至少实现订阅状态查看
   - **可选**: 升级/取消订阅功能

### 4. 没有订阅过期自动处理
   - **建议**: 添加定时任务检查过期订阅
   - **方案**: 使用 Vercel Cron Jobs 或 Supabase Functions

---

## ✅ 上线前最终检查

### 代码质量
- [ ] `npm run build` 成功无错误
- [ ] 所有 TypeScript 类型检查通过
- [ ] 没有 console.error 或 console.warn

### 环境变量
- [x] Stripe 生产密钥已配置
- [x] PayPal 生产密钥已配置
- [ ] Stripe Webhook Secret 已配置 (🔴 待完成)
- [ ] NEXT_PUBLIC_SITE_URL 更新为生产 URL (🔴 待完成)
- [x] Supabase 密钥已配置

### 数据库
- [ ] Supabase `subscriptions` 表已创建
- [ ] RLS 策略已配置
- [ ] 测试数据已清除

### 支付集成
- [ ] Stripe Checkout 可正常跳转
- [ ] PayPal 支付可正常跳转
- [ ] 支付成功回调正常
- [ ] 支付取消回调正常
- [ ] Webhook 接收正常

### 安全性
- [ ] 生产环境密钥未提交到 Git
- [ ] API 路由有适当的错误处理
- [ ] 用户输入有验证
- [ ] HTTPS 已启用

---

## 📞 紧急联系方式

- **支付问题**:
  - Stripe Support: https://support.stripe.com/
  - PayPal Support: https://www.paypal.com/us/smarthelp/contact-us

- **部署问题**:
  - Vercel Support: https://vercel.com/support
  - Supabase Support: https://supabase.com/support

---

## 🎉 上线后优化计划

### 第一周
- 监控支付成功率
- 收集用户反馈
- 修复紧急 Bug

### 第一个月
- 完成 Alipay ICP 备案
- 实现订阅管理功能
- 添加订阅过期提醒

### 长期优化
- 添加微信支付
- 实现订阅续费自动化
- 添加数据分析和报表

---

**文档版本**: v1.0
**最后更新**: 2025-01-13
**负责人**: 开发团队
