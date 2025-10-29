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

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality...\n')

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing database connection...')
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`)
      return
    }
    
    console.log('✅ Database connection successful')

    // Test 2: Test password reset for mornscience@gmail.com
    console.log('\n2️⃣ Testing password reset for mornscience@gmail.com...')
    
    const testEmail = 'mornscience@gmail.com'
    
    console.log(`   Email: ${testEmail}`)

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
      console.log('   📧 Check the email inbox for mornscience@gmail.com')
      console.log('   🔗 The email will contain a link to reset the password')
    }

    // Test 3: Check if user exists
    console.log('\n3️⃣ Checking if user exists...')
    
    // Try to sign in with a test password to see if user exists
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    })
    
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists but password is incorrect (expected)')
        console.log('   💡 This confirms the email is registered')
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('✅ User exists but email is not confirmed')
        console.log('   💡 User needs to confirm email first')
      } else {
        console.log(`❌ Sign in error: ${signInError.message}`)
      }
    } else {
      console.log('⚠️  User exists and password is correct')
      console.log('   💡 Consider changing the password first')
    }

    // Test 4: Instructions for setting up email
    console.log('\n4️⃣ Email Configuration Instructions...')
    console.log('   💡 To set up email sending in Supabase:')
    console.log('')
    console.log('   1. Go to Supabase Dashboard > Authentication > Settings')
    console.log('   2. Scroll down to "SMTP Settings"')
    console.log('   3. Configure your email provider:')
    console.log('      - For Gmail: Use App Password')
    console.log('      - For Outlook: Use App Password')
    console.log('      - For custom SMTP: Use your server settings')
    console.log('')
    console.log('   📧 For mornscience@gmail.com:')
    console.log('      1. Enable 2-factor authentication on Google account')
    console.log('      2. Generate an App Password')
    console.log('      3. Use the App Password in Supabase SMTP settings')
    console.log('')
    console.log('   🔗 Test the reset link by visiting:')
    console.log(`      ${supabaseUrl}/auth/reset-password`)

    console.log('\n✅ Password reset test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPasswordReset() 