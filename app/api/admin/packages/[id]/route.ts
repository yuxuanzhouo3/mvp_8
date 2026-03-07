import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/downloads/admin-auth"
import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { deletePackageById, updatePackageActive } from "@/lib/downloads/repository"

export const runtime = "nodejs"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await request.json()
    const region = resolveDeploymentRegion()
    const isActive = Boolean(body?.isActive)

    if (!id) {
      return NextResponse.json({ success: false, error: "Package id is required" }, { status: 400 })
    }

    await updatePackageActive({ id, region, isActive })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update package" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const region = resolveDeploymentRegion()

    if (!id) {
      return NextResponse.json({ success: false, error: "Package id is required" }, { status: 400 })
    }

    await deletePackageById({ id, region })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete package" },
      { status: 500 }
    )
  }
}
