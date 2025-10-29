const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    return {}
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return env
}

const env = loadEnv()

// Initialize Supabase client
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testReset163() {
  console.log('🧪 Testing Password Reset for mornscience@163.com...\n')

  try {
    const testEmail = 'mornscience@163.com'

    // Test 1: Check if user exists
    console.log('1️⃣ Checking if user exists...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists but password is incorrect (expected)')
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('✅ User exists but email is not confirmed')
      } else {
        console.log(`❌ Sign in error: ${signInError.message}`)
      }
    } else {
      console.log('✅ User exists and password is correct')
      console.log(`   User ID: ${signInData.user.id}`)
      console.log(`   Email: ${signInData.user.email}`)
    }

    // Test 2: Send password reset email
    console.log('\n2️⃣ Sending password reset email...')
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl}/auth/reset-password`
    })

    if (resetError) {
      console.log(`❌ Password reset failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
      
      if (resetError.status === 400) {
        console.log('   🔍 This might be because:')
        console.log('      - Email address is not registered')
        console.log('      - Email format is invalid')
        console.log('      - Rate limiting is in effect')
      }
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log('   📧 Check the email inbox for mornscience@163.com')
      console.log('   🔗 The email will contain a link to reset the password')
    }

    // Test 3: Check if user exists in database
    console.log('\n3️⃣ Checking user in database...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
    
    if (profileError) {
      console.log(`❌ Database query failed: ${profileError.message}`)
    } else if (profile && profile.length > 0) {
      console.log('✅ User found in database')
      console.log(`   Profile ID: ${profile[0].id}`)
      console.log(`   Custom Count: ${profile[0].custom_count}`)
      console.log(`   Is Pro: ${profile[0].is_pro}`)
    } else {
      console.log('❌ User not found in profiles table')
      console.log('   This might mean the user was created but profile was not generated')
    }

    // Test 4: Instructions
    console.log('\n4️⃣ Next Steps...')
    console.log('')
    console.log('   📧 Check Email:')
    console.log('      1. Check mornscience@163.com inbox')
    console.log('      2. Look for email from Supabase/SiteHub')
    console.log('      3. Click the "Reset Password" link in the email')
    console.log('')
    console.log('   🔗 Direct Testing:')
    console.log('      1. Visit: https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/forgot-password')
    console.log('      2. Enter: mornscience@163.com')
    console.log('      3. Click "Send Reset Link"')
    console.log('')
    console.log('   🔐 New Password Suggestions:')
    console.log('      - newpassword123')
    console.log('      - sitehub2024!')
    console.log('      - mornscience163!')

    console.log('\n✅ Password reset test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testReset163() 