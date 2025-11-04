import type { NextApiRequest, NextApiResponse } from 'next'
import cloudbase from '@cloudbase/node-sdk'
import jwt from 'jsonwebtoken'

/**
 * 国内用户收藏功能 API（使用已有依赖，不引入新包）
 */

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-development-only')
  } catch (error) {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded?.userId) {
      return res.status(401).json({ success: false, message: 'Token无效' })
    }

    const userId = decoded.userId

    // 初始化 CloudBase（使用已有依赖）
    const app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID!,
      secretId: process.env.CLOUDBASE_SECRET_ID!,
      secretKey: process.env.CLOUDBASE_SECRET_KEY!
    })

    const db = app.database()
    const collection = db.collection('web_favorites')

    // GET: 获取收藏列表
    if (req.method === 'GET') {
      const result = await collection.where({ user_id: userId }).get()
      return res.status(200).json({
        success: true,
        favorites: result.data.map((f: any) => f.site_id)
      })
    }

    // POST: 添加收藏
    if (req.method === 'POST') {
      const { siteId } = req.body
      if (!siteId) {
        return res.status(400).json({ success: false, message: '缺少siteId' })
      }

      await collection.add({
        user_id: userId,
        site_id: siteId,
        created_at: new Date()
      })

      return res.status(200).json({ success: true })
    }

    // DELETE: 删除收藏
    if (req.method === 'DELETE') {
      const { siteId } = req.body
      if (!siteId) {
        return res.status(400).json({ success: false, message: '缺少siteId' })
      }

      await collection.where({ user_id: userId, site_id: siteId }).remove()
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API错误:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
