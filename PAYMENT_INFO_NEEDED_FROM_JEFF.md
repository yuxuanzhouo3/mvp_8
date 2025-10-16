# Jeff 需要提供的支付信息

根据 Jeff 的方案：
- **国外用户** → 个人名义收款（Stripe/PayPal）
- **国内用户** → 深圳企业收款（支付宝）

---

## 🌍 Part 1: 国外支付（个人账户）

### 一、Stripe（信用卡支付）

#### Jeff 需要做的：

**步骤1：注册 Stripe 个人账户**
- 网址：https://dashboard.stripe.com/register
- 选择：**Individual（个人）** 账户类型

**步骤2：完成身份验证**
需要提供：
- [ ] Jeff 的护照 或 身份证（扫描件/照片）
- [ ] 个人地址证明（水电费账单/银行对账单，3个月内）
- [ ] 手机号（接收验证码）
- [ ] 个人邮箱

**步骤3：绑定个人银行账户**
可以绑定：
- [ ] **美国银行账户**（如果有）- 最方便
- [ ] **香港银行账户**（如 HSBC、渣打）- 也支持
- [ ] **大陆银行账户** - ⚠️ Stripe 不直接支持，需要通过 Payoneer 等中转

**推荐方案**：
```
方案A（最快）：使用 Payoneer 虚拟美国账户
  1. 注册 Payoneer (https://www.payoneer.com)
  2. 获得虚拟美国银行账户
  3. 绑定到 Stripe
  4. 款项先进 Payoneer，再提现到中国银行卡
  手续费：1-2%，到账时间 1-2天

方案B（需要时间）：香港银行账户
  需要：护照 + 地址证明 + 预约开户
  时间：2-4周
```

**步骤4：获取 API Key**
验证通过后（通常1-3天）：
1. 进入 Stripe Dashboard
2. 切换到 **"Test mode"** 先测试
3. 进入 Developers → API keys
4. 复制以下信息发给我：

```bash
# 测试环境（先用这个）
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# 生产环境（验证通过后）
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

**审核时间**：
- 测试模式：立即可用
- 生产模式：1-3个工作日

---

### 二、PayPal（PayPal支付）

#### Jeff 需要做的：

**步骤1：注册/升级个人 PayPal 账户**
- 如果已有 PayPal 账户：直接用
- 如果没有：https://www.paypal.com/signup

**步骤2：验证账户**
- [ ] 绑定信用卡/借记卡
- [ ] 绑定银行账户（可选）
- [ ] 完成邮箱验证

**步骤3：创建应用获取 API**
1. 访问：https://developer.paypal.com/dashboard
2. 登录 Jeff 的 PayPal 账户
3. **Sandbox** 标签页 → Create App（先测试）
4. 获取 Sandbox API Key 发给我：

```bash
# 测试环境（先用这个）
PAYPAL_CLIENT_ID=AXxxxxxxxxxxxxxxxx (Sandbox)
PAYPAL_CLIENT_SECRET=ELxxxxxxxxxxxxxxxx (Sandbox)
PAYPAL_MODE=sandbox

# 生产环境（测试通过后切换到 Live 标签页）
PAYPAL_CLIENT_ID=AXxxxxxxxxxxxxxxxx (Live)
PAYPAL_CLIENT_SECRET=ELxxxxxxxxxxxxxxxx (Live)
PAYPAL_MODE=production
```

**收款账户**：
- 款项直接进入 Jeff 的 PayPal 余额
- 可以提现到：
  - 中国银行账户（手续费 $35/笔，到账 3-7天）
  - 美国银行账户（免费，到账 1-3天）

**审核时间**：
- 测试模式：立即可用
- 生产模式：账户验证后即可用（通常当天）

---

## 🇨🇳 Part 2: 国内支付（深圳企业账户）

### 三、支付宝企业账户

#### Jeff 需要提供的深圳公司资料：

**公司基本信息**：
- [ ] 公司全称（营业执照上的）
- [ ] 统一社会信用代码（18位）
- [ ] 营业执照扫描件（彩色，清晰）
- [ ] 法人代表姓名
- [ ] 法人身份证正反面

**银行账户信息**：
- [ ] 对公银行账户名称
- [ ] 对公账户账号
- [ ] 开户行名称（具体到支行）

**网站备案信息**：
- [ ] ICP备案号（如：粤ICP备XXXXXXXX号）
- [ ] ⚠️ 如果 mornhub.help 还没有备案，需要先完成备案
- [ ] 备案主体需要是深圳公司

**联系信息**：
- [ ] 公司联系电话
- [ ] 公司地址
- [ ] 业务联系人姓名和手机

#### Jeff 需要做的步骤：

**步骤1：注册企业支付宝**
1. 访问：https://b.alipay.com/
2. 选择"企业账户"注册
3. 上传营业执照
4. 绑定对公账户（会打入小额验证款）

**步骤2：开通支付宝开放平台**
1. 访问：https://open.alipay.com
2. 登录企业支付宝账户
3. 进入"开发者中心" → "网页&移动应用"
4. 创建应用：
   - 应用名称：SiteHub
   - 应用类型：网页应用
   - 应用网址：https://www.mornhub.help

**步骤3：签约"手机网站支付"**
1. 在应用详情页面
2. 找到"手机网站支付"产品
3. 点击"签约"
4. 提交资质（营业执照、ICP备案等）
5. 等待审核（1-2周）

**步骤4：配置密钥**
审核通过后：
1. 下载"支付宝开放平台开发助手"
2. 生成应用私钥和公钥（RSA2 密钥）
3. 将公钥上传到支付宝开放平台
4. 获取支付宝公钥

**步骤5：提供 API 信息给我**

```bash
ALIPAY_APP_ID=2021xxxxxxxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBgkqhki... (应用私钥，很长的字符串)
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhki... (支付宝公钥)
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

**审核时间**：2-4周

---

## ⚠️ 关键问题：网站ICP备案

**支付宝要求网站必须有ICP备案！**

### 检查 mornhub.help 的备案状态：

访问：https://beian.miit.gov.cn

如果 **没有备案**，需要 Jeff 完成以下步骤：

#### 备案需要的资料：
- [ ] 深圳公司营业执照
- [ ] 法人身份证
- [ ] 服务器在中国（需要使用阿里云/腾讯云等国内服务器）
- [ ] 域名证书
- [ ] 网站负责人照片（幕布背景）

#### 备案流程：
1. 在阿里云/腾讯云提交备案申请
2. 填写网站信息
3. 上传资料
4. 等待初审（1-3天）
5. 工信部审核（10-20天）
6. 获得 ICP 备案号

**时间**：20-30天

**替代方案（如果来不及备案）**：
```
暂时不接入支付宝，只用 Stripe + PayPal
等备案完成后再接入支付宝
```

---

## 🎯 两阶段方案（推荐）

### 第一阶段：快速上线（1周内）

**只配置 Stripe + PayPal（测试模式）**

Jeff 只需要：
1. ✅ 注册 Stripe 个人账户（30分钟）
2. ✅ 提供 PayPal 账户（如果已有，5分钟）
3. ✅ 提供测试环境的 API Key

**优点**：
- 面试时可以完整演示
- 支持国际用户付款（测试模式）
- 不需要等支付宝审核

**我这边**：
- 配置测试 API Key
- 测试支付流程
- 准备演示环境

---

### 第二阶段：生产上线（1-2个月）

**Jeff 同时准备**：
1. ⏰ Stripe/PayPal 切换到生产模式（验证账户）
2. ⏰ 深圳公司完成 ICP 备案（20-30天）
3. ⏰ 申请支付宝企业账户（2-4周）

**我这边**：
- 等 Jeff 提供生产 API Key
- 更新 .env.local 配置
- 部署到生产环境

---

## 📊 费用对比

| 支付方式 | 手续费 | 提现费用 | 总成本 |
|---------|--------|---------|--------|
| **Stripe（个人）** | 2.9% + $0.30 | 见下方 | ~4-5% |
| **PayPal（个人）** | 2.9% + $0.30 | $35/笔 或 0% | ~3-4% |
| **支付宝（企业）** | 0.6% | 免费 | 0.6% |

**Stripe 提现方案对比**：
- Payoneer 中转：1-2% 手续费
- 香港银行：银行手续费 $5-15/笔
- 直接到大陆卡：Stripe 不支持

---

## ✅ 总结：Jeff 现在需要做什么

### 立即（本周内）：

1. **注册 Stripe 个人账户**
   - 网址：https://dashboard.stripe.com/register
   - 提供：护照/身份证、地址证明
   - 获取：Test API Key（发给你）

2. **提供 PayPal 账户信息**
   - 如果已有：提供 API Key
   - 如果没有：注册并获取 Sandbox API Key

3. **决定 Stripe 提现方案**
   - 推荐：注册 Payoneer（2天完成）
   - 或者：准备开香港银行账户（需要2-4周）

### 并行准备（1-2个月）：

4. **深圳公司 ICP 备案**
   - 联系阿里云/腾讯云客服
   - 准备营业执照、身份证等资料
   - 提交备案申请

5. **申请支付宝企业账户**
   - 等 ICP 备案完成后
   - 注册企业支付宝
   - 申请开放平台
   - 签约手机网站支付

---

## 📞 下一步

请将以下信息发给 Jeff：

**标题**：SiteHub 支付接入 - 需要您提供的信息

**内容**：
```
Hi Jeff,

根据您的方案（国外个人、国内企业），我整理了详细的资料清单。

【立即需要（本周）】：
1. Stripe 个人账户 API Key（测试模式）
2. PayPal 账户 API Key（测试模式）

【并行准备（1-2个月）】：
3. 深圳公司 ICP 备案
4. 支付宝企业账户申请

详细步骤和资料清单见附件：PAYMENT_INFO_NEEDED_FROM_JEFF.md

我建议：
- 本周先配置 Stripe/PayPal 测试环境
- 面试时可以演示国际支付功能
- 支付宝需要 ICP 备案，预计 1-2 个月完成

请问您方便本周提供 Stripe 和 PayPal 的测试 API Key 吗？

Best,
[你的名字]
```

---

**文档创建时间**：2025-10-06
**方案状态**：等待 Jeff 提供 API Key
