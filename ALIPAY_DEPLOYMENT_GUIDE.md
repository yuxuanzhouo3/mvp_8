# 支付宝支付部署指南

## 📋 概述

支付宝支付功能已完全实现，等待部署时配置环境变量即可启用。

---

## ✅ 已完成的工作

### 1. **API 实现**
- ✅ 创建订单接口：`/api/payment/alipay/create`
- ✅ 异步回调接口：`/api/payment/alipay/notify`
- ✅ 同步返回处理：支付完成后的页面跳转

### 2. **功能特性**
- ✅ 支持 Pro 和 Team 两种套餐
- ✅ 支持月付和年付
- ✅ 美元自动转人民币（汇率 1 USD = 7.2 CNY）
- ✅ 订单状态同步到 Supabase
- ✅ 自动激活用户订阅
- ✅ 签名验证保证安全性
- ✅ 完整的日志记录

### 3. **数据库集成**
- ✅ 订单记录保存到 `payment_transactions` 表
- ✅ 订阅状态更新到 `subscriptions` 表
- ✅ 与 Stripe/PayPal 数据结构统一

---

## 🔐 环境变量配置（Jeff 部署时配置）

### Vercel 环境变量

在 Vercel 项目设置中添加以下环境变量：

```bash
# 支付宝基础配置
ALIPAY_APP_ID=2021005199628151
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# 支付宝密钥（敏感信息）
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...（完整的私钥内容）
-----END PRIVATE KEY-----"

ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOC...（完整的支付宝公钥内容）
-----END PUBLIC KEY-----"

# 站点URL（已配置）
NEXT_PUBLIC_SITE_URL=https://mornhub.help
```

### 腾讯云环境变量

在腾讯云环境中添加相同的环境变量。

---

## 🔧 支付宝开放平台配置

### 1. 应用配置

登录 [支付宝开放平台](https://open.alipay.com/)，进入您的应用：

#### a) 设置回调地址
- **异步通知地址（notify_url）**：
  ```
  https://mornhub.help/api/payment/alipay/notify
  ```
- **同步返回地址（return_url）**：
  ```
  https://mornhub.help/payment/success
  ```

#### b) 接口加签方式
- 确认使用 **RSA2 (SHA256)** 签名方式
- 上传应用公钥（对应 ALIPAY_PRIVATE_KEY）
- 下载支付宝公钥（配置到 ALIPAY_PUBLIC_KEY）

#### c) 授权接口
确保应用已开通以下接口权限：
- `alipay.trade.page.pay` - 网站支付接口

### 2. 获取密钥的步骤

#### 生成应用密钥对：
1. 下载支付宝密钥工具：https://opendocs.alipay.com/common/02kipk
2. 选择 **RSA2(SHA256)** 算法
3. 生成密钥对
4. 复制**应用私钥**（配置到 `ALIPAY_PRIVATE_KEY`）
5. 上传**应用公钥**到支付宝开放平台
6. 下载**支付宝公钥**（配置到 `ALIPAY_PUBLIC_KEY`）

---

## 💰 定价配置

当前定价（与 Stripe/PayPal 保持一致）：

| 套餐 | 月付（测试） | 年付（正式） | 月付人民币 | 年付人民币 |
|------|-------------|-------------|-----------|-----------|
| Pro  | $0.50       | $168        | ¥3.60     | ¥1,209.60 |
| Team | $1.00       | $2,520      | ¥7.20     | ¥18,144   |

**汇率设置**：1 USD = 7.2 CNY（可在代码中调整）

---

## 🧪 测试流程

### 沙箱测试（部署前）

1. **配置沙箱环境**：
   - 使用沙箱 Gateway：`https://openapi.alipaydev.com/gateway.do`
   - 使用沙箱 App ID 和密钥

2. **测试支付流程**：
   ```bash
   # 访问支付页面
   https://mornhub.help/payment
   
   # 选择支付宝支付
   # 输入邮箱
   # 点击"确认支付"
   
   # 预期行为：
   # 1. 跳转到支付宝收银台
   # 2. 使用沙箱账号登录支付
   # 3. 支付成功后跳转到 /payment/success
   # 4. 订单状态更新为 completed
   # 5. 用户订阅自动激活
   ```

### 生产环境测试（部署后）

1. 切换到正式 Gateway：`https://openapi.alipay.com/gateway.do`
2. 使用正式 App ID 和密钥
3. 进行小额真实支付测试
4. 验证订单和订阅状态

---

## 📊 数据库表结构

### payment_transactions 表

支付宝订单会自动保存到此表：

```sql
{
  user_email: 'user@example.com',
  plan_type: 'pro',
  billing_cycle: 'monthly',
  amount_usd: 0.50,
  amount_cny: 3.60,
  payment_method: 'alipay',
  transaction_id: 'ALIPAY_PRO_MONTHLY_1698765432000',
  status: 'completed',  -- pending -> completed
  created_at: '2025-10-16T10:30:00Z',
  updated_at: '2025-10-16T10:31:00Z'
}
```

### subscriptions 表

支付成功后自动更新或创建订阅：

```sql
{
  user_email: 'user@example.com',
  plan_type: 'pro',
  status: 'active',
  current_period_start: '2025-10-16T10:31:00Z',
  current_period_end: '2025-11-16T10:31:00Z',  -- 月付 +1月
  cancel_at_period_end: false,
  payment_method: 'alipay',
  updated_at: '2025-10-16T10:31:00Z'
}
```

---

## 🔍 监控和日志

### 日志关键字

在 Vercel/Tencent Cloud 日志中搜索：

```
🔵 [Alipay] 开始创建支付订单
✅ [Alipay] 支付链接生成成功
🔔 [Alipay Notify] 收到支付宝回调通知
✅ [Alipay Notify] 签名验证通过
💰 [Alipay Notify] 支付成功，更新订单状态
✅ [Alipay Notify] 用户订阅已激活
```

### 常见错误

1. **配置缺失**
   ```
   ❌ [Alipay] 配置缺失
   ```
   **解决**：检查环境变量是否正确配置

2. **签名验证失败**
   ```
   ❌ [Alipay Notify] 签名验证失败
   ```
   **解决**：检查 ALIPAY_PUBLIC_KEY 是否正确

3. **数据库更新失败**
   ```
   ❌ [Alipay Notify] 订阅更新失败
   ```
   **解决**：检查 Supabase 表结构和权限

---

## 🚀 部署检查清单

- [ ] Vercel 环境变量已配置
  - [ ] ALIPAY_APP_ID
  - [ ] ALIPAY_GATEWAY
  - [ ] ALIPAY_PRIVATE_KEY
  - [ ] ALIPAY_PUBLIC_KEY
  - [ ] NEXT_PUBLIC_SITE_URL

- [ ] 支付宝开放平台已配置
  - [ ] 回调地址（notify_url）
  - [ ] 返回地址（return_url）
  - [ ] 应用公钥已上传
  - [ ] 支付宝公钥已下载
  - [ ] 接口权限已开通

- [ ] Supabase 数据库已就绪
  - [ ] payment_transactions 表已创建
  - [ ] subscriptions 表已创建
  - [ ] RLS 策略已配置

- [ ] 测试验证
  - [ ] 沙箱环境测试通过
  - [ ] 生产环境小额测试
  - [ ] 订单状态正确更新
  - [ ] 订阅自动激活

---

## 📞 技术支持

如有问题，请查看：
1. Vercel/Tencent Cloud 日志
2. Supabase 日志
3. 支付宝开放平台 - 应用详情 - 接口调用记录

---

## 📝 注意事项

1. **密钥安全**：
   - 私钥严禁提交到 Git
   - 仅在服务器环境变量中配置
   - 定期轮换密钥

2. **汇率更新**：
   - 当前汇率为固定值 7.2
   - 生产环境建议对接实时汇率 API
   - 汇率配置位置：`create/route.ts` 第 35 行

3. **测试价格**：
   - 当前月付价格为测试价格（$0.50）
   - 正式上线前确认定价策略
   - 定价配置位置：`create/route.ts` 第 20-29 行

4. **ICP 备案**：
   - 支付宝支付需要网站完成 ICP 备案
   - 确保 `mornhub.help` 已备案
   - 备案号需在网站底部显示

---

**部署完成后，支付宝支付功能即可正常使用！**

如有任何问题，请随时联系技术团队。


