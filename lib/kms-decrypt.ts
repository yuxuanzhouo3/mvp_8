/**
 * 腾讯云KMS密钥解密工具
 * 用于运行时解密环境变量中的加密密钥
 */

import * as tencentcloud from 'tencentcloud-sdk-nodejs'

const KmsClient = tencentcloud.kms.v20190118.Client

// 缓存解密后的密钥（避免重复调用KMS）
const decryptedCache: Record<string, string> = {}

/**
 * 解密KMS加密的环境变量
 * @param encryptedValue KMS加密后的密文
 * @returns 解密后的明文
 */
export async function decryptKMSSecret(encryptedValue: string): Promise<string> {
  // 检查缓存
  if (decryptedCache[encryptedValue]) {
    return decryptedCache[encryptedValue]
  }

  try {
    const client = new KmsClient({
      credential: {
        // 使用腾讯云临时凭证（由云函数自动提供，无需手动配置）
        // 如果在本地开发，需要配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY
        secretId: process.env.TENCENT_SECRET_ID || '',
        secretKey: process.env.TENCENT_SECRET_KEY || '',
      },
      region: 'ap-guangzhou', // 根据实际KMS密钥所在区域调整
    })

    const params = {
      CiphertextBlob: encryptedValue,
    }

    const response = await client.Decrypt(params)
    const plaintext = response.Plaintext || ''

    // 缓存结果
    decryptedCache[encryptedValue] = plaintext

    return plaintext
  } catch (error) {
    console.error('❌ KMS解密失败:', error)
    throw new Error('Failed to decrypt secret from KMS')
  }
}

/**
 * 获取解密后的环境变量
 * @param key 环境变量名称
 * @returns 解密后的值
 */
export async function getDecryptedEnv(key: string): Promise<string> {
  // 尝试获取加密的环境变量（带_ENCRYPTED后缀）
  const encryptedKey = `${key}_ENCRYPTED`
  const encryptedValue = process.env[encryptedKey]

  if (encryptedValue) {
    // 如果存在加密版本，解密后返回
    return await decryptKMSSecret(encryptedValue)
  }

  // 如果不存在加密版本，尝试直接返回明文版本
  const plainValue = process.env[key]
  if (plainValue) {
    console.warn(`⚠️ 环境变量 ${key} 未加密，建议使用KMS加密`)
    return plainValue
  }

  throw new Error(`环境变量 ${key} 不存在`)
}

/**
 * 批量获取解密后的环境变量
 * @param keys 环境变量名称数组
 * @returns 解密后的值对象
 */
export async function getDecryptedEnvs(keys: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  await Promise.all(
    keys.map(async (key) => {
      try {
        results[key] = await getDecryptedEnv(key)
      } catch (error) {
        console.error(`❌ 获取环境变量 ${key} 失败:`, error)
      }
    })
  )

  return results
}
