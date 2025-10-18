/**
 * 腾讯云 CloudBase 数据库适配器
 * 用于官网国内IP用户的数据存储
 */

import { db, COLLECTIONS } from './cloudbase-client'

/**
 * CloudBase适配器类
 */
export class CloudBaseAdapter {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // ==========================================
  // 收藏功能
  // ==========================================

  async getFavorites(): Promise<string[]> {
    try {
      const res = await db.collection(COLLECTIONS.FAVORITES)
        .where({ user_id: this.userId })
        .get()
      
      console.log('✅ [DB-腾讯云] 获取收藏:', res.data.length)
      return res.data.map((f: any) => f.site_id)
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取收藏失败:', error)
      return []
    }
  }

  async addFavorite(siteId: string): Promise<boolean> {
    try {
      await db.collection(COLLECTIONS.FAVORITES).add({
        user_id: this.userId,
        site_id: siteId,
        created_at: new Date()
      })
      
      console.log('✅ [DB-腾讯云] 添加收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 添加收藏失败:', error)
      return false
    }
  }

  async removeFavorite(siteId: string): Promise<boolean> {
    try {
      await db.collection(COLLECTIONS.FAVORITES)
        .where({
          user_id: this.userId,
          site_id: siteId
        })
        .remove()
      
      console.log('✅ [DB-腾讯云] 删除收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 删除收藏失败:', error)
      return false
    }
  }

  // ==========================================
  // 自定义网站功能
  // ==========================================

  async getCustomSites(): Promise<any[]> {
    try {
      const res = await db.collection(COLLECTIONS.CUSTOM_SITES)
        .where({ user_id: this.userId })
        .orderBy('created_at', 'desc')
        .get()
      
      console.log('✅ [DB-腾讯云] 获取自定义网站:', res.data.length)
      return res.data
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取自定义网站失败:', error)
      return []
    }
  }

  async addCustomSite(site: any): Promise<boolean> {
    try {
      await db.collection(COLLECTIONS.CUSTOM_SITES).add({
        user_id: this.userId,
        name: site.name,
        url: site.url,
        logo: site.logo,
        category: site.category,
        description: site.description || '',
        created_at: new Date(),
        updated_at: new Date()
      })
      
      console.log('✅ [DB-腾讯云] 添加自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 添加自定义网站失败:', error)
      return false
    }
  }

  async removeCustomSite(siteId: string): Promise<boolean> {
    try {
      await db.collection(COLLECTIONS.CUSTOM_SITES)
        .doc(siteId)
        .remove()
      
      console.log('✅ [DB-腾讯云] 删除自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 删除自定义网站失败:', error)
      return false
    }
  }

  // ==========================================
  // 订阅功能
  // ==========================================

  async getSubscription(): Promise<any | null> {
    try {
      const res = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
        .where({ user_id: this.userId })
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()
      
      const subscription = res.data[0] || null
      console.log('✅ [DB-腾讯云] 获取订阅状态:', subscription ? '有订阅' : '无订阅')
      return subscription
    } catch (error) {
      console.error('❌ [DB-腾讯云] 获取订阅失败:', error)
      return null
    }
  }

  async upsertSubscription(subscription: any): Promise<boolean> {
    try {
      // 先查询是否存在
      const existing = await this.getSubscription()
      
      if (existing && existing._id) {
        // 更新现有订阅
        await db.collection(COLLECTIONS.SUBSCRIPTIONS)
          .doc(existing._id)
          .update({
            ...subscription,
            updated_at: new Date()
          })
      } else {
        // 创建新订阅
        await db.collection(COLLECTIONS.SUBSCRIPTIONS).add({
          user_id: this.userId,
          ...subscription,
          created_at: new Date(),
          updated_at: new Date()
        })
      }
      
      console.log('✅ [DB-腾讯云] 更新订阅成功')
      return true
    } catch (error) {
      console.error('❌ [DB-腾讯云] 更新订阅失败:', error)
      return false
    }
  }
}

