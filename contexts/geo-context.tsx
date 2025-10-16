"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Region, Language } from '@/lib/ip-detection'

export interface GeoLocation {
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  timezone: string
  currency: string
  language: string
  paymentMethods: string[]
  ip: string
  regionCategory: Region  // 新增：区域分类
  languageCode: Language  // 新增：语言代码
  isEurope: boolean       // 新增：是否欧洲
}

interface GeoContextType {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  isChina: boolean
  isEurope: boolean       // 新增
  regionCategory: Region  // 新增
  languageCode: Language  // 新增
  refresh: () => Promise<void>
}

const defaultLocation: GeoLocation = {
  country: 'United States',
  countryCode: 'US',
  region: '',
  regionName: '',
  city: '',
  timezone: 'America/New_York',
  currency: 'USD',
  language: 'en-US',
  paymentMethods: ['stripe', 'paypal'],
  ip: 'unknown',
  regionCategory: 'usa',
  languageCode: 'en',
  isEurope: false
}

const GeoContext = createContext<GeoContextType>({
  location: defaultLocation,
  loading: false,
  error: null,
  isChina: false,
  isEurope: false,
  regionCategory: 'usa',
  languageCode: 'en',
  refresh: async () => {}
})

export function useGeo() {
  const context = useContext(GeoContext)
  if (!context) {
    throw new Error('useGeo must be used within GeoProvider')
  }
  return context
}

interface GeoProviderProps {
  children: ReactNode
}

export function GeoProvider({ children }: GeoProviderProps) {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGeoLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/geo/detect')
      const result = await response.json()

      if (result.success) {
        setLocation(result.data)
      } else {
        setError(result.error || 'Failed to detect location')
        setLocation(result.data || defaultLocation) // 使用返回的默认值
      }
    } catch (err) {
      console.error('Geo detection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to detect location')
      setLocation(defaultLocation) // 出错时使用默认值
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGeoLocation()
  }, [])

  const value: GeoContextType = {
    location,
    loading,
    error,
    isChina: location?.countryCode === 'CN',
    isEurope: location?.isEurope || false,
    regionCategory: location?.regionCategory || 'usa',
    languageCode: location?.languageCode || 'en',
    refresh: fetchGeoLocation
  }

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}
