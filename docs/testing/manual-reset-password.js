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

async function manualResetPassword() {
  console.log('🔧 Manual Password Reset Tool...\n')

  try {
    const testEmail = 'mornscience@gmail.com'
    const newPassword = 'newpassword123'

    console.log(`📧 Email: ${testEmail}`)
    console.log(`🔐 New Password: ${newPassword}`)
    console.log('')

    // Step 1: Check if user exists
    console.log('1️⃣ Checking if user exists...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'oldpassword123' // Try with a wrong password
    })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists (expected error with wrong password)')
      } else {
        console.log(`❌ Error: ${signInError.message}`)
        return
      }
    }

    // Step 2: Try to update password directly (this might not work without proper session)
    console.log('\n2️⃣ Attempting to update password...')
    
    // First, we need to get a session or use admin functions
    // This is a limitation - we can't update password without proper authentication
    
    console.log('❌ Cannot update password without proper authentication')
    console.log('   💡 This requires either:')
    console.log('      1. User to be logged in')
    console.log('      2. Admin access to the database')
    console.log('      3. Email configuration to work properly')

    // Step 3: Alternative solutions
    console.log('\n3️⃣ Alternative Solutions...')
    console.log('')
    console.log('   🔄 Solution 1: Configure Email (Recommended)')
    console.log('      1. Set up Gmail SMTP in Supabase')
    console.log('      2. Use the password reset email flow')
    console.log('')
    console.log('   🔄 Solution 2: Create New User')
    console.log('      1. Create a new account with different email')
    console.log('      2. Use the new account instead')
    console.log('')
    console.log('   🔄 Solution 3: Use Supabase Dashboard')
    console.log('      1. Go to Supabase Dashboard > Authentication > Users')
    console.log('      2. Find the user mornscience@gmail.com')
    console.log('      3. Click "Edit" and change password manually')
    console.log('')

    // Step 4: Instructions for Supabase Dashboard
    console.log('4️⃣ Manual Reset via Supabase Dashboard...')
    console.log('')
    console.log('   📋 Steps:')
    console.log('      1. Go to: https://supabase.com/dashboard/project/ykirhilnbvsanqyenusf')
    console.log('      2. Click "Authentication" in the left sidebar')
    console.log('      3. Click "Users" tab')
    console.log('      4. Find user: mornscience@gmail.com')
    console.log('      5. Click the three dots (...) next to the user')
    console.log('      6. Select "Edit"')
    console.log('      7. Change the password to: newpassword123')
    console.log('      8. Save changes')
    console.log('')

    console.log('✅ Manual reset instructions provided!')
    console.log('📋 Use the Supabase Dashboard method for immediate solution.')

  } catch (error) {
    console.error('❌ Manual reset failed:', error.message)
  }
}

manualResetPassword() 