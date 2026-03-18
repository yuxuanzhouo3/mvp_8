# 🔧 配置微信支付参数

## 📋 你的微信支付配置信息

根据你提供的信息：
- **AppID**: `wxf1aca21b5b79581d`
- **云开发ID**: `cloudbase-1gnip2iaa08260e5`
- **商户号**: `1694786758`
- **API密钥**: `mornsciencemornscience2025100705`

## 🚀 配置步骤

### 步骤1：在云函数中设置环境变量

在微信开发者工具中：

1. **打开云开发控制台**
   - 点击 "云开发" 按钮
   - 进入云开发控制台

2. **配置环境变量**
   - 点击 "云函数"
   - 找到 `wechatPaySubscription` 函数
   - 点击 "配置" 或 "环境变量"
   - 添加以下环境变量：

   ```
   WECHAT_APPID=wxf1aca21b5b79581d
   WECHAT_MCH_ID=1694786758
   WECHAT_API_KEY=mornsciencemornscience2025100705
   NOTIFY_URL=https://your-domain.com
   ```

### 步骤2：重新部署云函数

```bash
在微信开发者工具中：
1. 右键 cloudfunctions/wechatPaySubscription 文件夹
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成
```

### 步骤3：测试配置

在微信开发者工具控制台执行：

```javascript
// 测试支付参数生成
(async () => {
  try {
    console.log('🧪 测试微信支付配置...')
    
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
    
    console.log('📊 云函数返回:', result.result)
    
    if (result.result.success) {
      const paymentParams = result.result.data.paymentParams
      console.log('✅ 支付参数生成成功:')
      console.log('  - timeStamp:', paymentParams.timeStamp)
      console.log('  - nonceStr:', paymentParams.nonceStr)
      console.log('  - package:', paymentParams.package)
      console.log('  - signType:', paymentParams.signType)
      console.log('  - paySign:', paymentParams.paySign)
      
      // 检查参数完整性
      const requiredFields = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign']
      const missingFields = requiredFields.filter(field => !paymentParams[field])
      
      if (missingFields.length === 0) {
        console.log('🎉 所有支付参数完整，配置成功！')
      } else {
        console.error('❌ 缺少支付参数:', missingFields)
      }
    } else {
      console.error('❌ 支付参数生成失败:', result.result.error)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
})()
```

## 🔍 验证清单

- [ ] 云函数环境变量配置完成
- [ ] 云函数重新部署成功
- [ ] 支付参数生成测试通过
- [ ] 所有必需参数都存在
- [ ] 签名生成正常

## 🧪 真机测试

配置完成后，在真机上测试：

1. **生成预览二维码**
   - 在微信开发者工具中点击 "预览"
   - 用微信扫码打开小程序

2. **测试支付流程**
   - 登录小程序
   - 点击 "升级 Pro 会员"
   - 选择套餐并点击 "立即订阅"
   - 应该弹出真实的微信支付界面

3. **验证支付结果**
   - 完成支付后检查订阅状态
   - 确认用户Pro状态已更新

## 🚨 常见问题

### 问题1: "商户号不存在"
```bash
解决：
1. 确认商户号 1694786758 是否正确
2. 检查商户号是否已激活
3. 确认商户号与AppID匹配
```

### 问题2: "签名验证失败"
```bash
解决：
1. 确认API密钥 mornsciencemornscience2025100705 是否正确
2. 检查密钥长度是否为32位
3. 确认密钥没有多余的空格
```

### 问题3: "AppID不匹配"
```bash
解决：
1. 确认AppID wxf1aca21b5b79581d 是否正确
2. 检查AppID与小程序匹配
3. 确认环境变量配置正确
```

## 📱 下一步

配置完成后：
1. ✅ 在开发者工具中测试支付参数生成
2. 🔄 在真机上测试完整支付流程
3. 📱 验证支付成功后的订阅状态
4. 🚀 准备生产环境部署

---

**注意**: 微信支付必须在真机上测试，开发者工具无法完全模拟支付流程。





