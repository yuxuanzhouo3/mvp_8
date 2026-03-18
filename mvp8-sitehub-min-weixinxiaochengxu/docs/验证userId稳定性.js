/**
 * 验证 userId 稳定性
 * 在任意页面控制台执行
 */

(async function() {
  console.log('🔍 开始验证 userId 稳定性...\n')

  const userInfo = wx.getStorageSync('sitehub_userInfo')

  if (!userInfo || !userInfo.openid) {
    console.log('❌ 用户未登录')
    return
  }

  console.log('📋 本地缓存信息:')
  console.log('  openid:', userInfo.openid)
  console.log('  userId:', userInfo.userId)
  console.log('  nickName:', userInfo.nickName)
  console.log('  isPro:', userInfo.isPro)
  console.log('')

  // 调用后端 getMe 接口
  console.log('📡 调用后端 getMe 接口...')

  try {
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'getMe',
        userInfo: userInfo
      }
    })

    if (result.result && result.result.success) {
      const me = result.result.data

      console.log('✅ 后端返回信息:')
      console.log('  userId:', me.userId)
      console.log('  openid:', me.openid)
      console.log('  entitlement.status:', me.entitlement.status)
      console.log('  entitlement.plan:', me.entitlement.plan)
      console.log('')

      // 验证 userId 一致性
      console.log('🔍 验证结果:')

      if (userInfo.userId === me.userId) {
        console.log('  ✅ userId 一致！')
        console.log(`     本地: ${userInfo.userId}`)
        console.log(`     后端: ${me.userId}`)
      } else {
        console.log('  ❌ userId 不一致！')
        console.log(`     本地: ${userInfo.userId}`)
        console.log(`     后端: ${me.userId}`)
        console.log('')
        console.log('  🔧 建议操作:')
        console.log('     1. 退出登录')
        console.log('     2. 清除缓存: wx.clearStorageSync()')
        console.log('     3. 重新登录')
      }

      console.log('')

      // 验证会员状态
      const localIsPro = userInfo.isPro || userInfo.pro || false
      const backendIsPro = me.entitlement.status === 'active'

      console.log('👑 会员状态:')
      console.log(`  本地: ${localIsPro}`)
      console.log(`  后端: ${backendIsPro}`)

      if (localIsPro === backendIsPro) {
        console.log('  ✅ 会员状态一致')
      } else {
        console.log('  ⚠️ 会员状态不一致')
        console.log('     需要刷新缓存')
      }

      console.log('')

      // 查询数据库验证
      console.log('📊 查询数据库验证...')

      const db = wx.cloud.database()

      // 查询用户记录
      const usersResult = await db.collection('sitehub_users')
        .where({ openid: userInfo.openid })
        .get()

      console.log(`  用户记录数量: ${usersResult.data.length}`)

      if (usersResult.data.length > 1) {
        console.log('  🔴 发现重复用户记录！')
        console.log('     需要运行修复脚本')
      } else if (usersResult.data.length === 1) {
        const dbUser = usersResult.data[0]
        console.log(`  数据库 userId: ${dbUser.userId || dbUser.user_id || '(未设置)'}`)
        console.log(`  数据库 is_pro: ${dbUser.is_pro}`)

        if (dbUser.userId === me.userId || dbUser.user_id === me.userId) {
          console.log('  ✅ 数据库 userId 与后端一致')
        } else {
          console.log('  ⚠️ 数据库 userId 与后端不一致')
        }
      } else {
        console.log('  ⚠️ 未找到用户记录')
      }

      // 查询订阅记录
      const subsResult = await db.collection('sitehub_subscriptions')
        .where({ user_openid: userInfo.openid })
        .get()

      console.log(`  订阅记录数量: ${subsResult.data.length}`)

      if (subsResult.data.length > 0) {
        const sub = subsResult.data[0]
        console.log(`  订阅 status: ${sub.status}`)
        console.log(`  订阅 user_id: ${sub.user_id || '(未设置)'}`)

        if (sub.user_id === me.userId) {
          console.log('  ✅ 订阅记录 userId 正确关联')
        } else {
          console.log('  🔴 订阅记录 userId 关联错误！')
          console.log(`     订阅的 user_id: ${sub.user_id}`)
          console.log(`     实际的 userId: ${me.userId}`)
          console.log('     需要运行修复脚本')
        }
      } else {
        console.log('  ℹ️ 没有订阅记录（可能是免费用户）')
      }

      console.log('')
      console.log('✅ 验证完成')

    } else {
      console.log('❌ getMe 接口调用失败:', result.result?.error)
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error)
  }
})()
