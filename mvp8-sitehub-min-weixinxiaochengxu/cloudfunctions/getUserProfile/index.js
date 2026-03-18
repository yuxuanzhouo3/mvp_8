// cloudfunctions/getUserProfile/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, userInfo } = event
  
  console.log('🔍 [GetUserProfile] Action:', action, 'User:', userInfo?.openid)
  
  try {
    switch (action) {
      case 'getMe':
        return await handleGetMe(userInfo, context)
      case 'updateProfile':
        return await handleUpdateProfile(event, userInfo)
      default:
        return { success: false, error: 'Unknown action', action: action }
    }
  } catch (error) {
    console.error('❌ [GetUserProfile] Error:', error)
    return { success: false, error: error.message }
  }
}

// ========================================
// 统一的 /me 接口 - 单一事实源
// ========================================
async function handleGetMe(userInfo, context) {
  try {
    if (!userInfo?.openid) {
      return {
        success: false,
        error: 'Missing user identity',
        code: 'INVALID_USER'
      }
    }
    
    console.log('📡 [GetUserProfile] 获取用户画像，openid:', userInfo.openid)
    
    // 获取用户基础信息
    const userResult = await db.collection('sitehub_users')
      .where({ openid: userInfo.openid })
      .limit(1)
      .get()
    
    let user = null
    if (userResult.data && userResult.data.length > 0) {
      user = userResult.data[0]
    } else {
      // 用户不存在，创建新用户
      user = await createNewUser(userInfo)
    }
    
    // 获取权益信息（会员状态）
    const entitlement = await getUserEntitlement(user.openid)
    
    // 构建统一的用户画像
    const meResponse = {
      userId: user.userId || user._id,
      openid: user.openid,
      profile: {
        nickname: user.nickname || userInfo.nickName || 'User',
        avatar: user.avatar_url || userInfo.avatarUrl || '',
        createdAt: user.created_at || user.createdAt
      },
      entitlement: {
        plan: entitlement.plan || 'free',
        status: entitlement.status || 'free',
        expiresAt: entitlement.expiresAt || null,
        source: entitlement.source || null,
        version: Date.now() // 简单版本号
      }
    }
    
    console.log('✅ [GetUserProfile] 用户画像获取成功:', {
      userId: meResponse.userId,
      plan: meResponse.entitlement.plan,
      status: meResponse.entitlement.status,
      version: meResponse.entitlement.version
    })
    
    return {
      success: true,
      data: meResponse
    }
    
  } catch (error) {
    console.error('❌ [GetUserProfile] 获取用户画像失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ========================================
// 获取用户权益信息（会员状态）
// ========================================
async function getUserEntitlement(openid) {
  try {
    // 查询活跃订阅
    const subscriptionResult = await db.collection('sitehub_subscriptions')
      .where({ 
        user_openid: openid,
        status: 'active'
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
    
    if (subscriptionResult.data && subscriptionResult.data.length > 0) {
      const subscription = subscriptionResult.data[0]
      const now = new Date()
      const expiresAt = new Date(subscription.current_period_end)
      
      let status = 'active'
      if (expiresAt < now) {
        status = 'expired'
      } else if (subscription.cancel_at_period_end) {
        status = 'grace'
      }
      
      return {
        plan: subscription.plan_type === 'personal' ? 'pro' : 'team',
        status: status,
        expiresAt: subscription.current_period_end,
        source: 'wechat_pay'
      }
    }
    
    // 检查本地用户状态（临时兼容）
    const userResult = await db.collection('sitehub_users')
      .where({ openid: openid })
      .limit(1)
      .get()
    
    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0]
      if (user.pro || user.isPro) {
        return {
          plan: 'pro',
          status: 'active',
          expiresAt: null,
          source: 'legacy'
        }
      }
    }
    
    return {
      plan: 'free',
      status: 'free',
      expiresAt: null,
      source: null
    }
    
  } catch (error) {
    console.error('❌ [GetUserProfile] 获取权益信息失败:', error)
    return {
      plan: 'free',
      status: 'unknown',
      expiresAt: null,
      source: null
    }
  }
}

// ========================================
// 创建新用户
// ========================================
async function createNewUser(userInfo) {
  const now = new Date()
  
  // 生成用户ID
  const generateUserId = () => {
    const min = 100000
    const max = 999999
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  const newUser = {
    openid: userInfo.openid,
    userId: generateUserId(),
    nickname: userInfo.nickName || 'User',
    avatar_url: userInfo.avatarUrl || '',
    region: 'international',
    created_at: now.toISOString(),
    last_login: now.toISOString(),
    // 重置会员状态
    pro: false,
    isPro: false,
    memberType: 'free',
    memberStatus: 'free'
  }
  
  const result = await db.collection('sitehub_users').add({
    data: newUser
  })
  
  console.log('✅ [GetUserProfile] 新用户创建成功:', newUser.userId)
  
  return {
    ...newUser,
    _id: result._id
  }
}

// ========================================
// 更新用户资料
// ========================================
async function handleUpdateProfile(event, userInfo) {
  try {
    const { nickname, avatar } = event
    
    if (!userInfo?.openid) {
      return { success: false, error: 'Missing user identity' }
    }
    
    const updateData = {}
    if (nickname) updateData.nickname = nickname
    if (avatar) updateData.avatar_url = avatar
    updateData.updated_at = new Date().toISOString()
    
    await db.collection('sitehub_users')
      .where({ openid: userInfo.openid })
      .update({ data: updateData })
    
    console.log('✅ [GetUserProfile] 用户资料更新成功')
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ [GetUserProfile] 更新用户资料失败:', error)
    return { success: false, error: error.message }
  }
}





