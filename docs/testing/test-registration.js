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

async function testRegistration() {
  console.log('🧪 Testing User Registration (Email Confirmation Disabled)...\n')

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing database connection...')
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`)
      return
    }
    
    console.log('✅ Database connection successful')

    // Test 2: Test user registration
    console.log('\n2️⃣ Testing user registration...')
    
    const testEmail = `user${Date.now()}@gmail.com`
    const testPassword = 'testpassword123'
    
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.log(`❌ Registration failed: ${signUpError.message}`)
      console.log(`   Error status: ${signUpError.status}`)
      return
    }

    if (signUpData.user) {
      console.log(`✅ Registration succeeded!`)
      console.log(`   User ID: ${signUpData.user.id}`)
      console.log(`   Email: ${signUpData.user.email}`)
      console.log(`   Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Test 3: Check if profile was created
      console.log('\n3️⃣ Checking profile creation...')
      
      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
      
      if (profileError) {
        console.log(`❌ Profile error: ${profileError.message}`)
      } else if (profile && profile.length > 0) {
        console.log('✅ Profile created successfully!')
        console.log(`   Email: ${profile[0].email}`)
        console.log(`   Custom Count: ${profile[0].custom_count}`)
        console.log(`   Is Pro: ${profile[0].is_pro}`)
      } else {
        console.log('❌ Profile was NOT created')
        console.log('   This suggests the trigger is not working')
      }
      
      // Test 4: Check user settings
      console.log('\n4️⃣ Checking user settings...')
      
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', signUpData.user.id)
      
      if (settingsError) {
        console.log(`❌ Settings error: ${settingsError.message}`)
      } else if (settings && settings.length > 0) {
        console.log('✅ User settings created successfully!')
        console.log(`   Theme: ${settings[0].theme}`)
        console.log(`   Layout: ${settings[0].layout}`)
        console.log(`   Auto Sync: ${settings[0].auto_sync}`)
      } else {
        console.log('❌ User settings were NOT created')
      }
      
      // Test 5: Check subscription
      console.log('\n5️⃣ Checking subscription...')
      
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', signUpData.user.id)
      
      if (subscriptionError) {
        console.log(`❌ Subscription error: ${subscriptionError.message}`)
      } else if (subscription && subscription.length > 0) {
        console.log('✅ Subscription created successfully!')
        console.log(`   Plan: ${subscription[0].plan_type}`)
        console.log(`   Status: ${subscription[0].status}`)
        console.log(`   Period End: ${subscription[0].current_period_end}`)
      } else {
        console.log('❌ Subscription was NOT created')
      }
      
      // Test 6: Test sign in (should work without email confirmation)
      console.log('\n6️⃣ Testing sign in...')
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (signInError) {
        console.log(`❌ Sign in failed: ${signInError.message}`)
        console.log(`   Error status: ${signInError.status}`)
      } else {
        console.log('✅ Sign in successful!')
        console.log(`   Session created: ${signInData.session ? 'Yes' : 'No'}`)
        if (signInData.session) {
          console.log(`   User ID: ${signInData.session.user.id}`)
          console.log(`   Email: ${signInData.session.user.email}`)
        }
      }
      
    } else {
      console.log('⚠️  Registration completed but no user data returned')
    }

    console.log('\n✅ Registration test completed!')
    console.log('📋 Check the results above to see if everything is working.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRegistration() 