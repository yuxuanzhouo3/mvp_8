import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import cloudbase from '@cloudbase/node-sdk'

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

// 国内用户认证（暂时使用Supabase，添加region标记区分）
async function cloudbaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    // TODO: 等待CloudBase API密钥后切换到真实腾讯云数据库
    // 暂时使用Supabase，通过metadata中的region字段标记为china
    console.log('[国内用户] 使用Supabase存储，region标记为china')

    const supabase = createServerClient()

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            region: 'china', // 标记为国内用户
            full_name: email.split('@')[0],
          }
        }
      })

      if (error) {
        console.error('国内用户注册错误:', error)
        return { error: error.message.includes('already') ? '该邮箱已被注册' : '注册失败，请稍后重试' }
      }

      if (!data.user) {
        return { error: '注册失败，请稍后重试' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          pro: false,
          region: 'china'
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('国内用户登录错误:', error)
        return { error: '用户不存在或密码错误' }
      }

      if (!data.user) {
        return { error: '登录失败，请稍后重试' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          pro: false,
          region: data.user.user_metadata?.region || 'china'
        }
      }
    }
  } catch (error) {
    console.error('国内用户认证错误:', error)
    return { error: '认证失败，请稍后重试' }
  }
}

// 海外用户认证（Supabase，region标记为overseas）
async function supabaseEmailAuth(email: string, password: string, mode: 'login' | 'signup') {
  try {
    console.log('[海外用户] 使用Supabase存储，region标记为overseas')

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
          pro: false,
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
      // 国内IP用户：仅允许登录，禁止注册
      if (mode === 'signup') {
        console.log('🔐 [国内IP] 注册功能暂时关闭')
        return NextResponse.json({
          error: '国内用户注册功能正在配置中，请使用已有账号登录。如需测试请联系客服 mornscience@gmail.com',
          needCloudBase: true
        }, { status: 503 })
      }

      // 允许登录：使用测试账号
      console.log('🔐 [国内IP] 使用测试账号登录')

      // 测试账号验证
      const TEST_ACCOUNT = {
        email: '123',
        password: '123'
      }

      if (email === TEST_ACCOUNT.email && password === TEST_ACCOUNT.password) {
        result = {
          user: {
            id: 'test-user-china-001',
            email: '123@test.com',
            name: '测试用户',
            pro: false,
            region: 'china'
          }
        }
      } else {
        return NextResponse.json({
          error: '账号或密码错误。测试账号：123 密码：123'
        }, { status: 401 })
      }
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
