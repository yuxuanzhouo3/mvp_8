/**
 * 诊断后端返回的会员状态
 * 在Settings页面控制台执行
 */

(async function() {
  console.log('🔍 诊断后端返回数据...\n')
  
  const userInfo = wx.getStorageSync('sitehub_userInfo')
  
  // 1. 检查数据库原始数据
  console.log('1️⃣ 数据库原始数据:')
  const db = wx.cloud.database()
  
  const userResult = await db.collection('sitehub_users')
    .where({ openid: userInfo.openid })
    .get()
  
  const dbUser = userResult.data[0]
  console.log('   is_pro:', dbUser.is_pro)
  console.log('   subscription_status:', dbUser.subscription_status)
  console.log('   subscription_expires_at:', dbUser.subscription_expires_at)
  console.log('')
  
  // 2. 检查后端API返回
  console.log('2️⃣ 后端API返回（/me接口）:')
  const apiResult = await wx.cloud.callFunction({
    name: 'callAIGateway',
    data: {
      action: 'getMe',
      userInfo: userInfo
    }
  })
  
  console.log('   完整返回:', apiResult.result)
  
  if (apiResult.result && apiResult.result.data) {
    const me = apiResult.result.data
    console.log('\n   用户画像:')
    console.log('   - userId:', me.userId)
    console.log('   - entitlement.status:', me.entitlement?.status)
    console.log('   - entitlement.plan:', me.entitlement?.plan)
    console.log('   - entitlement.expiresAt:', me.entitlement?.expiresAt)
  }
  
  console.log('\n📊 结论:')
  if (dbUser.is_pro === true && apiResult.result?.data?.entitlement?.status === 'active') {
    console.log('   ✅ 数据库正确，后端API也正确')
    console.log('   问题在前端缓存或状态更新')
  } else if (dbUser.is_pro === true && apiResult.result?.data?.entitlement?.status !== 'active') {
    console.log('   🔴 数据库正确，但后端API返回错误！')
    console.log('   需要检查 callAIGateway 云函数的逻辑')
  } else {
    console.log('   ⚠️ 数据库状态异常')
  }
})()
