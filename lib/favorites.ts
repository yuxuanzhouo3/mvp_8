import { supabase } from './supabase'

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

// 获取用户地区
function getUserRegion(): 'china' | 'overseas' {
  if (typeof window === 'undefined') return 'overseas'
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.region === 'china' ? 'china' : 'overseas'
    }
  } catch (e) {
    console.error('获取用户地区失败:', e)
  }
  return 'overseas'
}

export async function addToFavorites(userId: string, site: CreateFavoriteData): Promise<Favorite> {
  const region = getUserRegion()

  if (region === 'china') {
    // 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) throw new Error('未登录')

    const res = await fetch('/api/favorites-cn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ siteId: site.site_id })
    })

    const result = await res.json()
    if (!result.success) throw new Error(result.message || '收藏失败')

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
    // 海外用户：使用Supabase
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

  if (region === 'china') {
    // 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) return []

    try {
      const res = await fetch('/api/favorites-cn', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const result = await res.json()
      if (!result.success) return []

      return result.favorites.map((siteId: string) => ({
        id: siteId,
        user_id: userId,
        site_id: siteId,
        site_name: '',
        site_url: '',
        created_at: new Date().toISOString()
      }))
    } catch (e) {
      console.error('获取收藏失败:', e)
      return []
    }
  } else {
    // 海外用户：使用Supabase
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

  if (region === 'china') {
    // 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) throw new Error('未登录')

    const res = await fetch('/api/favorites-cn', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ siteId })
    })

    const result = await res.json()
    if (!result.success) throw new Error(result.message || '取消收藏失败')
  } else {
    // 海外用户：使用Supabase
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

  if (region === 'china') {
    // 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) return false

    try {
      const res = await fetch('/api/favorites-cn', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const result = await res.json()
      if (!result.success) return false

      return result.favorites.includes(siteId)
    } catch (e) {
      return false
    }
  } else {
    // 海外用户：使用Supabase
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