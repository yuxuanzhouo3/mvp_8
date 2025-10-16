import { auth, supabase } from "@/lib/supabase"
import { sessionManager } from "@/lib/session-manager"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface WxRequestOptions<TBody = unknown> {
  url: string
  method?: HttpMethod
  data?: TBody
  headers?: Record<string, string>
  auth?: boolean
}

interface WxRequestResult<TData = unknown> {
  ok: boolean
  status: number
  data: TData | null
  error?: string
}

interface CheckoutPayload {
  planType: "pro" | "team"
  billingCycle: "monthly" | "yearly"
  userEmail: string
}

interface PaypalCreateResponse {
  approvalUrl: string
  orderId: string
}

interface StripeCreateResponse {
  url: string
  sessionId: string
}

interface BillingCheckResponse {
  status: string
  customerEmail?: string | null
  amountTotal?: number | null
  currency?: string | null
}

// getAuthToken tries to fetch the latest Supabase access token // 获取最新的 Supabase 访问令牌
async function getAuthToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Failed to read Supabase session:", error)
    return null
  }

  if (!data.session) {
    return null
  }

  const token = data.session.access_token

  if (!token) {
    return null
  }

  // Keep refresh logic alive for subsequent calls // 触发刷新逻辑确保后续请求可用
  sessionManager.initialize().catch((refreshError) => {
    console.warn("Session manager refresh failed:", refreshError)
  })

  return token
}

// wxRequest emulates wx.request with automatic auth header // wxRequest 模拟 wx.request 并自动附加鉴权头
export async function wxRequest<TResponse = unknown, TPayload = unknown>(
  options: WxRequestOptions<TPayload>
): Promise<WxRequestResult<TResponse>> {
  const { url, method = "GET", data, headers = {}, auth: needsAuth = true } = options

  const finalHeaders: Record<string, string> = {
    ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
    ...headers
  }

  if (needsAuth) {
    const token = await getAuthToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  const requestInit: RequestInit = {
    method,
    headers: finalHeaders
  }

  if (data && method !== "GET") {
    requestInit.body = JSON.stringify(data)
  } else if (data && method === "GET") {
    console.warn("GET request should not include body payload.")
  }

  try {
    const response = await fetch(url, requestInit)

    const contentType = response.headers.get("content-type")
    let parsed: any = null

    if (contentType && contentType.includes("application/json")) {
      parsed = await response.json()
    } else {
      parsed = await response.text()
    }

    if (!response.ok) {
      const errorMessage =
        typeof parsed === "string"
          ? parsed
          : parsed?.error || `Request failed with status ${response.status}`
      return {
        ok: false,
        status: response.status,
        data: null,
        error: errorMessage
      }
    }

    return {
      ok: true,
      status: response.status,
      data: parsed as TResponse
    }
  } catch (error) {
    console.error("wxRequest failed:", error)
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// wxStorage provides localStorage equivalents for wx storage APIs // wxStorage 提供与 wx 存储 API 对应的 localStorage 实现
export const wxStorage = {
  get<T = unknown>(key: string): T | null {
    if (typeof window === "undefined") {
      return null
    }
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        return null
      }
      return JSON.parse(raw) as T
    } catch (error) {
      console.warn("wxStorage.get parse error:", error)
      return null
    }
  },

  set<T = unknown>(key: string, value: T) {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn("wxStorage.set failed:", error)
    }
  },

  remove(key: string) {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.removeItem(key)
  },

  clear() {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.clear()
  }
}

// wxAuth wraps existing Supabase auth helpers to simulate wx.login wx.checkSession // wxAuth 使用 Supabase 封装登录流程模拟 wx.login 与 wx.checkSession
export const wxAuth = {
  async loginWithEmail(email: string, password: string) {
    return auth.signIn(email, password)
  },

  async registerWithEmail(email: string, password: string) {
    return auth.signUp(email, password)
  },

  async logout() {
    const { error } = await auth.signOut()
    if (error) {
      throw error
    }
  },

  async getCurrentSession() {
    return auth.getCurrentSession()
  },

  async getCurrentUser() {
    return auth.getCurrentUser()
  }
}

// wxPayment bridges payment calls used in the mini program // wxPayment 负责对接小程序中使用的支付能力
export const wxPayment = {
  async createStripeCheckout(payload: CheckoutPayload) {
    return wxRequest<StripeCreateResponse, CheckoutPayload>({
      url: "/api/payment/stripe/create",
      method: "POST",
      data: payload
    })
  },

  async createPaypalOrder(payload: CheckoutPayload) {
    return wxRequest<PaypalCreateResponse, CheckoutPayload>({
      url: "/api/payment/paypal/create",
      method: "POST",
      data: payload
    })
  },

  async createAlipayOrder(payload: CheckoutPayload) {
    return wxRequest<{ paymentUrl: string }, CheckoutPayload>({
      url: "/api/payment/alipay/create",
      method: "POST",
      data: payload
    })
  },

  async checkStripeSession(sessionId: string) {
    return wxRequest<BillingCheckResponse>({
      url: `/api/payment/stripe/check?session_id=${encodeURIComponent(sessionId)}`,
      method: "GET"
    })
  },

  redirectToPaymentPortal() {
    if (typeof window === "undefined") {
      return
    }
    window.location.href = "/payment"
  }
}
