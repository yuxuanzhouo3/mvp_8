import type { NextApiRequest, NextApiResponse } from 'next'
import cloudbase from '@cloudbase/node-sdk'
import * as jwt from 'jsonwebtoken'

/**
 * 国内用户收藏功能 API
 * 使用腾讯云 CloudBase Node.js SDK
 *
 * 支持操作：
 * - GET: 获取收藏列表
 * - POST: 添加收藏
 * - DELETE: 删除收藏
 */

// 验证 JWT Token
function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key-for-development-only'
    )
    return decoded
  } catch (error) {
    console.error('Token 验证失败:', error)
    return null
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 验证 Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证 Token'
      })
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Token 无效或已过期'
      })
    }

    const userId = decoded.userId

    // 初始化 CloudBase
    const app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID!,
      secretId: process.env.CLOUDBASE_SECRET_ID!,
      secretKey: process.env.CLOUDBASE_SECRET_KEY!
    })

    const db = app.database()
    const favoritesCollection = db.collection('web_favorites')

    // GET: 获取收藏列表
    if (req.method === 'GET') {
      try {
        const result = await favoritesCollection
          .where({ user_id: userId })
          .get()

        console.log(`✅ [CloudBase] 获取收藏成功: 用户=${userId}, 数量=${result.data.length}`)

        return res.status(200).json({
          success: true,
          favorites: result.data.map((f: any) => f.site_id)
        })
      } catch (error: any) {
        console.error('❌ [CloudBase] 获取收藏失败:', error)
        return res.status(500).json({
          success: false,
          message: error.message || '获取收藏失败'
        })
      }
    }

    // POST: 添加收藏
    if (req.method === 'POST') {
      const { siteId } = req.body

      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: '缺少 siteId 参数'
        })
      }

      try {
        // 检查是否已收藏
        const existing = await favoritesCollection
          .where({
            user_id: userId,
            site_id: siteId
          })
          .get()

        if (existing.data && existing.data.length > 0) {
          return res.status(400).json({
            success: false,
            message: '已经收藏过该网站'
          })
        }

        // 添加收藏
        await favoritesCollection.add({
          user_id: userId,
          site_id: siteId,
          created_at: new Date()
        })

        console.log(`✅ [CloudBase] 添加收藏成功: 用户=${userId}, 网站=${siteId}`)

        return res.status(200).json({
          success: true,
          message: '收藏成功'
        })
      } catch (error: any) {
        console.error('❌ [CloudBase] 添加收藏失败:', error)
        return res.status(500).json({
          success: false,
          message: error.message || '添加收藏失败'
        })
      }
    }

    // DELETE: 删除收藏
    if (req.method === 'DELETE') {
      const { siteId } = req.body

      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: '缺少 siteId 参数'
        })
      }

      try {
        await favoritesCollection
          .where({
            user_id: userId,
            site_id: siteId
          })
          .remove()

        console.log(`✅ [CloudBase] 删除收藏成功: 用户=${userId}, 网站=${siteId}`)

        return res.status(200).json({
          success: true,
          message: '取消收藏成功'
        })
      } catch (error: any) {
        console.error('❌ [CloudBase] 删除收藏失败:', error)
        return res.status(500).json({
          success: false,
          message: error.message || '删除收藏失败'
        })
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })

  } catch (error: any) {
    console.error('❌ [API] 服务器错误:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    })
  }
}
