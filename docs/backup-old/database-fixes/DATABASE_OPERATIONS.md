# 🗄️ **Database Operations Guide**

## 📋 **Overview**

This guide covers how to store and fetch user's custom and favorite website data using the Supabase database schema we've created.

## 🏗️ **Database Schema Summary**

The database includes these key tables:

### **1. `profiles`** - User profiles
- `id` - UUID (references auth.users)
- `email` - User's email
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `custom_count` - Number of custom websites
- `is_pro` - Pro subscription status

### **2. `custom_websites`** - User's custom websites
- `id` - UUID primary key
- `user_id` - References profiles.id
- `name` - Website name
- `url` - Website URL
- `icon` - Website icon URL
- `category` - Website category
- `is_favorite` - Favorite status
- `sort_order` - Display order

### **3. `favorites`** - User's favorite built-in sites
- `id` - UUID primary key
- `user_id` - References profiles.id
- `site_id` - Built-in site identifier
- `site_name` - Site name
- `site_url` - Site URL
- `site_icon` - Site icon
- `site_category` - Site category

## 🔧 **Database Setup**

### **Step 1: Run the Schema**
```sql
-- Copy and paste the entire database-schema.sql file
-- into your Supabase SQL Editor and run it
```

### **Step 2: Verify Tables**
```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'custom_websites', 'favorites', 'user_settings', 'subscriptions');
```

## 📝 **Data Operations**

### **A. Custom Websites Operations**

#### **1. Add Custom Website**
```typescript
// lib/custom-websites.ts
import { supabase } from './supabase'

export async function addCustomWebsite(userId: string, website: {
  name: string
  url: string
  icon?: string
  category?: string
}) {
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
```

#### **2. Get User's Custom Websites**
```typescript
export async function getCustomWebsites(userId: string) {
  const { data, error } = await supabase
    .from('custom_websites')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch websites: ${error.message}`)
  }

  return data
}
```

#### **3. Update Custom Website**
```typescript
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
) {
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
```

#### **4. Delete Custom Website**
```typescript
export async function deleteCustomWebsite(websiteId: string) {
  const { error } = await supabase
    .from('custom_websites')
    .delete()
    .eq('id', websiteId)

  if (error) {
    throw new Error(`Failed to delete website: ${error.message}`)
  }
}
```

### **B. Favorites Operations**

#### **1. Add to Favorites**
```typescript
// lib/favorites.ts
export async function addToFavorites(userId: string, site: {
  site_id: string
  site_name: string
  site_url: string
  site_icon?: string
  site_category?: string
}) {
  const { data, error } = await supabase
    .from('favorites')
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
```

#### **2. Get User's Favorites**
```typescript
export async function getFavorites(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch favorites: ${error.message}`)
  }

  return data
}
```

#### **3. Remove from Favorites**
```typescript
export async function removeFromFavorites(userId: string, siteId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('site_id', siteId)

  if (error) {
    throw new Error(`Failed to remove from favorites: ${error.message}`)
  }
}
```

#### **4. Check if Site is Favorited**
```typescript
export async function isFavorited(userId: string, siteId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check favorite status: ${error.message}`)
  }

  return !!data
}
```

### **C. User Profile Operations**

#### **1. Get User Profile**
```typescript
// lib/profiles.ts
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data
}
```

#### **2. Update User Profile**
```typescript
export async function updateUserProfile(
  userId: string, 
  updates: Partial<{
    full_name: string
    avatar_url: string
  }>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data
}
```

### **D. User Settings Operations**

#### **1. Get User Settings**
```typescript
// lib/user-settings.ts
export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`)
  }

  return data
}
```

#### **2. Update User Settings**
```typescript
export async function updateUserSettings(
  userId: string, 
  updates: Partial<{
    theme: string
    layout: string
    show_favorites_first: boolean
    auto_sync: boolean
    notifications_enabled: boolean
  }>
) {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  return data
}
```

## 🎯 **React Hooks for Data Management**

### **A. Custom Websites Hook**
```typescript
// hooks/use-custom-websites.ts
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getCustomWebsites, addCustomWebsite, updateCustomWebsite, deleteCustomWebsite } from '@/lib/custom-websites'

export function useCustomWebsites() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadWebsites()
    }
  }, [user])

  const loadWebsites = async () => {
    try {
      setLoading(true)
      const data = await getCustomWebsites(user.id)
      setWebsites(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addWebsite = async (website) => {
    try {
      const newWebsite = await addCustomWebsite(user.id, website)
      setWebsites(prev => [...prev, newWebsite])
      return newWebsite
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateWebsite = async (id, updates) => {
    try {
      const updatedWebsite = await updateCustomWebsite(id, updates)
      setWebsites(prev => prev.map(w => w.id === id ? updatedWebsite : w))
      return updatedWebsite
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removeWebsite = async (id) => {
    try {
      await deleteCustomWebsite(id)
      setWebsites(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    websites,
    loading,
    error,
    addWebsite,
    updateWebsite,
    removeWebsite,
    refresh: loadWebsites
  }
}
```

### **B. Favorites Hook**
```typescript
// hooks/use-favorites.ts
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getFavorites, addToFavorites, removeFromFavorites, isFavorited } from '@/lib/favorites'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await getFavorites(user.id)
      setFavorites(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addFavorite = async (site) => {
    try {
      const newFavorite = await addToFavorites(user.id, site)
      setFavorites(prev => [...prev, newFavorite])
      return newFavorite
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removeFavorite = async (siteId) => {
    try {
      await removeFromFavorites(user.id, siteId)
      setFavorites(prev => prev.filter(f => f.site_id !== siteId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const checkFavorite = async (siteId) => {
    try {
      return await isFavorited(user.id, siteId)
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    checkFavorite,
    refresh: loadFavorites
  }
}
```

## 🔄 **Real-time Updates**

### **A. Subscribe to Changes**
```typescript
// hooks/use-realtime-data.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export function useRealtimeData() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Subscribe to custom websites changes
    const customWebsitesSubscription = supabase
      .channel('custom-websites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_websites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Custom websites change:', payload)
          // Handle real-time updates
        }
      )
      .subscribe()

    // Subscribe to favorites changes
    const favoritesSubscription = supabase
      .channel('favorites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Favorites change:', payload)
          // Handle real-time updates
        }
      )
      .subscribe()

    return () => {
      customWebsitesSubscription.unsubscribe()
      favoritesSubscription.unsubscribe()
    }
  }, [user])
}
```

## 📊 **Data Analytics Queries**

### **A. User Statistics**
```sql
-- Get user's website statistics
SELECT 
  p.full_name,
  p.custom_count,
  COUNT(f.id) as favorites_count,
  COUNT(c.id) as total_websites
FROM profiles p
LEFT JOIN favorites f ON p.id = f.user_id
LEFT JOIN custom_websites c ON p.id = c.user_id
WHERE p.id = 'user-uuid'
GROUP BY p.id, p.full_name, p.custom_count;
```

### **B. Popular Categories**
```sql
-- Get most popular categories for a user
SELECT 
  category,
  COUNT(*) as count
FROM custom_websites
WHERE user_id = 'user-uuid'
GROUP BY category
ORDER BY count DESC;
```

### **C. Recent Activity**
```sql
-- Get recent website additions
SELECT 
  name,
  url,
  created_at
FROM custom_websites
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

## 🛡️ **Security Best Practices**

### **A. Row Level Security (RLS)**
The schema already includes RLS policies that ensure users can only access their own data.

### **B. Input Validation**
```typescript
// lib/validation.ts
export function validateWebsite(website) {
  const errors = []
  
  if (!website.name || website.name.trim().length === 0) {
    errors.push('Website name is required')
  }
  
  if (!website.url || !isValidUrl(website.url)) {
    errors.push('Valid URL is required')
  }
  
  return errors
}

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
```

### **C. Error Handling**
```typescript
// lib/error-handling.ts
export function handleDatabaseError(error) {
  if (error.code === '23505') {
    return 'This item already exists'
  }
  
  if (error.code === '23503') {
    return 'Referenced item not found'
  }
  
  if (error.code === '42501') {
    return 'Access denied'
  }
  
  return 'An unexpected error occurred'
}
```

## 🧪 **Testing Database Operations**

### **A. Test Custom Website Operations**
```typescript
// tests/custom-websites.test.ts
import { addCustomWebsite, getCustomWebsites, updateCustomWebsite, deleteCustomWebsite } from '@/lib/custom-websites'

describe('Custom Websites', () => {
  const testUserId = 'test-user-id'
  const testWebsite = {
    name: 'Test Website',
    url: 'https://example.com',
    icon: 'https://example.com/icon.png',
    category: 'test'
  }

  test('should add custom website', async () => {
    const result = await addCustomWebsite(testUserId, testWebsite)
    expect(result.name).toBe(testWebsite.name)
    expect(result.url).toBe(testWebsite.url)
  })

  test('should get user websites', async () => {
    const websites = await getCustomWebsites(testUserId)
    expect(websites).toBeInstanceOf(Array)
    expect(websites.length).toBeGreaterThan(0)
  })
})
```

## 📋 **Checklist**

- [ ] **Database Schema** - Created and applied
- [ ] **RLS Policies** - Enabled and configured
- [ ] **Triggers** - Set up for automatic profile creation
- [ ] **Indexes** - Created for performance
- [ ] **API Functions** - Implemented CRUD operations
- [ ] **React Hooks** - Created for state management
- [ ] **Error Handling** - Implemented proper error handling
- [ ] **Validation** - Added input validation
- [ ] **Testing** - Created test cases
- [ ] **Documentation** - Updated with examples

## 🔗 **Related Files**

- `database-schema.sql` - Complete database schema
- `lib/custom-websites.ts` - Custom websites operations
- `lib/favorites.ts` - Favorites operations
- `lib/profiles.ts` - User profile operations
- `hooks/use-custom-websites.ts` - Custom websites hook
- `hooks/use-favorites.ts` - Favorites hook
- `contexts/auth-context.tsx` - Authentication context 