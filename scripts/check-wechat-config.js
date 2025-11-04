/**
 * 微信登录配置检查脚本
 * 用于验证微信登录相关的环境变量是否已正确配置
 * 
 * 使用方法：
 * 1. 在项目根目录运行：node scripts/check-wechat-config.js
 * 2. 或添加到 package.json 中：npm run check:wechat
 */

require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = {
  // 微信登录配置
  WECHAT_APP_ID: {
    name: '微信APPID',
    format: 'wx_xxxxxxxxxxxxxxxx',
    description: '从微信开放平台获取'
  },
  WECHAT_APP_SECRET: {
    name: '微信APPSECRET',
    format: 'xxxxxxxxxxxxxxxxxxxxxxxx',
    description: '从微信开放平台获取（只显示一次）'
  },
  // 网站URL
  NEXT_PUBLIC_SITE_URL: {
    name: '网站URL',
    format: 'https://mornhub.help 或 http://localhost:3000',
    description: '用于OAuth回调'
  },
  // JWT密钥
  JWT_SECRET: {
    name: 'JWT密钥',
    format: '任意强密码字符串',
    description: '用于生成登录Token'
  },
  // 腾讯云CloudBase配置
  NEXT_PUBLIC_WECHAT_CLOUDBASE_ID: {
    name: 'CloudBase环境ID',
    format: 'cloudbase-xxxxxxxxx',
    description: '从腾讯云控制台获取'
  },
  CLOUDBASE_SECRET_ID: {
    name: 'CloudBase SecretId',
    format: 'xxxxxxxxxxxxxxxxxxxxxxxx',
    description: '从腾讯云控制台获取'
  },
  CLOUDBASE_SECRET_KEY: {
    name: 'CloudBase SecretKey',
    format: 'xxxxxxxxxxxxxxxxxxxxxxxx',
    description: '从腾讯云控制台获取'
  }
}

console.log('🔍 开始检查微信登录配置...\n')

let allPassed = true
const results = []

// 检查每个必需的环境变量
Object.entries(requiredEnvVars).forEach(([key, info]) => {
  const value = process.env[key]
  
  if (!value) {
    console.log(`❌ ${info.name} (${key})`)
    console.log(`   未配置`)
    console.log(`   格式：${info.format}`)
    console.log(`   说明：${info.description}\n`)
    allPassed = false
    results.push({ key, status: 'missing', info })
  } else {
    // 基本格式验证
    let isValid = true
    let validationMessage = ''
    
    if (key === 'WECHAT_APP_ID') {
      if (!value.startsWith('wx_')) {
        isValid = false
        validationMessage = '   ⚠️  APPID应该以 "wx_" 开头'
      }
    } else if (key === 'NEXT_PUBLIC_WECHAT_CLOUDBASE_ID') {
      if (!value.startsWith('cloudbase-')) {
        isValid = false
        validationMessage = '   ⚠️  环境ID应该以 "cloudbase-" 开头'
      }
    } else if (key === 'NEXT_PUBLIC_SITE_URL') {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        isValid = false
        validationMessage = '   ⚠️  URL应该以 http:// 或 https:// 开头'
      }
    } else if (key === 'JWT_SECRET') {
      if (value.length < 32) {
        isValid = false
        validationMessage = '   ⚠️  JWT密钥建议至少32位字符'
      }
    }
    
    if (isValid) {
      // 隐藏敏感信息，只显示部分
      const displayValue = key.includes('SECRET') || key.includes('KEY')
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value
      
      console.log(`✅ ${info.name} (${key})`)
      console.log(`   值：${displayValue}\n`)
      results.push({ key, status: 'ok', info, value: displayValue })
    } else {
      console.log(`⚠️  ${info.name} (${key})`)
      console.log(`   值：${value.substring(0, 20)}...`)
      console.log(validationMessage)
      console.log(`   格式：${info.format}\n`)
      results.push({ key, status: 'warning', info, value, validationMessage })
    }
  }
})

// 总结
console.log('='.repeat(50))
if (allPassed) {
  console.log('✅ 所有必需的环境变量已配置！')
  console.log('\n📝 下一步：')
  console.log('1. 确认微信开放平台已配置授权回调域：mornhub.help')
  console.log('2. 确认应用审核已通过')
  console.log('3. 运行 npm run dev 启动开发服务器')
  console.log('4. 访问网站测试微信登录功能\n')
} else {
  console.log('❌ 部分环境变量未配置或配置不正确')
  console.log('\n📝 请按照以下步骤配置：')
  console.log('1. 在项目根目录创建或编辑 .env.local 文件')
  console.log('2. 参考 docs/guides/微信登录企业账号配置指南.md')
  console.log('3. 添加所有必需的环境变量')
  console.log('4. 重新运行此脚本检查\n')
}

// 导出结果（供其他脚本使用）
module.exports = { results, allPassed }

