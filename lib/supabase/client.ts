import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables, using mock client')
    // 返回一个模拟的Supabase客户端，避免错误
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback: any) => {
          // 立即调用callback以完成初始化
          setTimeout(() => callback('INITIAL_SESSION', null), 0)
          return { data: { subscription: { unsubscribe: () => {} } } }
        }
      },
      from: () => ({
        select: () => ({ eq: () => ({ data: [], error: null }) }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) })
      })
    } as any
  }

  // 检查是否是占位符配置
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder_key') {
    console.warn('Using placeholder Supabase configuration, features will be limited')
    // 返回模拟客户端
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback: any) => {
          // 立即调用callback以完成初始化
          setTimeout(() => callback('INITIAL_SESSION', null), 0)
          return { data: { subscription: { unsubscribe: () => {} } } }
        }
      },
      from: () => ({
        select: () => ({ eq: () => ({ data: [], error: null }) }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) })
      })
    } as any
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sitehub-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce'
    }
  })
}
