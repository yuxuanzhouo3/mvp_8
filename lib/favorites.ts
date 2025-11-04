import { supabase } from './supabase'
import { createDatabaseAdapter } from './database/adapter'

export interface Favorite {
  id: string
  user_id: string
  site_id: string
  site_name: string
  site_url: string
  site_icon?: string
  site_category?: string
  created_at: string
}

export interface CreateFavoriteData {
  site_id: string
  site_name: string
  site_url: string
  site_icon?: string
  site_category?: string
}

// 检测用户地区（从localStorage中的用户信息获取）
function getUserRegion(): 'china' | 'overseas' {
  if (typeof window === 'undefined') return 'overseas'

  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.region === 'china' ? 'china' : 'overseas'
    }
  } catch (error) {
    console.error('获取用户地区失败:', error)
  }

  return 'overseas'
}

export async function addToFavorites(userId: string, site: CreateFavoriteData): Promise<Favorite> {
  const region = getUserRegion()
  const isChina = region === 'china'

  console.log(`[收藏] 用户地区: ${region}, 使用${isChina ? 'CloudBase' : 'Supabase'}`)

  if (isChina) {
    // 国内用户 - 使用 CloudBase
    const adapter = await createDatabaseAdapter(true, userId)
    const success = await adapter.addFavorite(site.site_id)

    if (!success) {
      throw new Error('Failed to add to favorites')
    }

    // 返回模拟的 Favorite 对象（CloudBase 不返回完整对象）
    return {
      id: Date.now().toString(),
      user_id: userId,
      site_id: site.site_id,
      site_name: site.site_name,
      site_url: site.site_url,
      site_icon: site.site_icon,
      site_category: site.site_category,
      created_at: new Date().toISOString()
    }
  } else {
    // 海外用户 - 使用 Supabase
    const { data, error } = await supabase
      .from('web_favorites')
      .insert({
        user_id: userId,
        site_id: site.site_id,
        site_name: site.site_name,
        site_url: site.site_url,
        site_icon: site.site_icon,
        site_category: site.site_category
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`)
    }

    return data
  }
}

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const region = getUserRegion()
  const isChina = region === 'china'

  console.log(`[获取收藏] 用户地区: ${region}, 使用${isChina ? 'CloudBase' : 'Supabase'}`)

  if (isChina) {
    // 国内用户 - 使用 CloudBase
    const adapter = await createDatabaseAdapter(true, userId)
    const siteIds = await adapter.getFavorites()

    // CloudBase只返回 site_id 数组，需要构造完整的 Favorite 对象
    // 注意：这里只返回 site_id，前端需要根据 site_id 查找完整信息
    return siteIds.map(siteId => ({
      id: siteId,
      user_id: userId,
      site_id: siteId,
      site_name: '',
      site_url: '',
      created_at: new Date().toISOString()
    }))
  } else {
    // 海外用户 - 使用 Supabase
    const { data, error } = await supabase
      .from('web_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`)
    }

    return data || []
  }
}

export async function removeFromFavorites(userId: string, siteId: string): Promise<void> {
  const region = getUserRegion()
  const isChina = region === 'china'

  console.log(`[取消收藏] 用户地区: ${region}, 使用${isChina ? 'CloudBase' : 'Supabase'}`)

  if (isChina) {
    // 国内用户 - 使用 CloudBase
    const adapter = await createDatabaseAdapter(true, userId)
    const success = await adapter.removeFavorite(siteId)

    if (!success) {
      throw new Error('Failed to remove from favorites')
    }
  } else {
    // 海外用户 - 使用 Supabase
    const { error } = await supabase
      .from('web_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('site_id', siteId)

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`)
    }
  }
}

export async function isFavorited(userId: string, siteId: string): Promise<boolean> {
  const region = getUserRegion()
  const isChina = region === 'china'

  if (isChina) {
    // 国内用户 - 使用 CloudBase
    const adapter = await createDatabaseAdapter(true, userId)
    const favorites = await adapter.getFavorites()
    return favorites.includes(siteId)
  } else {
    // 海外用户 - 使用 Supabase
    const { data, error } = await supabase
      .from('web_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check favorite status: ${error.message}`)
    }

    return !!data
  }
}

export async function getFavoritesByCategory(userId: string, category: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('web_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('site_category', category)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch favorites by category: ${error.message}`)
  }

  return data || []
}

export async function searchFavorites(userId: string, query: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('web_favorites')
    .select('*')
    .eq('user_id', userId)
    .or(`site_name.ilike.%${query}%,site_url.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to search favorites: ${error.message}`)
  }

  return data || []
}

export async function getFavoriteCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('web_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to get favorite count: ${error.message}`)
  }

  return count || 0
} 