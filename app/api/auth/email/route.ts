import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'
import cloudbase from '@cloudbase/node-sdk'

/**
 * 邮箱登录/注册API
 * 根据IP自动选择数据库：
 * - 国内IP → 腾讯云CloudBase
 * - 海外IP → Supabase
 */

// 获取客户端IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  return '8.8.8.8'
}

// 检测是否为中国IP
async function isChineseIP(ip: string): Promise<boolean> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`)
    const data = await response.json()
    return data.countryCode === 'CN'
  } catch (error) {
    console.error('IP检测失败:', error)
    return false // 默认为海外
  }
}

// 腾讯云邮箱登录（使用服务器端SDK）
async function cloudbaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    // 初始化腾讯云CloudBase服务器端SDK
    const app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'
    })

    const db = app.database()
    const COLLECTIONS = {
      USERS: 'web_users'
    }

    console.log('✅ [CloudBase服务器端] 使用真实的腾讯云数据库')

    if (mode === 'signup') {
      // 注册：检查用户是否存在
      const existingUser = await db.collection(COLLECTIONS.USERS)
        .where({ email })
        .get()

      if (existingUser.data && existingUser.data.length > 0) {
        return { error: '该邮箱已被注册' }
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10)

      // 创建用户
      const result = await db.collection(COLLECTIONS.USERS).add({
        email,
        password: hashedPassword,
        name: email.split('@')[0],
        created_at: db.serverDate(),
        updated_at: db.serverDate(),
        pro: false,
        email_verified: false
      })

      return {
        user: {
          id: result.id,
          email,
          name: email.split('@')[0],
          pro: false
        }
      }
    } else {
      // 登录：查找用户
      const userResult = await db.collection(COLLECTIONS.USERS)
        .where({ email })
        .get()

      if (!userResult.data || userResult.data.length === 0) {
        return { error: '用户不存在' }
      }

      const user = userResult.data[0]

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return { error: '密码错误' }
      }

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name || email.split('@')[0],
          pro: user.pro || false
        }
      }
    }
  } catch (error) {
    console.error('腾讯云CloudBase认证错误:', error)
    return { error: '认证失败，请稍后重试' }
  }
}

// Supabase邮箱登录
async function supabaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          pro: false,
          emailConfirmed: !!data.user.email_confirmed_at
        } : null
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          pro: false
        } : null
      }
    }
  } catch (error) {
    console.error('Supabase认证错误:', error)
    return { error: '认证失败，请稍后重试' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, mode } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少6位' },
        { status: 400 }
      )
    }

    // 检测IP
    const clientIP = getClientIP(request)
    const isChina = await isChineseIP(clientIP)

    console.log(`📍 IP检测: ${clientIP} → ${isChina ? '🇨🇳 国内' : '🌍 海外'}`)

    // 根据IP选择认证方式
    let result
    if (isChina) {
      console.log('🔐 使用腾讯云CloudBase认证')
      result = await cloudbaseEmailAuth(email, password, mode as 'login' | 'signup')
    } else {
      console.log('🔐 使用Supabase认证')
      result = await supabaseEmailAuth(email, password, mode as 'login' | 'signup')
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      database: isChina ? 'cloudbase' : 'supabase',
      region: isChina ? 'china' : 'overseas'
    })

  } catch (error) {
    console.error('邮箱认证API错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
