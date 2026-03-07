import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import cloudbase from '@cloudbase/node-sdk'
import { verifyChinaEmailVerificationCode } from '@/lib/auth/china-email-code'
import { resolveDeploymentRegion } from '@/lib/config/deployment-region'
import { bindReferralFromRequest } from '@/lib/market/referrals'

// 服务器端Supabase客户端（无需localStorage）
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

/**
 * 邮箱登录/注册API
 * 根据环境变量选择数据库：
 * - NEXT_PUBLIC_DEPLOYMENT_REGION=china → 腾讯云CloudBase
 * - NEXT_PUBLIC_DEPLOYMENT_REGION=overseas → Supabase
 */

// 从环境变量读取部署区域（默认为国内版）
const DEPLOYMENT_REGION = resolveDeploymentRegion()
const IS_CHINA_DEPLOYMENT = DEPLOYMENT_REGION === 'CN'

// 国内部署认证（使用腾讯云CloudBase数据库）
async function cloudbaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    console.log('[国内部署] 使用腾讯云CloudBase数据库')

    // 初始化CloudBase
    const app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID!,
      secretId: process.env.CLOUDBASE_SECRET_ID!,
      secretKey: process.env.CLOUDBASE_SECRET_KEY!
    })

    const db = app.database()
    const usersCollection = db.collection('web_users')

    if (mode === 'signup') {
      // 检查邮箱是否已存在
      const existingUser = await usersCollection.where({ email }).get()
      if (existingUser.data && existingUser.data.length > 0) {
        return { error: '该邮箱已被注册' }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10)

      // 创建新用户
      const newUser = {
        email,
        password: hashedPassword,
        name: email.includes('@') ? email.split('@')[0] : email,
        pro: false,
        region: 'china',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await usersCollection.add(newUser)

      return {
        user: {
          id: result.id,
          email,
          name: newUser.name,
          pro: false,
          region: 'china'
        }
      }
    } else {
      // 登录：查找用户
      const userResult = await usersCollection.where({ email }).get()

      if (!userResult.data || userResult.data.length === 0) {
        return { error: '用户不存在或密码错误' }
      }

      const user = userResult.data[0]

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return { error: '用户不存在或密码错误' }
      }

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          pro: user.pro || false,
          region: 'china'
        }
      }
    }
  } catch (error) {
    console.error('国内用户认证错误:', error)
    return { error: '认证失败，请稍后重试' }
  }
}

// 海外部署认证（Supabase，region标记为overseas）
async function supabaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    console.log('[海外部署] 使用Supabase存储，region标记为overseas')

    const supabase = createServerClient()

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            region: 'overseas', // 标记为海外用户
            full_name: email.split('@')[0],
          }
        }
      })

      if (error) {
        console.error('海外用户注册错误:', error)
        return { error: error.message }
      }

      if (!data.user) {
        return { error: 'Registration failed' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          pro: false,
          region: 'overseas'
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('海外用户登录错误:', error)
        return { error: error.message }
      }

      if (!data.user) {
        return { error: 'Login failed' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          pro: data.user.user_metadata?.pro || false,
          region: data.user.user_metadata?.region || 'overseas'
        }
      }
    }
  } catch (error) {
    console.error('海外用户认证错误:', error)
    return { error: 'Authentication failed' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, mode, verificationCode } = await request.json()
    const authMode = mode === 'signup' ? 'signup' : mode === 'login' ? 'login' : null

    if (!authMode) {
      return NextResponse.json(
        { error: '不支持的认证操作' },
        { status: 400 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    console.log(`📍 部署区域: ${DEPLOYMENT_REGION} → ${IS_CHINA_DEPLOYMENT ? '🇨🇳 国内版' : '🌍 海外版'}`)

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少6位' },
        { status: 400 }
      )
    }

    if (IS_CHINA_DEPLOYMENT && authMode === 'signup') {
      if (!verificationCode || !/^\d{6}$/.test(String(verificationCode))) {
        return NextResponse.json(
          { error: '请输入6位邮箱验证码' },
          { status: 400 }
        )
      }

      const verifyResult = await verifyChinaEmailVerificationCode({
        email: normalizedEmail,
        purpose: 'signup',
        code: String(verificationCode),
      })

      if (!verifyResult.success) {
        return NextResponse.json(
          { error: verifyResult.error || '验证码错误或已过期，请重新获取' },
          { status: 400 }
        )
      }
    }

    // 根据环境变量选择认证方式
    let result
    if (IS_CHINA_DEPLOYMENT) {
      console.log('🔐 [国内版] 使用CloudBase数据库')
      result = await cloudbaseEmailAuth(normalizedEmail, password, authMode)
    } else {
      console.log('🔐 [海外版] 使用Supabase数据库')
      result = await supabaseEmailAuth(normalizedEmail, password, authMode)
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    if (authMode === 'signup' && result.user?.id) {
      await bindReferralFromRequest({
        request,
        invitedUserId: String(result.user.id),
        invitedEmail: normalizedEmail,
      }).catch((error) => {
        console.warn('[Referral] bind failed after signup:', error)
      })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      database: IS_CHINA_DEPLOYMENT ? 'cloudbase' : 'supabase',
      region: IS_CHINA_DEPLOYMENT ? 'china' : 'overseas'
    })

  } catch (error) {
    console.error('邮箱认证API错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
