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

async function checkEmailConfig() {
  console.log('🔍 Checking Email Configuration...\n')

  try {
    // Test 1: Check if we can send a test reset email
    console.log('1️⃣ Testing password reset email...')
    
    const testEmail = 'mornscience@gmail.com'
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl}/auth/reset-password`
    })

    if (resetError) {
      console.log(`❌ Password reset failed: ${resetError.message}`)
      console.log(`   Error status: ${resetError.status}`)
      
      if (resetError.status === 400) {
        console.log('   🔍 This suggests:')
        console.log('      - Email configuration is not set up')
        console.log('      - SMTP settings are missing')
        console.log('      - Email service is not configured')
      }
    } else {
      console.log('✅ Password reset request accepted by Supabase')
      console.log('   📧 Email should be sent if SMTP is configured')
    }

    // Test 2: Check authentication settings
    console.log('\n2️⃣ Checking authentication settings...')
    console.log('   💡 Go to Supabase Dashboard > Authentication > Settings')
    console.log('   📧 Look for "SMTP Settings" section')
    console.log('   ❌ If SMTP is not configured, emails will not be sent')

    // Test 3: Email configuration instructions
    console.log('\n3️⃣ Email Configuration Instructions...')
    console.log('')
    console.log('   📧 Option 1: Configure Gmail SMTP')
    console.log('      1. Go to Supabase Dashboard > Authentication > Settings')
    console.log('      2. Scroll down to "SMTP Settings"')
    console.log('      3. Enable SMTP and configure:')
    console.log('         Host: smtp.gmail.com')
    console.log('         Port: 587')
    console.log('         Username: mornscience@gmail.com')
    console.log('         Password: [Gmail App Password]')
    console.log('         Sender Name: SiteHub')
    console.log('         Sender Email: mornscience@gmail.com')
    console.log('')
    console.log('   📧 Option 2: Use Supabase Email Templates')
    console.log('      1. Go to Supabase Dashboard > Authentication > Email Templates')
    console.log('      2. Customize the "Reset Password" template')
    console.log('      3. Test the template')
    console.log('')
    console.log('   📧 Option 3: Use External Email Service')
    console.log('      1. Consider using services like:')
    console.log('         - SendGrid')
    console.log('         - Mailgun')
    console.log('         - Resend')
    console.log('         - AWS SES')
    console.log('')

    // Test 4: Gmail App Password setup
    console.log('4️⃣ Gmail App Password Setup...')
    console.log('')
    console.log('   🔐 To generate Gmail App Password:')
    console.log('      1. Go to https://myaccount.google.com/security')
    console.log('      2. Enable "2-Step Verification" if not already enabled')
    console.log('      3. Go to "App passwords"')
    console.log('      4. Select "Mail" and "Other (Custom name)"')
    console.log('      5. Name it "SiteHub"')
    console.log('      6. Copy the 16-character password')
    console.log('      7. Use this password in Supabase SMTP settings')
    console.log('')

    // Test 5: Alternative solutions
    console.log('5️⃣ Alternative Solutions...')
    console.log('')
    console.log('   🔄 Temporary Workaround:')
    console.log('      1. Create a new user account')
    console.log('      2. Use a different email address')
    console.log('      3. Test with a working email service')
    console.log('')
    console.log('   🧪 Test with different email:')
    console.log('      1. Try with a different Gmail account')
    console.log('      2. Check if the issue is specific to mornscience@gmail.com')
    console.log('      3. Verify email is not in spam folder')
    console.log('')

    console.log('✅ Email configuration check completed!')
    console.log('📋 Follow the instructions above to set up email sending.')

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkEmailConfig() 