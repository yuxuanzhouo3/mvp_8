/**
 * 🔍 会员身份诊断与验证脚本
 *
 * 使用方法：
 * 1. 进入Settings页面
 * 2. 打开开发者工具控制台
 * 3. 复制粘贴本文件的函数
 * 4. 执行相应的诊断或测试函数
 *
 * 创建时间: 2025-10-12
 */

// ============================================
// 🔍 第一部分：完整诊断函数
// ============================================

/**
 * 诊断会员身份显示的完整链路
 * 这是最重要的诊断函数，会检查所有关键环节
 */
async function diagnoseMembershipStatus() {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║       🔍 会员身份完整诊断开始                           ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')

  const results = {
    pageData: null,
    databaseUser: null,
    databaseSubscription: null,
    localStorage: null,
    cloudFunction: null,
    diagnosis: [],
    recommendations: []
  }

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo || !userInfo.openid) {
      console.error('❌ 未找到用户信息，请先登录')
      return
    }

    // 1️⃣ 检查页面数据
    console.log('1️⃣  检查页面数据状态\n' + '─'.repeat(60))
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    results.pageData = {
      isPro: currentPage.data.isPro,
      subscription: currentPage.data.subscription,
      userInfo: currentPage.data.userInfo
    }

    console.log('📊 页面数据:')
    console.log('  isPro:', results.pageData.isPro)
    console.log('  subscription:', results.pageData.subscription)
    console.log('  userInfo.isPro:', results.pageData.userInfo?.isPro)
    console.log('')

    // 2️⃣ 检查数据库 - sitehub_users表
    console.log('2️⃣  检查数据库用户表\n' + '─'.repeat(60))
    const userResult = await wx.cloud.database()
      .collection('sitehub_users')
      .where({ openid: userInfo.openid })
      .get()

    if (userResult.data.length > 0) {
      results.databaseUser = userResult.data[0]
      console.log('✅ 数据库用户记录:')
      console.log('  is_pro:', results.databaseUser.is_pro)
      console.log('  subscription_status:', results.databaseUser.subscription_status)
      console.log('  subscription_expires_at:', results.databaseUser.subscription_expires_at)
    } else {
      console.log('❌ 未找到用户记录')
    }
    console.log('')

    // 3️⃣ 检查数据库 - sitehub_subscriptions表
    console.log('3️⃣  检查数据库订阅表\n' + '─'.repeat(60))
    const subsResult = await wx.cloud.database()
      .collection('sitehub_subscriptions')
      .where({ user_openid: userInfo.openid })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()

    if (subsResult.data.length > 0) {
      results.databaseSubscription = subsResult.data[0]
      console.log('✅ 数据库订阅记录:')
      console.log('  status:', results.databaseSubscription.status)
      console.log('  plan_type:', results.databaseSubscription.plan_type)
      console.log('  current_period_end:', results.databaseSubscription.current_period_end)
      console.log('  amount:', results.databaseSubscription.amount)
    } else {
      console.log('ℹ️  无订阅记录')
    }
    console.log('')

    // 4️⃣ 检查本地缓存
    console.log('4️⃣  检查本地缓存\n' + '─'.repeat(60))
    results.localStorage = {
      userInfo: wx.getStorageSync('sitehub_userInfo'),
      proStatus: wx.getStorageSync('sitehub_pro_status')
    }
    console.log('📦 本地缓存:')
    console.log('  userInfo.isPro:', results.localStorage.userInfo?.isPro)
    console.log('  proStatus:', results.localStorage.proStatus)
    console.log('')

    // 5️⃣ 测试云函数调用
    console.log('5️⃣  测试云函数 (fetchMe)\n' + '─'.repeat(60))
    try {
      const { getUserSession } = require('../../utils/userSession')
      const userSession = getUserSession()
      const me = await userSession.fetchMe(true)

      results.cloudFunction = {
        success: true,
        entitlement: me?.entitlement,
        profile: me?.profile
      }

      console.log('✅ 云函数返回:')
      console.log('  entitlement.status:', me?.entitlement?.status)
      console.log('  entitlement.plan:', me?.entitlement?.plan)
      console.log('  entitlement.expiresAt:', me?.entitlement?.expiresAt)
    } catch (error) {
      results.cloudFunction = {
        success: false,
        error: error.message
      }
      console.log('❌ 云函数调用失败:', error.message)
    }
    console.log('')

    // 6️⃣ 数据一致性分析
    console.log('6️⃣  数据一致性分析\n' + '─'.repeat(60))

    // 检查数据库状态
    const dbIsActive = results.databaseUser?.is_pro === true &&
                       results.databaseSubscription?.status === 'active'

    // 检查页面状态
    const pageIsActive = results.pageData?.isPro === true &&
                         results.pageData?.subscription?.status === 'active'

    // 检查云函数状态
    const cloudIsActive = results.cloudFunction?.entitlement?.status === 'active'

    console.log('📊 各层级状态:')
    console.log(`  数据库: ${dbIsActive ? '✅ 会员' : '❌ 非会员'}`)
    console.log(`  页面: ${pageIsActive ? '✅ 会员' : '❌ 非会员'}`)
    console.log(`  云函数: ${cloudIsActive ? '✅ 会员' : '❌ 非会员'}`)
    console.log('')

    // 7️⃣ 问题诊断
    console.log('7️⃣  问题诊断\n' + '─'.repeat(60))

    if (dbIsActive && !pageIsActive) {
      results.diagnosis.push('🔴 数据库显示会员，但页面未显示')
      results.recommendations.push('原因：onShow()未正确更新页面数据')
      results.recommendations.push('解决：刷新页面或下拉刷新')
    }

    if (dbIsActive && !cloudIsActive) {
      results.diagnosis.push('🟡 数据库显示会员，但云函数返回非会员')
      results.recommendations.push('原因：云函数缓存或查询逻辑问题')
      results.recommendations.push('解决：等待缓存过期或重启小程序')
    }

    if (!dbIsActive && pageIsActive) {
      results.diagnosis.push('🟠 页面显示会员，但数据库显示非会员')
      results.recommendations.push('原因：支付成功但数据库未更新')
      results.recommendations.push('解决：检查payment.js的handlePaymentSuccess')
    }

    if (results.pageData.subscription === null && dbIsActive) {
      results.diagnosis.push('🔴 subscription对象为null')
      results.recommendations.push('原因：onShow()中subscription对象未正确构建')
      results.recommendations.push('解决：检查settings.js第164-194行的逻辑')
    }

    if (results.pageData.subscription && !results.pageData.subscription.formattedExpiry) {
      results.diagnosis.push('🟡 subscription缺少formattedExpiry字段')
      results.recommendations.push('原因：到期日期未格式化')
      results.recommendations.push('解决：UI可能无法正确显示到期时间')
    }

    if (results.diagnosis.length === 0) {
      console.log('✅ 未发现异常，数据一致')
    } else {
      console.log('⚠️  发现以下问题:')
      results.diagnosis.forEach(d => console.log('   ' + d))
      console.log('')
      console.log('💡 建议:')
      results.recommendations.forEach(r => console.log('   ' + r))
    }
    console.log('')

    // 8️⃣ UI显示检查
    console.log('8️⃣  UI显示检查\n' + '─'.repeat(60))
    const displayCondition = `isPro=${results.pageData.isPro} && subscription=${results.pageData.subscription !== null} && subscription.status=${results.pageData.subscription?.status}`
    const shouldShowPro = results.pageData.isPro && results.pageData.subscription && results.pageData.subscription.status === 'active'

    console.log('🎨 显示条件:')
    console.log('  ' + displayCondition)
    console.log(`  结果: ${shouldShowPro ? '✅ 显示Pro会员卡' : '❌ 显示免费用户卡'}`)
    console.log('')

    // 总结
    console.log('\n╔══════════════════════════════════════════════════════════╗')
    console.log('║       📊 诊断完成                                        ║')
    console.log('╚══════════════════════════════════════════════════════════╝')

    if (dbIsActive && pageIsActive) {
      console.log('\n✅ 状态正常：您应该看到紫色渐变的Pro会员卡')
    } else if (dbIsActive && !pageIsActive) {
      console.log('\n🔴 状态异常：数据库显示会员，但页面未显示')
      console.log('💡 请执行: fixPageDisplay()')
    } else if (!dbIsActive) {
      console.log('\n⚪ 非会员状态：您应该看到灰色的免费用户卡')
    }

    return results

  } catch (error) {
    console.error('❌ 诊断过程出错:', error)
    return results
  }
}

// ============================================
// 🔧 第二部分：修复函数
// ============================================

/**
 * 修复页面显示（强制刷新）
 */
async function fixPageDisplay() {
  console.log('🔧 开始修复页面显示...\n')

  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    // 强制触发onShow
    if (currentPage.onShow) {
      await currentPage.onShow()
      console.log('✅ 页面已刷新')
      console.log('📊 新状态:')
      console.log('  isPro:', currentPage.data.isPro)
      console.log('  subscription:', currentPage.data.subscription)
    }
  } catch (error) {
    console.error('❌ 修复失败:', error)
  }
}

/**
 * 手动同步数据库状态到页面
 */
async function manualSyncFromDatabase() {
  console.log('🔄 手动从数据库同步状态...\n')

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    // 查询数据库
    const subsResult = await wx.cloud.database()
      .collection('sitehub_subscriptions')
      .where({
        user_openid: userInfo.openid,
        status: 'active'
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()

    if (subsResult.data.length > 0) {
      const sub = subsResult.data[0]
      const expiryDate = new Date(sub.current_period_end)
      const now = new Date()
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))

      const formattedExpiry = expiryDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      currentPage.setData({
        isPro: true,
        subscription: {
          status: 'active',
          plan_type: sub.plan_type,
          current_period_end: sub.current_period_end,
          formattedExpiry: formattedExpiry,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          amount: sub.amount,
          billing_cycle: sub.billing_cycle
        }
      })

      console.log('✅ 同步成功！')
      console.log('📊 新数据:', currentPage.data.subscription)
    } else {
      console.log('ℹ️  数据库中无active订阅')
      currentPage.setData({
        isPro: false,
        subscription: null
      })
    }
  } catch (error) {
    console.error('❌ 同步失败:', error)
  }
}

// ============================================
// 🧪 第三部分：测试函数
// ============================================

/**
 * 测试新用户支付流程（模拟）
 */
async function testNewUserPaymentFlow() {
  console.log('\n🧪 测试新用户支付流程\n')
  console.log('⚠️  这是模拟测试，不会真实扣款\n')

  const userInfo = wx.getStorageSync('sitehub_userInfo')
  const db = wx.cloud.database()
  const testOrderId = `test_${Date.now()}`

  try {
    console.log('1️⃣  创建pending订阅...')
    const currentDate = new Date()
    const expiryDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    await db.collection('sitehub_subscriptions').add({
      data: {
        user_openid: userInfo.openid,
        plan_type: 'personal',
        billing_cycle: 'monthly',
        status: 'pending',
        amount: 19.99,
        currency: 'CNY',
        wechat_order_id: testOrderId,
        current_period_start: currentDate,
        current_period_end: expiryDate,
        cancel_at_period_end: false,
        created_at: currentDate,
        updated_at: currentDate
      }
    })
    console.log('   ✅ 订阅记录已创建 (status: pending)')

    console.log('\n2️⃣  模拟支付成功，更新为active...')
    await db.collection('sitehub_subscriptions')
      .where({ wechat_order_id: testOrderId })
      .update({
        data: {
          status: 'active',
          updated_at: new Date()
        }
      })
    console.log('   ✅ 订阅状态已更新 (status: active)')

    console.log('\n3️⃣  更新用户状态...')
    await db.collection('sitehub_users')
      .where({ openid: userInfo.openid })
      .update({
        data: {
          is_pro: true,
          subscription_status: 'active',
          subscription_expires_at: expiryDate,
          updated_at: new Date()
        }
      })
    console.log('   ✅ 用户状态已更新 (is_pro: true)')

    console.log('\n4️⃣  刷新页面显示...')
    await fixPageDisplay()

    console.log('\n✅ 测试完成！')
    console.log('📊 现在应该显示Pro会员卡')
    console.log('\n💡 测试订单ID:', testOrderId)
    console.log('💡 可以通过以下命令清理测试数据:')
    console.log(`   cleanupTestOrder("${testOrderId}")`)

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

/**
 * 清理测试订单
 */
async function cleanupTestOrder(orderId) {
  try {
    console.log('🧹 清理测试订单:', orderId)

    const db = wx.cloud.database()
    await db.collection('sitehub_subscriptions')
      .where({ wechat_order_id: orderId })
      .remove()

    console.log('✅ 已清理')
  } catch (error) {
    console.error('❌ 清理失败:', error)
  }
}

// ============================================
// 📊 第四部分：快速检查函数
// ============================================

/**
 * 快速检查（一行命令）
 */
async function quickCheck() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const isPro = page.data.isPro
  const hasSub = page.data.subscription !== null
  const subStatus = page.data.subscription?.status

  console.log(`\n🔍 快速检查结果:`)
  console.log(`   isPro: ${isPro ? '✅' : '❌'}`)
  console.log(`   subscription: ${hasSub ? '✅' : '❌'}`)
  console.log(`   subscription.status: ${subStatus || 'N/A'}`)
  console.log(`   显示: ${isPro && hasSub && subStatus === 'active' ? '✅ Pro会员卡' : '❌ 免费用户卡'}`)
}

/**
 * 查看当前subscription对象
 */
function viewSubscription() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  console.log('📊 当前subscription对象:', page.data.subscription)
}

// ============================================
// 📖 使用说明
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║     🔍 会员身份诊断与验证脚本已加载                        ║
╚════════════════════════════════════════════════════════════╝

📝 可用函数:

【诊断函数】
1. diagnoseMembershipStatus()
   → 完整诊断会员身份显示链路（最重要）

2. quickCheck()
   → 快速检查当前页面状态

3. viewSubscription()
   → 查看当前subscription对象

【修复函数】
4. fixPageDisplay()
   → 强制刷新页面显示

5. manualSyncFromDatabase()
   → 手动从数据库同步状态到页面

【测试函数】
6. testNewUserPaymentFlow()
   → 模拟新用户支付流程（测试用）

7. cleanupTestOrder(orderId)
   → 清理测试订单数据

📖 推荐使用流程:

1️⃣  如果已支付但未显示会员:
   diagnoseMembershipStatus()
   // 查看诊断结果和建议

2️⃣  如果诊断发现问题:
   fixPageDisplay()
   // 或
   manualSyncFromDatabase()

3️⃣  验证修复结果:
   quickCheck()

4️⃣  测试新用户流程:
   testNewUserPaymentFlow()

💡 提示:
- 所有函数都会输出详细日志
- 出现问题先运行 diagnoseMembershipStatus()
- 修复后务必执行 quickCheck() 验证
`)
