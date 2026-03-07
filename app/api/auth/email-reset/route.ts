import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { getDatabase } from "@/lib/database/cloudbase-service"
import { verifyChinaEmailVerificationCode } from "@/lib/auth/china-email-code"

export async function POST(request: NextRequest) {
  try {
    if (resolveDeploymentRegion() !== "CN") {
      return NextResponse.json(
        { success: false, error: "Only CN deployment supports code-based password reset" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const rawEmail = String(body?.email || "").trim()
    const email = rawEmail.toLowerCase()
    const verificationCode = String(body?.verificationCode || "").trim()
    const newPassword = String(body?.newPassword || "")

    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json({ success: false, error: "请填写完整信息" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "密码至少6位" }, { status: 400 })
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json({ success: false, error: "请输入6位邮箱验证码" }, { status: 400 })
    }

    const verifyResult = await verifyChinaEmailVerificationCode({
      email,
      purpose: "reset",
      code: verificationCode,
    })

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || "验证码错误或已过期，请重新获取" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    let userResult = await db.collection("web_users").where({ email }).get()
    if ((!userResult?.data || userResult.data.length === 0) && rawEmail && rawEmail !== email) {
      userResult = await db.collection("web_users").where({ email: rawEmail }).get()
    }

    if (!userResult?.data || userResult.data.length === 0) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 })
    }

    const userDoc = userResult.data[0]
    const userId = userDoc?._id || userDoc?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: "用户数据异常" }, { status: 500 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.collection("web_users").doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "密码重置成功，请使用新密码登录",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "重置密码失败，请稍后重试" },
      { status: 500 }
    )
  }
}
