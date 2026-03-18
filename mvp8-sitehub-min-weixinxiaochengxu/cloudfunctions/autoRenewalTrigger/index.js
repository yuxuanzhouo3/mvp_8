// cloudfunctions/autoRenewalTrigger/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('🔄 [AutoRenewalTrigger] 定时任务开始执行...')
  
  try {
    // 调用微信支付订阅云函数处理自动续费
    const result = await cloud.callFunction({
      name: 'wechatPaySubscription',
      data: {
        action: 'processAutoRenewal'
      }
    })
    
    console.log('✅ [AutoRenewalTrigger] 自动续费处理结果:', result.result)
    
    return {
      success: true,
      data: result.result,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ [AutoRenewalTrigger] 定时任务执行失败:', error)
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}






