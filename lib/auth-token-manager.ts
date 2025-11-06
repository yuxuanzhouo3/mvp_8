/**
 * Auth Token Manager
 *
 * 管理JWT Token的生命周期，包括：
 * - Token过期检测
 * - 自动刷新Token
 * - 多端持久化支持
 */

interface TokenPayload {
  userId: string
  email?: string
  region: string
  exp: number
  iat: number
}

export class AuthTokenManager {
  // Token刷新阈值：剩余7天时自动刷新
  private static REFRESH_THRESHOLD = 7 * 24 * 60 * 60 // 7天（秒）

  // 防止重复刷新的锁
  private static isRefreshing = false
  private static refreshPromise: Promise<boolean> | null = null

  /**
   * 解码JWT Token（不验证签名，仅解析payload）
   */
  private static decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const payload = parts[1]
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))

      return decoded as TokenPayload
    } catch (error) {
      console.error('[AuthTokenManager] Token解码失败:', error)
      return null
    }
  }

  /**
   * 检查Token是否需要刷新
   */
  static shouldRefreshToken(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return false

    const now = Math.floor(Date.now() / 1000) // 当前时间（秒）
    const exp = decoded.exp // 过期时间（秒）
    const timeLeft = exp - now // 剩余时间（秒）

    console.log(`[AuthTokenManager] Token剩余时间: ${Math.floor(timeLeft / 86400)}天 ${Math.floor((timeLeft % 86400) / 3600)}小时`)

    // 如果剩余时间少于7天，需要刷新
    return timeLeft > 0 && timeLeft < this.REFRESH_THRESHOLD
  }

  /**
   * 检查Token是否已过期
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return true

    const now = Math.floor(Date.now() / 1000)
    return decoded.exp <= now
  }

  /**
   * 刷新Token
   */
  static async refreshToken(): Promise<boolean> {
    // 防止重复刷新
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[AuthTokenManager] Token刷新正在进行中，等待结果...')
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this._performRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * 执行Token刷新
   */
  private static async _performRefresh(): Promise<boolean> {
    try {
      const userInfo = localStorage.getItem('user_info')
      const oldToken = localStorage.getItem('user_token')

      if (!userInfo || !oldToken) {
        console.log('[AuthTokenManager] 缺少用户信息或Token，无法刷新')
        return false
      }

      const user = JSON.parse(userInfo)

      // 检查用户地区，调用对应的刷新API
      const region = user.region || 'overseas'

      if (region === 'china') {
        // 🇨🇳 国内用户：调用国内刷新API
        console.log('[AuthTokenManager] 刷新国内用户Token...')

        const response = await fetch('/api/auth-cn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${oldToken}`
          },
          body: JSON.stringify({
            action: 'refresh',
            userId: user.id
          })
        })

        if (!response.ok) {
          console.error('[AuthTokenManager] Token刷新失败:', response.status)
          return false
        }

        const result = await response.json()

        if (result.success && result.token) {
          // 更新Token
          localStorage.setItem('user_token', result.token)
          console.log('✅ [AuthTokenManager] Token刷新成功（国内用户）')
          return true
        } else {
          console.error('[AuthTokenManager] Token刷新响应无效:', result)
          return false
        }
      } else {
        // 🌍 海外用户：Supabase会自动处理Token刷新
        console.log('[AuthTokenManager] 海外用户使用Supabase认证，无需手动刷新')
        return true
      }
    } catch (error) {
      console.error('[AuthTokenManager] Token刷新异常:', error)
      return false
    }
  }

  /**
   * 检查并刷新Token（主入口）
   */
  static async checkAndRefreshToken(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const token = localStorage.getItem('user_token')

      if (!token) {
        console.log('[AuthTokenManager] 没有Token，跳过检查')
        return
      }

      // 检查Token是否已过期
      if (this.isTokenExpired(token)) {
        console.warn('[AuthTokenManager] Token已过期，需要重新登录')
        // 可以选择清除过期Token或触发登录
        // localStorage.removeItem('user_token')
        // localStorage.removeItem('user_info')
        return
      }

      // 检查是否需要刷新
      if (this.shouldRefreshToken(token)) {
        console.log('[AuthTokenManager] Token即将过期，开始刷新...')
        await this.refreshToken()
      } else {
        console.log('[AuthTokenManager] Token有效，无需刷新')
      }
    } catch (error) {
      console.error('[AuthTokenManager] 检查Token失败:', error)
    }
  }

  /**
   * 获取Token信息（用于调试）
   */
  static getTokenInfo(): {
    hasToken: boolean
    isExpired: boolean
    shouldRefresh: boolean
    daysLeft: number
    payload: TokenPayload | null
  } | null {
    if (typeof window === 'undefined') return null

    const token = localStorage.getItem('user_token')

    if (!token) {
      return {
        hasToken: false,
        isExpired: true,
        shouldRefresh: false,
        daysLeft: 0,
        payload: null
      }
    }

    const decoded = this.decodeToken(token)
    if (!decoded) {
      return {
        hasToken: true,
        isExpired: true,
        shouldRefresh: false,
        daysLeft: 0,
        payload: null
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const timeLeft = decoded.exp - now
    const daysLeft = Math.floor(timeLeft / 86400)

    return {
      hasToken: true,
      isExpired: this.isTokenExpired(token),
      shouldRefresh: this.shouldRefreshToken(token),
      daysLeft: daysLeft,
      payload: decoded
    }
  }
}
