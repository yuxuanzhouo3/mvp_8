/**
 * 检查是否存在重复的用户记录
 * 在Settings页面控制台执行
 */

(async function() {
  console.log('🔍 检查用户记录重复问题...\n')

  const userInfo = wx.getStorageSync('sitehub_userInfo')
  const db = wx.cloud.database()

  // 1. 查询所有该openid的用户记录
  console.log('1️⃣ 查询所有用户记录 (openid: ' + userInfo.openid + '):')

  const allUsers = await db.collection('sitehub_users')
    .where({ openid: userInfo.openid })
    .get()

  console.log(`   找到 ${allUsers.data.length} 条记录\n`)

  // 2. 显示每条记录的详情
  allUsers.data.forEach((user, index) => {
    console.log(`   记录 ${index + 1}:`)
    console.log(`   - _id: ${user._id}`)
    console.log(`   - userId: ${user.userId || '(未设置)'}`)
    console.log(`   - user_id: ${user.user_id || '(未设置)'}`)
    console.log(`   - is_pro: ${user.is_pro}`)
    console.log(`   - subscription_status: ${user.subscription_status}`)
    console.log(`   - created_at: ${user.created_at}`)
    console.log(`   - last_login: ${user.last_login}`)
    console.log('')
  })

  // 3. 查询订阅记录
  console.log('2️⃣ 查询订阅记录:')

  const subscriptions = await db.collection('sitehub_subscriptions')
    .where({ user_openid: userInfo.openid })
    .get()

  console.log(`   找到 ${subscriptions.data.length} 条订阅记录\n`)

  subscriptions.data.forEach((sub, index) => {
    console.log(`   订阅 ${index + 1}:`)
    console.log(`   - _id: ${sub._id}`)
    console.log(`   - user_openid: ${sub.user_openid}`)
    console.log(`   - user_id: ${sub.user_id || '(未设置)'}`)
    console.log(`   - status: ${sub.status}`)
    console.log(`   - plan_type: ${sub.plan_type}`)
    console.log(`   - current_period_end: ${sub.current_period_end}`)
    console.log('')
  })

  // 4. 查询订单记录
  console.log('3️⃣ 查询订单记录:')

  const orders = await db.collection('orders')
    .where({ openid: userInfo.openid })
    .get()

  console.log(`   找到 ${orders.data.length} 条订单记录\n`)

  orders.data.forEach((order, index) => {
    console.log(`   订单 ${index + 1}:`)
    console.log(`   - _id: ${order._id}`)
    console.log(`   - out_trade_no: ${order.out_trade_no}`)
    console.log(`   - status: ${order.status}`)
    console.log(`   - total_fee: ${order.total_fee}`)
    console.log(`   - created_at: ${order.created_at}`)
    console.log('')
  })

  // 5. 诊断结论
  console.log('\n📊 诊断结论:')

  if (allUsers.data.length > 1) {
    console.log('   🔴 发现重复用户记录！')
    console.log(`   同一个openid有 ${allUsers.data.length} 条用户记录`)
    console.log('   这会导致每次登录可能找到不同的记录')
    console.log('\n   建议：合并重复记录，只保留一条')
  } else if (allUsers.data.length === 1) {
    console.log('   ✅ 只有一条用户记录')

    const user = allUsers.data[0]
    if (!user.userId && !user.user_id) {
      console.log('   ⚠️ 但是缺少 userId 字段')
      console.log('   这会导致每次调用getMe时生成新的userId')
    }

    if (subscriptions.data.length === 0) {
      console.log('   ⚠️ 没有找到订阅记录')
      console.log('   可能订阅创建失败，或者user_openid不匹配')
    } else {
      const activeSub = subscriptions.data.find(s => s.status === 'active')
      if (activeSub) {
        console.log('   ✅ 找到有效订阅')
        if (user.is_pro !== true) {
          console.log('   🔴 但是用户表的is_pro不是true！')
          console.log('   需要更新sitehub_users表')
        }
      } else {
        console.log('   ⚠️ 订阅状态不是active')
      }
    }
  } else {
    console.log('   🔴 没有找到用户记录！')
    console.log('   用户数据可能被删除或从未创建')
  }
})()
