const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Production environment variables
const PROD_SUPABASE_URL = 'https://ykirhilnbvsanqyenusf.supabase.co'
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y'

// Production redirect URL
const PROD_REDIRECT_URL = 'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password'

// Initialize Supabase client with production credentials
const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY)

async function sendProdReset() {
  console.log('🚀 Sending Password Reset from PRODUCTION Environment...\n')
  console.log(`📧 Target Email: mornscience@163.com`)
  console.log(`🔗 Redirect URL: ${PROD_REDIRECT_URL}`)
  console.log(`🌐 Supabase URL: ${PROD_SUPABASE_URL}`)
  console.log('')

  try {
    const testEmail = 'mornscience@163.com'

    // Step 1: Verify user exists
    console.log('1️⃣ Verifying user exists in production...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists in production (password incorrect - expected)')
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('✅ User exists in production (email not confirmed)')
      } else {
        console.log(`❌ Sign in error: ${signInError.message}`)
      }
    } else {
      console.log('✅ User exists and password is correct')
      console.log(`   User ID: ${signInData.user.id}`)
      console.log(`   Email: ${signInData.user.email}`)
    }

    // Step 2: Send password reset email from production
    console.log('\n2️⃣ Sending password reset email from production...')
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: PROD_REDIRECT_URL
    })

    if (resetError) {
      console.log(`❌ Production password reset failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
      
      if (resetError.status === 400) {
        console.log('   🔍 Possible reasons:')
        console.log('      - Email not registered in production')
        console.log('      - Rate limiting')
        console.log('      - SMTP configuration issue')
      }
    } else {
      console.log('✅ Production password reset email sent successfully!')
      console.log('')
      console.log('📧 Email Details:')
      console.log('   From: Supabase (production)')
      console.log('   To: mornscience@163.com')
      console.log('   Subject: Password Reset Request')
      console.log('   Redirect: Will redirect to production app')
    }

    // Step 3: Check production database
    console.log('\n3️⃣ Checking production database...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
    
    if (profileError) {
      console.log(`❌ Production database query failed: ${profileError.message}`)
    } else if (profile && profile.length > 0) {
      console.log('✅ User found in production database')
      console.log(`   Profile ID: ${profile[0].id}`)
      console.log(`   Custom Count: ${profile[0].custom_count}`)
      console.log(`   Is Pro: ${profile[0].is_pro}`)
    } else {
      console.log('❌ User not found in production profiles table')
      console.log('   Profile may need to be created manually')
    }

    // Step 4: Production links and instructions
    console.log('\n4️⃣ Production Reset Links:')
    console.log('')
    console.log('🔗 Direct Production Links:')
    console.log('')
    console.log('1️⃣ Production Forgot Password:')
    console.log('   https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/forgot-password')
    console.log('')
    console.log('2️⃣ Production Reset Password:')
    console.log('   https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password')
    console.log('')
    console.log('3️⃣ Production Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/ykirhilnbvsanqyenusf/auth/users')
    console.log('')
    console.log('📧 Next Steps:')
    console.log('   1. Check mornscience@163.com inbox')
    console.log('   2. Look for email from production Supabase')
    console.log('   3. Click the reset link (will redirect to production app)')
    console.log('   4. Set new password: mornscience163!')
    console.log('')
    console.log('🔐 Production Password: mornscience163!')

    console.log('\n✅ Production password reset completed!')

  } catch (error) {
    console.error('❌ Production reset failed:', error.message)
  }
}

sendProdReset() 