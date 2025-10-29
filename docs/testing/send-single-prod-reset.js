const { createClient } = require('@supabase/supabase-js')

// Production environment variables only
const PROD_SUPABASE_URL = 'https://ykirhilnbvsanqyenusf.supabase.co'
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y'

// Production redirect URL
const PROD_REDIRECT_URL = 'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password'

// Initialize Supabase client with production credentials only
const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY)

async function sendSingleProdReset() {
  console.log('🚀 Sending SINGLE Password Reset from PRODUCTION Environment...\n')
  console.log(`📧 Target Email: mornscience@163.com`)
  console.log(`🔗 Redirect URL: ${PROD_REDIRECT_URL}`)
  console.log(`🌐 Supabase URL: ${PROD_SUPABASE_URL}`)
  console.log('')

  try {
    const testEmail = 'mornscience@163.com'

    // Send password reset email from production only
    console.log('📧 Sending password reset email from production...')
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: PROD_REDIRECT_URL
    })

    if (resetError) {
      console.log(`❌ Production password reset failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
    } else {
      console.log('✅ Production password reset email sent successfully!')
      console.log('')
      console.log('📧 Email Details:')
      console.log('   From: Supabase (production)')
      console.log('   To: mornscience@163.com')
      console.log('   Subject: Password Reset Request')
      console.log('   Redirect: Will redirect to production app')
      console.log('')
      console.log('🔗 Production Reset Link:')
      console.log('   https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password')
      console.log('')
      console.log('📧 Check your email: mornscience@163.com')
      console.log('🔐 Suggested password: mornscience163!')
    }

    console.log('\n✅ Single production password reset completed!')

  } catch (error) {
    console.error('❌ Production reset failed:', error.message)
  }
}

sendSingleProdReset() 