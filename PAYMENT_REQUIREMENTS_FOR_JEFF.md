# 支付接入所需信息清单

## 📋 给 Jeff 的清单

### 🏢 第一步：公司信息

请提供：
- [ ] 公司名称（英文）
- [ ] 公司注册地（美国/中国/香港/其他）
- [ ] 营业执照扫描件
- [ ] 公司地址
- [ ] 法人代表信息（姓名、联系方式）
- [ ] EIN/税号（如果是美国公司）

---

### 💳 第二步：Stripe（信用卡支付）

#### 如果已有 Stripe 账号：
请提供以下 API Key（在 Stripe Dashboard → Developers → API keys）：

```bash
# Production Keys（生产环境）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

#### 如果还没有 Stripe 账号：
需要注册并完成以下步骤：

1. **注册账号**：https://dashboard.stripe.com/register
   - 使用公司邮箱
   - 填写公司信息

2. **完成身份验证（KYC）**：
   需要上传：
   - [ ] 法人身份证/护照
   - [ ] 营业执照
   - [ ] 公司地址证明
   - [ ] EIN（美国公司）

3. **绑定银行账户**：
   - [ ] 银行名称
   - [ ] 账户号码
   - [ ] Routing Number / SWIFT Code
   - [ ] 银行对账单

**审核时间**：1-3个工作日

---

### 💰 第三步：PayPal（PayPal支付）

#### 如果已有 PayPal 商业账号：
请提供以下信息（在 https://developer.paypal.com/dashboard）：

```bash
# Production Keys
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxxxxxxxxxxxxx
PAYPAL_MODE=production
```

#### 如果还没有 PayPal 商业账号：
需要完成以下步骤：

1. **升级为商业账户**：https://www.paypal.com/bizsignup
   - [ ] 公司名称
   - [ ] 公司地址
   - [ ] 法人信息

2. **验证商业账户**：
   - [ ] 上传营业执照
   - [ ] 绑定公司银行账户
   - [ ] 完成银行账户验证（小额打款）

3. **创建应用**：
   - 进入开发者中心
   - 创建 Live 应用
   - 获取 Client ID 和 Secret

**审核时间**：1-2周

---

### 💙 第四步：支付宝（中国用户）

#### ⚠️ 硬性要求：
- 必须有中国营业执照
- 必须有对公银行账户
- 法人必须是中国公民

#### 如果已有支付宝企业账号：
请提供以下信息：

```bash
ALIPAY_APP_ID=2021xxxxxxxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBgkqhki... (私钥，很长)
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhki... (支付宝公钥)
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

#### 如果还没有支付宝企业账号：
需要完成以下步骤：

1. **注册企业支付宝**：https://b.alipay.com/
   - [ ] 中国营业执照
   - [ ] 对公银行账户
   - [ ] 法人身份证

2. **申请开放平台**：https://open.alipay.com
   需要提交：
   - [ ] 营业执照副本
   - [ ] 法人身份证
   - [ ] 对公账户信息
   - [ ] 网站ICP备案号
   - [ ] 软件著作权（可选）

3. **签约产品**：
   - 创建应用
   - 签约"手机网站支付"
   - 配置RSA2密钥

**审核时间**：2-4周

---

## 🎯 费率对比

| 支付方式 | 手续费 | 到账时间 | 适用用户 |
|---------|--------|---------|---------|
| **Stripe** | 2.9% + $0.30/笔 | T+2 工作日 | 国际信用卡用户 |
| **PayPal** | 2.9% + $0.30/笔 | 即时（可提现） | 全球 PayPal 用户 |
| **支付宝** | 0.6% (国内) | T+1 工作日 | 中国用户 |

---

## ⚡ 推荐方案

### 方案 A：只接美国/国际用户
```
只需要：Stripe + PayPal
时间：1-2周
难度：⭐⭐ 中等
```

### 方案 B：主要面向中国用户
```
只需要：支付宝 + 微信支付
时间：3-4周
难度：⭐⭐⭐⭐ 较难（需要中国公司）
```

### 方案 C：全球用户
```
需要：Stripe + PayPal + 支付宝
时间：4-6周
难度：⭐⭐⭐⭐⭐ 最难（需要多个公司主体）
```

---

## 🚦 临时方案（测试模式）

如果注册需要时间，我可以先配置**测试环境**：

**优点**：
- ✅ 立即可用（5分钟配置）
- ✅ 功能完全相同
- ✅ 可以演示给面试官看
- ✅ 使用测试卡号，不真实扣款

**测试卡号**：
- Stripe: `4242 4242 4242 4242`
- 任意未来日期 + 任意 CVC

**切换到生产**：
- 等企业账号审核通过
- 替换 `.env.local` 中的 API Key
- 重启服务器即可

---

## 📞 下一步

请 Jeff 决定：

**选项 A**：提供现有账号的 API Key（如果已有）
  → 我2-3天内完成配置和测试

**选项 B**：使用测试模式先演示（推荐）
  → 我立即配置测试环境
  → 您同时去注册企业账号
  → 审核通过后切换到生产模式

**选项 C**：等账号注册完再开发
  → 预计等待 2-4周
  → 不推荐（影响面试进度）

---

## 📧 联系方式

如有任何问题，请联系：
- Email: [你的邮箱]
- Phone: [你的电话]

**文档更新时间**：2025-10-06
