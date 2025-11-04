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

export async function addToFavorites(userId: string, site: CreateFavoriteData): Promise<Favorite> {
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

export async function getFavorites(userId: string): Promise<Favorite[]> {
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

export async function removeFromFavorites(userId: string, siteId: string): Promise<void> {
  const { error } = await supabase
    .from('web_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('site_id', siteId)

  if (error) {
    throw new Error(`Failed to remove from favorites: ${error.message}`)
  }
}

export async function isFavorited(userId: string, siteId: string): Promise<boolean> {
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