/**
 * 腾讯云 CloudBase 数据库客户端
 * 用于官网国内IP用户的数据存储
 */

import cloudbase from '@cloudbase/js-sdk'

// 初始化腾讯云
const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || 'cloudbase-1gnip2iaa08260e5'
})

// 数据库实例
export const db = app.database()

// 认证实例
export const auth = app.auth()

// 导出app实例
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

