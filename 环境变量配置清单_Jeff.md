# 环境变量配置清单（给Jeff）

## 📋 需要配置的环境变量

### **在哪里配置？**

**如果使用Vercel部署（推荐）：**
- 登录：https://vercel.com/dashboard
- 项目：mvp_8
- Settings → Environment Variables
- 逐个添加下面的变量

**如果使用腾讯云Serverless：**
- 登录：https://console.cloud.tencent.com
- Serverless 应用中心
- 环境配置 → 环境变量
- 逐个添加下面的变量

---

## 🔐 微信支付配置（6个）

```
变量名：WECHAT_PAY_APP_ID
说明：微信公众号APPID
示例：wx1234567890abcdef
获取：微信支付商户平台 → 产品中心
```

```
变量名：WECHAT_PAY_MCH_ID
说明：微信支付商户号
示例：1234567890
获取：微信支付商户平台 → 账户中心
```

```
变量名：WECHAT_PAY_SERIAL_NO
说明：API证书序列号
示例：ABC123DEF456789
获取：微信支付商户平台 → 账户中心 → API安全 → 查看证书
```

```
变量名：WECHAT_PAY_PRIVATE_KEY
说明：API私钥（RSA）
示例：-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
获取：微信支付商户平台 → 账户中心 → API安全 → 下载证书
注意：需要保留BEGIN和END标记，可以用换行符\n连接
```

```
变量名：WECHAT_PAY_PUBLIC_KEY
说明：API公钥（可选）
示例：-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
获取：与私钥配对的公钥
```

```
变量名：WECHAT_PAY_API_V3_KEY
说明：APIv3密钥（32位字符串）
示例：abcdef1234567890abcdef1234567890
获取：微信支付商户平台 → 账户中心 → API安全 → 设置APIv3密钥
注意：必须是32位字符
```

---

## 🔐 微信登录配置（2个）

```
变量名：WECHAT_APP_ID
说明：微信网站应用APPID（不是小程序APPID）
示例：wx0987654321fedcba
获取：微信开放平台 → 网站应用 → 查看详情
```

```
变量名：WECHAT_APP_SECRET
说明：微信网站应用密钥
示例：abcdef1234567890abcdef1234567890
获取：微信开放平台 → 网站应用 → 查看详情
注意：需要重置后才能看到完整密钥
```

---

## 🔐 腾讯云配置（1个）

```
变量名：NEXT_PUBLIC_WECHAT_CLOUDBASE_ID
说明：腾讯云CloudBase环境ID
值：cloudbase-1gnip2iaa08260e5
获取：已配置 ✅
注意：这个已经在代码里了，确保Vercel也配置
```

---

## 🔐 其他已配置的变量（确认）

### **Supabase（2个）：**
```
NEXT_PUBLIC_SUPABASE_URL=https://ykirhilnbvsanqyenusf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（您已有）
```

### **支付宝（3个）：**
```
NEXT_PUBLIC_ALIPAY_APP_ID=2021005199628151
ALIPAY_PRIVATE_KEY=您的支付宝私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
```

### **Stripe（2个）：**
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **PayPal（3个）：**
```
PAYPAL_CLIENT_ID=您的PayPal Client ID
PAYPAL_CLIENT_SECRET=您的PayPal Secret
PAYPAL_MODE=sandbox
```

---

## ✅ 配置完成检查清单

- [ ] 微信支付6个变量全部添加
- [ ] 微信登录2个变量全部添加
- [ ] 腾讯云ID已配置
- [ ] 点击"Save"保存
- [ ] 重新部署应用
- [ ] 测试微信支付功能
- [ ] 测试微信登录功能

---

## 📞 需要帮助？

**常见问题：**

**Q1: 微信支付私钥太长怎么办？**
A: 可以将私钥内容中的换行替换为`\n`，变成一行字符串

**Q2: 环境变量保存后不生效？**
A: 需要重新部署应用才会生效

**Q3: 如何验证配置成功？**
A: 查看应用日志，应该不会有"微信支付未配置"的错误

---

**配置完成后告知，我们可以进行测试！** ✅

