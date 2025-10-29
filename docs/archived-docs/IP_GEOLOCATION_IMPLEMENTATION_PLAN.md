# IP 地理位置识别 & 区域策略实施方案

## 📋 需求概述

### 核心需求：
1. **精确 IP 识别**：区分中国、美国、印度、新加坡、欧洲各国（精确到国家）
2. **欧洲地区屏蔽**：选择性屏蔽欧洲国家访问
3. **双语言模式**：登录和支付页面分中英文两套，其他组件功能保持不变

---

## 🔍 技术方案对比

### 方案 A：使用免费 IP 地理位置 API（推荐）✅

**优点：**
- ✅ 免费或低成本
- ✅ 精确到国家级别
- ✅ 包含国家代码、城市、货币等详细信息
- ✅ 无需维护 IP 数据库

**推荐服务：**
1. **ipapi.co** (免费额度：1000次/天)
   - API: `https://ipapi.co/{ip}/json/`
   - 返回：国家代码、国家名称、城市、货币等

2. **ip-api.com** (免费额度：45次/分钟)
   - API: `http://ip-api.com/json/{ip}`
   - 返回：国家代码、国家名称、地区、时区等

3. **ipgeolocation.io** (免费额度：1000次/月)
   - API: `https://api.ipgeolocation.io/ipgeo?apiKey={key}&ip={ip}`
   - 返回：详细地理信息

**缺点：**
- ⚠️ 有请求次数限制
- ⚠️ 依赖第三方服务稳定性

---

### 方案 B：使用本地 IP 数据库

**优点：**
- ✅ 无请求次数限制
- ✅ 响应速度快

**库推荐：**
- **geoip-lite** (npm package)
- **maxmind GeoIP2**

**缺点：**
- ⚠️ 需要定期更新 IP 数据库
- ⚠️ 增加项目体积
- ⚠️ 精确度可能不如在线 API

---

## 🎨 推荐实施方案

**混合方案**：在线 API（主） + 本地缓存（辅）

1. **首次访问**：调用在线 IP API 获取精确地理位置
2. **缓存机制**：将结果存储在用户本地（localStorage）24小时
3. **备用方案**：如果 API 失败，使用浏览器语言作为备选

---

## 🛠️ 实施架构

### 1. 新建 IP 检测服务

**文件结构：**
```
lib/
  └── ip-detection.ts          # IP 检测核心逻辑
contexts/
  └── geo-context.tsx          # 已有，需要升级
app/api/
  └── geo/
      └── detect/
          └── route.ts         # 已有，需要升级
```

### 2. 国家分类定义

```typescript
// lib/ip-detection.ts

// 欧洲国家代码列表（EU + EEA + UK）
export const EUROPEAN_COUNTRIES = [
  // EU 成员国 (27个)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA 非 EU 成员
  'IS', 'LI', 'NO',
  // 英国（脱欧后仍需遵守部分GDPR）
  'GB',
  // 瑞士（虽非EU但数据保护法类似）
  'CH',
]

// 主流市场国家
export const TARGET_MARKETS = {
  CHINA: 'CN',
  USA: 'US',
  INDIA: 'IN',
  SINGAPORE: 'SG',
}

// 区域分类
export type Region = 'china' | 'usa' | 'india' | 'singapore' | 'europe' | 'other'

export function getRegionFromCountryCode(countryCode: string): Region {
  if (countryCode === TARGET_MARKETS.CHINA) return 'china'
  if (countryCode === TARGET_MARKETS.USA) return 'usa'
  if (countryCode === TARGET_MARKETS.INDIA) return 'india'
  if (countryCode === TARGET_MARKETS.SINGAPORE) return 'singapore'
  if (EUROPEAN_COUNTRIES.includes(countryCode)) return 'europe'
  return 'other'
}
```

---

## 🌍 欧洲地区屏蔽策略

### 方案 A：完全屏蔽（简单直接）

**效果：** 欧洲用户访问时显示"服务不可用"页面

**优点：**
- ✅ 符合 GDPR 合规要求（不收集欧洲用户数据）
- ✅ 实施简单

**实现：**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const geo = await detectIPLocation(request.ip)

  if (geo.region === 'europe') {
    // 重定向到欧洲屏蔽页面
    return NextResponse.redirect(new URL('/blocked/europe', request.url))
  }

  return NextResponse.next()
}
```

---

### 方案 B：限制功能访问（部分开放）

**效果：** 欧洲用户可以浏览，但无法注册/登录/支付

**优点：**
- ✅ 允许访客浏览内容
- ✅ 不收集个人数据，避免 GDPR 风险

**实现：**
```typescript
// 在登录/注册/支付页面检测
if (geo.region === 'europe') {
  return (
    <div>
      <h1>Service Not Available in Europe</h1>
      <p>Due to regulatory requirements, we cannot offer account creation and payment services in European countries.</p>
      <p>You can still browse our content as a guest.</p>
    </div>
  )
}
```

---

### 方案 C：显示合规提示（推荐，未来扩展）✅

**效果：**
- 欧洲用户访问时显示 Cookie 同意横幅
- 遵守 GDPR 要求收集用户同意
- 未来可以开放欧洲市场

**优点：**
- ✅ 合规且灵活
- ✅ 为未来欧洲市场布局

**实现：**
```typescript
// components/gdpr-banner.tsx
export function GDPRBanner({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to improve your experience. By using SiteHub, you agree to our use of cookies.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleAccept}>Accept</Button>
          <Button variant="outline" onClick={handleDecline}>Decline</Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🌐 双语言模式实施

### 策略：登录和支付页面中英文分离

**语言选择逻辑：**
```typescript
export function getDefaultLanguage(region: Region): 'zh' | 'en' {
  if (region === 'china') return 'zh'
  return 'en'
}

// 支持的语言
export type Language = 'zh' | 'en'
```

### 实施步骤：

#### 1. 创建语言配置文件

**文件结构：**
```
lib/
  └── i18n/
      ├── auth-zh.ts      # 登录/注册中文翻译
      ├── auth-en.ts      # 登录/注册英文翻译
      ├── payment-zh.ts   # 支付页面中文翻译
      └── payment-en.ts   # 支付页面英文翻译
```

**示例：**
```typescript
// lib/i18n/auth-zh.ts
export const authTranslationsZh = {
  login: {
    title: '欢迎回到 SiteHub',
    emailPlaceholder: '请输入邮箱',
    passwordPlaceholder: '请输入密码',
    submitButton: '登录',
    noAccount: '还没有账号？',
    signUpLink: '立即注册',
  },
  signup: {
    title: '加入 SiteHub',
    emailPlaceholder: '请输入邮箱',
    passwordPlaceholder: '设置密码',
    submitButton: '注册',
    hasAccount: '已有账号？',
    loginLink: '立即登录',
  },
}

// lib/i18n/auth-en.ts
export const authTranslationsEn = {
  login: {
    title: 'Welcome Back to SiteHub',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    submitButton: 'Sign In',
    noAccount: "Don't have an account?",
    signUpLink: 'Sign Up',
  },
  signup: {
    title: 'Join SiteHub',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Create a password',
    submitButton: 'Sign Up',
    hasAccount: 'Already have an account?',
    loginLink: 'Sign In',
  },
}
```

#### 2. 升级 Geo Context 添加语言支持

```typescript
// contexts/geo-context.tsx
export interface GeoContextType {
  location: GeoLocation | null
  loading: boolean
  isChina: boolean
  region: Region  // 新增
  language: Language  // 新增
  isEurope: boolean  // 新增
}
```

#### 3. 修改登录组件支持双语

```typescript
// components/auth-modal.tsx
import { useGeo } from '@/contexts/geo-context'
import { authTranslationsZh } from '@/lib/i18n/auth-zh'
import { authTranslationsEn } from '@/lib/i18n/auth-en'

export function AuthModal({ ... }) {
  const { language, isEurope } = useGeo()
  const t = language === 'zh' ? authTranslationsZh : authTranslationsEn

  // 欧洲地区屏蔽检测
  if (isEurope) {
    return <EuropeBlockedMessage />
  }

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>{mode === 'login' ? t.login.title : t.signup.title}</DialogTitle>
      </DialogHeader>

      <Input
        placeholder={mode === 'login' ? t.login.emailPlaceholder : t.signup.emailPlaceholder}
        ...
      />

      <Button>{mode === 'login' ? t.login.submitButton : t.signup.submitButton}</Button>
    </Dialog>
  )
}
```

#### 4. 修改支付页面支持双语

```typescript
// app/payment/page.tsx
import { useGeo } from '@/contexts/geo-context'
import { paymentTranslationsZh } from '@/lib/i18n/payment-zh'
import { paymentTranslationsEn } from '@/lib/i18n/payment-en'

export default function PaymentPage() {
  const { language, isEurope } = useGeo()
  const t = language === 'zh' ? paymentTranslationsZh : paymentTranslationsEn

  // 欧洲地区屏蔽检测
  if (isEurope) {
    return <EuropeBlockedMessage />
  }

  return (
    <div>
      <h1>{t.title}</h1>
      <p>{t.description}</p>

      {/* Pro Plan */}
      <Card>
        <CardTitle>{t.plans.pro.name}</CardTitle>
        <CardDescription>{t.plans.pro.description}</CardDescription>
      </Card>

      {/* Payment Methods */}
      <h3>{t.paymentMethod.title}</h3>
      <Button>{t.paymentMethod.confirm}</Button>
    </div>
  )
}
```

---

## 🔄 完整实施流程

### Phase 1: 升级 IP 检测系统 ✅

**优先级：高**

1. **升级 API 路由** (`app/api/geo/detect/route.ts`)
   - 集成精确 IP 地理位置 API（ipapi.co）
   - 返回国家代码、区域、语言等信息
   - 添加缓存机制

2. **创建国家分类库** (`lib/ip-detection.ts`)
   - 定义欧洲国家列表
   - 定义主流市场国家
   - 区域分类函数

3. **升级 Geo Context** (`contexts/geo-context.tsx`)
   - 添加 `region` 字段
   - 添加 `language` 字段
   - 添加 `isEurope` 布尔值

**预计工作量：** 2-3 小时

---

### Phase 2: 实施欧洲屏蔽策略 ✅

**优先级：高**

1. **创建欧洲屏蔽页面** (`app/blocked/europe/page.tsx`)
   - 显示友好的"服务不可用"消息
   - 提供联系方式

2. **在关键页面添加检测**
   - 登录/注册页面
   - 支付页面
   - 个人中心页面

3. **可选：添加中间件全局拦截**
   - 如果要完全屏蔽，可以在 `middleware.ts` 实现

**预计工作量：** 1-2 小时

---

### Phase 3: 实施双语言系统 ✅

**优先级：中**

1. **创建翻译文件**
   - `lib/i18n/auth-zh.ts` - 登录/注册中文
   - `lib/i18n/auth-en.ts` - 登录/注册英文
   - `lib/i18n/payment-zh.ts` - 支付页面中文
   - `lib/i18n/payment-en.ts` - 支付页面英文

2. **修改登录组件** (`components/auth-modal.tsx`)
   - 根据语言加载对应翻译
   - 添加欧洲检测

3. **修改支付页面** (`app/payment/page.tsx`)
   - 根据语言加载对应翻译
   - 添加欧洲检测

**预计工作量：** 3-4 小时

---

### Phase 4: 测试和优化 ✅

**优先级：中**

1. **测试不同地区访问**
   - 使用 VPN 测试中国、美国、印度、新加坡、欧洲访问
   - 验证语言自动切换
   - 验证欧洲屏蔽生效

2. **性能优化**
   - 添加请求缓存（24小时）
   - 添加失败回退机制

3. **错误处理**
   - IP API 失败时的备选方案
   - 网络错误提示

**预计工作量：** 2-3 小时

---

## 📊 总体实施时间估算

| 阶段 | 任务 | 预计工作量 | 优先级 |
|------|------|------------|--------|
| Phase 1 | 升级 IP 检测系统 | 2-3 小时 | 🔴 高 |
| Phase 2 | 实施欧洲屏蔽 | 1-2 小时 | 🔴 高 |
| Phase 3 | 双语言系统 | 3-4 小时 | 🟡 中 |
| Phase 4 | 测试和优化 | 2-3 小时 | 🟡 中 |
| **总计** | | **8-12 小时** | |

**建议分批实施：**
- **第一批**：Phase 1 + Phase 2（4小时，核心功能）
- **第二批**：Phase 3 + Phase 4（6小时，完善体验）

---

## 🎯 自洽逻辑验证

### 用户访问流程：

```
1. 用户访问 SiteHub
   ↓
2. 检测用户 IP 地址
   ↓
3. 调用 IP API 获取国家代码
   ↓
4. 判断区域：
   - 中国 (CN) → region='china', language='zh'
   - 美国 (US) → region='usa', language='en'
   - 印度 (IN) → region='india', language='en'
   - 新加坡 (SG) → region='singapore', language='en'
   - 欧洲 (EU) → region='europe', language='en', isEurope=true
   - 其他 → region='other', language='en'
   ↓
5. 渲染页面：
   - 如果 isEurope=true && 访问登录/支付 → 显示屏蔽页面
   - 否则 → 根据 language 加载对应翻译文件
   ↓
6. 用户交互：
   - 登录/注册：显示对应语言的表单
   - 支付页面：显示对应语言的定价和按钮
   - 其他页面：保持原样
```

### 数据流：

```
API Route (/api/geo/detect)
    ↓ [返回国家代码]
Geo Context
    ↓ [提供 region, language, isEurope]
Components (AuthModal, PaymentPage)
    ↓ [根据 language 选择翻译]
User Interface
    ↓ [显示对应语言内容]
```

### 关键检查点：

✅ **IP 检测准确性**
- 使用可靠的第三方 IP API
- 精确到国家级别
- 包含备用方案

✅ **欧洲屏蔽完整性**
- 覆盖所有 EU/EEA 国家
- 包括英国和瑞士
- 在关键页面生效（登录、支付）

✅ **语言切换逻辑**
- 中国 → 中文
- 其他所有地区 → 英文
- 仅影响登录和支付页面

✅ **用户体验一致性**
- 除登录和支付外，其他组件功能不变
- 语言切换无需刷新页面
- 缓存机制减少 API 请求

---

## 🔐 合规性考虑

### GDPR 合规（欧洲地区）

**屏蔽策略：**
- ✅ 不收集欧洲用户个人数据
- ✅ 不设置非必要 Cookie
- ✅ 明确告知服务不可用原因

**备选方案（未来）：**
如果要开放欧洲市场，需要：
1. 添加 Cookie 同意横幅
2. 更新隐私政策和用户协议
3. 实施数据访问和删除请求机制
4. 指定欧盟数据保护代表

---

## 💡 建议的欧洲屏蔽策略

**推荐：方案 A（完全屏蔽）+ 友好提示**

**理由：**
1. ✅ **简单有效** - 避免 GDPR 复杂合规要求
2. ✅ **成本最低** - 无需实施 Cookie 横幅、隐私政策更新等
3. ✅ **风险最小** - 不收集数据就没有违规风险
4. ✅ **可扩展** - 未来如果要开放欧洲市场，可以升级

**实施细节：**
- 欧洲用户访问时显示友好的"服务暂不支持"页面
- 提供联系邮箱（sales@mornhub.help）供商务合作
- 允许浏览公开内容（如 Landing Page）
- 阻止注册、登录、支付功能

---

## 📝 开发检查清单

### Phase 1: IP 检测
- [ ] 注册 ipapi.co 账号（免费）
- [ ] 升级 `/app/api/geo/detect/route.ts`
- [ ] 创建 `/lib/ip-detection.ts`
- [ ] 升级 `/contexts/geo-context.tsx`
- [ ] 测试 IP 检测准确性

### Phase 2: 欧洲屏蔽
- [ ] 创建 `/app/blocked/europe/page.tsx`
- [ ] 在 `AuthModal` 添加欧洲检测
- [ ] 在 `PaymentPage` 添加欧洲检测
- [ ] 测试欧洲 IP 访问（使用 VPN）

### Phase 3: 双语言
- [ ] 创建翻译文件（auth-zh, auth-en, payment-zh, payment-en）
- [ ] 修改 `AuthModal` 支持双语
- [ ] 修改 `PaymentPage` 支持双语
- [ ] 测试中文/英文切换

### Phase 4: 测试
- [ ] 测试中国 IP → 中文界面
- [ ] 测试美国 IP → 英文界面
- [ ] 测试印度 IP → 英文界面
- [ ] 测试新加坡 IP → 英文界面
- [ ] 测试欧洲 IP → 被屏蔽
- [ ] 测试其他地区 IP → 英文界面

---

## 🚀 下一步行动

**建议按顺序执行：**

1. **立即开始**：Phase 1（升级 IP 检测）
   - 这是所有功能的基础
   - 工作量：2-3 小时

2. **第二步**：Phase 2（欧洲屏蔽）
   - 合规要求，需要尽快实施
   - 工作量：1-2 小时

3. **第三步**：Phase 3（双语言）
   - 提升用户体验
   - 工作量：3-4 小时

4. **最后**：Phase 4（测试优化）
   - 确保功能稳定
   - 工作量：2-3 小时

**是否开始实施？** 如果同意方案，我可以立即开始 Phase 1 的开发。

---

**生成时间：** 2025-01-07
**作者：** SiteHub Development Team
