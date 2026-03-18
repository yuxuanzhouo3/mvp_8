// cloudfunctions/wechatPaySubscription/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, userInfo } = event
  
  console.log('🔄 [WeChatPaySubscription] Action:', action, 'User:', userInfo?.openid)
  
  try {
    switch (action) {
      case 'createSubscription':
        return await createSubscription(event, context)
      case 'handlePaymentCallback':
        return await handlePaymentCallback(event)
      case 'cancelSubscription':
        return await cancelSubscription(event)
      case 'getSubscriptionStatus':
        return await getSubscriptionStatus(event)
      case 'getSubscriptionHistory':
        return await getSubscriptionHistory(event)
      case 'getPricing':
        return await getPricing(event)
      case 'checkConfig':
        return await checkConfig()
      case 'testDatabase':
        return await testDatabase()
      case 'clearTestData':
        return await clearTestData(event)
      default:
        return { success: false, error: 'Unknown action', action: action }
    }
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] Error:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 创建订阅订单（简化版本）
// ========================================
async function createSubscription(event, context) {
  const { planType, billingCycle, userInfo, forceUpgrade } = event

  console.log('🔍 [WeChatPaySubscription] 接收到的参数:', {
    planType,
    billingCycle,
    amount: event.amount,
    amountType: typeof event.amount,
    openid: userInfo?.openid
  })

  if (!planType || !billingCycle || !userInfo?.openid) {
    return { success: false, error: 'Missing required parameters' }
  }

  try {
    // 获取价格
    let pricing = await getPricingByPlan(planType, billingCycle)
    if (!pricing) {
      return { success: false, error: 'Invalid plan or pricing not found' }
    }

    // 如果前端传递了amount，使用前端金额（优先级更高）
    if (event.amount && event.amount > 0) {
      console.log('🔧 [WeChatPaySubscription] 使用前端传递的金额:', event.amount, '类型:', typeof event.amount)
      // 确保金额是数字类型
      pricing.amount = Number(event.amount)
    }

    // 最终验证金额
    if (!pricing.amount || isNaN(pricing.amount) || pricing.amount <= 0) {
      console.error('❌ [WeChatPaySubscription] 金额验证失败:', {
        amount: pricing.amount,
        type: typeof pricing.amount,
        isNaN: isNaN(pricing.amount)
      })
      return { success: false, error: `Invalid amount: ${pricing.amount}` }
    }

    console.log('💰 [WeChatPaySubscription] 最终使用金额:', pricing.amount, '类型:', typeof pricing.amount)
    
    // 检查用户是否已有活跃订阅
    const existingSubscription = await getUserActiveSubscription(userInfo.openid)
    let upgradedFrom = null
    if (existingSubscription) {
      const existingPlan = existingSubscription.plan_type === 'pro' ? 'personal' : existingSubscription.plan_type
      if (forceUpgrade && existingPlan === 'personal' && planType === 'team') {
        console.log('🔄 [WeChatPaySubscription] 检测到个人版升级到团队版，准备标记旧订阅')
        upgradedFrom = existingSubscription
        try {
          await db.collection('sitehub_subscriptions').doc(existingSubscription._id).update({
            data: {
              status: 'upgrading',
              upgraded_to_plan: planType,
              cancel_at_period_end: false,
              updated_at: new Date()
            }
          })
        } catch (upgradeError) {
          console.error('❌ [WeChatPaySubscription] 升级过程中标记旧订阅失败:', upgradeError)
          return { success: false, error: 'Upgrade failed, please retry later.' }
        }
      } else {
        return { 
          success: false, 
          error: 'User already has an active subscription',
          existingSubscription: existingSubscription
        }
      }
    }
    
    // 生成订单号
    const orderId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 保存订阅记录
    const subscriptionData = {
      plan_type: planType,
      billing_cycle: billingCycle,
      status: 'pending',
      auto_renew: true,
      wechat_order_id: orderId,
      amount: pricing.amount,
      currency: 'CNY',
      start_date: new Date(),
      current_period_end: calculatePeriodEnd(new Date(), billingCycle),
      cancel_at_period_end: false,
      created_at: new Date(),
      updated_at: new Date(),
      // 添加用户标识字段
      user_openid: userInfo.openid,
      user_id: userInfo.userId || userInfo.openid,
      userId: userInfo.userId || null,
      user_nickname: userInfo.nickName || userInfo.nickname,
      upgraded_from_id: upgradedFrom ? upgradedFrom._id : null
    }
    
    console.log('🔧 [WeChatPaySubscription] 准备创建订阅记录:', subscriptionData)
    
    const subscriptionResult = await db.collection('sitehub_subscriptions').add({
      data: subscriptionData
    })
    
    console.log('✅ [WeChatPaySubscription] 订阅记录已创建:', subscriptionResult._id)
    console.log('📊 [WeChatPaySubscription] 创建结果详情:', subscriptionResult)

    // 记录订单信息（用于后续支付结果跟踪）
    try {
      await db.collection('orders').add({
        data: {
          orderNo: orderId,
          userId: userInfo.userId || userInfo.openid,
          openid: userInfo.openid,
          planType: planType,
          billingCycle: billingCycle,
          amount: pricing.amount,
          currency: 'CNY',
          totalFee: Math.round(Number(pricing.amount) * 100),
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscriptionId: subscriptionResult._id
        }
      })
      console.log('💾 [WeChatPaySubscription] 订单记录已写入 orders 表')
    } catch (orderError) {
      console.warn('⚠️ [WeChatPaySubscription] 订单记录写入失败:', orderError)
    }
    
    // 构建真实的微信支付参数
    const paymentParams = await buildWeChatPaymentParams({
      orderId,
      planType,
      billingCycle,
      amount: pricing.amount,
      userInfo,
      requestIP: context?.requestIP || event?.requestIP || '127.0.0.1'
    })
    
    return {
      success: true,
      data: {
        subscriptionId: subscriptionResult._id,
        orderId: orderId,
        orderNo: orderId, // 添加orderNo字段，与前端保持一致
        paymentParams: paymentParams,
        pricing: pricing
      }
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 创建订阅失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 处理支付回调（升级版 - 支持双数据库同步）
// ========================================
async function handlePaymentCallback(event) {
  const { transactionId, orderId, amount, userInfo } = event

  try {
    console.log('🔄 [WeChatPaySubscription] 处理支付回调:', orderId)

    // 先查询订阅记录是否存在
    const existingSubscription = await db.collection('sitehub_subscriptions').where({
      wechat_order_id: orderId
    }).get()

    console.log('🔍 [WeChatPaySubscription] 查询订阅记录:', {
      orderId: orderId,
      found: existingSubscription.data.length,
      records: existingSubscription.data
    })

    if (existingSubscription.data.length === 0) {
      console.error('❌ [WeChatPaySubscription] 未找到订阅记录，orderId:', orderId)
      return { success: false, error: 'Subscription record not found' }
    }

    const subscription = existingSubscription.data[0]

    // 1. 更新 WeChat Cloud 订阅状态
    const updateResult = await db.collection('sitehub_subscriptions').where({
      wechat_order_id: orderId
    }).update({
      data: {
        status: 'active',
        wechat_transaction_id: transactionId,
        updated_at: new Date()
      }
    })

    console.log('📊 [WeChatPaySubscription] WeChat Cloud 更新结果:', updateResult)

    if (updateResult.stats.updated > 0) {
      // 2. 同步到 Supabase（关键新增！）
      try {
        await syncSubscriptionToSupabase({
          openid: userInfo?.openid,
          orderId: orderId,
          transactionId: transactionId,
          status: 'active',
          planType: subscription.plan_type,
          billingCycle: subscription.billing_cycle,
          amount: subscription.amount,
          currency: subscription.currency || 'CNY',
          startDate: subscription.start_date,
          currentPeriodEnd: subscription.current_period_end
        })
        console.log('✅ [WeChatPaySubscription] 订阅已同步到 Supabase')
      } catch (supabaseError) {
        console.error('⚠️ [WeChatPaySubscription] Supabase 同步失败（不阻塞主流程）:', supabaseError.message)
      }

      // 3. 记录订阅历史
      await recordSubscriptionHistory(orderId, 'created', amount, userInfo?.openid)

      // 4. 更新用户Pro状态（WeChat Cloud）
      await updateUserProStatus(userInfo?.openid, true)

      // 5. 更新用户Pro状态（Supabase）
      try {
        await updateUserProStatusInSupabase(userInfo?.openid, true, subscription.current_period_end)
        console.log('✅ [WeChatPaySubscription] 用户Pro状态已同步到 Supabase')
      } catch (supabaseError) {
        console.error('⚠️ [WeChatPaySubscription] Supabase 用户状态同步失败:', supabaseError.message)
      }

      // 6. 记录支付统计到 Supabase（关键：用于利润分析）
      try {
        await recordPaymentStatsToSupabase({
          openid: userInfo?.openid,
          productId: 'sitehub',
          productName: 'SiteHub导航',
          planType: subscription.plan_type,
          billingCycle: subscription.billing_cycle,
          transactionId: transactionId,
          orderId: orderId,
          amount: subscription.amount,
          currency: subscription.currency || 'CNY',
          platform: 'wechat',
          paymentMethod: 'wechat',
          status: 'completed',
          region: 'CN'  // 根据实际情况可以从 IP 检测获取
        })
        console.log('✅ [WeChatPaySubscription] 支付统计已记录到 Supabase')
      } catch (statsError) {
        console.error('⚠️ [WeChatPaySubscription] 支付统计记录失败（不阻塞主流程）:', statsError.message)
      }

      console.log('✅ [WeChatPaySubscription] 支付回调处理成功:', orderId)

      return { success: true, message: 'Payment processed successfully' }
    } else {
      return { success: false, error: 'Subscription not found' }
    }

  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 支付回调处理失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 取消订阅
// ========================================
async function cancelSubscription(event) {
  const { subscriptionId, userInfo } = event
  
  if (!subscriptionId || !userInfo?.openid) {
    return { success: false, error: 'Missing required parameters' }
  }
  
  try {
    const _ = db.command
    const result = await db.collection('sitehub_subscriptions').where(
      _.and([
        { _id: subscriptionId },
        _.or([
          { _openid: userInfo.openid },
          { user_openid: userInfo.openid }
        ])
      ])
    ).update({
      data: {
        cancel_at_period_end: true,
        cancelled_at: new Date(),
        updated_at: new Date()
      }
    })
    
    if (result.stats.updated > 0) {
      await recordSubscriptionHistory(subscriptionId, 'cancelled', 0, userInfo.openid)
      
      console.log('✅ [WeChatPaySubscription] 订阅已取消:', subscriptionId)
      
      return { 
        success: true, 
        message: 'Subscription will be cancelled at period end' 
      }
    } else {
      return { success: false, error: 'Subscription not found or not authorized' }
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 取消订阅失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 获取订阅状态
// ========================================
async function getSubscriptionStatus(event) {
  const { userInfo } = event
  
  if (!userInfo?.openid) {
    return { success: false, error: 'Missing user info' }
  }
  
  try {
    const subscription = await getUserActiveSubscription(userInfo.openid)
    
    if (subscription) {
      const formattedSubscription = {
        id: subscription._id,
        planType: subscription.plan_type,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        autoRenew: subscription.auto_renew,
        amount: subscription.amount,
        currency: subscription.currency,
        startDate: subscription.start_date,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.cancelled_at,
        daysUntilExpiry: Math.ceil((new Date(subscription.current_period_end) - new Date()) / (1000 * 60 * 60 * 24))
      }
      
      return { success: true, data: formattedSubscription }
    } else {
      return { success: true, data: null }
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 获取订阅状态失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 获取订阅历史
// ========================================
async function getSubscriptionHistory(event) {
  const { userInfo } = event
  
  if (!userInfo?.openid) {
    return { success: false, error: 'Missing user info' }
  }
  
  try {
    const result = await db.collection('sitehub_subscription_history').where({
      _openid: userInfo.openid
    }).orderBy('created_at', 'desc').limit(20).get()
    
    const history = result.data.map(item => ({
      id: item._id,
      action: item.action,
      amount: item.amount,
      transactionId: item.transaction_id,
      notes: item.notes,
      createdAt: item.created_at
    }))
    
    return { success: true, data: { history } }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 获取订阅历史失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 获取价格信息
// ========================================
async function getPricing(event) {
  try {
    const result = await db.collection('sitehub_pricing').where({
      is_active: true
    }).get()
    
    const pricing = {}
    result.data.forEach(item => {
      if (!pricing[item.plan_type]) {
        pricing[item.plan_type] = {}
      }
      pricing[item.plan_type][item.billing_cycle] = {
        amount: item.amount,
        currency: item.currency
      }
    })
    
    return { success: true, data: pricing }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 获取价格失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 辅助函数
// ========================================

// 获取用户活跃订阅
async function getUserActiveSubscription(openid) {
  console.log('🔍 [WeChatPaySubscription] 查询用户订阅，openid:', openid)
  const _ = db.command
  const userCondition = _.or(
    { user_openid: openid },
    { user_id: openid }
  )
  const statusCondition = _.in(['active', 'pending'])
  
  // 先查询所有订阅记录看看数据结构
  const allResult = await db.collection('sitehub_subscriptions')
    .where(userCondition)
    .get()
  
  console.log('📊 [WeChatPaySubscription] 用户所有订阅记录:', allResult.data.length)
  
  if (allResult.data.length > 0) {
    console.log('📋 [WeChatPaySubscription] 最新记录:', allResult.data[0])
  }
  
  // 查询活跃订阅
  const result = await db.collection('sitehub_subscriptions')
    .where(_.and([
      userCondition,
      { status: statusCondition }
    ]))
    .orderBy('created_at', 'desc')
    .limit(1)
    .get()
  
  console.log('📊 [WeChatPaySubscription] 活跃订阅记录:', result.data.length)

  const subscription = result.data[0]

  if (subscription && subscription.status === 'pending') {
    const now = new Date()
    const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null
    if (end && end > now) {
      subscription.status = 'active'
    }
  }
  
  return subscription || null
}

// 获取价格配置
async function getPricingByPlan(planType, billingCycle) {
  try {
    const result = await db.collection('sitehub_pricing').where({
      plan_type: planType,
      billing_cycle: billingCycle,
      is_active: true
    }).get()
    
    if (result.data.length > 0) {
      return result.data[0]
    }
    
    // 如果数据库中没有配置，使用默认价格
    const defaultPricing = {
      personal: { monthly: 19.99, yearly: 168.00 },
      team: { monthly: 299.99, yearly: 2520.00 }
    }
    
    return {
      amount: defaultPricing[planType][billingCycle],
      currency: 'CNY'
    }
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 获取价格失败:', error)
    return null
  }
}

// 计算周期结束时间
function calculatePeriodEnd(startDate, billingCycle) {
  const date = new Date(startDate)
  
  if (billingCycle === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  } else if (billingCycle === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  }
  
  return date
}

// 记录订阅历史
async function recordSubscriptionHistory(subscriptionId, action, amount, openid) {
  try {
    await db.collection('sitehub_subscription_history').add({
      data: {
        subscription_id: subscriptionId,
        action: action,
        amount: amount,
        transaction_id: `txn_${Date.now()}`,
        notes: `${action} subscription`,
        created_at: new Date()
      }
    })
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 记录订阅历史失败:', error)
  }
}

// 更新用户Pro状态
async function updateUserProStatus(openid, isPro) {
  try {
    await db.collection('sitehub_users').where({
      openid: openid
    }).update({
      data: {
        is_pro: isPro,
        updated_at: new Date()
      }
    })
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 更新用户Pro状态失败:', error)
  }
}

// ========================================
// Supabase 同步函数（双数据库架构）
// ========================================

// 同步订阅到 Supabase
async function syncSubscriptionToSupabase(subscriptionData) {
  const axios = require('axios')

  // Supabase 配置（生产环境应使用环境变量）
  const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://ykirhilnbvsanqyenusf.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQwODg0NiwiZXhwIjoyMDUxOTg0ODQ2fQ.QFJnmwQhzpxJvI2kbQ1X9v6nWiRbI7-yc4K1aFMmx3I'
  }

  try {
    console.log('🔄 [Supabase] 开始同步订阅数据:', subscriptionData.openid)

    // 1. 查询或创建用户记录
    const userRes = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${subscriptionData.openid}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
        }
      }
    )

    let userId = null

    if (userRes.data.length === 0) {
      // 用户不存在，创建新用户
      console.log('⚠️ [Supabase] 用户不存在，创建新用户记录:', subscriptionData.openid)
      const createUserRes = await axios.post(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users`,
        {
          openid: subscriptionData.openid,
          region: 'international',
          is_pro: false,
          created_at: new Date().toISOString()
        },
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      )
      userId = createUserRes.data[0].id
      console.log('✅ [Supabase] 新用户已创建:', userId)
    } else {
      userId = userRes.data[0].id
      console.log('✅ [Supabase] 找到用户:', userId)
    }

    // 2. 检查订阅是否已存在（通过 wechat_order_id）
    const existingSubRes = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_subscriptions?wechat_order_id=eq.${subscriptionData.orderId}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
        }
      }
    )

    const subscriptionPayload = {
      user_id: userId,
      user_openid: subscriptionData.openid,
      plan_type: subscriptionData.planType,
      billing_cycle: subscriptionData.billingCycle,
      status: subscriptionData.status,
      payment_method: 'wechat',
      wechat_transaction_id: subscriptionData.transactionId,
      wechat_order_id: subscriptionData.orderId,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency,
      start_date: new Date(subscriptionData.startDate).toISOString(),
      current_period_end: new Date(subscriptionData.currentPeriodEnd).toISOString(),
      updated_at: new Date().toISOString()
    }

    if (existingSubRes.data.length > 0) {
      // 更新现有订阅
      const subId = existingSubRes.data[0].id
      console.log('🔄 [Supabase] 更新现有订阅:', subId)
      await axios.patch(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_subscriptions?id=eq.${subId}`,
        subscriptionPayload,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('✅ [Supabase] 订阅已更新:', subId)
    } else {
      // 创建新订阅
      console.log('➕ [Supabase] 创建新订阅记录')
      subscriptionPayload.created_at = new Date().toISOString()
      await axios.post(
        `${SUPABASE_CONFIG.url}/rest/v1/sitehub_subscriptions`,
        subscriptionPayload,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.serviceKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      )
      console.log('✅ [Supabase] 新订阅已创建')
    }

    console.log('✅ [Supabase] 订阅同步成功')
  } catch (error) {
    console.error('❌ [Supabase] 订阅同步失败:', error.message)
    if (error.response) {
      console.error('📋 [Supabase] 错误详情:', error.response.data)
    }
    throw error
  }
}

// 更新 Supabase 用户 Pro 状态
async function updateUserProStatusInSupabase(openid, isPro, expiresAt) {
  const axios = require('axios')

  const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://ykirhilnbvsanqyenusf.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQwODg0NiwiZXhwIjoyMDUxOTg0ODQ2fQ.QFJnmwQhzpxJvI2kbQ1X9v6nWiRbI7-yc4K1aFMmx3I'
  }

  try {
    console.log('🔄 [Supabase] 更新用户Pro状态:', { openid, isPro, expiresAt })

    await axios.patch(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${openid}`,
      {
        is_pro: isPro,
        subscription_status: isPro ? 'active' : 'free',
        subscription_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        updated_at: new Date().toISOString()
      },
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('✅ [Supabase] 用户Pro状态已更新')
  } catch (error) {
    console.error('❌ [Supabase] 用户状态更新失败:', error.message)
    if (error.response) {
      console.error('📋 [Supabase] 错误详情:', error.response.data)
    }
    throw error
  }
}

// 记录支付统计到 Supabase（用于利润分析）
async function recordPaymentStatsToSupabase(paymentData) {
  const axios = require('axios')

  const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://ykirhilnbvsanqyenusf.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQwODg0NiwiZXhwIjoyMDUxOTg0ODQ2fQ.QFJnmwQhzpxJvI2kbQ1X9v6nWiRbI7-yc4K1aFMmx3I'
  }

  try {
    console.log('🔄 [Supabase] 记录支付统计:', paymentData.transactionId)

    // 1. 获取用户 UUID
    const userRes = await axios.get(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_users?openid=eq.${paymentData.openid}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`
        }
      }
    )

    let userId = null
    if (userRes.data.length > 0) {
      userId = userRes.data[0].id
    }

    // 2. 构建支付统计记录
    const statsPayload = {
      user_id: userId,
      user_openid: paymentData.openid,
      product_id: paymentData.productId,
      product_name: paymentData.productName,
      plan_type: paymentData.planType,
      billing_cycle: paymentData.billingCycle,
      platform: paymentData.platform,
      payment_method: paymentData.paymentMethod,
      transaction_id: paymentData.transactionId,
      order_id: paymentData.orderId,
      amount: paymentData.amount,
      cost: 0,  // 默认成本为0，后期可以手动更新
      currency: paymentData.currency,
      status: paymentData.status,
      region: paymentData.region,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    // 3. 写入支付统计表
    await axios.post(
      `${SUPABASE_CONFIG.url}/rest/v1/sitehub_payment_stats`,
      statsPayload,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.serviceKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    )

    console.log('✅ [Supabase] 支付统计已记录')
  } catch (error) {
    console.error('❌ [Supabase] 支付统计记录失败:', error.message)
    if (error.response) {
      console.error('📋 [Supabase] 错误详情:', error.response.data)
    }
    throw error
  }
}

// ========================================
// 构建微信支付参数（真实版本）
// ========================================
async function buildWeChatPaymentParams({ orderId, planType, billingCycle, amount, userInfo, requestIP }) {
  const planNames = {
    personal: { monthly: '个人会员月付', yearly: '个人会员年付' },
    team: { monthly: '团队会员月付', yearly: '团队会员年付' }
  }
  
  console.log('🔧 [WeChatPaySubscription] 构建真实支付参数:', { orderId, planType, billingCycle, amount })
  console.log('🔧 [WeChatPaySubscription] 用户信息:', { openid: userInfo.openid })
  console.log('🔧 [WeChatPaySubscription] 请求IP:', requestIP)
  
  // 环境检测和适配
  const isProduction = process.env.NODE_ENV === 'production'
  const isRealDevice = requestIP && requestIP !== '127.0.0.1'
  console.log('🌍 [WeChatPaySubscription] 环境信息:', { isProduction, isRealDevice, requestIP })
  
  // 验证关键参数
  if (!amount || amount <= 0) {
    throw new Error(`Invalid amount parameter: ${amount}`)
  }
  
  const totalFee = Math.round(Number(amount) * 100)
  console.log('💰 [WeChatPaySubscription] 金额转换:', { amount, totalFee })
  
  if (!totalFee || totalFee <= 0) {
    throw new Error(`Invalid total_fee after conversion: ${totalFee}`)
  }
  
  // 微信支付统一下单API参数
  const unifiedOrderParams = {
    appid: process.env.WECHAT_APPID || 'wxf1aca21b5b79581d', // 你的小程序AppID
    mch_id: process.env.WECHAT_MCH_ID || '1694786758', // 你的商户号
    nonce_str: generateNonceStr(),
    body: `SiteHub ${planNames[planType][billingCycle]}`,
    out_trade_no: orderId,
    total_fee: totalFee.toString(), // 转换为字符串（微信API要求）
    spbill_create_ip: isRealDevice ? requestIP : '127.0.0.1',
    notify_url: `${process.env.NOTIFY_URL || 'https://your-domain.com'}/api/wechat-pay-notify`,
    trade_type: 'JSAPI',
    openid: userInfo.openid
  }
  
  // 生成签名
  const apiKey = process.env.WECHAT_API_KEY || 'mornsciencemornscience2025100705'
  console.log('🔧 [WeChatPaySubscription] API密钥长度:', apiKey.length)
  console.log('🔧 [WeChatPaySubscription] 统一下单参数:', unifiedOrderParams)
  
  // 关键参数验证日志
  console.log('🔍 [WeChatPaySubscription] 关键参数验证:')
  console.log('  - total_fee:', unifiedOrderParams.total_fee, '(类型:', typeof unifiedOrderParams.total_fee, ')')
  console.log('  - spbill_create_ip:', unifiedOrderParams.spbill_create_ip)
  console.log('  - openid:', unifiedOrderParams.openid)
  console.log('  - out_trade_no:', unifiedOrderParams.out_trade_no)
  
  const sign = generateSign(unifiedOrderParams, apiKey)
  unifiedOrderParams.sign = sign
  console.log('🔧 [WeChatPaySubscription] 生成的签名:', sign)
  
  try {
    // 调用微信支付统一下单API
    console.log('📡 [WeChatPaySubscription] 调用微信支付统一下单API...')
    
    // 这里需要实际的HTTP请求到微信API
    const prepayId = await callWeChatUnifiedOrder(unifiedOrderParams)
    
    if (prepayId) {
      // 生成小程序支付参数
      const timeStamp = Math.floor(Date.now() / 1000).toString()
      const nonceStr = generateNonceStr()
      const packageValue = `prepay_id=${prepayId}`
      const signType = 'MD5'
      
      const payParams = {
        appId: unifiedOrderParams.appid,
        timeStamp: timeStamp,
        nonceStr: nonceStr,
        package: packageValue,
        signType: signType
      }
      
      // 生成支付签名
      const paySign = generatePaySign(payParams, apiKey)
      
      return {
        timeStamp: timeStamp,
        nonceStr: nonceStr,
        package: packageValue,
        signType: signType,
        paySign: paySign,
        prepay_id: prepayId
      }
    } else {
      throw new Error('Failed to get prepay_id from WeChat')
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 微信支付API调用失败:', error)
    console.error('📋 [WeChatPaySubscription] 错误堆栈:', error.stack)

    // 生成详细的错误信息
    let errorMessage = '微信支付API调用失败'

    if (error.message.includes('商户号')) {
      errorMessage = '商户号配置错误，请检查微信支付商户号是否正确'
    } else if (error.message.includes('API密钥')) {
      errorMessage = 'API密钥配置错误，请检查微信支付API密钥(必须32位)'
    } else if (error.message.includes('签名')) {
      errorMessage = '签名验证失败，请检查商户API密钥配置'
    } else if (error.message.includes('IP')) {
      errorMessage = 'IP白名单限制，请在微信商户平台添加云函数出口IP'
    } else if (error.message.includes('openid')) {
      errorMessage = '用户openid无效，请重新登录'
    } else {
      errorMessage = `微信支付API调用失败: ${error.message}`
    }

    // 添加诊断信息
    console.error('🔍 [WeChatPaySubscription] 诊断信息:')
    console.error('  - AppID:', unifiedOrderParams.appid)
    console.error('  - 商户号:', unifiedOrderParams.mch_id)
    console.error('  - API密钥长度:', apiKey.length)
    console.error('  - total_fee:', unifiedOrderParams.total_fee)
    console.error('  - openid:', unifiedOrderParams.openid)

    throw new Error(errorMessage)
  }
}

// 生成随机字符串
function generateNonceStr() {
  return Math.random().toString(36).substr(2, 15)
}

// 生成微信支付签名
function generateSign(params, apiKey) {
  // 1. 参数排序
  const sortedKeys = Object.keys(params).sort()
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  // 2. 拼接API密钥
  const stringSignTemp = `${stringA}&key=${apiKey}`
  
  // 3. MD5加密并转大写
  const crypto = require('crypto')
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase()
}

// 生成小程序支付签名
function generatePaySign(params, apiKey) {
  const sortedKeys = Object.keys(params).sort()
  const stringA = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const stringSignTemp = `${stringA}&key=${apiKey}`
  const crypto = require('crypto')
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase()
}

// 调用微信支付统一下单API（真实实现）
async function callWeChatUnifiedOrder(params) {
  console.log('📡 [WeChatPaySubscription] 调用微信统一下单API')
  console.log('📋 [WeChatPaySubscription] 请求参数:', params)
  
  try {
    // 构建XML请求体
    const xmlBody = buildXMLBody(params)
    console.log('📄 [WeChatPaySubscription] XML请求体:', xmlBody)
    
    // 使用HTTP请求调用微信支付API
    const axios = require('axios')
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlBody, {
      headers: {
        'Content-Type': 'application/xml'
      }
    })
    
    console.log('📡 [WeChatPaySubscription] 微信API响应:', response.data)
    
    // 解析XML响应
    const responseData = parseXMLResponse(response.data)
    console.log('📊 [WeChatPaySubscription] 解析后的响应:', responseData)
    
    // 检查响应结果
    if (responseData.return_code === 'SUCCESS' && responseData.result_code === 'SUCCESS') {
      console.log('✅ [WeChatPaySubscription] 获取prepay_id成功:', responseData.prepay_id)
      return responseData.prepay_id
    } else {
      console.error('❌ [WeChatPaySubscription] 微信支付API返回错误:', responseData)
      throw new Error(`微信支付API错误: ${responseData.err_code_des || responseData.return_msg}`)
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 微信支付API调用失败:', error)
    console.error('📋 [WeChatPaySubscription] 错误详情:', error.response?.data || error.message)

    // 开发环境降级策略
    const isDevelopment = process.env.NODE_ENV !== 'production'

    if (isDevelopment) {
      console.log('⚠️ [WeChatPaySubscription] 开发环境 - 使用模拟prepay_id')
      return `wx${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    } else {
      // 生产环境不降级，直接抛出错误
      console.error('❌ [WeChatPaySubscription] 生产环境 - 支付API调用失败，不能降级')
      throw new Error(`微信支付API调用失败: ${error.response?.data?.err_code_des || error.message}`)
    }
  }
}

// 构建XML请求体
function buildXMLBody(params) {
  const xml = `<xml>
    <appid>${params.appid}</appid>
    <mch_id>${params.mch_id}</mch_id>
    <nonce_str>${params.nonce_str}</nonce_str>
    <body>${params.body}</body>
    <out_trade_no>${params.out_trade_no}</out_trade_no>
    <total_fee>${params.total_fee}</total_fee>
    <spbill_create_ip>${params.spbill_create_ip}</spbill_create_ip>
    <notify_url>${params.notify_url}</notify_url>
    <trade_type>${params.trade_type}</trade_type>
    <openid>${params.openid}</openid>
    <sign>${params.sign}</sign>
  </xml>`
  
  return xml
}

// 解析XML响应
function parseXMLResponse(xmlString) {
  // 简单的XML解析（生产环境建议使用专门的XML解析库）
  const result = {}
  
  // 提取关键字段
  const patterns = {
    return_code: /<return_code><!\[CDATA\[(.*?)\]\]><\/return_code>/,
    result_code: /<result_code><!\[CDATA\[(.*?)\]\]><\/result_code>/,
    prepay_id: /<prepay_id><!\[CDATA\[(.*?)\]\]><\/prepay_id>/,
    err_code_des: /<err_code_des><!\[CDATA\[(.*?)\]\]><\/err_code_des>/,
    return_msg: /<return_msg><!\[CDATA\[(.*?)\]\]><\/return_msg>/
  }
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = xmlString.match(pattern)
    if (match) {
      result[key] = match[1]
    }
  }
  
  return result
}

// ========================================
// 检查配置
// ========================================
async function checkConfig() {
  try {
    const config = {
      appid: process.env.WECHAT_APPID || 'wxf1aca21b5b79581d',
      mchId: process.env.WECHAT_MCH_ID || '1694786758',
      apiKey: process.env.WECHAT_API_KEY || 'mornsciencemornscience2025100705',
      notifyUrl: process.env.NOTIFY_URL || 'https://your-domain.com'
    }
    
    console.log('🔍 [WeChatPaySubscription] 配置检查:', {
      appid: config.appid,
      mchId: config.mchId,
      apiKeyLength: config.apiKey.length,
      notifyUrl: config.notifyUrl
    })
    
    return {
      success: true,
      data: {
        appid: config.appid,
        mchId: config.mchId,
        apiKeyLength: config.apiKey.length,
        notifyUrl: config.notifyUrl,
        isConfigured: config.apiKey.length === 32
      }
    }
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 配置检查失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ========================================
// 清除测试数据（仅用于测试环境）
// ========================================
async function clearTestData(event) {
  const { userInfo } = event
  
  if (!userInfo?.openid) {
    return { success: false, error: 'Missing user info' }
  }
  
  try {
    console.log('🔧 [清除测试数据] 开始清除...', userInfo.openid)
    const _ = db.command
    
    // 1. 删除所有订阅记录
    const subsResult = await db.collection('sitehub_subscriptions').where({
      user_openid: userInfo.openid
    }).remove()
    
    console.log('🗑️ [清除测试数据] 删除订阅记录:', subsResult.stats.removed)
    
    // 2. 删除订阅历史
    const historyResult = await db.collection('sitehub_subscription_history').where({
      user_openid: userInfo.openid
    }).remove()
    
    console.log('🗑️ [清除测试数据] 删除订阅历史:', historyResult.stats.removed)
    
    // 3. 更新用户Pro状态
    const userResult = await db.collection('sitehub_users').where({
      openid: userInfo.openid
    }).update({
      data: {
        is_pro: false,
        subscription_status: 'inactive',
        subscription_expires_at: null,
        updated_at: new Date()
      }
    })
    
    console.log('👤 [清除测试数据] 更新用户状态:', userResult.stats.updated)
    
    // 4. 更新订单状态为已取消
    const orderResult = await db.collection('orders').where({
      userId: userInfo.openid,
      status: _.neq('paid')
    }).update({
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    })
    
    console.log('📦 [清除测试数据] 更新订单状态:', orderResult.stats.updated)
    
    return {
      success: true,
      data: {
        subscriptionsRemoved: subsResult.stats.removed,
        historyRemoved: historyResult.stats.removed,
        usersUpdated: userResult.stats.updated,
        ordersUpdated: orderResult.stats.updated
      },
      message: '测试数据已清除，现在可以重新测试支付了'
    }
    
  } catch (error) {
    console.error('❌ [清除测试数据] 失败:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 测试数据库操作
// ========================================
async function testDatabase() {
  try {
    console.log('🔍 [WeChatPaySubscription] 测试数据库操作...')
    
    // 1. 测试添加记录
    const addResult = await db.collection('sitehub_subscriptions').add({
      data: {
        plan_type: 'test',
        status: 'pending',
        amount: 19.99,
        created_at: new Date(),
        test: true
      }
    })
    
    console.log('✅ [WeChatPaySubscription] 添加记录成功:', addResult._id)
    
    // 2. 测试查询记录
    const queryResult = await db.collection('sitehub_subscriptions').get()
    console.log('📊 [WeChatPaySubscription] 查询记录数量:', queryResult.data.length)
    
    // 3. 删除测试记录
    if (addResult._id) {
      await db.collection('sitehub_subscriptions').doc(addResult._id).remove()
      console.log('✅ [WeChatPaySubscription] 测试记录已删除')
    }
    
    return {
      success: true,
      data: {
        addResult: addResult._id,
        queryCount: queryResult.data.length,
        message: 'Database operations successful'
      }
    }
    
  } catch (error) {
    console.error('❌ [WeChatPaySubscription] 数据库测试失败:', error)
    return {
      success: false,
      error: error.message,
      errCode: error.errCode
    }
  }
}
