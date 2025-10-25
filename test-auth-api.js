#!/usr/bin/env node

/**
 * 测试国内用户邮箱认证 API
 */

require('dotenv').config({ path: '.env.local' })

async function testSignup() {
  console.log('🧪 测试注册接口...\n')
  
  const email = `test${Date.now()}@example.com`
  const password = 'test123456'
  
  console.log('请求参数:')
  console.log(`  邮箱: ${email}`)
  console.log(`  密码: ${password}`)
  console.log(`  操作: signup\n`)
  
  try {
    const response = await fetch('http://localhost:3000/api/auth-cn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        action: 'signup'
      })
    })
    
    const data = await response.json()
    
    console.log('响应状态:', response.status)
    console.log('响应数据:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ 注册成功！')
      console.log('用户信息:', JSON.stringify(data.user, null, 2))
    } else {
      console.log('\n❌ 注册失败:', data.message)
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

async function testLogin(email, password) {
  console.log('\n🧪 测试登录接口...\n')
  
  console.log('请求参数:')
  console.log(`  邮箱: ${email}`)
  console.log(`  密码: ${password}`)
  console.log(`  操作: login\n`)
  
  try {
    const response = await fetch('http://localhost:3000/api/auth-cn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        action: 'login'
      })
    })
    
    const data = await response.json()
    
    console.log('响应状态:', response.status)
    console.log('响应数据:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ 登录成功！')
      console.log('用户信息:', JSON.stringify(data.user, null, 2))
    } else {
      console.log('\n❌ 登录失败:', data.message)
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

async function main() {
  await testSignup()
}

main().catch(console.error)


