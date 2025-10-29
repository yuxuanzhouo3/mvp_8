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

async function createResetLink() {
  console.log('🔗 Creating Direct Password Reset Link...\n')

  try {
    const testEmail = 'mornscience@163.com'
    const redirectUrl = 'https://mvp-8-kwv5th556-yzcmf94-4399s-projects.vercel.app/auth/reset-password'

    console.log('📧 Sending password reset with custom redirect...')
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: redirectUrl
    })

    if (resetError) {
      console.log(`❌ Password reset failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log('')
      console.log('🔗 Direct Reset Links:')
      console.log('')
      console.log('1️⃣ Forgot Password Page:')
      console.log(`   ${redirectUrl.replace('/reset-password', '/forgot-password')}`)
      console.log('')
      console.log('2️⃣ Reset Password Page (after clicking email link):')
      console.log(`   ${redirectUrl}`)
      console.log('')
      console.log('3️⃣ Manual Reset via Supabase Dashboard:')
      console.log('   https://supabase.com/dashboard/project/ykirhilnbvsanqyenusf/auth/users')
      console.log('')
      console.log('📧 Check your email: mornscience@163.com')
      console.log('   The email will contain a link that redirects to the reset page')
      console.log('')
      console.log('🔐 Suggested new password: mornscience163!')
    }

  } catch (error) {
    console.error('❌ Failed to create reset link:', error.message)
  }
}

createResetLink() 