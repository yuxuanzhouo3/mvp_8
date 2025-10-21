# 🔐 密钥安全管理策略 - 防止泄露方案

## 🚨 **Jeff的安全担忧（合理且重要）**

### **问题描述：**
```
❌ 风险场景：
  - 腾讯云环境变量：所有开发成员都可以访问
  - Vercel环境变量：可以设置可见范围 ✅
  - 如果开发成员离职或账号被盗：密钥泄露风险

⚠️ 敏感密钥包括：
  1. WECHAT_APP_SECRET（微信登录密钥）
  2. WECHAT_PAY_API_V3_KEY（微信支付密钥）
  3. WECHAT_PAY_PRIVATE_KEY（商户私钥）
  4. ALIPAY_PRIVATE_KEY（支付宝私钥）
  5. STRIPE_SECRET_KEY（Stripe密钥）
  6. PAYPAL_CLIENT_SECRET（PayPal密钥）
  7. SUPABASE_SERVICE_ROLE_KEY（数据库管理密钥）
```

---

## 🛡️ **多层防护策略**

### **策略1: 基于角色的访问控制（RBAC）**

#### **腾讯云项目成员角色设置：**

```
推荐角色分配：

👑 项目管理员（Jeff）：
  - 权限：所有权限
  - 可见：所有环境变量
  - 可操作：创建、修改、删除

🔧 开发者（开发团队）：
  - 权限：只读代码、部署
  - 可见：非敏感环境变量
  - 不可见：支付密钥、私钥
  - 不可操作：修改环境变量

👀 运维人员（如有）：
  - 权限：查看日志、监控
  - 可见：部分环境变量
  - 不可操作：修改敏感配置
```

#### **腾讯云具体操作：**

1. **访问管理（CAM）配置**
```
路径：腾讯云控制台 → 访问管理 → 用户管理

步骤：
1. 创建子账号：dev-team（开发团队）
2. 分配策略：
   - 只读访问云函数代码
   - 只读访问云开发数据库
   - 禁止访问环境变量管理
   - 禁止访问密钥管理

3. Jeff保留主账号：
   - 完全权限
   - 管理所有敏感配置
```

2. **云函数环境变量权限隔离**
```
腾讯云Serverless环境变量策略：

问题：默认所有成员可见环境变量
解决方案：
  → 使用"密钥管理系统（KMS）"加密
  → 使用"环境变量加密"功能
  → 配合CAM权限控制
```

---

### **策略2: 密钥管理系统（KMS）**

#### **腾讯云KMS配置（推荐 ✅）**

```
优势：
  ✅ 密钥加密存储
  ✅ 访问审计日志
  ✅ 自动密钥轮换
  ✅ 细粒度权限控制
```

**实施步骤：**

#### **步骤1: 开通KMS服务**
```
路径：腾讯云控制台 → 密钥管理系统（KMS）

操作：
1. 开通KMS服务（免费）
2. 创建主密钥（CMK）：
   - 密钥名称：sitehub-master-key
   - 用途：加密环境变量
   - 密钥用户：只有Jeff主账号
```

#### **步骤2: 加密敏感环境变量**
```bash
# 使用KMS加密密钥
# 示例：加密微信支付密钥

原始密钥：
WECHAT_PAY_API_V3_KEY=my_secret_key_123456789012

KMS加密后：
WECHAT_PAY_API_V3_KEY_ENCRYPTED=AQICAHj8kF...（密文）
```

#### **步骤3: 代码中解密使用**
```typescript
// lib/kms-decrypt.ts
import * as tencentcloud from 'tencentcloud-sdk-nodejs'

const KmsClient = tencentcloud.kms.v20190118.Client

export async function decryptEnvVar(encryptedValue: string): Promise<string> {
  const client = new KmsClient({
    credential: {
      // 使用临时凭证，不使用永久密钥
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: 'ap-guangzhou',
  })

  const params = {
    CiphertextBlob: encryptedValue,
  }

  const response = await client.Decrypt(params)
  return response.Plaintext
}

// 使用示例
const wechatPayKey = await decryptEnvVar(process.env.WECHAT_PAY_API_V3_KEY_ENCRYPTED!)
```

---

### **策略3: 密钥分级存储**

#### **分级策略：**

```
Level 1: 公开配置（无需保护）
  ✅ NEXT_PUBLIC_SITE_URL=https://mornhub.help
  ✅ NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  ✅ NEXT_PUBLIC_ALIPAY_APP_ID=2021005199628151
  → 所有开发者可见

Level 2: 内部配置（轻度保护）
  🔒 NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-xxx
  🔒 数据库连接字符串（只读权限）
  → 限定开发者可见

Level 3: 敏感密钥（重度保护）
  🔐 WECHAT_APP_SECRET
  🔐 WECHAT_PAY_API_V3_KEY
  🔐 WECHAT_PAY_PRIVATE_KEY
  🔐 ALIPAY_PRIVATE_KEY
  → 只有Jeff可见，使用KMS加密
```

---

### **策略4: 密钥轮换机制**

#### **定期更换密钥：**

```
推荐轮换周期：

🔄 每3个月轮换一次：
  - WECHAT_APP_SECRET
  - API密钥类

🔄 每6个月轮换一次：
  - WECHAT_PAY_API_V3_KEY
  - 支付相关密钥

🔄 每年轮换一次：
  - RSA证书和私钥
  - WECHAT_PAY_PRIVATE_KEY

⚠️ 开发成员离职：立即轮换所有密钥
```

#### **微信密钥轮换步骤：**

```
1. 生成新密钥：
   - 登录微信开放平台
   - 生成新的APP_SECRET
   - 下载新的支付证书

2. 更新环境变量：
   - 先添加新密钥（不删除旧密钥）
   - 部署新版本
   - 验证新密钥工作正常
   - 删除旧密钥

3. 审计日志：
   - 记录更换时间
   - 记录操作人员
```

---

### **策略5: 环境隔离**

#### **多环境策略：**

```
开发环境（Development）：
  - 使用测试密钥
  - 沙盒支付账号
  - 开发团队可访问
  - 数据可随时清空

测试环境（Staging）：
  - 使用测试密钥
  - 模拟真实环境
  - 只读访问权限

生产环境（Production）：
  - 使用真实密钥 🔐
  - 只有Jeff可访问
  - 严格权限控制
  - 操作审计日志
```

---

### **策略6: 密钥存储方案对比**

#### **方案对比：**

| 方案 | 安全性 | 便利性 | 成本 | 推荐度 |
|------|-------|--------|------|--------|
| **直接环境变量** | ❌ 低 | ✅ 高 | 免费 | ❌ 不推荐 |
| **KMS加密** | ✅ 高 | 🔶 中 | 低 | ✅✅✅ 强烈推荐 |
| **密钥管理服务** | ✅ 高 | 🔶 中 | 中 | ✅✅ 推荐 |
| **硬件安全模块（HSM）** | ✅✅ 极高 | ❌ 低 | 高 | 🔶 大企业适用 |

---

## 🎯 **针对腾讯云的具体实施方案**

### **方案A: KMS加密方案（最推荐 ✅✅✅）**

#### **实施步骤：**

**1. 开通KMS并创建主密钥**
```
腾讯云控制台 → KMS → 创建密钥

配置：
  密钥名称：sitehub-prod-master-key
  密钥用途：加密环境变量
  密钥用户：只有Jeff主账号
```

**2. 加密敏感密钥**
```bash
# 使用腾讯云CLI加密
tccli kms Encrypt --KeyId <key-id> --Plaintext "my_secret_key"

# 输出密文：
AQICAHj8kF9w2...（存储这个密文到环境变量）
```

**3. 修改代码，启动时解密**
```typescript
// lib/secrets.ts
import { decryptEnvVar } from './kms-decrypt'

// 缓存解密后的密钥（避免重复解密）
let decryptedSecrets: Record<string, string> = {}

export async function getSecret(key: string): Promise<string> {
  if (decryptedSecrets[key]) {
    return decryptedSecrets[key]
  }

  const encryptedKey = `${key}_ENCRYPTED`
  const encryptedValue = process.env[encryptedKey]

  if (!encryptedValue) {
    throw new Error(`Secret ${key} not found`)
  }

  const decrypted = await decryptEnvVar(encryptedValue)
  decryptedSecrets[key] = decrypted
  return decrypted
}

// 使用示例
// app/api/payment/wechat/create/route.ts
import { getSecret } from '@/lib/secrets'

const wechatPayKey = await getSecret('WECHAT_PAY_API_V3_KEY')
```

**4. 环境变量配置**
```bash
# 腾讯云Serverless环境变量（加密后的值）
WECHAT_APP_SECRET_ENCRYPTED=AQICAHj8kF...
WECHAT_PAY_API_V3_KEY_ENCRYPTED=AQICAHj8kF...
WECHAT_PAY_PRIVATE_KEY_ENCRYPTED=AQICAHj8kF...
ALIPAY_PRIVATE_KEY_ENCRYPTED=AQICAHj8kF...

# 公开配置（无需加密）
NEXT_PUBLIC_SITE_URL=https://mornhub.help
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-xxx
```

**优势：**
- ✅ 即使开发者看到环境变量，也是密文
- ✅ 只有Jeff的主账号能解密
- ✅ 有完整的访问审计日志
- ✅ 支持自动密钥轮换

---

### **方案B: 密钥管理服务（SSM）**

#### **腾讯云SSM（参数存储）：**

```
路径：腾讯云控制台 → SSM（凭据管理系统）

优势：
  ✅ 专门用于密钥管理
  ✅ 自动版本控制
  ✅ 访问审计
  ✅ 定期轮换提醒
```

**实施步骤：**

**1. 创建凭据**
```
SSM控制台 → 创建凭据

配置：
  凭据名称：sitehub-wechat-app-secret
  凭据值：wx_app_secret_value_here
  访问权限：只有Jeff主账号
```

**2. 代码中获取凭据**
```typescript
// lib/ssm-client.ts
import * as tencentcloud from 'tencentcloud-sdk-nodejs'

const SsmClient = tencentcloud.ssm.v20190923.Client

export async function getSecretFromSSM(secretName: string): Promise<string> {
  const client = new SsmClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: 'ap-guangzhou',
  })

  const params = {
    SecretName: secretName,
  }

  const response = await client.GetSecretValue(params)
  return response.SecretString
}

// 使用示例
const wechatAppSecret = await getSecretFromSSM('sitehub-wechat-app-secret')
```

**3. 不在环境变量中存储密钥**
```bash
# 腾讯云Serverless环境变量（只存储密钥名称）
WECHAT_APP_SECRET_NAME=sitehub-wechat-app-secret
WECHAT_PAY_KEY_NAME=sitehub-wechat-pay-key

# 代码中根据名称从SSM获取真实密钥
```

**优势：**
- ✅ 密钥完全不在环境变量中
- ✅ 开发者完全无法看到密钥
- ✅ Jeff可以随时轮换密钥，无需重新部署

---

### **方案C: 混合方案（推荐给Jeff ✅）**

#### **分级处理策略：**

```
极度敏感密钥（使用SSM）：
  🔐 WECHAT_PAY_PRIVATE_KEY → SSM凭据
  🔐 ALIPAY_PRIVATE_KEY → SSM凭据
  🔐 STRIPE_SECRET_KEY → SSM凭据
  🔐 PAYPAL_CLIENT_SECRET → SSM凭据

中度敏感密钥（使用KMS加密）：
  🔒 WECHAT_APP_SECRET → KMS加密后存环境变量
  🔒 WECHAT_PAY_API_V3_KEY → KMS加密后存环境变量

低敏感配置（直接环境变量）：
  ✅ NEXT_PUBLIC_* 系列 → 直接存储
  ✅ 数据库连接字符串（只读） → 直接存储
```

---

## 🔍 **访问审计和监控**

### **1. 腾讯云审计日志（CloudAudit）**

```
开通路径：腾讯云控制台 → 云审计

监控内容：
  ✅ 谁访问了密钥管理页面
  ✅ 谁修改了环境变量
  ✅ 谁调用了KMS解密接口
  ✅ 操作时间、IP地址、结果
```

### **2. 告警规则配置**

```
设置告警：

⚠️ 敏感操作告警：
  - 有人修改环境变量 → 立即通知Jeff
  - 有人访问KMS密钥 → 记录日志
  - 异常IP调用解密接口 → 立即告警

⚠️ 异常行为检测：
  - 非工作时间访问 → 告警
  - 大量解密请求 → 告警
  - 未授权访问尝试 → 告警
```

---

## 📋 **实施检查清单**

### **Phase 1: 基础安全配置（立即实施）**

```
□ 腾讯云CAM权限配置
  □ 创建子账号给开发团队
  □ 限制环境变量访问权限
  □ 只有Jeff主账号有完全权限

□ Vercel权限配置
  □ 设置环境变量可见范围
  □ 敏感变量只对Owner可见
  □ 开发者只有只读访问

□ 开发/生产环境隔离
  □ 开发环境使用测试密钥
  □ 生产环境使用真实密钥
  □ 严格区分访问权限
```

### **Phase 2: KMS加密配置（推荐实施）**

```
□ 开通腾讯云KMS服务
□ 创建主密钥（CMK）
□ 加密敏感环境变量
□ 修改代码支持KMS解密
□ 测试加密/解密流程
□ 部署到生产环境
```

### **Phase 3: SSM凭据管理（高级配置）**

```
□ 开通腾讯云SSM服务
□ 创建敏感凭据
□ 配置访问权限（只有Jeff）
□ 修改代码支持SSM获取密钥
□ 移除环境变量中的敏感密钥
□ 测试凭据获取流程
```

### **Phase 4: 审计和监控（持续运行）**

```
□ 开通云审计服务
□ 配置操作日志收集
□ 设置告警规则
□ 定期审查访问日志（每月）
□ 定期轮换密钥（每季度）
```

---

## 🎯 **给Jeff的最终建议**

### **短期方案（1周内实施）：**

**1. CAM权限隔离**
```
操作步骤：
1. 登录腾讯云控制台
2. 访问管理 → 用户管理
3. 创建子账号：dev-team
4. 分配策略：
   - 云函数只读
   - 禁止访问环境变量管理
   - 禁止访问密钥管理
5. 将开发团队账号切换为子账号
```

**时间成本：** 30分钟
**安全提升：** ⭐⭐⭐⭐ (中等)

---

### **中期方案（1个月内实施）：**

**2. KMS加密敏感密钥**
```
操作步骤：
1. 开通KMS服务
2. 创建主密钥
3. 使用CLI加密敏感密钥
4. 修改代码支持KMS解密
5. 部署到生产环境
```

**时间成本：** 2-3小时（开发） + 1小时（部署）
**安全提升：** ⭐⭐⭐⭐⭐ (高)

---

### **长期方案（持续改进）：**

**3. SSM凭据管理**
```
操作步骤：
1. 开通SSM服务
2. 迁移极度敏感密钥到SSM
3. 配置自动轮换
4. 设置审计告警
```

**时间成本：** 1天（开发） + 持续维护
**安全提升：** ⭐⭐⭐⭐⭐ (极高)

---

## 💡 **额外建议**

### **1. 开发团队管理**

```
✅ 签署保密协议（NDA）
✅ 最小权限原则
✅ 定期安全培训
✅ 离职密钥轮换流程
```

### **2. 技术措施**

```
✅ 代码审查机制
✅ 防止硬编码密钥（使用ESLint规则）
✅ Git提交前检查密钥泄露
✅ 使用.env.example模板
```

### **3. 应急响应**

```
⚠️ 密钥泄露应急预案：
1. 立即禁用泄露的密钥
2. 生成新密钥
3. 更新所有环境
4. 审查访问日志
5. 评估影响范围
6. 通知相关方
```

---

## 📊 **成本分析**

| 服务 | 免费额度 | 付费成本 | 推荐使用 |
|------|---------|---------|---------|
| **CAM权限管理** | 免费 | 免费 | ✅ 必须 |
| **KMS加密** | 免费20次/月 | ¥0.03/次 | ✅ 推荐 |
| **SSM凭据管理** | 免费30个凭据 | ¥0.4/个/月 | ✅ 推荐 |
| **CloudAudit审计** | 免费 | 免费 | ✅ 必须 |

**预估月成本：**
- KMS：¥10-30/月（假设1000次解密）
- SSM：¥2-8/月（5-20个凭据）
- **总计：¥12-38/月**

**性价比：** ✅✅✅ 极高（相比密钥泄露的风险）

---

## ✅ **总结**

### **Jeff应该立即做的：**

**1. 短期（本周）：**
```
✅ 配置CAM权限隔离
✅ Vercel环境变量设置可见范围
✅ 开发/生产环境分离
```

**2. 中期（本月）：**
```
✅ 开通KMS服务
✅ 加密敏感密钥
✅ 部署KMS解密代码
```

**3. 长期（持续）：**
```
✅ 配置SSM凭据管理
✅ 设置审计告警
✅ 定期密钥轮换
```

### **安全原则：**
```
🔐 零信任原则：不信任任何人
🔐 最小权限原则：只给必要的权限
🔐 纵深防御原则：多层防护
🔐 审计原则：所有操作可追溯
```

---

*文档创建时间：2025年1月*
*最后更新：2025年1月*
*负责人：Jeff + 开发团队*
