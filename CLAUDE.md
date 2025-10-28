# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteHub is a Next.js web application providing access to 300+ websites with user authentication and data persistence. The app uses geo-based routing to serve different user segments: China (CloudBase), overseas (Supabase), and Europe (blocked).

## Development Commands

### Core Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Package Manager
This project uses **npm** (not pnpm despite README.md claiming otherwise - see package.json scripts).

## Architecture

### Geo-Based Multi-Region System

The application routes users to different backends based on IP geolocation:

1. **China Region** (`isChina = true`)
   - Auth: Tencent CloudBase (`web_users` collection)
   - Database: CloudBase adapter
   - Payment: WeChat Pay, Alipay
   - API: `/api/auth-cn` (Pages Router), `/api/auth/email` (App Router with IP detection)

2. **Overseas Region** (`isChina = false`, `isEurope = false`)
   - Auth: Supabase (`auth.users` table)
   - Database: Supabase adapter
   - Payment: Stripe, PayPal
   - API: `/api/auth/email` (App Router with IP detection)

3. **Europe Region** (`isEurope = true`)
   - Blocked with `/blocked/europe` page

**Key Files:**
- `contexts/geo-context.tsx` - Detects user region via `/api/geo/detect`
- `app/api/geo/detect/route.ts` - IP detection API
- `lib/database/adapter.ts` - Factory pattern for DB selection
- `lib/auth-client-cn.ts` - China-specific auth client

### Database Architecture

**Adapter Pattern:** `lib/database/adapter.ts` provides `createDatabaseAdapter(isChina, userId)` which returns either:
- `CloudBaseAdapter` - Tencent CloudBase (China users)
- `SupabaseAdapter` - Supabase (Overseas users)

Both implement `IDatabaseAdapter` interface with methods:
- `getFavorites()`, `addFavorite()`, `removeFavorite()`
- `getCustomSites()`, `addCustomSite()`, `removeCustomSite()`
- `getSubscription()`, `upsertSubscription()`

**CloudBase Schema (`web_users` collection):**
```typescript
{
  _id: string,              // Auto-generated
  email: string,
  password: string,         // bcrypt hashed
  name: string,
  pro: boolean,
  region: 'china',
  createdAt: string,        // ISO 8601
  updatedAt: string
}
```

**Supabase:** Uses built-in `auth.users` with custom `user_metadata.region = 'overseas'`.

### Authentication Flow

**China Users:**
1. Frontend calls `/api/auth-cn` (Pages Router) with `action: 'signup' | 'login'`
2. API uses CloudBase Node.js SDK to query `web_users` collection
3. Returns JWT token (7 days for free, 30 days for pro)
4. Frontend stores token in `localStorage` as `user_token`

**Overseas Users:**
1. Frontend calls `/api/auth/email` with IP-based routing
2. API uses Supabase Auth (`signUp()` or `signInWithPassword()`)
3. User metadata includes `region: 'overseas'`

**Session Management:**
- JWT tokens stored in `localStorage.user_token`
- User info in `localStorage.user_info`
- Context: `contexts/auth-context.tsx`

### API Routes

**App Router (`app/api/`):**
- `auth/email/route.ts` - IP-based email auth (routes to CloudBase or Supabase)
- `auth/wechat/route.ts`, `auth/wechat/callback/route.ts` - WeChat OAuth
- `geo/detect/route.ts` - IP geolocation
- `payment/stripe/*` - Stripe integration
- `payment/paypal/*` - PayPal integration
- `payment/wechat/*`, `payment/alipay/*` - China payments

**Pages Router (`pages/api/`):**
- `auth-cn.ts` - Direct CloudBase auth (China users only, no IP detection)

### Payment Integration

**China:**
- WeChat Pay: `app/api/payment/wechat/`
- Alipay: `app/api/payment/alipay/`

**Overseas:**
- Stripe: `app/api/payment/stripe/` (primary)
- PayPal: `app/api/payment/paypal/` (secondary)

**Payment Page:** `app/payment/page.tsx` - Geo-aware, shows appropriate payment methods.

### Context Providers

Located in `contexts/`:
- `geo-context.tsx` - Geolocation and region detection
- `auth-context.tsx` - User authentication state
- `language-context.tsx` - i18n support (Chinese/English)
- `settings-context.tsx` - User preferences

### Internationalization

**Structure:** `lib/i18n/`
- `auth-zh.ts`, `auth-en.ts` - Auth UI translations
- `payment-zh.ts`, `payment-en.ts` - Payment UI translations
- `home-ui.ts` - Home page translations

**Usage:** Language context auto-detects based on geo region (`isChina ? 'zh' : 'en'`).

## Important Constraints

### IP Detection Testing
- **DO NOT hardcode `isChina` or geo flags for testing** - see `lib/DEPLOYMENT-CLEANUP-COMPLETE.md`
- All test hardcoding was removed in production deployment
- Use real IPs or VPNs for region testing

### Environment Variables Required
```
# CloudBase (China)
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=
CLOUDBASE_SECRET_ID=
CLOUDBASE_SECRET_KEY=

# Supabase (Overseas)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth
JWT_SECRET=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### WeChat Integration
- WeChat OAuth: `lib/wechat-auth.ts`, `lib/adapters/wechat-web.ts`
- Uses `@cloudbase/js-sdk` and `wechat-oauth` packages
- Requires WeChat Official Account setup

## Code Patterns

### Geo-Aware Components
Always check `isChina` from `GeoContext` before rendering region-specific UI:
```typescript
const { isChina, isEurope } = useGeo()
if (isEurope) return <EuropeBlocked />
```

### Database Operations
Use adapter factory pattern:
```typescript
const adapter = await createDatabaseAdapter(isChina, userId)
const favorites = await adapter.getFavorites()
```

### API Route Pattern
Check IP region in API routes serving both regions:
```typescript
const clientIP = getClientIP(request)
const isChina = await isChineseIP(clientIP)
if (isChina) {
  // CloudBase logic
} else {
  // Supabase logic
}
```

## Testing Notes

- **China Flow:** Test with VPN to China or use staging CloudBase environment
- **Supabase Flow:** Test with non-China IP
- **Session Expiry:** Guest mode has 10-minute timeout (see README)
- **Payment Testing:** Use Stripe/PayPal test mode, WeChat/Alipay sandbox

## Known Issues

- Project uses npm but README claims pnpm
- Backup payment implementations in `backup/payments-stripe-paypal/` (legacy)
- Multiple documentation files in root (see `lib/DEPLOYMENT-CLEANUP-COMPLETE.md` for production readiness)
