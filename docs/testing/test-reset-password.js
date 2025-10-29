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

async function testResetPassword() {
  console.log('🧪 Testing Password Reset for mornscience@gmail.com...\n')

  try {
    const testEmail = 'mornscience@gmail.com'
    const currentPassword = 'uukpvlxyffxasgct'
    const newPassword = 'newpassword123'

    // Test 1: Check if user can sign in with current password
    console.log('1️⃣ Testing current password...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: currentPassword,
    })

    if (signInError) {
      console.log(`❌ Current password test failed: ${signInError.message}`)
      console.log('   This means the current password is incorrect or user needs to reset')
    } else {
      console.log('✅ Current password is correct')
      console.log(`   User ID: ${signInData.user.id}`)
      console.log(`   Email: ${signInData.user.email}`)
    }

    // Test 2: Send password reset email
    console.log('\n2️⃣ Sending password reset email...')
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl}/auth/reset-password`
    })

    if (resetError) {
      console.log(`❌ Password reset email failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log('   📧 Check the email inbox for mornscience@gmail.com')
      console.log('   🔗 The email will contain a link to reset the password')
    }

    // Test 3: Test the reset password page URL
    console.log('\n3️⃣ Testing reset password page...')
    console.log(`   Reset page URL: ${supabaseUrl}/auth/reset-password`)
    console.log('   💡 This page should allow setting a new password')
    console.log('   💡 The user will be redirected here after clicking the email link')

    // Test 4: Instructions for manual testing
    console.log('\n4️⃣ Manual Testing Instructions...')
    console.log('')
    console.log('   📧 Email Testing:')
    console.log('      1. Check mornscience@gmail.com inbox')
    console.log('      2. Look for email from Supabase/SiteHub')
    console.log('      3. Click the "Reset Password" link in the email')
    console.log('')
    console.log('   🔗 Direct Testing:')
    console.log('      1. Visit: https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/forgot-password')
    console.log('      2. Enter: mornscience@gmail.com')
    console.log('      3. Click "Send Reset Link"')
    console.log('      4. Check email and click the reset link')
    console.log('      5. Set new password on the reset page')
    console.log('')
    console.log('   🔐 New Password Suggestions:')
    console.log('      - newpassword123')
    console.log('      - sitehub2024!')
    console.log('      - mornscience123!')

    // Test 5: Check if user exists in database
    console.log('\n5️⃣ Checking user in database...')
    
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

    console.log('\n✅ Password reset test completed!')
    console.log('📋 Follow the manual testing instructions above to complete the reset process.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testResetPassword() 