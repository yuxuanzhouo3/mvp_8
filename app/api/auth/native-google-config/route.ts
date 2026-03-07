import { NextResponse } from "next/server"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"

export const runtime = "nodejs"

export async function GET() {
  if (resolveDeploymentRegion() !== "INTL") {
    return NextResponse.json(
      {
        success: false,
        error: "native-google-config is only available in INTL deployment",
      },
      { status: 403 }
    )
  }

  const clientId =
    process.env.NATIVE_GOOGLE_WEB_CLIENT_ID ||
    process.env.NEXT_PUBLIC_NATIVE_GOOGLE_WEB_CLIENT_ID ||
    ""

  return NextResponse.json(
    {
      success: true,
      clientId,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
