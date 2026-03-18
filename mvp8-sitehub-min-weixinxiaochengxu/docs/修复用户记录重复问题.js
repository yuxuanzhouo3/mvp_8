/**
 * 修复用户记录重复和userId变化问题
 * 在Settings页面控制台执行
 */

(async function() {
  console.log('🔧 开始修复用户记录问题...\n')

  const userInfo = wx.getStorageSync('sitehub_userInfo')
  const db = wx.cloud.database()

  // 辅助函数：生成稳定的userId（与云函数相同的算法）
  function generateStableUserId(openid) {
    if (!openid || typeof openid !== 'string') {
      return Math.floor(Math.random() * 900000) + 100000
    }
    let hash = 0
    for (let i = 0; i < openid.length; i++) {
      hash = (hash * 131 + openid.charCodeAt(i)) % 1000000
    }
    const normalized = (hash % 900000) + 100000
    return normalized
  }

  // 步骤1: 查询所有该openid的用户记录
  console.log('📋 步骤1: 查询所有用户记录')
  const allUsers = await db.collection('sitehub_users')
    .where({ openid: userInfo.openid })
    .get()

  console.log(`   找到 ${allUsers.data.length} 条用户记录\n`)

  if (allUsers.data.length === 0) {
    console.log('❌ 错误：没有找到用户记录')
    return
  }

  // 步骤2: 生成永久的userId
  const permanentUserId = generateStableUserId(userInfo.openid)
  console.log(`🔑 步骤2: 生成永久userId: ${permanentUserId}\n`)

  // 步骤3: 选择主记录（最早创建的，或有is_pro=true的）
  console.log('🎯 步骤3: 选择主记录')

  let masterRecord = allUsers.data[0]

  // 优先选择is_pro=true的记录
  const proRecord = allUsers.data.find(u => u.is_pro === true)
  if (proRecord) {
    masterRecord = proRecord
    console.log('   选择了is_pro=true的记录作为主记录')
  } else {
    // 否则选择最早创建的
    allUsers.data.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
      return dateA - dateB
    })
    masterRecord = allUsers.data[0]
    console.log('   选择了最早创建的记录作为主记录')
  }

  console.log(`   主记录ID: ${masterRecord._id}`)
  console.log(`   is_pro: ${masterRecord.is_pro}`)
  console.log(`   subscription_status: ${masterRecord.subscription_status}\n`)

  // 步骤4: 查询订阅记录
  console.log('📊 步骤4: 查询订阅记录')
  const subscriptions = await db.collection('sitehub_subscriptions')
    .where({ user_openid: userInfo.openid })
    .orderBy('created_at', 'desc')
    .get()

  console.log(`   找到 ${subscriptions.data.length} 条订阅记录\n`)

  // 查找有效订阅
  const activeSub = subscriptions.data.find(s => s.status === 'active')
  const pendingSub = subscriptions.data.find(s => s.status === 'pending')
  const latestSub = subscriptions.data[0] // 最新的订阅

  let hasActiveSubscription = false
  let subscriptionExpiry = null

  if (activeSub) {
    hasActiveSubscription = true
    subscriptionExpiry = activeSub.current_period_end
    console.log('   ✅ 找到active订阅')
  } else if (latestSub && latestSub.status === 'pending') {
    console.log('   ⚠️ 最新订阅状态是pending，需要激活')
    // 将pending改为active
    await db.collection('sitehub_subscriptions')
      .doc(latestSub._id)
      .update({
        data: {
          status: 'active',
          updated_at: new Date()
        }
      })
    hasActiveSubscription = true
    subscriptionExpiry = latestSub.current_period_end
    console.log('   ✅ 已将pending订阅激活')
  }

  console.log('')

  // 步骤5: 更新主记录
  console.log('🔄 步骤5: 更新主记录')

  const updates = {
    userId: permanentUserId,
    user_id: permanentUserId, // 兼容字段
    updated_at: new Date()
  }

  // 如果有active订阅，更新会员状态
  if (hasActiveSubscription) {
    updates.is_pro = true
    updates.subscription_status = 'active'
    updates.subscription_expires_at = subscriptionExpiry
    console.log('   ✅ 设置会员状态: is_pro=true')
  } else {
    console.log('   ⚠️ 没有有效订阅，保持原状态')
  }

  await db.collection('sitehub_users')
    .doc(masterRecord._id)
    .update({ data: updates })

  console.log(`   ✅ 主记录已更新 (userId: ${permanentUserId})\n`)

  // 步骤6: 删除重复记录
  if (allUsers.data.length > 1) {
    console.log('🗑️ 步骤6: 删除重复记录')

    for (const user of allUsers.data) {
      if (user._id !== masterRecord._id) {
        await db.collection('sitehub_users')
          .doc(user._id)
          .remove()
        console.log(`   ✅ 删除重复记录: ${user._id}`)
      }
    }
    console.log('')
  }

  // 步骤7: 更新所有订阅记录的user_id字段
  console.log('🔗 步骤7: 更新订阅记录关联')

  for (const sub of subscriptions.data) {
    await db.collection('sitehub_subscriptions')
      .doc(sub._id)
      .update({
        data: {
          user_id: permanentUserId,
          updated_at: new Date()
        }
      })
  }

  console.log(`   ✅ 已更新 ${subscriptions.data.length} 条订阅记录的user_id\n`)

  // 步骤8: 更新本地缓存
  console.log('💾 步骤8: 更新本地缓存')

  const updatedUserInfo = {
    ...userInfo,
    userId: permanentUserId,
    isPro: hasActiveSubscription
  }

  wx.setStorageSync('sitehub_userInfo', updatedUserInfo)
  console.log('   ✅ 本地缓存已更新\n')

  // 步骤9: 验证修复结果
  console.log('✅ 步骤9: 验证修复结果')

  const verifyUser = await db.collection('sitehub_users')
    .where({ openid: userInfo.openid })
    .get()

  console.log(`   用户记录数量: ${verifyUser.data.length}`)

  if (verifyUser.data.length === 1) {
    const user = verifyUser.data[0]
    console.log(`   userId: ${user.userId}`)
    console.log(`   is_pro: ${user.is_pro}`)
    console.log(`   subscription_status: ${user.subscription_status}`)
    console.log(`   subscription_expires_at: ${user.subscription_expires_at}`)

    if (user.userId === permanentUserId && hasActiveSubscription && user.is_pro === true) {
      console.log('\n🎉 修复成功！')
      console.log(`   永久userId: ${permanentUserId}`)
      console.log('   会员状态: 已激活')
      console.log('\n请刷新页面查看效果')
    } else if (user.userId === permanentUserId) {
      console.log('\n✅ userId已修复')
      console.log('   但会员状态需要支付后才会激活')
    } else {
      console.log('\n⚠️ userId可能未正确设置')
    }
  } else {
    console.log('\n⚠️ 仍有重复记录，请重新运行脚本')
  }
})()
