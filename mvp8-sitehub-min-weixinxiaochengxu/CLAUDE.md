# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SiteHub** is a WeChat Mini Program that provides a curated directory of websites with intelligent features including IP-based geo-detection, dual-database architecture, subscription management, and AI-powered site parsing. The project is designed for both Chinese (mainland) and international users with automatic region detection and localization.

## Development Commands

### WeChat Developer Tools
- **Open project**: Import this directory in WeChat Developer Tools
- **Preview**: Click "Preview" in dev tools → scan QR code with WeChat
- **Upload code**: Tools → Upload → enter version and description
- **Debug**: Use "Real Device Debugging" for testing on actual devices

### Cloud Functions Development
```bash
# Deploy all cloud functions (from WeChat Developer Tools)
# Right-click cloudfunctions/ → Upload All Cloud Functions

# Deploy single cloud function
# Right-click specific function → Upload and Deploy

# View logs
# Cloud Development Console → Cloud Functions → Logs
```

### Testing
- **Local testing**: Use WeChat Developer Tools simulator
- **Real device testing**: Tools → Preview → scan QR code
- **Cloud function testing**: cloudfunctions/*/test.js files or Cloud Console

## Architecture

### Core Architecture Patterns

1. **Dual Database Architecture with IP-based Routing**
   - `callAIGateway` cloud function acts as intelligent router
   - Detects user region via IP analysis (`utils/geoDetector.js`)
   - Routes to WeChat Cloud (China) or Supabase (International)
   - Fallback mechanisms ensure service availability
   - User region stored in `app.js` globalData

2. **Single Source of Truth (SSOT) Data Model**
   - Canonical data: `pages/index/data/canonical.en.js` (English, authoritative)
   - Localization overlays: `l10n.zh.js`, `l10n.en.js`
   - `data-loader.js` merges canonical + l10n at runtime
   - Display uses `name_zh` (localized), `name_en` (identifier)
   - Never modify l10n files for structural changes—only canonical

3. **Frontend State Management**
   - App-level: `app.js` globalData (userInfo, region, favorites)
   - Page-level: WeChat Page() data object
   - Persistence: `wx.setStorageSync()` / `wx.getStorageSync()`
   - User session: `utils/userSession.js` + `userSessionStore.js`

4. **Gateway Pattern for External Services**
   - `gateway/ai-gateway.js`: AI service abstraction
   - `gateway/fallback.js`: Service degradation handling
   - `cloudfunctions/callAIGateway/`: Cloud proxy for API calls
   - Prevents direct API exposure to mini-program

### Key Directories

- `pages/`: Mini-program pages (index, webview, login, payment, settings, etc.)
  - `index/`: Main site directory page with search/filter
  - `webview/`: Embedded browser for external sites
  - `payment/`: Subscription management UI
  - `login/`: WeChat authentication flow

- `cloudfunctions/`: Serverless functions deployed to WeChat Cloud
  - `callAIGateway/`: IP detection + dual-DB routing + AI service proxy
  - `wechatPaySubscription/`: Subscription lifecycle management
  - `getUserProfile/`: User data retrieval
  - `setupDatabase/`: DB initialization
  - `autoRenewalTrigger/`: Scheduled renewal checks

- `utils/`: Shared utilities
  - `api.js`: Cloud function call wrapper with error handling
  - `geoDetector.js`: IP-based region detection
  - `route.js`: Database routing logic
  - `text-parser.js`: AI-powered URL/site extraction from text
  - `userSession.js`: Session management
  - `cross-platform-api.js`: Platform abstraction layer

- `components/`: Reusable UI components
  - `sidebar/`: Navigation sidebar component

- `gateway/`: External service adapters
  - Not packaged in mini-program (see project.config.json packOptions.ignore)
  - Used as reference for cloud function implementation

- `admin-backend/`: Backend management system (separate from mini-program)

- `docs/`: Documentation (excluded from mini-program package)

## Critical Implementation Details

### IP Detection & Region Routing
- **Detection happens**: On app launch and in `callAIGateway` cloud function
- **IP ranges**: China IPs defined in `geoDetector.js` (first octet matching)
- **Region storage**: `app.globalData.userRegion` and `wx.storage.sitehub_userRegion`
- **Database selection**: Automatic based on IP (China → WeChat Cloud, Other → Supabase)
- **Fallback**: If one DB fails, automatically tries the other

### Data Loading Pattern
```javascript
// CORRECT: Use data-loader to merge canonical + localization
const { loadMergedData, getUIText } = require('./data-loader')
const { products, categories, sites } = loadMergedData()

// Display uses localized name
site.name_zh // "百度"
site.name_en // "Baidu" (stable identifier)

// NEVER directly modify canonical.en.js without understanding SSOT pattern
```

### Cloud Function Call Pattern
```javascript
// Always use api.js wrapper, never direct wx.cloud.callFunction
const api = require('../../utils/api.js')

const result = await api.callAIGateway({
  action: 'someAction',
  data: { /* ... */ }
})

// api.js provides error handling, logging, and retry logic
```

### User Session Management
- **Initialize session**: `getUserSession()` on page load
- **Region detection**: Automatic via `geoDetector.detectUserRegion()`
- **Session persistence**: Stored in localStorage + app.globalData
- **Session expiry**: 30-day rolling window
- **Refresh**: Automatic on app launch and API calls

### Subscription System
- **Plans**: Free, Basic, Pro (monthly/yearly billing)
- **Payment flow**: WeChat Pay integration via `wechatPaySubscription` cloud function
- **Auto-renewal**: `autoRenewalTrigger` checks daily for expiring subscriptions
- **State management**: Stored in cloud database (dual DB)
- **Trial periods**: Supported via subscription metadata

### WeChat Mini Program Specifics
- **AppID**: `wxf1aca21b5b79581d`
- **Cloud environment**: `cloudbase-1gnip2iaa08260e5`
- **Base library version**: 3.10.2+
- **Lazy loading**: Enabled for components (`lazyCodeLoading: "requiredComponents"`)
- **Web-view domain**: Requires business domain verification in WeChat Admin
- **Package size limits**: Total 20MB, single file 2MB

## Important Constraints

### Mini Program Limitations
- Cannot use `eval()`, `new Function()`, or dynamic code execution
- No access to `window`, `document`, DOM APIs
- Limited npm package support (must use WeChat's npm build)
- Web-view requires HTTPS and domain whitelist
- Storage limit: 10MB per mini-program

### API Rate Limits
- Cloud functions: 10k calls/day (free tier)
- Database: 50k reads, 10k writes/day (free tier)
- Static hosting: 5GB storage, 10GB traffic/month

### Security Requirements
- Never commit API keys, certificates, or secrets
- Use cloud functions as proxy for external APIs
- Validate all user input before DB operations
- Sanitize URLs before loading in web-view
- Check user permissions before subscription operations

## Configuration Files

- `project.config.json`: Mini-program build config, cloud function root, package ignore rules
- `app.json`: Pages, navigation, permissions, lazy loading
- `app.js`: Global lifecycle, cloud init, state management
- `cloudfunctions/*/config.json`: Cloud function-specific config (e.g., WeChat Pay credentials)

## Deployment Workflow

1. **Code development**: Local changes in WeChat Dev Tools
2. **Cloud function deployment**: Right-click → Upload (individual) or Upload All
3. **Code upload**: Tools → Upload → version info
4. **Admin approval**: Owner submits for review via WeChat Admin Platform
5. **Release**: Owner publishes approved version

**Developer permissions**: Can develop, test, upload code, deploy cloud functions
**Admin permissions**: Can submit reviews, publish versions, configure domains

## Common Patterns

### Adding a New Page
1. Create `pages/newpage/` directory
2. Add `newpage.js`, `newpage.json`, `newpage.wxml`, `newpage.wxss`
3. Register in `app.json` pages array
4. Use `wx.navigateTo({ url: '/pages/newpage/newpage' })` for navigation

### Adding a New Cloud Function
1. Create `cloudfunctions/functionName/` directory
2. Add `index.js` and `package.json`
3. Right-click function → Upload and Deploy
4. Call via `api.js` wrapper

### Adding a New Site to Directory
1. Add to `pages/index/data/canonical.en.js` (English, authoritative)
2. Add localized name to `l10n.zh.js` or `l10n.en.js`
3. Optionally add Chinese tags to `l10n.zh.js` tagsCN map
4. For sites that cannot open in web-view (WeChat, Alipay, etc.), add `"openInBrowser": true` flag
5. No code changes needed—data-loader handles merging

### Handling Region-Specific Features
```javascript
// Check user region
const userRegion = getApp().getUserRegion() // 'china' | 'international'

// Conditionally show features
if (userRegion === 'china') {
  // Show WeChat-specific features
} else {
  // Show international alternatives
}
```

## Troubleshooting

### Cloud Function Errors
- Check logs: Cloud Console → Functions → Logs
- Verify cloud init in `app.js` onLaunch
- Check permissions in Cloud Console → Database → Permissions
- Ensure cloud environment matches `project.config.json`

### Region Detection Issues
- Test IP detection: `geoDetector.isChinaIP('YOUR_IP')`
- Check `app.globalData.userRegion` in debugger
- Verify storage: `wx.getStorageSync('sitehub_userRegion')`
- Fallback always defaults to China/WeChat Cloud

### Data Not Showing
- Verify data-loader merge: `loadMergedData()` returns expected structure
- Check canonical.en.js for syntax errors (JSON-like but JS export)
- Ensure l10n files have matching keys
- Check page `onLoad()` calls `loadMergedData()`

### Payment Issues
- Verify WeChat Pay config in `cloudfunctions/wechatPay/config.json`
- Check merchant ID and API key (never commit these)
- Test in production environment (payment doesn't work in simulator)
- Review payment cloud function logs for callback errors
