# 🚀 一键数据库设置指南

## 方法一：使用云函数自动设置（推荐）

### 步骤1：部署云函数
```bash
1. 在微信开发者工具中右键 cloudfunctions/setupDatabase 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
```

### 步骤2：执行一键设置
在微信开发者工具的控制台中运行以下代码：

```javascript
// 一键设置数据库集合和价格配置
(async () => {
  try {
    console.log('🚀 开始一键设置数据库...')
    
    // 调用云函数设置数据库
    const result = await wx.cloud.callFunction({
      name: 'setupDatabase',
      data: {
        createSampleData: true // 是否创建示例数据
      }
    })
    
    console.log('✅ 数据库设置结果:', result.result)
    
    if (result.result.success) {
      console.log('🎉 数据库设置成功！')
      console.log('📊 设置结果详情:')
      
      result.result.results.forEach(item => {
        console.log(`\n📋 ${item.type}:`)
        item.results.forEach(r => {
          if (r.action === 'created') {
            console.log(`  ✅ 创建: ${r.plan} - ¥${r.amount}`)
          } else if (r.action === 'updated') {
            console.log(`  🔄 更新: ${r.plan} - ¥${r.amount}`)
          } else if (r.action === 'failed') {
            console.log(`  ❌ 失败: ${r.plan} - ${r.error}`)
          }
        })
      })
      
      // 验证设置结果
      await verifyDatabaseSetup()
      
    } else {
      console.error('❌ 数据库设置失败:', result.result.error)
    }
    
  } catch (error) {
    console.error('❌ 设置过程出错:', error)
  }
})()

// 验证数据库设置
async function verifyDatabaseSetup() {
  try {
    console.log('\n🔍 验证数据库设置...')
    
    // 验证价格配置
    const pricingResult = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: { action: 'getPricing' }
    })
    
    if (pricingResult.result.success) {
      console.log('✅ 价格配置验证成功')
      console.log('💰 价格配置:', pricingResult.result.data)
    } else {
      console.error('❌ 价格配置验证失败')
    }
    
    // 验证集合是否存在
    const db = wx.cloud.database()
    
    const collections = [
      'sitehub_pricing',
      'sitehub_subscriptions', 
      'sitehub_subscription_history',
      'sitehub_payments'
    ]
    
    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).limit(1).get()
        console.log(`✅ 集合 ${collectionName} 验证成功 (${result.data.length} 条记录)`)
      } catch (error) {
        console.log(`⚠️ 集合 ${collectionName} 可能不存在或权限不足`)
      }
    }
    
    console.log('\n🎉 数据库设置验证完成！')
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error)
  }
}
```

## 方法二：手动创建集合（备用方案）

如果云函数方法不工作，可以手动创建集合：

### 1. 在微信开发者工具中创建集合

打开微信开发者工具 → 云开发 → 数据库，手动创建以下集合：

#### sitehub_pricing 集合
```javascript
// 创建集合后，添加以下文档：
{
  "plan_type": "personal",
  "billing_cycle": "monthly", 
  "amount": 19.99,
  "currency": "CNY",
  "is_active": true,
  "created_at": "2025-01-11T00:00:00.000Z",
  "updated_at": "2025-01-11T00:00:00.000Z"
}

{
  "plan_type": "personal",
  "billing_cycle": "yearly",
  "amount": 168.00,
  "currency": "CNY", 
  "is_active": true,
  "created_at": "2025-01-11T00:00:00.000Z",
  "updated_at": "2025-01-11T00:00:00.000Z"
}

{
  "plan_type": "team",
  "billing_cycle": "monthly",
  "amount": 299.99,
  "currency": "CNY",
  "is_active": true,
  "created_at": "2025-01-11T00:00:00.000Z", 
  "updated_at": "2025-01-11T00:00:00.000Z"
}

{
  "plan_type": "team",
  "billing_cycle": "yearly",
  "amount": 2520.00,
  "currency": "CNY",
  "is_active": true,
  "created_at": "2025-01-11T00:00:00.000Z",
  "updated_at": "2025-01-11T00:00:00.000Z"
}
```

#### sitehub_subscriptions 集合
```javascript
// 创建集合即可，无需添加示例数据
// 集合结构会在用户订阅时自动创建
```

#### sitehub_subscription_history 集合
```javascript
// 创建集合即可，无需添加示例数据
// 集合结构会在订阅操作时自动创建
```

#### sitehub_payments 集合
```javascript
// 创建集合即可，无需添加示例数据
// 集合结构会在支付时自动创建
```

### 2. 设置集合权限

为每个集合设置以下权限：

```javascript
// 读取权限
"auth.openid == resource._openid || auth != null"

// 写入权限  
"auth.openid == resource._openid"

// 创建权限
"auth != null"

// 更新权限
"auth.openid == resource._openid || auth != null"

// 删除权限
"auth != null"
```

## 验证设置结果

运行以下代码验证设置是否成功：

```javascript
// 验证数据库设置
(async () => {
  try {
    console.log('🔍 验证数据库设置...')
    
    const db = wx.cloud.database()
    
    // 1. 验证价格配置
    const pricing = await db.collection('sitehub_pricing').get()
    console.log('💰 价格配置:', pricing.data.length, '条记录')
    pricing.data.forEach(p => {
      console.log(`  - ${p.plan_type} ${p.billing_cycle}: ¥${p.amount}`)
    })
    
    // 2. 验证集合存在
    const collections = [
      'sitehub_pricing',
      'sitehub_subscriptions',
      'sitehub_subscription_history', 
      'sitehub_payments'
    ]
    
    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).limit(1).get()
        console.log(`✅ ${collectionName}: 集合存在`)
      } catch (error) {
        console.log(`❌ ${collectionName}: 集合不存在或权限不足`)
      }
    }
    
    // 3. 测试订阅云函数
    const testResult = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: { action: 'getPricing' }
    })
    
    if (testResult.result.success) {
      console.log('✅ 订阅云函数测试成功')
    } else {
      console.error('❌ 订阅云函数测试失败:', testResult.result.error)
    }
    
    console.log('🎉 数据库设置验证完成！')
    
  } catch (error) {
    console.error('❌ 验证失败:', error)
  }
})()
```

## 常见问题解决

### 问题1：云函数调用失败
```bash
解决方案：
1. 确保云函数已正确部署
2. 检查云开发环境ID配置
3. 确认云函数权限设置
```

### 问题2：集合权限错误
```bash
解决方案：
1. 检查集合权限配置
2. 确认用户登录状态
3. 调整权限规则
```

### 问题3：价格配置不生效
```bash
解决方案：
1. 检查价格数据格式
2. 确认 is_active 字段为 true
3. 验证集合名称拼写
```

## 下一步

数据库设置完成后，你可以：

1. **测试订阅功能**: 在支付页面测试订阅创建
2. **测试管理功能**: 在设置页面测试订阅管理
3. **部署定时任务**: 配置自动续费触发器
4. **设置管理后台**: 部署Next.js管理后台

---

**注意**: 如果遇到任何问题，请检查微信开发者工具的控制台日志，或联系技术支持。






