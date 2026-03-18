// cloudfunctions/initSubscriptionDB/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('🔄 [InitSubscriptionDB] 开始初始化订阅数据库...')
  
  try {
    // 1. 初始化价格配置
    await initPricingData()
    
    // 2. 迁移现有用户数据
    await migrateExistingUsers()
    
    console.log('✅ [InitSubscriptionDB] 数据库初始化完成')
    
    return {
      success: true,
      message: 'Database initialization completed successfully'
    }
    
  } catch (error) {
    console.error('❌ [InitSubscriptionDB] 数据库初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 初始化价格配置
async function initPricingData() {
  console.log('📊 [InitSubscriptionDB] 初始化价格配置...')
  
  const pricingData = [
    { plan_type: 'personal', billing_cycle: 'monthly', amount: 19.99, currency: 'CNY', is_active: true },
    { plan_type: 'personal', billing_cycle: 'yearly', amount: 168.00, currency: 'CNY', is_active: true },
    { plan_type: 'team', billing_cycle: 'monthly', amount: 299.99, currency: 'CNY', is_active: true },
    { plan_type: 'team', billing_cycle: 'yearly', amount: 2520.00, currency: 'CNY', is_active: true }
  ]
  
  for (const pricing of pricingData) {
    try {
      // 检查是否已存在
      const existing = await db.collection('sitehub_pricing').where({
        plan_type: pricing.plan_type,
        billing_cycle: pricing.billing_cycle
      }).get()
      
      if (existing.data.length === 0) {
        // 不存在则创建
        await db.collection('sitehub_pricing').add({
          data: {
            ...pricing,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        console.log(`✅ [InitSubscriptionDB] 价格配置已创建: ${pricing.plan_type} ${pricing.billing_cycle}`)
      } else {
        console.log(`⚠️ [InitSubscriptionDB] 价格配置已存在: ${pricing.plan_type} ${pricing.billing_cycle}`)
      }
    } catch (error) {
      console.error(`❌ [InitSubscriptionDB] 创建价格配置失败:`, error)
    }
  }
}

// 迁移现有用户数据
async function migrateExistingUsers() {
  console.log('👥 [InitSubscriptionDB] 迁移现有用户数据...')
  
  try {
    // 获取所有现有用户
    const users = await db.collection('sitehub_users').get()
    console.log(`📊 [InitSubscriptionDB] 找到 ${users.data.length} 个用户`)
    
    for (const user of users.data) {
      try {
        // 检查是否已有订阅记录
        const existingSubscription = await db.collection('sitehub_subscriptions').where({
          _openid: user.openid,
          status: 'active'
        }).get()
        
        if (existingSubscription.data.length === 0 && user.is_pro) {
          // 为Pro用户创建订阅记录
          await db.collection('sitehub_subscriptions').add({
            data: {
              plan_type: 'personal',
              billing_cycle: 'monthly',
              status: 'active',
              auto_renew: false, // 默认不自动续费，需要用户重新购买
              amount: 19.99,
              currency: 'CNY',
              start_date: user.created_at || new Date(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
              cancel_at_period_end: true, // 标记为到期取消
              created_at: new Date(),
              updated_at: new Date()
            }
          })
          
          // 记录迁移历史
          await db.collection('sitehub_subscription_history').add({
            data: {
              user_id: user.openid,
              action: 'migrated',
              amount: 19.99,
              transaction_id: `migration_${Date.now()}`,
              notes: 'Migrated from legacy Pro status',
              created_at: new Date()
            }
          })
          
          console.log(`✅ [InitSubscriptionDB] 用户迁移完成: ${user.nickname || user.openid}`)
        }
      } catch (error) {
        console.error(`❌ [InitSubscriptionDB] 用户迁移失败:`, error)
      }
    }
  } catch (error) {
    console.error('❌ [InitSubscriptionDB] 迁移用户数据失败:', error)
  }
}






