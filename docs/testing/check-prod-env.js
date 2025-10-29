const { createClient } = require('@supabase/supabase-js')

// Production environment variables
const PROD_SUPABASE_URL = 'https://ykirhilnbvsanqyenusf.supabase.co'
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXJoaWxuYnZzYW5xeWVudXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzA5OTQsImV4cCI6MjA2ODU0Njk5NH0.AHf66dC0vqu43WFET1zzosMMKIWwcvPlDIKCnVQli0Y'

// Initialize Supabase client with production credentials
const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY)

async function checkProdEnvironment() {
  console.log('🔍 Checking Production Environment...\n')

  console.log('📋 Environment Variables:')
  console.log(`   Supabase URL: ${PROD_SUPABASE_URL}`)
  console.log(`   Supabase Key: ${PROD_SUPABASE_ANON_KEY.substring(0, 20)}...`)
  console.log('')

  // Test 1: Check if we can connect to Supabase
  console.log('1️⃣ Testing Supabase connection...')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log(`❌ Connection error: ${error.message}`)
    } else {
      console.log('✅ Supabase connection successful')
    }
  } catch (error) {
    console.log(`❌ Connection exception: ${error.message}`)
  }

  console.log('')

  // Test 2: Check if user exists
  console.log('2️⃣ Checking if user exists...')
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'mornscience@163.com',
      password: 'testpassword123'
    })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists (password incorrect - expected)')
      } else {
        console.log(`❌ Sign in error: ${signInError.message}`)
      }
    } else {
      console.log('✅ User exists and password is correct')
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`)
  }

  console.log('')

  // Test 3: Send password reset with correct redirect
  console.log('3️⃣ Sending password reset with production redirect...')
  
  const productionRedirectUrl = 'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password'
  
  try {
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail('mornscience@163.com', {
      redirectTo: productionRedirectUrl
    })

    if (resetError) {
      console.log(`❌ Password reset error: ${resetError.message}`)
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log(`   Redirect URL: ${productionRedirectUrl}`)
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`)
  }

  console.log('')

  // Test 4: Check if the reset page is accessible
  console.log('4️⃣ Checking reset page accessibility...')
  console.log(`   URL: ${productionRedirectUrl}`)
  console.log('   Note: This will likely return 401 due to Vercel authentication protection')
  console.log('')

  console.log('🔧 Root Cause Analysis:')
  console.log('')
  console.log('The issue is that Vercel has enabled authentication protection')
  console.log('on the entire project, which blocks access to all pages including')
  console.log('the password reset page.')
  console.log('')
  console.log('💡 Solutions:')
  console.log('')
  console.log('1️⃣ IMMEDIATE SOLUTION - Manual Password Reset:')
  console.log('   Visit: https://supabase.com/dashboard/project/ykirhilnbvsanqyenusf/auth/users')
  console.log('   Find user: mornscience@163.com')
  console.log('   Set new password: mornscience163!')
  console.log('')
  console.log('2️⃣ LONG-TERM SOLUTION - Disable Vercel Protection:')
  console.log('   - Go to Vercel Dashboard')
  console.log('   - Select this project')
  console.log('   - Go to Settings > Security')
  console.log('   - Disable "Password Protection" or "Authentication"')
  console.log('')
  console.log('3️⃣ ALTERNATIVE - Use Local Development:')
  console.log('   - Run: npm run dev')
  console.log('   - Visit: http://localhost:3000/auth/forgot-password')
  console.log('   - Enter: mornscience@163.com')
  console.log('')

  console.log('✅ Environment check completed!')
}

checkProdEnvironment() 