# 🔧 微信支付配置指南

## 📋 需要配置的参数

为了启用真实的微信支付，需要在云函数环境变量中配置以下参数：

### 1. 微信小程序 AppID
```bash
WECHAT_APPID=wx1234567890abcdef
```
- 从微信公众平台获取
- 用于标识你的小程序

### 2. 微信支付商户号
```bash
WECHAT_MCH_ID=1234567890
```
- 从微信支付商户平台获取
- 用于标识你的商户账户

### 3. 微信支付API密钥
```bash
WECHAT_API_KEY=your_api_key_32_chars_long_123456
```
- 从微信支付商户平台获取
- 用于签名验证
- 必须是32位字符串

### 4. 支付回调URL
```bash
NOTIFY_URL=https://your-domain.com
```
- 支付成功后微信会回调的URL
- 需要是HTTPS地址

## 🚀 配置步骤

### 步骤1：获取微信支付参数
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 获取小程序的 AppID
3. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
4. 获取商户号 (MCH_ID)
5. 设置API密钥 (API_KEY)

### 步骤2：配置云函数环境变量
在微信开发者工具中：
1. 打开 "云开发" 控制台
2. 点击 "云函数"
3. 找到 `wechatPaySubscription` 函数
4. 点击 "配置"
5. 添加环境变量：
   ```
   WECHAT_APPID=你的AppID
   WECHAT_MCH_ID=你的商户号
   WECHAT_API_KEY=你的API密钥
   NOTIFY_URL=你的回调URL
   ```

### 步骤3：重新部署云函数
```bash
1. 右键 cloudfunctions/wechatPaySubscription 文件夹
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成
```

## 🧪 测试步骤

### 1. 测试支付参数生成
```javascript
// 在微信开发者工具控制台执行
(async () => {
  try {
    console.log('🧪 测试支付参数生成...')
    
    const result = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: {
        action: 'createSubscription',
        planType: 'personal',
        billingCycle: 'monthly',
        userInfo: {
          openid: 'test_openid_001',
          nickName: '测试用户'
        }
      }
    })
    
    console.log('📊 支付参数:', result.result.data.paymentParams)
    
    // 检查支付参数是否完整
    const params = result.result.data.paymentParams
    const requiredFields = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign']
    const missingFields = requiredFields.filter(field => !params[field])
    
    if (missingFields.length === 0) {
      console.log('✅ 支付参数完整')
    } else {
      console.error('❌ 缺少支付参数:', missingFields)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
})()
```

### 2. 测试真实支付流程
1. 在小程序中点击 "升级 Pro 会员"
2. 选择套餐并点击 "立即订阅"
3. 应该弹出微信支付界面
4. 完成支付流程

## 🔍 常见问题

### 问题1: "调用支付 JSAPI 缺少参数"
```bash
原因：支付参数不完整或格式错误
解决：
1. 检查云函数返回的支付参数
2. 确认所有必需参数都存在
3. 验证参数格式是否正确
```

### 问题2: "商户号不存在"
```bash
原因：WECHAT_MCH_ID 配置错误
解决：
1. 检查商户号是否正确
2. 确认商户号与AppID匹配
3. 重新配置环境变量
```

### 问题3: "签名验证失败"
```bash
原因：WECHAT_API_KEY 配置错误
解决：
1. 检查API密钥是否正确
2. 确认密钥长度是32位
3. 重新生成API密钥
```

### 问题4: "AppID不匹配"
```bash
原因：WECHAT_APPID 配置错误
解决：
1. 检查AppID是否正确
2. 确认AppID与小程序匹配
3. 重新配置环境变量
```

## 📋 验证清单

- [ ] 微信支付参数配置完成
- [ ] 云函数环境变量设置正确
- [ ] 云函数重新部署成功
- [ ] 支付参数生成测试通过
- [ ] 真实支付流程测试通过
- [ ] 支付回调处理正常

## 🎯 下一步

配置完成后：
1. ✅ 在开发者工具中测试支付参数生成
2. 🔄 在真机上测试真实支付流程
3. 📱 测试支付成功后的订阅状态
4. 🚀 部署到生产环境

---

**注意**: 微信支付需要在真机上测试，开发者工具无法完全模拟支付流程。





