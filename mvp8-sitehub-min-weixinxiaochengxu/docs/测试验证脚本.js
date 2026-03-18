/**
 * 🧪 支付流程测试验证脚本
 *
 * 使用方法：
 * 1. 在微信开发者工具的控制台中复制粘贴以下函数
 * 2. 按顺序执行各个测试步骤
 * 3. 每个步骤都会输出详细的检查结果
 *
 * 创建时间: 2025-10-12
 */

// ============================================
// 步骤1: 清理测试数据（可选）
// ============================================

/**
 * 清理当前用户的所有测试数据
 * ⚠️ 警告：这会删除订阅记录、订单记录等，仅用于测试环境
 */
async function cleanupTestData() {
  console.log('🧹 开始清理测试数据...\n')

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo || !userInfo.openid) {
      console.error('❌ 未找到用户信息，请先登录')
      return
    }

    const openid = userInfo.openid
    const db = wx.cloud.database()

    // 1. 清理订阅记录
    console.log('1️⃣ 清理订阅记录...')
    const subsResult = await db.collection('sitehub_subscriptions')
      .where({ user_openid: openid })
      .remove()
    console.log(`   ✅ 已删除 ${subsResult.stats.removed} 条订阅记录\n`)

    // 2. 清理订单记录
    console.log('2️⃣ 清理订单记录...')
    const ordersResult = await db.collection('orders')
      .where({ openid: openid })
      .remove()
    console.log(`   ✅ 已删除 ${ordersResult.stats.removed} 条订单记录\n`)

    // 3. 清理订阅历史
    console.log('3️⃣ 清理订阅历史...')
    const historyResult = await db.collection('sitehub_subscription_history')
      .where({ user_openid: openid })
      .remove()
    console.log(`   ✅ 已删除 ${historyResult.stats.removed} 条历史记录\n`)

    // 4. 重置用户会员状态
    console.log('4️⃣ 重置用户会员状态...')
    const userResult = await db.collection('sitehub_users')
      .where({ openid: openid })
      .update({
        data: {
          is_pro: false,
          subscription_status: 'free',
          subscription_expires_at: null,
          updated_at: new Date()
        }
      })
    console.log(`   ✅ 已重置 ${userResult.stats.updated} 个用户状态\n`)

    // 5. 清理本地缓存
    console.log('5️⃣ 清理本地缓存...')
    wx.removeStorageSync('sitehub_pro_status')
    wx.removeStorageSync('sitehub_subscription_cache')
    console.log('   ✅ 本地缓存已清理\n')

    console.log('✅ 测试数据清理完成！\n')
    console.log('📊 清理统计:')
    console.log(`   - 订阅记录: ${subsResult.stats.removed} 条`)
    console.log(`   - 订单记录: ${ordersResult.stats.removed} 条`)
    console.log(`   - 历史记录: ${historyResult.stats.removed} 条`)
    console.log(`   - 用户状态: 已重置`)

  } catch (error) {
    console.error('❌ 清理失败:', error)
  }
}

// ============================================
// 步骤2: 检查当前状态
// ============================================

/**
 * 检查当前用户的所有相关数据状态
 */
async function checkCurrentStatus() {
  console.log('🔍 检查当前状态...\n')

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo || !userInfo.openid) {
      console.error('❌ 未找到用户信息，请先登录')
      return
    }

    const openid = userInfo.openid
    const db = wx.cloud.database()

    // 1. 检查用户状态
    console.log('1️⃣ 用户会员状态:')
    const userResult = await db.collection('sitehub_users')
      .where({ openid: openid })
      .get()

    if (userResult.data.length > 0) {
      const user = userResult.data[0]
      console.log(`   is_pro: ${user.is_pro ? '✅ true' : '❌ false'}`)
      console.log(`   subscription_status: ${user.subscription_status}`)
      console.log(`   subscription_expires_at: ${user.subscription_expires_at || '无'}`)
    } else {
      console.log('   ⚠️ 未找到用户记录')
    }
    console.log('')

    // 2. 检查订阅记录
    console.log('2️⃣ 订阅记录:')
    const subsResult = await db.collection('sitehub_subscriptions')
      .where({ user_openid: openid })
      .orderBy('created_at', 'desc')
      .get()

    if (subsResult.data.length > 0) {
      subsResult.data.forEach((sub, index) => {
        console.log(`   [${index + 1}] ${sub.status === 'active' ? '✅' : '⚠️'} status: ${sub.status}`)
        console.log(`       plan_type: ${sub.plan_type}`)
        console.log(`       billing_cycle: ${sub.billing_cycle}`)
        console.log(`       amount: ¥${sub.amount}`)
        console.log(`       wechat_order_id: ${sub.wechat_order_id}`)
        console.log(`       current_period_end: ${sub.current_period_end}`)
        console.log('')
      })
    } else {
      console.log('   ℹ️ 无订阅记录\n')
    }

    // 3. 检查订单记录
    console.log('3️⃣ 订单记录:')
    const ordersResult = await db.collection('orders')
      .where({ openid: openid })
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    if (ordersResult.data.length > 0) {
      ordersResult.data.forEach((order, index) => {
        console.log(`   [${index + 1}] ${order.status === 'paid' ? '✅' : '⚠️'} status: ${order.status}`)
        console.log(`       orderNo: ${order.orderNo}`)
        console.log(`       amount: ¥${order.amount}`)
        console.log(`       createdAt: ${order.createdAt}`)
        console.log('')
      })
    } else {
      console.log('   ℹ️ 无订单记录\n')
    }

    // 4. 检查本地缓存
    console.log('4️⃣ 本地缓存:')
    const proStatus = wx.getStorageSync('sitehub_pro_status')
    const subCache = wx.getStorageSync('sitehub_subscription_cache')
    console.log(`   sitehub_pro_status: ${proStatus ? '✅ true' : '❌ false'}`)
    console.log(`   sitehub_subscription_cache: ${subCache ? '有缓存' : '无缓存'}`)
    console.log('')

    // 5. 数据一致性检查
    console.log('5️⃣ 数据一致性检查:')
    const user = userResult.data[0]
    const activeSubs = subsResult.data.filter(s => s.status === 'active')

    let consistent = true

    if (user.is_pro && activeSubs.length === 0) {
      console.log('   ❌ 不一致: 用户is_pro=true，但无active订阅记录')
      consistent = false
    }

    if (!user.is_pro && activeSubs.length > 0) {
      console.log('   ❌ 不一致: 用户is_pro=false，但有active订阅记录')
      consistent = false
    }

    if (user.is_pro !== proStatus) {
      console.log(`   ❌ 不一致: 数据库is_pro=${user.is_pro}，缓存proStatus=${proStatus}`)
      consistent = false
    }

    if (consistent) {
      console.log('   ✅ 数据一致性检查通过')
    }
    console.log('')

    console.log('✅ 状态检查完成！\n')

  } catch (error) {
    console.error('❌ 检查失败:', error)
  }
}

// ============================================
// 步骤3: 修复现有的pending订阅
// ============================================

/**
 * 将当前pending状态的订阅更新为active
 * 用于修复已支付但状态未更新的订阅
 */
async function fixPendingSubscription() {
  console.log('🔧 修复pending订阅状态...\n')

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo || !userInfo.openid) {
      console.error('❌ 未找到用户信息，请先登录')
      return
    }

    const openid = userInfo.openid
    const db = wx.cloud.database()

    // 查找pending状态的订阅
    const subsResult = await db.collection('sitehub_subscriptions')
      .where({
        user_openid: openid,
        status: 'pending'
      })
      .get()

    if (subsResult.data.length === 0) {
      console.log('ℹ️ 没有需要修复的pending订阅\n')
      return
    }

    console.log(`找到 ${subsResult.data.length} 条pending订阅记录\n`)

    // 更新为active
    for (const sub of subsResult.data) {
      console.log(`修复订阅: ${sub.wechat_order_id}`)

      const updateResult = await db.collection('sitehub_subscriptions')
        .doc(sub._id)
        .update({
          data: {
            status: 'active',
            updated_at: new Date()
          }
        })

      console.log(`   ${updateResult.stats.updated > 0 ? '✅' : '❌'} 已更新\n`)
    }

    console.log('✅ 修复完成！\n')

    // 重新检查状态
    await checkCurrentStatus()

  } catch (error) {
    console.error('❌ 修复失败:', error)
  }
}

// ============================================
// 步骤4: 测试云函数配置
// ============================================

/**
 * 测试云函数是否正确部署和配置
 */
async function testCloudFunction() {
  console.log('☁️ 测试云函数配置...\n')

  try {
    // 测试调用云函数
    console.log('1️⃣ 调用 wechatPaySubscription 云函数...')

    const result = await wx.cloud.callFunction({
      name: 'wechatPaySubscription',
      data: {
        action: 'checkConfig'
      }
    })

    console.log('   云函数返回:', result)

    if (result.errMsg === 'cloud.callFunction:ok') {
      console.log('   ✅ 云函数调用成功\n')

      if (result.result) {
        console.log('2️⃣ 云函数配置信息:')
        console.log(`   环境ID: ${result.result.env || '未配置'}`)
        console.log(`   AppID: ${result.result.appId || '未配置'}`)
        console.log(`   商户号: ${result.result.mchId || '未配置'}`)
        console.log('')
      }
    } else {
      console.log('   ❌ 云函数调用失败\n')
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)

    if (error.errCode === -1) {
      console.log('\n⚠️ 提示: 云函数可能未部署或名称不匹配')
      console.log('   请检查:')
      console.log('   1. 云函数文件夹名称是否为 wechatPaySubscription')
      console.log('   2. 是否已上传并部署云函数')
      console.log('   3. 云函数是否安装了依赖 (wx-server-sdk, axios)')
    }
  }
}

// ============================================
// 步骤5: 模拟支付成功测试
// ============================================

/**
 * 模拟支付成功流程，验证状态更新逻辑
 * 注意：这只是模拟，不会真正调用微信支付
 */
async function simulatePaymentSuccess() {
  console.log('🧪 模拟支付成功流程...\n')

  try {
    const userInfo = wx.getStorageSync('sitehub_userInfo')
    if (!userInfo || !userInfo.openid) {
      console.error('❌ 未找到用户信息，请先登录')
      return
    }

    const db = wx.cloud.database()
    const orderId = `test_order_${Date.now()}`
    const transactionId = `test_txn_${Date.now()}`

    console.log(`订单ID: ${orderId}\n`)

    // 1. 创建测试订阅记录（pending状态）
    console.log('1️⃣ 创建测试订阅记录 (status: pending)...')

    const currentDate = new Date()
    const expiryDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天后

    await db.collection('sitehub_subscriptions').add({
      data: {
        user_openid: userInfo.openid,
        plan_type: 'personal',
        billing_cycle: 'monthly',
        status: 'pending',
        amount: 19.99,
        currency: 'CNY',
        wechat_order_id: orderId,
        current_period_start: currentDate,
        current_period_end: expiryDate,
        cancel_at_period_end: false,
        created_at: currentDate,
        updated_at: currentDate
      }
    })
    console.log('   ✅ 订阅记录已创建\n')

    // 2. 创建测试订单记录
    console.log('2️⃣ 创建测试订单记录...')
    await db.collection('orders').add({
      data: {
        orderNo: orderId,
        openid: userInfo.openid,
        amount: 19.99,
        status: 'pending',
        createdAt: currentDate,
        updatedAt: currentDate
      }
    })
    console.log('   ✅ 订单记录已创建\n')

    // 3. 模拟支付成功，更新状态
    console.log('3️⃣ 模拟支付成功，更新订阅状态...')
    const subsUpdateResult = await db.collection('sitehub_subscriptions')
      .where({ wechat_order_id: orderId })
      .update({
        data: {
          status: 'active',
          wechat_transaction_id: transactionId,
          updated_at: new Date()
        }
      })
    console.log(`   ✅ 订阅状态已更新 (${subsUpdateResult.stats.updated} 条)\n`)

    // 4. 更新订单状态
    console.log('4️⃣ 更新订单状态...')
    await db.collection('orders')
      .where({ orderNo: orderId })
      .update({
        data: {
          status: 'paid',
          transaction_id: transactionId,
          paidAt: new Date(),
          updatedAt: new Date()
        }
      })
    console.log('   ✅ 订单状态已更新\n')

    // 5. 更新用户状态
    console.log('5️⃣ 更新用户会员状态...')
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
    console.log('   ✅ 用户状态已更新\n')

    // 6. 更新本地缓存
    console.log('6️⃣ 更新本地缓存...')
    wx.setStorageSync('sitehub_pro_status', true)
    console.log('   ✅ 本地缓存已更新\n')

    console.log('✅ 模拟支付成功流程完成！\n')

    // 验证结果
    console.log('📊 验证结果:')
    await checkCurrentStatus()

  } catch (error) {
    console.error('❌ 模拟失败:', error)
  }
}

// ============================================
// 使用说明
// ============================================

console.log(`
╔════════════════════════════════════════════════════════╗
║     🧪 支付流程测试验证脚本已加载                      ║
╚════════════════════════════════════════════════════════╝

📝 可用的测试函数:

1. checkCurrentStatus()
   → 检查当前用户的所有数据状态（用户、订阅、订单、缓存）

2. fixPendingSubscription()
   → 修复现有的pending状态订阅（将其更新为active）

3. testCloudFunction()
   → 测试云函数是否正确部署和配置

4. simulatePaymentSuccess()
   → 完整模拟支付成功流程（创建订阅→更新状态→验证）

5. cleanupTestData()
   → 清理所有测试数据（⚠️ 慎用，会删除所有订阅和订单）

📖 推荐测试顺序:

1️⃣ 先检查当前状态:
   checkCurrentStatus()

2️⃣ 如果有pending订阅，先修复:
   fixPendingSubscription()

3️⃣ 测试云函数:
   testCloudFunction()

4️⃣ 如需完整测试，先清理再模拟:
   cleanupTestData()
   simulatePaymentSuccess()

💡 提示: 直接在控制台调用上述函数即可开始测试
`)
