# 🚀 SiteHub 发布前必做清单

## ✅ 已完成的任务

### 1. PayPal 支付修复
- **问题**: PayPal 订单创建后停留在 "pending" 状态，3天后退款
- **原因**: 缺少 capture API 调用（PayPal 两阶段支付：CREATE → CAPTURE）
- **解决方案**:
  - 在 `app/payment/page.tsx` 中添加 localStorage 保存支付信息
  - 在 `app/payment/success/page.tsx` 中添加 capture 逻辑
  - 在 `app/api/payment/paypal/capture/route.ts` 中增强日志记录
- **状态**: ✅ 代码已修复，等待 Jeff 测试验证

### 2. 测试定价调整
- **调整内容**:
  - Pro 月付: $0.50（Stripe 最低限制）
  - Team 月付: $1.00
  - 年付保持正式价格（Pro: $168, Team: $2520）
- **状态**: ✅ 已完成

### 3. Alipay 临时禁用
- **问题**: alipay-sdk 导入错误导致构建失败
- **解决方案**: 临时返回 503 错误，提示需要 ICP 备案
- **状态**: ✅ 已完成

### 4. Subscriptions 表设计
- **文件**: `supabase_subscriptions_table.sql`
- **功能**: 存储所有支付方式的订阅信息
- **状态**: ✅ SQL 脚本已创建，待执行

### 5. 支付 API 改进
- **PayPal Capture**: 添加 `billing_cycle` 字段保存
- **Stripe Webhook**: 修复 metadata 读取和字段映射
- **状态**: ✅ 代码已修复

---

## 🔥 需要立即完成的任务

### ⚠️ 任务 1: 在 Supabase 中创建 subscriptions 表（必做）

**重要性**: 🔴 **Critical** - 没有这个表，支付成功后会报数据库错误

**步骤**:

1. **登录 Supabase Dashboard**:
   - 打开 https://supabase.com/dashboard
   - 选择项目: `ykirhilnbvsanqyenusf` (SiteHub)

2. **执行 SQL 脚本**:
   - 点击左侧菜单 **SQL Editor**
   - 点击 **New query**
   - 复制 `supabase_subscriptions_table.sql` 的全部内容
   - 粘贴到 SQL 编辑器
   - 点击 **Run** 执行

3. **验证表创建成功**:
   ```sql
   SELECT * FROM subscriptions LIMIT 10;
   ```
   应该返回空结果（表存在但无数据）

4. **检查表结构**:
   - 点击左侧菜单 **Table Editor**
   - 找到 `subscriptions` 表
   - 确认以下字段存在:
     - `user_email` (TEXT, UNIQUE)
     - `plan_type` (TEXT)
     - `billing_cycle` (TEXT)
     - `payment_method` (TEXT)
     - `status` (TEXT)
     - `start_time`, `expire_time` (TIMESTAMP)
     - `stripe_session_id`, `paypal_order_id` (TEXT)

**验证**:
- ✅ 表创建成功
- ✅ 索引创建成功
- ✅ RLS 策略启用
- ✅ 触发器创建成功

---

### ⚠️ 任务 2: 测试支付流程（必做）

**重要性**: 🔴 **Critical** - 确保所有支付路径正常工作

#### 2.1 测试 PayPal 支付

**测试步骤**:
1. 打开 `http://localhost:3000/payment`
2. 选择 "Monthly" + "Pro Plan" ($0.50)
3. 输入测试邮箱
4. 选择 "PayPal"
5. 完成支付
6. 检查浏览器控制台日志:
   ```
   🟡 PayPal payment capture...
   📦 Retrieved payment info
   ✅ PayPal payment captured successfully
   ```
7. 登录 Supabase 验证订阅记录:
   ```sql
   SELECT * FROM subscriptions WHERE user_email = '你的测试邮箱';
   ```

**预期结果**:
- ✅ PayPal 订单状态显示 "Completed"
- ✅ Supabase 中有订阅记录
- ✅ `expire_time` 为 1 个月后
- ✅ 成功页面显示正确

#### 2.2 测试 Stripe 支付

**测试步骤**:
1. 打开 `http://localhost:3000/payment`
2. 选择 "Monthly" + "Pro Plan" ($0.50)
3. 输入测试邮箱
4. 选择 "Credit Card (Stripe)"
5. 使用 Stripe 测试卡: `4242 4242 4242 4242`
6. 完成支付
7. 检查 Stripe Dashboard 的支付记录

**注意**:
- ⚠️ Stripe Webhook 尚未配置，所以订阅记录不会自动写入 Supabase
- 需要先配置 Webhook（见任务 3）

---

### ⚠️ 任务 3: 配置 Stripe Webhook（上线前必做）

**重要性**: 🔴 **Critical** - 没有 Webhook，Stripe 支付成功后无法创建订阅

**当前状态**:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # ❌ 占位符
```

**配置步骤**:

#### 本地开发测试（使用 Stripe CLI）

1. **安装 Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # 或访问: https://stripe.com/docs/stripe-cli
   ```

2. **登录 Stripe**:
   ```bash
   stripe login
   ```

3. **转发 Webhook 到本地**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/stripe/webhook
   ```

4. **获取 Webhook Secret**:
   - 运行上述命令后，会显示类似:
     ```
     Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
     ```
   - 复制这个 secret

5. **更新 `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **重启开发服务器**:
   ```bash
   npm run dev
   ```

7. **测试 Webhook**:
   - 在另一个终端，保持 `stripe listen` 运行
   - 执行一次 Stripe 支付
   - 查看终端输出，应该看到:
     ```
     2025-01-13 10:00:00 --> checkout.session.completed [200]
     ```

#### 生产环境配置（上线时）

1. **登录 Stripe Dashboard**:
   - 打开 https://dashboard.stripe.com/webhooks
   - 确保切换到 **Live mode**（右上角）

2. **创建新的 Webhook**:
   - 点击 **Add endpoint**
   - Endpoint URL: `https://www.mornhub.help/api/payment/stripe/webhook`
   - 选择事件: `checkout.session.completed`
   - 点击 **Add endpoint**

3. **获取 Webhook Secret**:
   - 创建后，点击新的 endpoint
   - 复制 **Signing secret** (以 `whsec_` 开头)

4. **更新 Vercel 环境变量**:
   ```bash
   # 方式 1: 使用 Vercel CLI
   vercel env add STRIPE_WEBHOOK_SECRET production
   # 粘贴 webhook secret

   # 方式 2: 在 Vercel Dashboard 手动添加
   # https://vercel.com/your-team/sitehub/settings/environment-variables
   ```

5. **重新部署**:
   ```bash
   git add .
   git commit -m "Configure Stripe webhook"
   git push
   ```

**验证**:
- ✅ Webhook 接收到事件
- ✅ Supabase 中创建订阅记录
- ✅ 用户看到成功页面

---

## 📋 次要任务（可以后续完成）

### 任务 4: 完善 Dashboard 页面

**当前状态**: 可能不存在或功能不完整

**需要实现的功能**:
- 显示用户订阅状态（Active/Expired）
- 显示套餐类型（Pro/Team）
- 显示到期时间
- 取消订阅功能
- 续费功能
- 查看支付历史

**文件位置**: `app/dashboard/page.tsx` (可能需要创建)

### 任务 5: ICP 备案（Alipay 需要）

**时间**: 2-4 周

**步骤**:
1. 准备企业营业执照
2. 准备网站备案材料
3. 提交 ICP 备案申请
4. 等待审批
5. 获得 ICP 备案号
6. 配置 Alipay SDK
7. 重新启用 Alipay 支付

**优先级**: 🟡 Low（可以先用 Stripe 和 PayPal）

### 任务 6: 添加自动过期检查

**建议**: 使用 Vercel Cron Jobs 或 Supabase Edge Functions

**实现方案**:
1. 创建定时任务（每天运行一次）
2. 调用 Supabase 函数:
   ```sql
   SELECT check_expired_subscriptions();
   ```
3. 自动将过期订阅标记为 `expired`

---

## 🎯 发布检查清单

在正式发布前，确认以下所有项目都已完成:

### 数据库
- [ ] Supabase `subscriptions` 表已创建
- [ ] 表结构正确（所有字段存在）
- [ ] RLS 策略已启用
- [ ] 索引已创建

### 支付系统
- [ ] PayPal 支付测试通过（本地）
- [ ] PayPal capture 正常工作
- [ ] Stripe 支付测试通过（本地）
- [ ] Stripe Webhook 已配置（本地和生产）
- [ ] 支付成功后订阅记录写入数据库

### 环境变量
- [ ] `.env.local` 配置正确（本地开发）
- [ ] Vercel 环境变量配置完整（生产环境）
- [ ] `STRIPE_WEBHOOK_SECRET` 不是占位符
- [ ] `NEXT_PUBLIC_SITE_URL` 指向正确域名

### 测试
- [ ] 本地测试通过
- [ ] 生产环境测试通过
- [ ] 支付流程端到端测试通过
- [ ] 订阅到期时间计算正确

### 监控和日志
- [ ] 支付 API 添加详细日志
- [ ] Stripe Webhook 日志正常
- [ ] 错误处理完善
- [ ] 用户看到清晰的错误提示

---

## 📞 如有问题

如果在测试或部署过程中遇到问题:

1. **检查日志**:
   - 浏览器控制台（F12）
   - 服务器终端输出
   - Vercel 部署日志
   - Stripe Dashboard Logs
   - PayPal Dashboard Activity

2. **常见问题**:
   - **PayPal Pending**: 确认 capture API 被调用
   - **Stripe 失败**: 检查 Webhook secret 是否正确
   - **数据库错误**: 确认 subscriptions 表存在
   - **金额错误**: 确认价格≥$0.50

3. **联系支持**:
   - Stripe: https://support.stripe.com
   - PayPal: https://www.paypal.com/businesshelp
   - Supabase: https://supabase.com/support

---

## 🎉 完成后

所有任务完成后，你的 SiteHub 就可以正式上线了！

**下一步**:
1. 部署到 Vercel 生产环境
2. 配置自定义域名 `www.mornhub.help`
3. 启用 Stripe 正式环境
4. 监控支付流程
5. 收集用户反馈
6. 迭代改进功能

祝发布顺利！🚀
