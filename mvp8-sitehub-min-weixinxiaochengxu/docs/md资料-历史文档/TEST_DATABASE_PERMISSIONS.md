# 🔍 测试数据库权限问题

## 问题分析
- ✅ 云函数调用成功
- ✅ 支付参数生成正常
- ❌ 数据库记录创建失败
- 🔍 可能原因：数据库权限问题或集合字段问题

## 🧪 数据库权限测试

### 测试1：直接数据库操作
在微信开发者工具控制台执行：

```javascript
// 测试直接数据库操作
(async () => {
  try {
    console.log('🔍 测试直接数据库操作...')
    
    // 1. 测试添加记录
    const addResult = await wx.cloud.database().collection('sitehub_subscriptions').add({
      data: {
        plan_type: 'test',
        status: 'pending',
        amount: 19.99,
        created_at: new Date(),
        test: true
      }
    })
    
    console.log('📊 添加记录结果:', addResult)
    
    // 2. 测试查询记录
    const queryResult = await wx.cloud.database().collection('sitehub_subscriptions').get()
    console.log('📊 查询记录结果:', queryResult.data)
    
    // 3. 测试删除测试记录
    if (addResult._id) {
      await wx.cloud.database().collection('sitehub_subscriptions').doc(addResult._id).remove()
      console.log('✅ 测试记录已删除')
    }
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error)
    
    if (error.errCode === -502003) {
      console.log('⚠️ 权限不足，需要设置数据库权限')
    } else if (error.errCode === -502005) {
      console.log('⚠️ 集合不存在')
    }
  }
})()
```

### 测试2：云函数数据库操作
```javascript
// 测试云函数数据库操作
(async () => {
  try {
    console.log('🔍 测试云函数数据库操作...')
    
    const result = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: {
        action: 'testDatabase'
      }
    })
    
    console.log('📊 云函数数据库测试结果:', result.result)
    
  } catch (error) {
    console.error('❌ 云函数数据库测试失败:', error)
  }
})()
```

## 🔧 数据库权限设置

### 在微信开发者工具中设置权限：
1. 打开 "云开发" 控制台
2. 点击 "数据库"
3. 找到 `sitehub_subscriptions` 集合
4. 点击 "权限设置"
5. 设置为 "所有用户可读写"

### 或者通过代码设置权限：
```javascript
// 设置数据库权限
(async () => {
  try {
    // 注意：这个操作需要在云函数中执行
    console.log('🔧 设置数据库权限...')
    
    // 这里需要在云函数中调用数据库权限设置API
    // 具体实现需要根据微信云开发的最新API
    
  } catch (error) {
    console.error('❌ 权限设置失败:', error)
  }
})()
```

## 🔧 修复方案

### 方案1：检查集合权限
1. 在微信开发者工具中检查集合权限
2. 确保权限设置为"所有用户可读写"
3. 重新测试数据库操作

### 方案2：重新创建集合
如果权限设置正确但仍无法写入：
1. 删除现有集合
2. 重新创建集合
3. 设置正确权限

### 方案3：使用云函数创建记录
如果前端无法直接写入，使用云函数：
```javascript
// 在云函数中添加测试action
case 'testDatabase':
  try {
    const result = await db.collection('sitehub_subscriptions').add({
      data: {
        plan_type: 'test',
        status: 'pending',
        amount: 19.99,
        created_at: new Date(),
        test: true
      }
    })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
```

## 📋 检查清单

- [ ] 数据库权限设置正确
- [ ] 集合存在且可访问
- [ ] 云函数数据库操作正常
- [ ] 字段名称和类型正确
- [ ] 网络连接正常

## 🎯 下一步

1. 先运行数据库权限测试
2. 检查集合权限设置
3. 如果权限正常，检查云函数日志
4. 根据结果确定具体问题

---

**注意**: 数据库权限问题是微信小程序开发的常见问题，通常通过设置集合权限可以解决。





