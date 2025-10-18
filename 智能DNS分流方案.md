# 智能DNS分流部署方案

## 🎯 方案概述

### **Jeff的需求：**
- 国内IP用户 → 访问腾讯云（site.mornscience.top）
- 海外IP用户 → 访问Vercel（mornhub.help）
- API和数据库根据部署位置自动匹配

---

## 🏗️ 架构设计

### **双域名 + 双部署架构**

```
┌─────────────────────────────────────────┐
│           用户访问网站                    │
└───────────────┬─────────────────────────┘
                │
          检测用户IP
                │
    ┌───────────┴───────────┐
    │                       │
国内IP                   海外IP
    │                       │
    ↓                       ↓
┌─────────────┐      ┌─────────────┐
│ 国内域名      │      │ 国际域名      │
│ site.mornscience.top│ mornhub.help │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ↓                    ↓
┌─────────────┐      ┌─────────────┐
│ 腾讯云部署    │      │ Vercel部署   │
│ Serverless  │      │ Edge Network│
└──────┬──────┘      └──────┬──────┘
       │                    │
       ↓                    ↓
┌─────────────┐      ┌─────────────┐
│ 腾讯云 API   │      │ Vercel API  │
│ /api/*      │      │ /api/*      │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ↓                    ↓
┌─────────────┐      ┌─────────────┐
│ 腾讯云数据库  │      │ Supabase    │
│ CloudBase   │      │ PostgreSQL  │
└─────────────┘      └─────────────┘

✅ 国内数据不出境   ✅ 海外访问快速
```

---

## 📋 实施步骤

### **Phase 1: 腾讯云部署（国内站）**

#### 1.1 创建腾讯云Serverless应用
```
控制台：https://console.cloud.tencent.com/ssr
应用名称：mvp8-china
地域：中国大陆
代码来源：GitHub（yan888376/mvp_8）
分支：main
```

#### 1.2 配置环境变量（仅国内服务）
```bash
# 基础配置
NEXT_PUBLIC_SITE_URL=https://site.mornscience.top
NEXT_PUBLIC_IS_CHINA_DEPLOYMENT=true  # 标记为国内部署

# 腾讯云数据库（主要使用）
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5

# 微信支付（国内）
WECHAT_PAY_APP_ID=wx...
WECHAT_PAY_MCH_ID=...
WECHAT_PAY_SERIAL_NO=...
WECHAT_PAY_PRIVATE_KEY=...
WECHAT_PAY_API_V3_KEY=...

# 微信登录（国内）
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...

# 支付宝（国内+国际）
NEXT_PUBLIC_ALIPAY_APP_ID=...
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...

# Supabase（备用，用于IP检测失败的情况）
NEXT_PUBLIC_SUPABASE_URL=https://ykirhilnbvsanqyenusf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### 1.3 绑定域名
```
域名：site.mornscience.top
SSL证书：腾讯云免费证书
CDN加速：开启
```

---

### **Phase 2: Vercel部署（国际站）**

#### 2.1 在Vercel创建项目
```
项目名：mvp8-international
仓库：yan888376/mvp_8
分支：main（或创建 international 分支）
```

#### 2.2 配置环境变量（仅国际服务）
```bash
# 基础配置
NEXT_PUBLIC_SITE_URL=https://mornhub.help
NEXT_PUBLIC_IS_CHINA_DEPLOYMENT=false  # 标记为国际部署

# Supabase数据库（主要使用）
NEXT_PUBLIC_SUPABASE_URL=https://ykirhilnbvsanqyenusf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe支付（国际）
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal支付（国际）
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live

# 支付宝（国际也支持）
NEXT_PUBLIC_ALIPAY_APP_ID=...
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...

# 腾讯云（备用）
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5
```

#### 2.3 绑定域名
```
域名：mornhub.help
SSL证书：自动（Let's Encrypt）
```

---

### **Phase 3: 智能DNS配置**

#### 3.1 使用腾讯云DNSPod

**登录：** https://console.cloud.tencent.com/cns

**主域名配置（mornhub.help）：**
```
记录类型：A / CNAME
线路类型：默认
记录值：Vercel地址（默认解析）

记录类型：A / CNAME  
线路类型：境内
记录值：腾讯云Serverless地址（国内用户）

记录类型：A / CNAME
线路类型：境外
记录值：Vercel地址（海外用户）
```

**中国专用域名（site.mornscience.top）：**
```
记录类型：CNAME
线路类型：默认
记录值：腾讯云Serverless地址
```

---

## 🔧 代码调整（可选优化）

### **优化1：根据部署环境自动配置**

**文件：** `lib/config/deployment.ts`
```typescript
// 检测当前部署环境
export const isChina Deployment = process.env.NEXT_PUBLIC_IS_CHINA_DEPLOYMENT === 'true'

// 获取正确的API基础URL
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 客户端：使用当前域名
    return window.location.origin
  }
  // 服务端：使用环境变量
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// 数据库配置
export const getDatabaseConfig = () => {
  if (isChinaDeployment) {
    // 腾讯云部署：优先使用腾讯云数据库
    return {
      primary: 'cloudbase',
      fallback: 'supabase'
    }
  } else {
    // Vercel部署：优先使用Supabase
    return {
      primary: 'supabase',
      fallback: 'cloudbase'
    }
  }
}
```

### **优化2：支付方式根据部署环境**

**文件：** `app/payment/page.tsx`
```typescript
// 根据部署环境和用户IP综合判断
const getAvailablePaymentMethods = () => {
  // 如果是腾讯云部署
  if (isChinaDeployment) {
    return ['wechat', 'alipay']  // 只显示微信和支付宝
  }
  
  // 如果是Vercel部署
  if (isChina) {
    // 国内用户访问国际站（少见情况）
    return ['alipay', 'stripe', 'paypal']
  } else {
    // 海外用户访问国际站（正常情况）
    return ['stripe', 'paypal', 'alipay']
  }
}
```

---

## 📊 数据流向对比

### **国内用户访问国内站：**
```
用户（中国）
  ↓
site.mornscience.top
  ↓
腾讯云CDN（中国节点）
  ↓
腾讯云Serverless（中国）
  ↓
腾讯云CloudBase数据库（中国）

✅ 全程在境内
✅ 访问速度快
✅ 完全合规
```

### **海外用户访问国际站：**
```
用户（美国/欧洲/其他）
  ↓
mornhub.help
  ↓
Vercel Edge Network（就近节点）
  ↓
Vercel Serverless（美国）
  ↓
Supabase PostgreSQL（美国）

✅ 全程在境外
✅ 访问速度快
✅ 合规
```

### **国内用户误访问国际站（DNS智能解析失败）：**
```
用户（中国）
  ↓
mornhub.help
  ↓
DNS智能解析 → 腾讯云地址（境内线路）
  ↓
腾讯云Serverless
  ↓
检测isChina=true → 使用腾讯云数据库

✅ 仍然合规（数据不出境）
```

---

## ✅ 优势分析

### **1. 完全合规** ✅
- 国内用户数据不出境
- 符合《数据安全法》
- 符合《个人信息保护法》

### **2. 性能最优** ✅
- 国内用户访问国内服务器（快）
- 海外用户访问海外服务器（快）
- 智能DNS自动选择最优路径

### **3. 成本可控** ✅
- 腾讯云：~50-100元/月
- Vercel：免费
- 总成本：50-100元/月

### **4. 维护简单** ✅
- 同一套代码
- 自动部署
- 环境变量区分配置

---

## 🧪 测试验证

### **测试1：国内用户访问国内站**
```bash
# 使用国内VPN或服务器测试
curl -I https://site.mornscience.top

# 应该看到：
# Server: Tencent Cloud
# 访问速度：< 200ms
```

### **测试2：海外用户访问国际站**
```bash
# 使用海外VPN或服务器测试
curl -I https://mornhub.help

# 应该看到：
# Server: Vercel
# 访问速度：< 500ms
```

### **测试3：DNS智能解析**
```bash
# 国内DNS查询
nslookup mornhub.help 119.29.29.29
# 应该返回腾讯云IP

# 海外DNS查询  
nslookup mornhub.help 8.8.8.8
# 应该返回Vercel IP
```

---

## 📝 域名配置清单

### **需要准备的域名：**

#### 1. site.mornscience.top（国内专用）
```
用途：国内用户访问
部署：腾讯云Serverless
DNS：DNSPod
备案：需要ICP备案 ⚠️
SSL：腾讯云免费证书
```

#### 2. mornhub.help（国际主域名）
```
用途：海外用户访问 + 国内智能解析
部署：Vercel（默认）+ 腾讯云（境内线路）
DNS：DNSPod智能解析
备案：不需要（.help域名）
SSL：Let's Encrypt（Vercel）
```

---

## 🚀 部署顺序

### **建议顺序：**

1. **先部署腾讯云（国内站）** ⏰ 2小时
   - 创建Serverless应用
   - 配置环境变量
   - 绑定 site.mornscience.top
   - 测试国内访问

2. **保持Vercel（国际站）** ⏰ 30分钟
   - 更新环境变量
   - 确认 mornhub.help 正常
   - 测试海外访问

3. **配置智能DNS** ⏰ 30分钟
   - DNSPod添加智能解析
   - 测试不同地区访问
   - 验证路由正确

4. **全面测试** ⏰ 1小时
   - 国内+海外访问测试
   - 支付功能测试
   - 登录功能测试
   - 数据库路由测试

**总时间：** 约4小时

---

## 💰 成本估算

### **月度费用：**
```
腾讯云Serverless：50-100元
  - 函数调用：~30元
  - 流量：~20元
  - 存储：~5元
  
Vercel：0元（免费额度足够）

DNSPod：0元（免费版足够）

域名：
  - site.mornscience.top：~50元/年
  - mornhub.help：已有

总计：50-100元/月 + 50元/年
```

---

## ⚠️ 注意事项

### **1. ICP备案**
- site.mornscience.top **必须备案**
- 备案周期：7-20天
- 需要提供：营业执照、法人身份证

### **2. 回调URL配置**

**国内站回调：**
```
微信支付：https://site.mornscience.top/api/payment/wechat/notify
支付宝：https://site.mornscience.top/api/payment/alipay/notify
微信登录：https://site.mornscience.top/api/auth/wechat/callback
```

**国际站回调：**
```
Stripe：https://mornhub.help/api/payment/stripe/webhook
PayPal：https://mornhub.help/api/payment/paypal/webhook
支付宝：https://mornhub.help/api/payment/alipay/notify
```

### **3. 数据同步**
- 两个站点的数据库是独立的
- 不会自动同步
- 这是正常的（合规要求）

---

## ✅ 完成标志

部署成功后应该能看到：

- [ ] site.mornscience.top 在国内能快速访问
- [ ] mornhub.help 在海外能快速访问
- [ ] 国内用户自动使用腾讯云数据库
- [ ] 海外用户自动使用Supabase数据库
- [ ] 支付和登录功能正常
- [ ] DNS智能解析工作正常
- [ ] 数据不出境（合规）

---

**这个方案是最优解：合规 + 性能 + 成本可控！** ✅🎊

