/**
 * Supabase 数据库适配器
 * 用于官网海外IP用户的数据存储
 */

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 官网专用表名称（带web_前缀）
export const TABLES = {
  FAVORITES: 'web_favorites',
  CUSTOM_SITES: 'web_custom_sites',
  SUBSCRIPTIONS: 'web_subscriptions',
  PAYMENT_TRANSACTIONS: 'web_payment_transactions'
}

/**
 * Supabase适配器类
 */
export class SupabaseAdapter {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // ==========================================
  // 收藏功能
  // ==========================================

  async getFavorites(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FAVORITES)
        .select('site_id')
        .eq('user_id', this.userId)
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 获取收藏:', data?.length || 0)
      return data?.map(f => f.site_id) || []
    } catch (error) {
      console.error('❌ [DB-Supabase] 获取收藏失败:', error)
      return []
    }
  }

  async addFavorite(siteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.FAVORITES)
        .insert({
          user_id: this.userId,
          site_id: siteId
        })
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 添加收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-Supabase] 添加收藏失败:', error)
      return false
    }
  }

  async removeFavorite(siteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.FAVORITES)
        .delete()
        .eq('user_id', this.userId)
        .eq('site_id', siteId)
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 删除收藏成功:', siteId)
      return true
    } catch (error) {
      console.error('❌ [DB-Supabase] 删除收藏失败:', error)
      return false
    }
  }

  // ==========================================
  // 自定义网站功能
  // ==========================================

  async getCustomSites(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOM_SITES)
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 获取自定义网站:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ [DB-Supabase] 获取自定义网站失败:', error)
      return []
    }
  }

  async addCustomSite(site: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.CUSTOM_SITES)
        .insert({
          user_id: this.userId,
          name: site.name,
          url: site.url,
          logo: site.logo,
          category: site.category,
          description: site.description
        })
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 添加自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-Supabase] 添加自定义网站失败:', error)
      return false
    }
  }

  async removeCustomSite(siteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.CUSTOM_SITES)
        .delete()
        .eq('user_id', this.userId)
        .eq('id', siteId)
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 删除自定义网站成功')
      return true
    } catch (error) {
      console.error('❌ [DB-Supabase] 删除自定义网站失败:', error)
      return false
    }
  }

  // ==========================================
  // 订阅功能
  // ==========================================

  async getSubscription(): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 获取订阅状态:', data ? '有订阅' : '无订阅')
      return data
    } catch (error) {
      console.error('❌ [DB-Supabase] 获取订阅失败:', error)
      return null
    }
  }

  async upsertSubscription(subscription: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .upsert({
          user_id: this.userId,
          ...subscription,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
      
      if (error) throw error
      
      console.log('✅ [DB-Supabase] 更新订阅成功')
      return true
    } catch (error) {
      console.error('❌ [DB-Supabase] 更新订阅失败:', error)
      return false
    }
  }
}

