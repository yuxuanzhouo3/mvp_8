import { supabase } from './supabase'

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

export interface CustomWebsite {
  id: string
  user_id: string
  name: string
  url: string
  icon?: string
  category: string
  is_favorite: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateWebsiteData {
  name: string
  url: string
  icon?: string
  category?: string
}

export async function addCustomWebsite(userId: string, website: CreateWebsiteData): Promise<CustomWebsite> {
  const region = getUserRegion()
  console.log('🔍 [addCustomWebsite] 用户地区:', region, '用户ID:', userId)

  if (region === 'china') {
    // 🇨🇳 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    console.log('🔍 [addCustomWebsite] Token存在:', !!token)
    if (!token) throw new Error('未登录')

    console.log('🔍 [addCustomWebsite] 发送数据:', {
      name: website.name,
      url: website.url,
      logo: website.icon || '',
      category: website.category || 'custom'
    })

    const res = await fetch('/api/custom-sites-cn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: website.name,
        url: website.url,
        logo: website.icon || '',
        category: website.category || 'custom',
        description: ''
      })
    })

    console.log('🔍 [addCustomWebsite] API响应状态:', res.status)
    const result = await res.json()
    console.log('🔍 [addCustomWebsite] API响应数据:', result)

    if (!result.success) {
      throw new Error(result.message || '添加自定义网站失败')
    }

    // 转换为统一格式
    return {
      id: result.site.id,
      user_id: result.site.user_id,
      name: result.site.name,
      url: result.site.url,
      icon: result.site.logo,
      category: result.site.category,
      is_favorite: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } else {
    // 🌍 海外用户：使用Supabase
    const { data, error } = await supabase
      .from('custom_websites')
      .insert({
        user_id: userId,
        name: website.name,
        url: website.url,
        icon: website.icon,
        category: website.category || 'custom',
        sort_order: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add website: ${error.message}`)
    }

    return data
  }
}

export async function getCustomWebsites(userId: string): Promise<CustomWebsite[]> {
  const region = getUserRegion()

  if (region === 'china') {
    // 🇨🇳 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) throw new Error('未登录')

    const res = await fetch('/api/custom-sites-cn', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await res.json()
    if (!result.success) {
      throw new Error(result.message || '获取自定义网站失败')
    }

    // 转换CloudBase格式到统一格式
    return (result.sites || []).map((site: any) => ({
      id: site._id,
      user_id: site.user_id,
      name: site.name,
      url: site.url,
      icon: site.logo,
      category: site.category || 'custom',
      is_favorite: false,
      sort_order: 0,
      created_at: site.created_at,
      updated_at: site.updated_at
    }))
  } else {
    // 🌍 海外用户：使用Supabase
    const { data, error } = await supabase
      .from('custom_websites')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch websites: ${error.message}`)
    }

    return data || []
  }
}

export async function updateCustomWebsite(
  websiteId: string, 
  updates: Partial<{
    name: string
    url: string
    icon: string
    category: string
    is_favorite: boolean
    sort_order: number
  }>
): Promise<CustomWebsite> {
  const { data, error } = await supabase
    .from('custom_websites')
    .update(updates)
    .eq('id', websiteId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update website: ${error.message}`)
  }

  return data
}

export async function deleteCustomWebsite(websiteId: string): Promise<void> {
  const region = getUserRegion()

  if (region === 'china') {
    // 🇨🇳 国内用户：调用CloudBase API
    const token = localStorage.getItem('user_token')
    if (!token) throw new Error('未登录')

    const res = await fetch('/api/custom-sites-cn', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ siteId: websiteId })
    })

    const result = await res.json()
    if (!result.success) {
      throw new Error(result.message || '删除自定义网站失败')
    }
  } else {
    // 🌍 海外用户：使用Supabase
    const { error } = await supabase
      .from('custom_websites')
      .delete()
      .eq('id', websiteId)

    if (error) {
      throw new Error(`Failed to delete website: ${error.message}`)
    }
  }
}

export async function reorderWebsites(userId: string, websiteIds: string[]): Promise<void> {
  const updates = websiteIds.map((id, index) => ({
    id,
    sort_order: index
  }))

  const { error } = await supabase
    .from('custom_websites')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    throw new Error(`Failed to reorder websites: ${error.message}`)
  }
}

export async function getWebsitesByCategory(userId: string, category: string): Promise<CustomWebsite[]> {
  const { data, error } = await supabase
    .from('custom_websites')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch websites by category: ${error.message}`)
  }

  return data || []
}

export async function searchWebsites(userId: string, query: string): Promise<CustomWebsite[]> {
  const { data, error } = await supabase
    .from('custom_websites')
    .select('*')
    .eq('user_id', userId)
    .or(`name.ilike.%${query}%,url.ilike.%${query}%`)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to search websites: ${error.message}`)
  }

  return data || []
} 