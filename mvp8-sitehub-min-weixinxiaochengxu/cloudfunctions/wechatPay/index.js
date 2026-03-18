// cloudfunctions/wechatPay/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('🔄 [WeChatPay] 开始处理支付请求:', event)
  
  const { planType, billingCycle, amount } = event
  
  try {
    // 获取用户信息
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        error: '无法获取用户OpenID'
      }
    }
    
    console.log('👤 [WeChatPay] 用户OpenID:', openid)
    
    // 生成订单号
    const orderNo = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 计算价格
    const finalAmount = amount || getPriceByPlan(planType, billingCycle)
    
    console.log('💰 [WeChatPay] 订单信息:', {
      orderNo,
      planType,
      billingCycle,
      amount: finalAmount,
      openid
    })
    
    // 保存订单记录
    const orderData = {
      orderNo: orderNo,
      userId: openid,
      planType: planType,
      billingCycle: billingCycle,
      amount: finalAmount,
      currency: 'CNY',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('💾 [WeChatPay] 保存订单记录:', orderData)
    
    const orderResult = await db.collection('orders').add({
      data: orderData
    })
    
    console.log('✅ [WeChatPay] 订单记录已保存:', orderResult._id)
    
    // 🎯 临时测试版本：返回简单的支付参数
    console.log('🧪 [WeChatPay] 使用测试模式...')
    
    const testPayment = {
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: generateNonceStr(),
      package: `prepay_id=test_prepay_${orderNo}`,
      signType: 'MD5',
      paySign: generateTestSign(orderNo)
    }
    
    console.log('✅ [WeChatPay] 测试支付参数:', testPayment)
    
    return {
      success: true,
      data: {
        payment: testPayment,
        orderNo: orderNo
      }
    }
    
    // 🎯 关键：生成真实的微信支付参数
    console.log('💳 [WeChatPay] 准备调用微信支付API...')
    
    // 微信支付统一下单参数
    const unifiedOrderParams = {
      appid: 'wxf1aca21b5b79581d', // 你的小程序AppID
      mch_id: '1694786758', // 你的商户号
      nonce_str: generateNonceStr(),
      body: `SiteHub ${planType === 'pro' ? 'Pro' : 'Team'} ${billingCycle === 'monthly' ? '月付' : '年付'}`,
      out_trade_no: orderNo,
      total_fee: Math.round(finalAmount * 100).toString(), // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: 'https://your-domain.com/api/wechat-pay-notify',
      trade_type: 'JSAPI',
      openid: openid
    }
    
    // 生成签名
    const apiKey = 'mornsciencemornscience2025100705'
    const sign = generateSign(unifiedOrderParams, apiKey)
    unifiedOrderParams.sign = sign
    
    console.log('🔧 [WeChatPay] 统一下单参数:', unifiedOrderParams)
    
    try {
      // 调用微信支付统一下单API
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
        
        const payment = {
          timeStamp: timeStamp,
          nonceStr: nonceStr,
          package: packageValue,
          signType: signType,
          paySign: paySign
        }
        
        console.log('✅ [WeChatPay] 支付参数生成成功:', payment)
        
        return {
          success: true,
          data: {
            payment: payment,
            orderNo: orderNo
          }
        }
      } else {
        throw new Error('获取prepay_id失败')
      }
      
    } catch (error) {
      console.error('❌ [WeChatPay] 微信支付API调用失败:', error)
      
      // 返回错误信息
      return {
        success: false,
        error: `微信支付API调用失败: ${error.message}`
      }
    }
    
  } catch (error) {
    console.error('❌ [WeChatPay] 处理失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 根据套餐获取价格
 */
function getPriceByPlan(planType, billingCycle) {
  const pricing = {
    pro: {
      monthly: 19.99,
      yearly: 168.00
    },
    team: {
      monthly: 299.99,
      yearly: 2520.00
    }
  }
  
  return pricing[planType]?.[billingCycle] || 19.99
}

/**
 * 生成随机字符串
 */
function generateNonceStr() {
  return Math.random().toString(36).substr(2, 15)
}

/**
 * 生成微信支付签名
 */
function generateSign(params, apiKey) {
  // 过滤空值并排序
  const filteredParams = Object.keys(params)
    .filter(key => params[key] !== '' && params[key] != null)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {})
  
  // 构建签名字符串
  const signStr = Object.keys(filteredParams)
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&') + `&key=${apiKey}`
  
  // MD5加密
  const crypto = require('crypto')
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase()
}

/**
 * 生成支付签名
 */
function generatePaySign(params, apiKey) {
  return generateSign(params, apiKey)
}

/**
 * 调用微信支付统一下单API
 */
async function callWeChatUnifiedOrder(params) {
  const axios = require('axios')
  
  // 构建XML请求体
  const xmlData = buildXML(params)
  
  try {
    console.log('📡 [WeChatPay] 调用微信统一下单API...')
    
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000
    })
    
    console.log('📡 [WeChatPay] 微信API响应:', response.data)
    
    // 解析XML响应
    const result = parseXML(response.data)
    
    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      console.log('✅ [WeChatPay] 统一下单成功:', result.prepay_id)
      return result.prepay_id
    } else {
      console.error('❌ [WeChatPay] 统一下单失败:', result)
      throw new Error(result.err_code_des || result.return_msg || '统一下单失败')
    }
    
  } catch (error) {
    console.error('❌ [WeChatPay] 微信API调用失败:', error)
    throw error
  }
}

/**
 * 构建XML请求体
 */
function buildXML(params) {
  let xml = '<xml>'
  Object.keys(params).forEach(key => {
    xml += `<${key}><![CDATA[${params[key]}]]></${key}>`
  })
  xml += '</xml>'
  return xml
}

/**
 * 解析XML响应
 */
function parseXML(xml) {
  const result = {}
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g
  let match
  
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2]
  }
  
  return result
}