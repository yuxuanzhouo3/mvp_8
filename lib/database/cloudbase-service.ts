let cloudbaseApp: any = null

async function getCloudbaseApp() {
  if (cloudbaseApp) return cloudbaseApp

  const env = process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID
  const secretId = process.env.CLOUDBASE_SECRET_ID
  const secretKey = process.env.CLOUDBASE_SECRET_KEY

  if (!env || !secretId || !secretKey) {
    throw new Error("CloudBase config missing")
  }

  const cloudbase = await import("@cloudbase/node-sdk")
  cloudbaseApp = cloudbase.default.init({
    env,
    secretId,
    secretKey,
  })

  return cloudbaseApp
}

export async function getDatabase() {
  const app = await getCloudbaseApp()
  return app.database()
}

export async function downloadFileFromCloudBase(fileID: string): Promise<Buffer> {
  const app = await getCloudbaseApp()
  const result = await app.downloadFile({ fileID })

  if (!result?.fileContent) {
    throw new Error("CloudBase file is empty")
  }

  return result.fileContent
}
