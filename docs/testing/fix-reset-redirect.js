const { createClient } = require('@supabase/supabase-js')

// Production environment variables
const PROD_SUPABASE_URL = 'https://ykirhilnbvsanqyenusf.supabase.co'
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y'

// Initialize Supabase client with production credentials
const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY)

async function testResetRedirect() {
  console.log('🔧 Testing Password Reset Redirect URLs...\n')

  const testEmail = 'mornscience@163.com'
  
  // Test different redirect URLs
  const redirectUrls = [
    'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password',
    'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password?token=',
    'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password#',
    'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password?',
    'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password?type=recovery'
  ]

  for (let i = 0; i < redirectUrls.length; i++) {
    const redirectUrl = redirectUrls[i]
    console.log(`📧 Testing redirect URL ${i + 1}: ${redirectUrl}`)
    
    try {
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: redirectUrl
      })

      if (resetError) {
        console.log(`❌ Error: ${resetError.message}`)
      } else {
        console.log(`✅ Success! Email sent with redirect to: ${redirectUrl}`)
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`)
    }
    
    console.log('')
    
    // Wait a bit between requests to avoid rate limiting
    if (i < redirectUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('🔍 Analysis:')
  console.log('')
  console.log('The issue might be:')
  console.log('1. Vercel authentication protection blocking the reset page')
  console.log('2. Incorrect redirect URL format')
  console.log('3. Missing environment variables in production')
  console.log('4. Supabase auth configuration issue')
  console.log('')
  console.log('💡 Solution:')
  console.log('1. Disable Vercel authentication protection')
  console.log('2. Use Supabase Dashboard to manually reset password')
  console.log('3. Check production environment variables')
}

testResetRedirect() 