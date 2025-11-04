# 🔐 腾讯云SSM密钥存储配置指南（给Jeff）

## 📋 概述

为了保护支付密钥的安全性，我们使用**腾讯云SSM（凭据管理系统）**来存储所有敏感密钥。这样即使开发团队成员有环境变量访问权限，也无法看到真实的密钥内容。

---

## ✅ 为什么使用SSM？

### **传统方式的问题：**
- ❌ 环境变量中直接存储密钥，所有开发成员都能看到
- ❌ 如果团队成员离职或账号被盗，密钥有泄露风险
- ❌ 密钥轮换需要重新部署代码

### **SSM方式的优势：**
- ✅ 密钥完全不在环境变量中，只存储凭据名称
- ✅ 只有你（主账号）能查看和管理密钥
- ✅ 支持访问审计，可以看到谁访问了密钥
- ✅ 支持密钥轮换，无需重新部署代码
- ✅ 自动版本控制

---

## 🎯 需要创建的SSM凭据清单

### **微信支付凭据（6个）**

| 凭据名称 | 对应的环境变量 | 说明 |
|---------|--------------|------|
| `sitehub-wechat-pay-app-id` | `WECHAT_PAY_APP_ID` | 微信支付AppID |
| `sitehub-wechat-pay-mch-id` | `WECHAT_PAY_MCH_ID` | 微信支付商户号 |
| `sitehub-wechat-pay-serial-no` | `WECHAT_PAY_SERIAL_NO` | API证书序列号 |
| `sitehub-wechat-pay-private-key` | `WECHAT_PAY_PRIVATE_KEY` | API私钥（RSA格式，完整内容） |
| `sitehub-wechat-pay-public-key` | `WECHAT_PAY_PUBLIC_KEY` | API公钥（可选） |
| `sitehub-wechat-pay-api-v3-key` | `WECHAT_PAY_API_V3_KEY` | APIv3密钥（32位字符串） |

### **支付宝支付凭据（2个）**

| 凭据名称 | 对应的环境变量 | 说明 |
|---------|--------------|------|
| `sitehub-alipay-private-key` | `ALIPAY_PRIVATE_KEY` | 支付宝私钥（RSA2格式，完整内容） |
| `sitehub-alipay-public-key` | `ALIPAY_PUBLIC_KEY` | 支付宝公钥（支付宝返回的公钥） |

### **微信登录凭据（2个，审核通过后创建）**

| 凭据名称 | 对应的环境变量 | 说明 |
|---------|--------------|------|
| `sitehub-wechat-app-id` | `WECHAT_APP_ID` | 微信登录AppID（审核通过后获取） |
| `sitehub-wechat-app-secret` | `WECHAT_APP_SECRET` | 微信登录Secret（审核通过后获取） |

---

## ❓ 重要：使用哪个腾讯云账号？

### **账号选择说明**

Jeff问：应该用公司邮箱账号（chenyou_science@163.com）还是小程序对应的腾讯云账号？

### **推荐方案：使用小程序对应的腾讯云账号** ✅

**原因：**
1. ✅ **CloudBase环境已存在**：小程序使用的CloudBase环境 `cloudbase-1gnip2iaa08260e5` 在这个账号下
2. ✅ **资源统一管理**：SSM凭据和CloudBase环境在同一个账号下，便于管理
3. ✅ **权限一致**：代码访问CloudBase和SSM需要使用相同的API密钥（SecretId/SecretKey）

### **如果使用公司邮箱账号**

**前提条件：**
- 需要确保CloudBase环境也在公司邮箱账号下
- 或者确保两个账号之间有资源访问权限

**如果CloudBase环境在小程序账号下：**
- ❌ 不建议使用公司邮箱账号
- ✅ 应该使用小程序对应的腾讯云账号

### **确认方法**

**如何确认应该用哪个账号：**

1. **检查CloudBase环境在哪个账号下**
   - 登录小程序对应的腾讯云账号
   - 进入：云开发控制台 → 查看环境列表
   - 确认是否有：`cloudbase-1gnip2iaa08260e5` 这个环境

2. **如果有这个环境：**
   - ✅ **使用小程序对应的腾讯云账号**配置SSM
   - ✅ 这样SSM和CloudBase在同一个账号下，代码访问更方便

3. **如果没有这个环境：**
   - 需要检查公司邮箱账号是否有这个环境
   - 或者需要迁移环境到统一账号

### **最终建议**

**推荐使用：小程序对应的腾讯云账号**（因为CloudBase环境在这个账号下）

---

## 📝 详细操作步骤

### **第一步：确认并登录腾讯云控制台**

1. 访问：https://console.cloud.tencent.com/
2. **确认账号**：使用小程序对应的腾讯云账号登录（如果CloudBase环境在这个账号下）
3. **验证方法**：登录后，进入云开发控制台，确认能看到 `cloudbase-1gnip2iaa08260e5` 环境

### **第二步：进入SSM（凭据管理系统）**

1. 在控制台顶部搜索框输入：**SSM** 或 **凭据管理**
2. 点击进入：**SSM（凭据管理系统）**
3. 如果首次使用，会提示开通服务（免费）

### **第三步：创建第一个凭据（以微信支付私钥为例）**

#### 3.1 点击"创建凭据"

在SSM控制台页面，点击右上角 **"创建凭据"** 按钮

#### 3.2 选择凭据类型

选择：**"用户凭据"**（不是云产品凭据）

#### 3.3 填写凭据信息

**基本信息：**
- **凭据名称**：`sitehub-wechat-pay-private-key`
  - ⚠️ **重要**：名称必须完全一致，代码中会使用这个名称
- **凭据类型**：选择 **"普通凭据"**
- **描述**：`微信支付API私钥（用于国内支付功能）`

**凭据值：**
- 在"凭据值"输入框中，粘贴你的微信支付私钥
- 格式示例：
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
（完整的私钥内容）
-----END PRIVATE KEY-----
```
- ⚠️ **重要**：必须包含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----` 标记

#### 3.4 配置访问权限

**访问控制：**
- **访问方式**：选择 **"仅允许主账号访问"**
- 这样只有你的主账号能看到密钥内容
- 开发团队成员即使有环境变量访问权限，也无法看到密钥

**标签（可选）：**
- 添加标签：`环境:生产`、`用途:支付`、`类型:微信支付`

#### 3.5 提交创建

1. 检查所有信息无误
2. 点击 **"确定"** 创建凭据
3. 创建成功后会显示凭据详情页

### **第四步：重复创建其他凭据**

按照第三步的步骤，依次创建以下所有凭据：

#### **微信支付凭据（6个）：**

1. ✅ `sitehub-wechat-pay-app-id`
   - 凭据值：你的微信支付AppID（格式：`wx_xxxxxxxxxxxxxxxx`）

2. ✅ `sitehub-wechat-pay-mch-id`
   - 凭据值：你的微信支付商户号（纯数字）

3. ✅ `sitehub-wechat-pay-serial-no`
   - 凭据值：API证书序列号

4. ✅ `sitehub-wechat-pay-private-key`
   - 凭据值：API私钥（完整RSA格式）

5. ✅ `sitehub-wechat-pay-public-key`（可选）
   - 凭据值：API公钥（完整格式）

6. ✅ `sitehub-wechat-pay-api-v3-key`
   - 凭据值：APIv3密钥（32位字符串）

#### **支付宝支付凭据（2个）：**

1. ✅ `sitehub-alipay-private-key`
   - 凭据值：支付宝私钥（完整RSA2格式，包括BEGIN/END标记）

2. ✅ `sitehub-alipay-public-key`
   - 凭据值：支付宝公钥（从支付宝开放平台获取的公钥，不是你自己上传的公钥）

#### **微信登录凭据（2个，审核通过后创建）：**

1. ⏳ `sitehub-wechat-app-id`（等待审核通过）
   - 凭据值：微信开放平台网站应用AppID

2. ⏳ `sitehub-wechat-app-secret`（等待审核通过）
   - 凭据值：微信开放平台网站应用Secret
   - ⚠️ **重要**：只显示一次，请立即保存

---

## 🔍 验证凭据创建

创建完成后，在SSM控制台的"凭据列表"中应该能看到所有凭据：

```
✅ sitehub-wechat-pay-app-id
✅ sitehub-wechat-pay-mch-id
✅ sitehub-wechat-pay-serial-no
✅ sitehub-wechat-pay-private-key
✅ sitehub-wechat-pay-public-key
✅ sitehub-wechat-pay-api-v3-key
✅ sitehub-alipay-private-key
✅ sitehub-alipay-public-key
⏳ sitehub-wechat-app-id（审核通过后创建）
⏳ sitehub-wechat-app-secret（审核通过后创建）
```

---

## 🔐 权限配置说明

### **当前配置（推荐）：**
- ✅ 所有凭据设置为"仅允许主账号访问"
- ✅ 开发团队成员无法查看凭据内容
- ✅ 只有你能管理和查看密钥

### **如果需要让开发团队成员也能访问（不推荐）：**
- ⚠️ 可以在凭据详情页 → 权限设置 → 添加子账号
- ⚠️ 但建议只给只读权限，不要给修改权限

---

## 📊 创建凭据检查清单

在创建凭据前，请确保你已经准备好以下密钥：

### **微信支付密钥（从微信支付商户平台获取）：**
- [ ] 微信支付AppID
- [ ] 微信支付商户号（MCH_ID）
- [ ] API证书序列号
- [ ] API私钥（RSA格式，完整内容）
- [ ] API公钥（可选）
- [ ] APIv3密钥（32位字符串）

**获取位置：**
- 微信支付商户平台：https://pay.weixin.qq.com/
- 账户中心 → API安全 → API证书

### **支付宝支付密钥（从支付宝开放平台获取）：**
- [ ] 支付宝AppID（已有：`2021005199628151`）
- [ ] 支付宝应用私钥（RSA2格式）
- [ ] 支付宝公钥（从平台获取的公钥）

**获取位置：**
- 支付宝开放平台：https://open.alipay.com/
- 应用详情 → 接口加签方式

### **微信登录密钥（审核通过后获取）：**
- [ ] 微信开放平台网站应用AppID
- [ ] 微信开放平台网站应用Secret

**获取位置：**
- 微信开放平台：https://open.weixin.qq.com/
- 管理中心 → 网站应用 → 应用详情

---

## ⚠️ 重要注意事项

### **1. 凭据名称必须完全一致**
- 代码中会使用这些凭据名称来获取密钥
- 如果名称不一致，代码无法找到密钥
- 建议直接复制粘贴本文档中的凭据名称

### **2. 私钥格式必须完整**
- 私钥必须包含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 如果私钥是多行的，需要完整复制所有行
- 在SSM中，多行内容可以直接粘贴，会自动处理换行

### **3. 访问权限设置**
- 建议所有凭据都设置为"仅允许主账号访问"
- 这样可以确保只有你能查看和管理密钥
- 开发团队成员即使有环境变量访问权限，也无法看到密钥

### **4. 密钥轮换**
- 如果以后需要更换密钥，只需要在SSM中更新凭据值
- 无需修改代码或重新部署
- 代码会自动获取最新的密钥值

### **5. 备份密钥**
- ⚠️ **重要**：请将原始密钥备份到安全的地方（如密码管理器）
- 虽然SSM有版本控制，但建议自己也要备份一份

---

## 📞 创建完成后

创建完所有凭据后，请告诉我：

1. ✅ **已创建的凭据列表**（确认名称是否正确）
2. ✅ **是否有任何问题或疑问**
3. ⏳ **微信登录凭据**（等审核通过后再创建）

我会根据你创建的凭据，更新代码配置，然后你就可以在环境变量中只配置凭据名称（而不是密钥本身）。

---

## 🎯 下一步

创建完SSM凭据后，我会：

1. ✅ 修改代码，支持从SSM读取密钥
2. ✅ 更新环境变量配置文档
3. ✅ 提供测试步骤

---

## 📋 快速参考：凭据名称清单

### **微信支付（6个）：**
```
sitehub-wechat-pay-app-id
sitehub-wechat-pay-mch-id
sitehub-wechat-pay-serial-no
sitehub-wechat-pay-private-key
sitehub-wechat-pay-public-key
sitehub-wechat-pay-api-v3-key
```

### **支付宝支付（2个）：**
```
sitehub-alipay-private-key
sitehub-alipay-public-key
```

### **微信登录（2个，审核通过后）：**
```
sitehub-wechat-app-id
sitehub-wechat-app-secret
```

---

**文档创建时间：** 2025年1月  
**适用场景：** 国内支付功能密钥存储  
**负责人：** Jeff

