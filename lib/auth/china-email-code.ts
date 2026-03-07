import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { getDatabase } from "@/lib/database/cloudbase-service"

const CODE_COLLECTION = "auth_email_verification_codes"
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_INTERVAL_MS = 60 * 1000

export type ChinaEmailCodePurpose = "signup" | "reset"

interface SendCodeOptions {
  email: string
  purpose: ChinaEmailCodePurpose
}

interface VerifyCodeOptions {
  email: string
  purpose: ChinaEmailCodePurpose
  code: string
}

function assertChinaDeployment() {
  if (resolveDeploymentRegion() !== "CN") {
    throw new Error("Email verification code service is only available in CN deployment")
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function getSmtpConfig() {
  const host = process.env.AUTH_EMAIL_SMTP_HOST
  const port = Number(process.env.AUTH_EMAIL_SMTP_PORT || "465")
  const user = process.env.AUTH_EMAIL_SMTP_USER
  const pass = process.env.AUTH_EMAIL_SMTP_PASS
  const from = process.env.AUTH_EMAIL_FROM || user

  if (!host || !user || !pass || !from) {
    throw new Error("Missing AUTH_EMAIL_SMTP_HOST/AUTH_EMAIL_SMTP_USER/AUTH_EMAIL_SMTP_PASS/AUTH_EMAIL_FROM")
  }

  return {
    host,
    port,
    secure: process.env.AUTH_EMAIL_SMTP_SECURE
      ? process.env.AUTH_EMAIL_SMTP_SECURE === "true"
      : port === 465,
    user,
    pass,
    from,
  }
}

async function sendVerificationCodeEmail(email: string, code: string, purpose: ChinaEmailCodePurpose) {
  const smtp = getSmtpConfig()

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  })

  const subject = purpose === "signup" ? "【SiteHub】注册验证码" : "【SiteHub】重置密码验证码"
  const actionText = purpose === "signup" ? "注册" : "重置密码"

  await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject,
    text: `您的${actionText}验证码是：${code}（10分钟内有效）`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 12px">SiteHub 邮箱验证码</h2>
        <p>您正在进行${actionText}操作，验证码如下：</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</p>
        <p>验证码 <strong>10 分钟</strong> 内有效，请勿泄露给他人。</p>
      </div>
    `,
  })
}

function pickLatestRecord(records: any[]) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.created_at || 0).getTime()
    const rightTime = new Date(right.created_at || 0).getTime()
    return rightTime - leftTime
  })[0]
}

function isCollectionNotFoundError(error: any) {
  const message = String(error?.message || error?.msg || "")
  const code = String(error?.code || error?.errCode || "")

  return (
    message.includes("Db or Table not exist") ||
    message.includes("DATABASE_COLLECTION_NOT_EXIST") ||
    message.includes("ResourceNotFound") ||
    code.includes("DATABASE_COLLECTION_NOT_EXIST") ||
    code.includes("ResourceNotFound")
  )
}

async function ensureCodeCollectionExists(db: any) {
  try {
    await db.collection(CODE_COLLECTION).limit(1).get()
    return
  } catch (error: any) {
    if (!isCollectionNotFoundError(error)) {
      throw error
    }

    try {
      await db.createCollection(CODE_COLLECTION)
      return
    } catch (createError: any) {
      const createMessage = String(createError?.message || createError?.msg || "")
      if (createMessage.toLowerCase().includes("already")) {
        return
      }

      const envId = process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || "unknown_env"
      throw new Error(
        `CloudBase 集合 ${CODE_COLLECTION} 不存在且自动创建失败，请在环境 ${envId} 中创建后重试`
      )
    }
  }
}

export async function sendChinaEmailVerificationCode(options: SendCodeOptions) {
  assertChinaDeployment()

  const email = options.email.trim().toLowerCase()
  const purpose = options.purpose

  if (!isValidEmail(email)) {
    throw new Error("邮箱格式不正确")
  }

  const db = await getDatabase()
  await ensureCodeCollectionExists(db)

  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  const existingResult = await db.collection(CODE_COLLECTION).where({
    email,
    purpose,
    used: false,
  }).get()

  const existingRecords = existingResult?.data || []
  const latest = pickLatestRecord(existingRecords)

  if (latest?.created_at) {
    const latestTime = new Date(latest.created_at).getTime()
    if (Number.isFinite(latestTime) && now - latestTime < RESEND_INTERVAL_MS) {
      throw new Error("验证码发送过于频繁，请 60 秒后重试")
    }
  }

  if (existingRecords.length > 0) {
    await db.collection(CODE_COLLECTION).where({
      email,
      purpose,
      used: false,
    }).update({
      used: true,
      consumed_reason: "replaced_by_new_code",
      updated_at: nowIso,
    })
  }

  const code = generateVerificationCode()
  const codeHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString()

  const insertResult = await db.collection(CODE_COLLECTION).add({
    email,
    purpose,
    code_hash: codeHash,
    expires_at: expiresAt,
    used: false,
    created_at: nowIso,
    updated_at: nowIso,
  })

  try {
    await sendVerificationCodeEmail(email, code, purpose)
  } catch (error: any) {
    const recordId = insertResult?._id || insertResult?.id

    if (recordId) {
      await db.collection(CODE_COLLECTION).doc(recordId).update({
        used: true,
        consumed_reason: "email_send_failed",
        updated_at: new Date().toISOString(),
      })
    }

    throw new Error(error?.message || "发送验证码失败，请稍后重试")
  }

  return {
    success: true,
    expiresInSeconds: CODE_TTL_MS / 1000,
  }
}

export async function verifyChinaEmailVerificationCode(options: VerifyCodeOptions) {
  assertChinaDeployment()

  const email = options.email.trim().toLowerCase()
  const purpose = options.purpose
  const code = options.code.trim()

  if (!isValidEmail(email)) {
    return { success: false, error: "邮箱格式不正确" }
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "验证码格式错误，请输入6位数字" }
  }

  const db = await getDatabase()
  await ensureCodeCollectionExists(db)

  const result = await db.collection(CODE_COLLECTION).where({
    email,
    purpose,
    used: false,
  }).get()

  const records = result?.data || []
  if (records.length === 0) {
    return { success: false, error: "验证码错误或已过期，请重新获取" }
  }

  const latest = pickLatestRecord(records)
  const latestId = latest?._id

  if (!latest || !latestId) {
    return { success: false, error: "验证码错误或已过期，请重新获取" }
  }

  const expiresAt = new Date(latest.expires_at || 0).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    await db.collection(CODE_COLLECTION).doc(latestId).update({
      used: true,
      consumed_reason: "expired",
      updated_at: new Date().toISOString(),
    })
    return { success: false, error: "验证码错误或已过期，请重新获取" }
  }

  const isMatch = await bcrypt.compare(code, latest.code_hash || "")
  if (!isMatch) {
    return { success: false, error: "验证码错误或已过期，请重新获取" }
  }

  await db.collection(CODE_COLLECTION).doc(latestId).update({
    used: true,
    consumed_reason: "verified",
    consumed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return { success: true }
}
