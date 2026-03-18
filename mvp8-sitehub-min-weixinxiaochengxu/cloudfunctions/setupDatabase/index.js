// cloudfunctions/setupDatabase/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('🚀 [SetupDatabase] 开始设置数据库集合...')
  
  try {
    const results = []
    
    // 1. 创建价格配置数据
    const pricingResult = await setupPricingData()
    results.push(pricingResult)
    
    // 2. 创建示例订阅数据（可选）
    if (event.createSampleData) {
      const sampleResult = await createSampleData()
      results.push(sampleResult)
    }
    
    console.log('✅ [SetupDatabase] 数据库设置完成')
    
    return {
      success: true,
      message: 'Database setup completed successfully',
      results: results
    }
    
  } catch (error) {
    console.error('❌ [SetupDatabase] 数据库设置失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 设置价格配置数据
async function setupPricingData() {
  console.log('💰 [SetupDatabase] 设置价格配置...')
  
  const pricingData = [
    {
      plan_type: 'personal',
      billing_cycle: 'monthly',
      amount: 19.99,
      currency: 'CNY',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      plan_type: 'personal',
      billing_cycle: 'yearly',
      amount: 168.00,
      currency: 'CNY',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      plan_type: 'team',
      billing_cycle: 'monthly',
      amount: 299.99,
      currency: 'CNY',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      plan_type: 'team',
      billing_cycle: 'yearly',
      amount: 2520.00,
      currency: 'CNY',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]
  
  const results = []
  
  for (const pricing of pricingData) {
    try {
      // 检查是否已存在
      const existing = await db.collection('sitehub_pricing').where({
        plan_type: pricing.plan_type,
        billing_cycle: pricing.billing_cycle
      }).get()
      
      if (existing.data.length === 0) {
        // 不存在则创建
        const result = await db.collection('sitehub_pricing').add({
          data: pricing
        })
        
        results.push({
          action: 'created',
          plan: `${pricing.plan_type}_${pricing.billing_cycle}`,
          amount: pricing.amount,
          id: result._id
        })
        
        console.log(`✅ [SetupDatabase] 价格配置已创建: ${pricing.plan_type} ${pricing.billing_cycle} - ¥${pricing.amount}`)
      } else {
        // 已存在则更新
        await db.collection('sitehub_pricing').doc(existing.data[0]._id).update({
          data: {
            amount: pricing.amount,
            is_active: pricing.is_active,
            updated_at: new Date()
          }
        })
        
        results.push({
          action: 'updated',
          plan: `${pricing.plan_type}_${pricing.billing_cycle}`,
          amount: pricing.amount,
          id: existing.data[0]._id
        })
        
        console.log(`🔄 [SetupDatabase] 价格配置已更新: ${pricing.plan_type} ${pricing.billing_cycle} - ¥${pricing.amount}`)
      }
    } catch (error) {
      console.error(`❌ [SetupDatabase] 价格配置设置失败:`, error)
      results.push({
        action: 'failed',
        plan: `${pricing.plan_type}_${pricing.billing_cycle}`,
        error: error.message
      })
    }
  }
  
  return {
    type: 'pricing',
    results: results
  }
}

// 创建示例数据
async function createSampleData() {
  console.log('📝 [SetupDatabase] 创建示例数据...')
  
  const sampleSubscriptions = [
    {
      plan_type: 'personal',
      billing_cycle: 'monthly',
      status: 'active',
      auto_renew: true,
      wechat_order_id: `sample_order_${Date.now()}_1`,
      amount: 19.99,
      currency: 'CNY',
      start_date: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      cancel_at_period_end: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      plan_type: 'team',
      billing_cycle: 'yearly',
      status: 'active',
      auto_renew: true,
      wechat_order_id: `sample_order_${Date.now()}_2`,
      amount: 2520.00,
      currency: 'CNY',
      start_date: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后
      cancel_at_period_end: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]
  
  const results = []
  
  for (const subscription of sampleSubscriptions) {
    try {
      const result = await db.collection('sitehub_subscriptions').add({
        data: subscription
      })
      
      // 创建对应的历史记录
      await db.collection('sitehub_subscription_history').add({
        data: {
          subscription_id: result._id,
          action: 'created',
          amount: subscription.amount,
          transaction_id: `sample_txn_${Date.now()}`,
          notes: 'Sample subscription data',
          created_at: new Date()
        }
      })
      
      results.push({
        action: 'created',
        plan: `${subscription.plan_type}_${subscription.billing_cycle}`,
        amount: subscription.amount,
        id: result._id
      })
      
      console.log(`✅ [SetupDatabase] 示例订阅已创建: ${subscription.plan_type} ${subscription.billing_cycle} - ¥${subscription.amount}`)
    } catch (error) {
      console.error(`❌ [SetupDatabase] 示例订阅创建失败:`, error)
      results.push({
        action: 'failed',
        plan: `${subscription.plan_type}_${subscription.billing_cycle}`,
        error: error.message
      })
    }
  }
  
  return {
    type: 'sample_data',
    results: results
  }
}






