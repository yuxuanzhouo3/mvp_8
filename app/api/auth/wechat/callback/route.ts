import { NextRequest, NextResponse } from 'next/server'
import { db as cloudbaseDB } from '@/lib/database/cloudbase-client'

/**
 * 微信网页授权回调
 * 文档：https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
 */
export async function GET(req: NextRequest) {
  try {
    // 检查微信登录是否已配置
    if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
      console.log('⚠️ [WeChat] 微信登录未配置，重定向到首页')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/?error=wechat_not_configured`
      )
    }
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/?error=wechat_auth_failed`
      )
    }

    // 通过code获取access_token
    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?` +
      `appid=${process.env.WECHAT_APP_ID}&` +
      `secret=${process.env.WECHAT_APP_SECRET}&` +
      `code=${code}&` +
      `grant_type=authorization_code`
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.errcode) {
      console.error('❌ 获取微信access_token失败:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/?error=wechat_token_failed`
      )
    }

    const { access_token, openid, refresh_token } = tokenData

    // 获取用户信息
    const userInfoResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?` +
      `access_token=${access_token}&` +
      `openid=${openid}&` +
      `lang=zh_CN`
    )

    const userInfo = await userInfoResponse.json()

    if (userInfo.errcode) {
      console.error('❌ 获取微信用户信息失败:', userInfo)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/?error=wechat_userinfo_failed`
      )
    }

    console.log('✅ 微信用户信息:', userInfo)

    // 保存/更新用户信息到腾讯云数据库
    try {
      // 查询是否已存在
      const existingUser = await cloudbaseDB
        .collection('web_users')
        .where({
          _openid: openid,
        })
        .get()

      const userData = {
        _openid: openid,
        nickname: userInfo.nickname,
        avatar: userInfo.headimgurl,
        province: userInfo.province,
        city: userInfo.city,
        country: userInfo.country,
        sex: userInfo.sex,
        updated_at: new Date(),
      }

      if (existingUser.data && existingUser.data.length > 0) {
        // 更新现有用户
        await cloudbaseDB
          .collection('web_users')
          .doc(existingUser.data[0]._id)
          .update(userData)
        
        console.log('✅ 更新微信用户成功')
      } else {
        // 创建新用户
        await cloudbaseDB
          .collection('web_users')
          .add({
            ...userData,
            created_at: new Date(),
          })
        
        console.log('✅ 创建微信用户成功')
      }

      // 重定向回首页，并传递登录信息
      // 注意：这里简化处理，实际应该创建session或JWT
      const redirectUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL!)
      redirectUrl.searchParams.set('wechat_login', 'success')
      redirectUrl.searchParams.set('openid', openid)
      redirectUrl.searchParams.set('nickname', encodeURIComponent(userInfo.nickname))

      return NextResponse.redirect(redirectUrl.toString())
    } catch (error) {
      console.error('❌ 保存微信用户信息失败:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/?error=save_user_failed`
      )
    }
  } catch (error: any) {
    console.error('❌ 微信登录回调处理失败:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/?error=wechat_callback_failed`
    )
  }
}

/**
 * 发起微信网页授权
 * 前端调用此接口跳转到微信授权页面
 */
export async function POST(req: NextRequest) {
  try {
    const { redirectUrl } = await req.json()

    const appid = process.env.WECHAT_APP_ID
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/wechat/callback`
    const state = Math.random().toString(36).substr(2)

    // 构造微信授权URL
    const authUrl = 
      `https://open.weixin.qq.com/connect/oauth2/authorize?` +
      `appid=${appid}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=snsapi_userinfo&` +
      `state=${state}#wechat_redirect`

    return NextResponse.json({
      success: true,
      authUrl,
    })
  } catch (error: any) {
    console.error('❌ 构造微信授权URL失败:', error)
    return NextResponse.json(
      { error: '构造授权URL失败' },
      { status: 500 }
    )
  }
}
