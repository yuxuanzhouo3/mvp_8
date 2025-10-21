/**
 * 腾讯云 CloudBase 数据库客户端
 * 用于官网国内IP用户的数据存储
 */

import cloudbase from '@cloudbase/js-sdk'

// 延迟初始化，避免SSR错误
let app: any = null
let db: any = null
let auth: any = null

// 只在浏览器端初始化
if (typeof window !== 'undefined') {
  try {
    app = cloudbase.init({
      env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'
    })
    db = app.database()
    auth = app.auth()
  } catch (error) {
    console.error('❌ [CloudBase] 初始化失败:', error)
  }
}

// 导出实例
export { db, auth }
export default app

// 辅助函数：获取集合引用
export function getCollection(collectionName: string) {
  return db.collection(collectionName)
}

// 官网专用集合名称（带web_前缀）
export const COLLECTIONS = {
  USERS: 'web_users',
  FAVORITES: 'web_favorites',
  CUSTOM_SITES: 'web_custom_sites',
  SUBSCRIPTIONS: 'web_subscriptions',
  PAYMENT_TRANSACTIONS: 'web_payment_transactions'
}

