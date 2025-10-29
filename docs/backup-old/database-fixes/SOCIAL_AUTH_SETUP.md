# Social Authentication Setup Guide

This guide will help you set up Facebook and WeChat authentication for your SiteHub application.

## 🚀 Quick Start

### 1. Facebook Authentication Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Consumer" → "Next"
3. Fill in your app details:
   - App Name: `SiteHub` (or your preferred name)
   - App Contact Email: Your email
   - Business Account: Optional
4. Click "Create App"

#### Step 2: Add Facebook Login
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" platform
4. Enter your site URL: `https://your-domain.com`
5. Click "Save and Continue"

#### Step 3: Configure OAuth Settings
1. Go to Facebook Login → Settings
2. Add these Valid OAuth Redirect URIs:
   ```
   https://your-domain.com/auth/callback
   http://localhost:3000/auth/callback (for development)
   ```
3. Save Changes

#### Step 4: Get App Credentials
1. Go to Settings → Basic
2. Copy your App ID and App Secret
3. Add them to your `.env.local`:
   ```env
   NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

#### Step 5: Configure Supabase
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Find Facebook and click "Enable"
4. Enter your Facebook App ID and App Secret
5. Set Redirect URL: `https://your-domain.com/auth/callback`
6. Save

### 2. WeChat Authentication Setup

**Note**: WeChat OAuth is not a built-in Supabase provider, so we need a custom implementation.

#### Option A: Using WeChat Official SDK (Recommended)

#### Step 1: Register WeChat App
1. Go to [WeChat Open Platform](https://open.weixin.qq.com/)
2. Register a new app (requires verification)
3. Get your App ID and App Secret

#### Step 2: Install WeChat SDK
```bash
npm install wechat-oauth
# or
pnpm add wechat-oauth
```

#### Step 3: Create WeChat Auth Handler
Create a new file `lib/wechat-auth.ts`:

```typescript
import OAuth from 'wechat-oauth'

const client = new OAuth(
  process.env.NEXT_PUBLIC_WECHAT_APP_ID!,
  process.env.WECHAT_APP_SECRET!
)

export const wechatAuth = {
  getAuthUrl: () => {
    const state = Math.random().toString(36).substring(7)
    return client.getAuthorizeURL(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/wechat/callback`,
      state,
      'snsapi_userinfo'
    )
  },

  getAccessToken: (code: string) => {
    return new Promise((resolve, reject) => {
      client.getAccessToken(code, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  },

  getUserInfo: (openid: string, accessToken: string) => {
    return new Promise((resolve, reject) => {
      client.getUser(openid, accessToken, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }
}
```

#### Step 4: Create API Routes
Create `app/api/auth/wechat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { wechatAuth } from '@/lib/wechat-auth'

export async function GET(request: NextRequest) {
  const authUrl = wechatAuth.getAuthUrl()
  return NextResponse.redirect(authUrl)
}
```

Create `app/api/auth/wechat/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { wechatAuth } from '@/lib/wechat-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect('/auth/error?message=No authorization code')
  }

  try {
    // Get access token
    const tokenResult = await wechatAuth.getAccessToken(code)
    
    // Get user info
    const userInfo = await wechatAuth.getUserInfo(
      tokenResult.data.openid,
      tokenResult.data.access_token
    )

    // Create or sign in user with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google', // We'll use Google as a fallback
      options: {
        queryParams: {
          access_token: tokenResult.data.access_token,
          openid: tokenResult.data.openid,
          user_info: JSON.stringify(userInfo)
        }
      }
    })

    if (error) {
      return NextResponse.redirect('/auth/error?message=Authentication failed')
    }

    return NextResponse.redirect('/dashboard')
  } catch (error) {
    console.error('WeChat auth error:', error)
    return NextResponse.redirect('/auth/error?message=Authentication failed')
  }
}
```

#### Option B: Using Third-Party Service (Simpler)

You can use services like Auth0, Firebase Auth, or Clerk that support WeChat OAuth out of the box.

### 3. Environment Variables

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Facebook
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# WeChat
NEXT_PUBLIC_WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Testing

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test Facebook authentication:
   - Click "Continue with Facebook" in the auth modal
   - You should be redirected to Facebook for authorization
   - After authorization, you'll be redirected back to your app

3. Test WeChat authentication:
   - Click "Continue with WeChat" in the auth modal
   - You should be redirected to WeChat for authorization
   - After authorization, you'll be redirected back to your app

### 5. Production Deployment

#### Facebook
1. In Facebook App Settings, add your production domain
2. Update OAuth redirect URIs to include your production URL
3. Submit your app for review if you want to go live

#### WeChat
1. Update your WeChat app settings with production URLs
2. Complete the verification process
3. Deploy your API routes to your hosting platform

### 6. Troubleshooting

#### Common Issues:

1. **Facebook: "Invalid OAuth redirect URI"**
   - Make sure your redirect URI exactly matches what's configured in Facebook
   - Check for trailing slashes or protocol mismatches

2. **WeChat: "App not verified"**
   - WeChat apps need verification for production use
   - Use test accounts during development

3. **Supabase: "Provider not enabled"**
   - Make sure you've enabled the provider in Supabase dashboard
   - Check that your credentials are correct

4. **CORS Issues**
   - Ensure your domain is whitelisted in both Facebook and WeChat
   - Check that your API routes are properly configured

### 7. Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **State Parameter**: Always validate the state parameter in OAuth flows
4. **Error Handling**: Implement proper error handling and user feedback
5. **Rate Limiting**: Consider implementing rate limiting for auth endpoints

### 8. Next Steps

After setting up authentication:

1. **User Profiles**: Create user profile pages
2. **Account Linking**: Allow users to link multiple social accounts
3. **Data Migration**: Migrate existing user data
4. **Analytics**: Track authentication events
5. **Testing**: Add comprehensive tests for auth flows

## 📚 Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [WeChat Open Platform](https://open.weixin.qq.com/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) 