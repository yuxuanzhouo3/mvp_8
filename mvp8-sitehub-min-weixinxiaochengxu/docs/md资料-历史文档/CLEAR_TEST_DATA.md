# 🗑️ 清除测试数据指南

## ✅ 已添加清除测试数据功能

我已经在云函数中添加了 `clearTestData` 功能，可以一键清除所有测试订阅数据。

## 🚀 使用步骤

### 步骤1：重新部署云函数 ⚠️ **必须先执行**

```
1. 打开微信开发者工具
2. 找到 cloudfunctions/wechatPaySubscription 文件夹
3. 右键点击 wechatPaySubscription
4. 选择"上传并部署：云端安装依赖"
5. 等待部署完成（约1-2分钟）
```

### 步骤2：运行清除脚本

在真机微信小程序的控制台运行：

```javascript
(async () => {
  try {
    console.log('🔧 清除测试数据...')
    
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    
    if (!userInfo) {
      console.error('❌ 未登录')
      return
    }
    
    console.log('👤 用户OpenID:', userInfo.openid)
    
    const res = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: {
        action: 'clearTestData',
        userInfo: userInfo
      }
    })
    
    console.log('📊 清除结果:', res.result)
    
    if (res.result.success) {
      console.log('✅ 测试数据已清除')
      console.log('📋 清除详情:')
      console.log('  - 删除订阅记录:', res.result.data.subscriptionsRemoved)
      console.log('  - 删除订阅历史:', res.result.data.historyRemoved)
      console.log('  - 更新用户记录:', res.result.data.usersUpdated)
      console.log('  - 更新订单记录:', res.result.data.ordersUpdated)
      
      // 更新本地状态
      userInfo.pro = false
      userInfo.isPro = false
      wx.setStorageSync('sitehub_userInfo', userInfo)
      
      const app = getApp()
      if (app.globalData.userInfo) {
        app.globalData.userInfo.pro = false
        app.globalData.userInfo.isPro = false
      }
      
      console.log('💡 现在可以重新测试支付了')
      console.log('🔄 即将刷新页面...')
      
      // 刷新页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/settings/settings'
        })
      }, 2000)
    } else {
      console.error('❌ 清除失败:', res.result.error)
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error)
  }
})()
```

## 🎯 这个脚本会做什么？

1. ✅ **删除所有订阅记录**（`sitehub_subscriptions` 表）
2. ✅ **删除订阅历史**（`sitehub_subscription_history` 表）
3. ✅ **更新用户Pro状态为false**（`sitehub_users` 表）
4. ✅ **更新订单状态为已取消**（`orders` 表）
5. ✅ **更新本地缓存**（Storage 和 globalData）
6. ✅ **刷新页面**（显示最新状态）

## 📋 预期结果

```
✅ 测试数据已清除
📋 清除详情:
  - 删除订阅记录: 1
  - 删除订阅历史: 0
  - 更新用户记录: 1
  - 更新订单记录: 0
💡 现在可以重新测试支付了
🔄 即将刷新页面...
```

## ⚠️ 注意事项

1. **必须先部署云函数**：如果不部署，会提示 `Unknown action`
2. **仅用于测试环境**：生产环境不应该使用此功能
3. **会清除所有测试数据**：包括订阅、历史、用户状态等

## 🔄 完整测试流程

### 1. 清除测试数据
```bash
运行清除脚本 → 等待完成 → 页面自动刷新
```

### 2. 验证清除结果
```javascript
// 验证会员状态
(async () => {
  const userInfo = wx.getStorageSync('sitehub_userInfo')
  console.log('👤 会员状态:', userInfo.pro ? '是会员' : '非会员')
  
  // 查询订阅记录
  const res = await wx.cloud.callFunction({
    name: 'wechatPaySubscription',
    data: {
      action: 'getSubscriptionStatus',
      userInfo: userInfo
    }
  })
  
  console.log('📊 订阅状态:', res.result)
})()
```

### 3. 测试支付
```bash
进入支付页面 → 选择套餐 → 点击支付 → 完成支付流程
```

## 🎉 现在可以做什么？

1. **部署云函数**（步骤1）
2. **运行清除脚本**（步骤2）
3. **重新测试支付**
4. **验证会员状态同步**

---

**立即部署云函数，然后运行清除脚本！** 🚀


