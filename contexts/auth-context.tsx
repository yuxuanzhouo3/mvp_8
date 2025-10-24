'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { sessionManager } from '@/lib/session-manager'

interface CustomUser {
  type: "guest" | "authenticated"
  name?: string
  email?: string
  customCount: number
  pro: boolean
  id?: string
  provider?: string
}

interface AuthContextType {
  user: CustomUser
  supabaseUser: SupabaseUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (userData: CustomUser) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser>({ type: "guest", customCount: 0, pro: false })
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize session manager
    sessionManager.initialize()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          setUser({ type: "guest", customCount: 0, pro: false })
          setLoading(false)
          return
        }

        setSession(session)
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          // Convert Supabase user to custom user format
          const customUser: CustomUser = {
            type: "authenticated",
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            customCount: 0,
            pro: false,
            id: session.user.id,
            provider: session.user.app_metadata?.provider
          }
          setUser(customUser)
          localStorage.setItem("sitehub-user", JSON.stringify(customUser))
        } else {
          // Check for guest data in localStorage
          const savedUser = localStorage.getItem("sitehub-user")
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser)
              setUser(userData)
            } catch (error) {
              console.error("Failed to parse saved user data:", error)
              setUser({ type: "guest", customCount: 0, pro: false })
            }
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser({ type: "guest", customCount: 0, pro: false })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.email)
        
        try {
          setSession(session)
          setSupabaseUser(session?.user ?? null)
          
          if (event === 'SIGNED_IN' && session?.user) {
            const customUser: CustomUser = {
              type: "authenticated",
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              customCount: 0,
              pro: false,
              id: session.user.id,
              provider: session.user.app_metadata?.provider
            }
            setUser(customUser)
            localStorage.setItem("sitehub-user", JSON.stringify(customUser))
          } else if (event === 'SIGNED_OUT') {
            setUser({ type: "guest", customCount: 0, pro: false })
            localStorage.removeItem("sitehub-user")
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Handle token refresh
            const customUser: CustomUser = {
              type: "authenticated",
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              customCount: 0,
              pro: false,
              id: session.user.id,
              provider: session.user.app_metadata?.provider
            }
            setUser(customUser)
            localStorage.setItem("sitehub-user", JSON.stringify(customUser))
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    sessionManager.clearSession()
    await supabase.auth.signOut()
  }

  const signIn = (userData: CustomUser) => {
    setUser(userData)
    localStorage.setItem("sitehub-user", JSON.stringify(userData))
  }

  const value = {
    user,
    supabaseUser,
    session,
    loading,
    signOut,
    signIn
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 