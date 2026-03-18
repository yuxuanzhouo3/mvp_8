# 🧪 SSOT 30分钟极速定位测试

## 🎯 目标：验证单一事实源（SSOT）架构

### 测试前准备
1. 部署更新后的 `callAIGateway` 云函数
2. 编译小程序
3. 真机调试

---

## 📊 测试脚本1：基础 /me 接口测试

```javascript
// 测试1：基础 /me 接口
(async () => {
  try {
    console.log('🧪 测试1：基础 /me 接口')
    console.log('==========================================')
    
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo?.openid) {
      console.log('❌ 用户信息不存在，请先登录')
      return
    }
    
    const traceId = `test1-${Date.now()}`
    
    // 探针1：前端发起 /me 前
    console.log('[FE] call /me', {
      traceId: traceId,
      userId: userInfo.userId,
      openid: userInfo.openid
    })
    
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'getMe',
        userInfo: userInfo,
        traceId: traceId
      }
    })
    
    if (result.result && result.result.success) {
      const me = result.result.data
      
      console.log('✅ /me 接口测试成功:')
      console.log('  - traceId:', me.traceId)
      console.log('  - userId:', me.userId)
      console.log('  - openid:', me.openid)
      console.log('  - nickname:', me.profile.nickname)
      console.log('  - plan:', me.entitlement.plan)
      console.log('  - status:', me.entitlement.status)
      console.log('  - expiresAt:', me.entitlement.expiresAt)
      console.log('  - version:', me.entitlement.version)
      
      // 检查关键字段
      if (!me.openid || me.openid === 'undefined') {
        console.log('❌ 错误：openid 丢失！')
      } else {
        console.log('✅ openid 正常')
      }
      
      if (!me.userId) {
        console.log('❌ 错误：userId 丢失！')
      } else {
        console.log('✅ userId 正常')
      }
      
    } else {
      console.log('❌ /me 接口测试失败:', result.result?.error)
    }
    
  } catch (error) {
    console.error('❌ 测试1异常:', error)
  }
})()
```

---

## 📊 测试脚本2：前端状态机测试

```javascript
// 测试2：前端状态机
(async () => {
  try {
    console.log('🧪 测试2：前端状态机')
    console.log('==========================================')
    
    const { getUserSession } = require('../../utils/userSession')
    const userSession = getUserSession()
    
    // 强制刷新
    console.log('🔄 强制刷新用户画像...')
    const me = await userSession.fetchMe(true)
    
    if (me) {
      console.log('✅ 前端状态机测试成功:')
      console.log('  - traceId:', me.traceId)
      console.log('  - userId:', me.userId)
      console.log('  - openid:', me.openid)
      console.log('  - nickname:', me.profile.nickname)
      console.log('  - plan:', me.entitlement.plan)
      console.log('  - status:', me.entitlement.status)
      
      // 获取状态
      const state = userSession.getState()
      console.log('📊 当前状态:')
      console.log('  - isLoggedIn:', state.isLoggedIn)
      console.log('  - isPro:', state.isPro)
      console.log('  - plan:', state.plan)
      console.log('  - status:', state.status)
      
      // 检查本地存储同步
      const localUserInfo = wx.getStorageSync('sitehub_userInfo')
      console.log('📦 本地存储检查:')
      console.log('  - userId:', localUserInfo.userId)
      console.log('  - openid:', localUserInfo.openid)
      console.log('  - pro:', localUserInfo.pro)
      console.log('  - status:', localUserInfo.status)
      
      // 检查全局数据同步
      const app = getApp()
      console.log('🌐 全局数据检查:')
      console.log('  - userId:', app.globalData.userInfo?.userId)
      console.log('  - openid:', app.globalData.userInfo?.openid)
      console.log('  - pro:', app.globalData.userInfo?.pro)
      
    } else {
      console.log('❌ 前端状态机测试失败')
    }
    
  } catch (error) {
    console.error('❌ 测试2异常:', error)
  }
})()
```

---

## 📊 测试脚本3：Settings页面数据一致性测试

```javascript
// 测试3：Settings页面数据一致性
(async () => {
  try {
    console.log('🧪 测试3：Settings页面数据一致性')
    console.log('==========================================')
    
    // 获取当前页面
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    
    if (currentPage.route !== 'pages/settings/settings') {
      console.log('⚠️ 请先进入Settings页面')
      return
    }
    
    // 获取页面数据
    const pageUserInfo = currentPage.data.userInfo
    
    console.log('📄 Settings页面数据:')
    console.log('  - userId:', pageUserInfo.userId)
    console.log('  - openid:', pageUserInfo.openid)
    console.log('  - nickName:', pageUserInfo.nickName)
    console.log('  - pro:', pageUserInfo.pro)
    console.log('  - memberType:', pageUserInfo.memberType)
    console.log('  - memberStatus:', pageUserInfo.memberStatus)
    
    // 获取状态机数据
    const { getUserSession } = require('../../utils/userSession')
    const userSession = getUserSession()
    const state = userSession.getState()
    
    console.log('📊 状态机数据:')
    console.log('  - userId:', state.me?.userId)
    console.log('  - openid:', state.me?.openid)
    console.log('  - nickname:', state.me?.profile?.nickname)
    console.log('  - isPro:', state.isPro)
    console.log('  - plan:', state.plan)
    console.log('  - status:', state.status)
    
    // 检查一致性
    console.log('🔍 数据一致性检查:')
    const isUserIdMatch = pageUserInfo.userId === state.me?.userId
    const isOpenidMatch = pageUserInfo.openid === state.me?.openid
    const isProMatch = pageUserInfo.pro === state.isPro
    const isPlanMatch = pageUserInfo.memberType === state.plan
    
    console.log('  - userId 一致性:', isUserIdMatch ? '✅' : '❌')
    console.log('  - openid 一致性:', isOpenidMatch ? '✅' : '❌')
    console.log('  - pro 一致性:', isProMatch ? '✅' : '❌')
    console.log('  - plan 一致性:', isPlanMatch ? '✅' : '❌')
    
    if (isUserIdMatch && isOpenidMatch && isProMatch && isPlanMatch) {
      console.log('🎉 数据一致性验证通过！')
    } else {
      console.log('❌ 数据一致性验证失败！')
    }
    
  } catch (error) {
    console.error('❌ 测试3异常:', error)
  }
})()
```

---

## 📊 测试脚本4：探针日志验证

```javascript
// 测试4：探针日志验证
(async () => {
  try {
    console.log('🧪 测试4：探针日志验证')
    console.log('==========================================')
    console.log('请观察以下日志输出：')
    console.log('')
    console.log('1. [FE] call /me - 前端发起请求')
    console.log('2. [GW-IN] - API网关入口')
    console.log('3. [ENT-GET] - 履约读取')
    console.log('4. [GW-OUT] - /me返回')
    console.log('')
    console.log('开始调用...')
    
    const { getUserSession } = require('../../utils/userSession')
    const userSession = getUserSession()
    
    const me = await userSession.fetchMe(true)
    
    if (me) {
      console.log('')
      console.log('✅ 探针日志已完整输出')
      console.log('请检查上方日志是否包含所有探针标记')
    } else {
      console.log('❌ 调用失败')
    }
    
  } catch (error) {
    console.error('❌ 测试4异常:', error)
  }
})()
```

---

## 📊 测试脚本5：支付后状态更新测试

```javascript
// 测试5：支付后状态更新（需要在支付成功后运行）
(async () => {
  try {
    console.log('🧪 测试5：支付后状态更新')
    console.log('==========================================')
    console.log('⚠️ 请在支付成功后立即运行此测试')
    console.log('')
    
    // 等待3秒，让支付回调完成
    console.log('⏳ 等待3秒让支付回调完成...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 强制刷新用户画像
    console.log('🔄 强制刷新用户画像...')
    const { getUserSession } = require('../../utils/userSession')
    const userSession = getUserSession()
    const me = await userSession.fetchMe(true)
    
    if (me) {
      console.log('✅ 用户画像获取成功:')
      console.log('  - plan:', me.entitlement.plan)
      console.log('  - status:', me.entitlement.status)
      console.log('  - expiresAt:', me.entitlement.expiresAt)
      console.log('  - version:', me.entitlement.version)
      
      if (me.entitlement.status === 'active') {
        console.log('🎉 支付后状态更新成功！用户已成为会员')
        
        // 检查侧边栏显示
        const pages = getCurrentPages()
        const indexPage = pages.find(p => p.route === 'pages/index/index')
        if (indexPage) {
          console.log('📊 检查侧边栏显示:')
          console.log('  - userStatus:', indexPage.data.uiText?.userStatus)
          console.log('  - upgradeText:', indexPage.data.uiText?.upgradeText)
        }
        
      } else {
        console.log('⚠️ 用户状态未变为active，当前状态:', me.entitlement.status)
      }
      
    } else {
      console.log('❌ 获取用户画像失败')
    }
    
  } catch (error) {
    console.error('❌ 测试5异常:', error)
  }
})()
```

---

## 🎯 预期结果

### 测试1：基础 /me 接口
- ✅ 返回完整的用户画像
- ✅ openid 正常显示
- ✅ userId 正常显示
- ✅ entitlement 正常显示

### 测试2：前端状态机
- ✅ 用户画像正确获取
- ✅ 本地存储同步
- ✅ 全局数据同步
- ✅ 状态机状态正确

### 测试3：Settings页面数据一致性
- ✅ 页面数据与状态机数据一致
- ✅ userId 一致
- ✅ openid 一致
- ✅ pro 一致
- ✅ plan 一致

### 测试4：探针日志
- ✅ `[FE] call /me` 日志输出
- ✅ `[GW-IN]` 日志输出
- ✅ `[ENT-GET]` 日志输出
- ✅ `[GW-OUT]` 日志输出

### 测试5：支付后状态更新
- ✅ 支付成功后状态自动更新
- ✅ 用户变为会员
- ✅ 侧边栏显示正确

---

## 🔍 排错指南

### 如果 openid 丢失：
1. 检查 `[GW-IN]` 日志，看 openid 是否传入
2. 检查 `getUserInfoFromWeChatCloud` 函数是否正确读取数据库
3. 检查登录流程是否正确保存 openid

### 如果状态不更新：
1. 检查 `[ENT-GET]` 日志，看履约状态是否正确
2. 检查订阅数据库是否有记录
3. 检查支付回调是否正确写入数据库

### 如果页面显示不一致：
1. 检查前端状态机是否正确同步
2. 检查页面是否使用了旧的数据源
3. 检查是否调用了 `fetchMe(true)` 强制刷新

---

**请按顺序执行这些测试脚本，并记录结果！** 🚀





