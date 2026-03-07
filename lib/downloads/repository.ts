import { resolveDeploymentRegion } from "@/lib/config/deployment-region"
import { getDatabase, downloadFileFromCloudBase } from "@/lib/database/cloudbase-service"
import { deleteFromCloudbaseStorage } from "@/lib/downloads/cloudbase-storage"
import { ensureSupabaseBucketExists, getSupabaseAdminForDownloads, getSupabaseDownloadBucket } from "@/lib/downloads/supabase-admin"
import {
  CreateDownloadPackageInput,
  DownloadEventInput,
  DownloadPackageRecord,
  PackageRegion,
} from "@/lib/downloads/types"

function normalizeRegion(value?: string | null): PackageRegion {
  return String(value || "").toUpperCase() === "INTL" ? "INTL" : "CN"
}

function mapSupabasePackage(row: any): DownloadPackageRecord {
  return {
    id: String(row.id),
    region: normalizeRegion(row.region),
    platform: String(row.platform || "unknown"),
    version: String(row.version || "0.0.0"),
    title: String(row.title || "Installer"),
    fileName: String(row.file_name || "package.bin"),
    fileSize: Number(row.file_size || 0),
    mimeType: String(row.mime_type || "application/octet-stream"),
    releaseNotes: row.release_notes || null,
    isActive: Boolean(row.is_active),
    downloadCount: Number(row.download_count || 0),
    storageProvider: "supabase",
    storagePath: String(row.file_path || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.created_at || new Date().toISOString()),
  }
}

function mapCloudbasePackage(row: any): DownloadPackageRecord {
  return {
    id: String(row._id || row.id),
    region: normalizeRegion(row.region),
    platform: String(row.platform || "unknown"),
    version: String(row.version || "0.0.0"),
    title: String(row.title || "Installer"),
    fileName: String(row.file_name || "package.bin"),
    fileSize: Number(row.file_size || 0),
    mimeType: String(row.mime_type || "application/octet-stream"),
    releaseNotes: row.release_notes || null,
    isActive: Boolean(row.is_active),
    downloadCount: Number(row.download_count || 0),
    storageProvider: "cloudbase",
    storagePath: String(row.file_path || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.created_at || new Date().toISOString()),
  }
}

function toNumber(value: any): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDateInput(value: any): string | number | Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date || typeof value === "string" || typeof value === "number") return value
  if (typeof value === "object" && value !== null && "$date" in value) {
    return (value as any).$date
  }
  return null
}

function toTimestamp(value: any): number | null {
  const normalized = normalizeDateInput(value)
  if (normalized === null) return null
  const timestamp = new Date(normalized).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function toIsoString(value: any): string {
  const timestamp = toTimestamp(value)
  return timestamp === null ? new Date().toISOString() : new Date(timestamp).toISOString()
}

function isOnOrAfterTimestamp(value: any, thresholdMs: number): boolean {
  const timestamp = toTimestamp(value)
  return timestamp !== null && timestamp >= thresholdMs
}

function isAfterTimestamp(value: any, thresholdMs: number): boolean {
  const timestamp = toTimestamp(value)
  return timestamp !== null && timestamp > thresholdMs
}

function normalizeIdentity(value: any): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().toLowerCase()
  return normalized ? normalized : null
}

function pickIdentity(row: any): string | null {
  return (
    normalizeIdentity(row?.user_email) ||
    normalizeIdentity(row?.email) ||
    normalizeIdentity(row?.user_id) ||
    normalizeIdentity(row?.id) ||
    normalizeIdentity(row?._id)
  )
}

function isCompletedStatus(value: any): boolean {
  const status = String(value || "").toLowerCase()
  return status === "completed" || status === "success" || status === "succeeded" || status === "paid"
}

function isCompletedTransaction(row: any): boolean {
  return isCompletedStatus(row?.status) || isCompletedStatus(row?.payment_status)
}

function isActiveSubscription(row: any, nowMs: number): boolean {
  const status = String(row?.status || "").toLowerCase()
  if (["cancelled", "canceled", "expired", "inactive", "failed"].includes(status)) {
    return false
  }

  const expiresAt =
    row?.current_period_end ??
    row?.expire_time ??
    row?.subscription_expires_at ??
    row?.membership_expires_at ??
    row?.expires_at

  const expiresAtMs = toTimestamp(expiresAt)
  if (expiresAtMs !== null) return expiresAtMs > nowMs

  return status === "active" || status === "trialing"
}

function getTransactionAmount(row: any, currency: "CNY" | "USD"): number {
  const rowCurrency = String(row?.currency || "").toUpperCase()

  if (currency === "CNY") {
    if (row?.amount_cny !== undefined && row?.amount_cny !== null) return toNumber(row.amount_cny)
    if ((rowCurrency === "CNY" || !rowCurrency) && row?.amount !== undefined && row?.amount !== null) {
      return toNumber(row.amount)
    }
    if (rowCurrency === "CNY" && row?.gross_amount !== undefined && row?.gross_amount !== null) {
      return toNumber(row.gross_amount) / 100
    }
    return 0
  }

  if (row?.amount_usd !== undefined && row?.amount_usd !== null) return toNumber(row.amount_usd)
  if ((rowCurrency === "USD" || !rowCurrency) && row?.amount !== undefined && row?.amount !== null) {
    return toNumber(row.amount)
  }
  if ((rowCurrency === "USD" || !rowCurrency) && row?.gross_amount !== undefined && row?.gross_amount !== null) {
    return toNumber(row.gross_amount) / 100
  }
  return 0
}

async function safeCloudbaseCollectionGet(db: any, collectionName: string, where?: Record<string, any>) {
  try {
    let query = db.collection(collectionName)
    if (where) query = query.where(where)
    const result = await query.get()
    return Array.isArray(result?.data) ? result.data : []
  } catch (error: any) {
    const message = String(error?.message || "")
    if (message.includes("Db or Table not exist") || message.includes("DATABASE_COLLECTION_NOT_EXIST")) {
      return []
    }
    throw error
  }
}

async function ensureCloudbaseCollections(db: any) {
  for (const name of ["download_packages", "download_events"]) {
    try {
      await db.collection(name).limit(1).get()
    } catch (error: any) {
      const msg = String(error?.message || "")
      if (msg.includes("Db or Table not exist") || msg.includes("DATABASE_COLLECTION_NOT_EXIST")) {
        await db.createCollection(name)
      } else {
        throw error
      }
    }
  }
}

export async function createDownloadPackage(input: CreateDownloadPackageInput): Promise<DownloadPackageRecord> {
  if (input.region === "INTL") {
    const supabase = getSupabaseAdminForDownloads()
    const { data: existingRows, error: existingError } = await supabase
      .from("download_packages")
      .select("*")
      .eq("region", "INTL")
      .eq("platform", input.platform)
      .order("created_at", { ascending: false })

    if (existingError) {
      throw new Error(existingError.message)
    }

    const primary = Array.isArray(existingRows) ? existingRows[0] : null

    let data: any = null
    let error: any = null

    if (primary?.id) {
      const updateResult = await supabase
        .from("download_packages")
        .update({
          version: input.version,
          title: input.title,
          file_name: input.fileName,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          release_notes: input.releaseNotes || null,
          is_active: input.isActive !== false,
          storage_provider: "supabase",
          file_path: input.storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", primary.id)
        .select("*")
        .single()

      data = updateResult.data
      error = updateResult.error
    } else {
      const insertResult = await supabase
        .from("download_packages")
        .insert({
          region: "INTL",
          platform: input.platform,
          version: input.version,
          title: input.title,
          file_name: input.fileName,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          release_notes: input.releaseNotes || null,
          is_active: input.isActive !== false,
          storage_provider: "supabase",
          file_path: input.storagePath,
        })
        .select("*")
        .single()

      data = insertResult.data
      error = insertResult.error
    }

    if (error || !data) {
      throw new Error(error?.message || "Failed to create package")
    }

    return mapSupabasePackage(data)
  }

  const db = await getDatabase()
  await ensureCloudbaseCollections(db)
  const now = new Date().toISOString()

  const existingResult = await db
    .collection("download_packages")
    .where({ region: "CN", platform: input.platform })
    .get()
  const existingRows = Array.isArray(existingResult?.data) ? existingResult.data : []
  const primary = existingRows.sort((a: any, b: any) => {
    const aTime = String(a?.updated_at || a?.created_at || "")
    const bTime = String(b?.updated_at || b?.created_at || "")
    return aTime > bTime ? -1 : 1
  })[0]

  const payload = {
    region: "CN",
    platform: input.platform,
    version: input.version,
    title: input.title,
    file_name: input.fileName,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    release_notes: input.releaseNotes || null,
    is_active: input.isActive !== false,
    download_count: 0,
    storage_provider: "cloudbase",
    file_path: input.storagePath,
    created_at: now,
    updated_at: now,
  }

  let row: any

  if (primary?._id) {
    await db.collection("download_packages").doc(primary._id).update({
      version: payload.version,
      title: payload.title,
      file_name: payload.file_name,
      file_size: payload.file_size,
      mime_type: payload.mime_type,
      release_notes: payload.release_notes,
      is_active: payload.is_active,
      storage_provider: payload.storage_provider,
      file_path: payload.file_path,
      updated_at: now,
    })

    const updated = await db.collection("download_packages").where({ _id: primary._id }).get()
    row = updated?.data?.[0] || { ...primary, ...payload, _id: primary._id }
  } else {
    const result = await db.collection("download_packages").add(payload)
    const listResult = await db.collection("download_packages").where({ _id: result.id }).get()
    row = listResult?.data?.[0] || { ...payload, _id: result.id }
  }

  return mapCloudbasePackage(row)
}

export async function listDownloadPackages(options?: {
  region?: PackageRegion
  onlyActive?: boolean
}): Promise<DownloadPackageRecord[]> {
  const region = options?.region
  const onlyActive = options?.onlyActive !== false

  if (region === "INTL") {
    const supabase = getSupabaseAdminForDownloads()
    let query = supabase.from("download_packages").select("*").eq("region", "INTL")
    if (onlyActive) query = query.eq("is_active", true)
    query = query.order("created_at", { ascending: false })
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data || []).map(mapSupabasePackage)
  }

  if (region === "CN") {
    const db = await getDatabase()
    await ensureCloudbaseCollections(db)
    let query = db.collection("download_packages").where({ region: "CN" })
    if (onlyActive) {
      query = db.collection("download_packages").where({ region: "CN", is_active: true })
    }
    const result = await query.get()
    const records = (result?.data || []).map(mapCloudbasePackage)
    return records.sort((a: DownloadPackageRecord, b: DownloadPackageRecord) => (a.createdAt > b.createdAt ? -1 : 1))
  }

  const current = resolveDeploymentRegion()
  return listDownloadPackages({ region: current, onlyActive })
}

export async function listAllDownloadPackagesForAdmin(): Promise<DownloadPackageRecord[]> {
  const activeRegion = resolveDeploymentRegion()
  const records = await listDownloadPackages({ region: activeRegion, onlyActive: false }).catch(() => [])
  return records.sort((a: DownloadPackageRecord, b: DownloadPackageRecord) =>
    a.createdAt > b.createdAt ? -1 : 1
  )
}

export async function updatePackageActive(input: {
  id: string
  region: PackageRegion
  isActive: boolean
}): Promise<void> {
  if (input.region === "INTL") {
    const supabase = getSupabaseAdminForDownloads()
    const { error } = await supabase
      .from("download_packages")
      .update({ is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq("id", input.id)
    if (error) throw new Error(error.message)
    return
  }

  const db = await getDatabase()
  await ensureCloudbaseCollections(db)
  await db.collection("download_packages").doc(input.id).update({
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  })
}

export async function deletePackageById(input: {
  id: string
  region: PackageRegion
}): Promise<void> {
  if (input.region === "INTL") {
    const supabase = getSupabaseAdminForDownloads()
    const bucket = getSupabaseDownloadBucket()

    const { data: existing, error: loadError } = await supabase
      .from("download_packages")
      .select("id,file_path")
      .eq("id", input.id)
      .eq("region", "INTL")
      .maybeSingle()

    if (loadError) throw new Error(loadError.message)

    if (existing?.file_path) {
      await supabase.storage.from(bucket).remove([String(existing.file_path)])
    }

    const { error } = await supabase
      .from("download_packages")
      .delete()
      .eq("id", input.id)
      .eq("region", "INTL")

    if (error) throw new Error(error.message)
    return
  }

  const db = await getDatabase()
  await ensureCloudbaseCollections(db)

  const existingResult = await db.collection("download_packages").where({ _id: input.id, region: "CN" }).get()
  const existing = existingResult?.data?.[0]

  if (existing?.file_path) {
    try {
      await deleteFromCloudbaseStorage(String(existing.file_path))
    } catch {
      // ignore storage deletion errors, still delete DB record
    }
  }

  await db.collection("download_packages").doc(input.id).remove()
}

export async function getPackageById(id: string, region?: PackageRegion): Promise<DownloadPackageRecord | null> {
  const regionToUse = region || resolveDeploymentRegion()

  if (regionToUse === "INTL") {
    const supabase = getSupabaseAdminForDownloads()
    const { data, error } = await supabase
      .from("download_packages")
      .select("*")
      .eq("id", id)
      .eq("region", "INTL")
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data ? mapSupabasePackage(data) : null
  }

  const db = await getDatabase()
  await ensureCloudbaseCollections(db)
  const result = await db.collection("download_packages").where({ _id: id, region: "CN" }).get()
  const row = result?.data?.[0]
  return row ? mapCloudbasePackage(row) : null
}

export async function recordDownloadEvent(input: DownloadEventInput): Promise<void> {
  const now = new Date().toISOString()

  if (input.region === "INTL") {
    const supabase = getSupabaseAdminForDownloads()

    const { data: existing, error: loadError } = await supabase
      .from("download_packages")
      .select("download_count")
      .eq("id", input.packageId)
      .maybeSingle()

    if (loadError) throw new Error(loadError.message)

    const currentCount = Number(existing?.download_count || 0)
    const { error: updateError } = await supabase
      .from("download_packages")
      .update({
        download_count: currentCount + 1,
        updated_at: now,
      })
      .eq("id", input.packageId)

    if (updateError) throw new Error(updateError.message)

    const { error: eventError } = await supabase.from("download_events").insert({
      package_id: input.packageId,
      region: "INTL",
      user_id: input.userId || null,
      user_email: input.userEmail || null,
      ip: input.ip || null,
      user_agent: input.userAgent || null,
      created_at: now,
    })
    if (eventError) throw new Error(eventError.message)

    return
  }

  const db = await getDatabase()
  await ensureCloudbaseCollections(db)

  const packageResult = await db.collection("download_packages").where({ _id: input.packageId }).get()
  const pkg = packageResult?.data?.[0]
  const currentCount = Number(pkg?.download_count || 0)

  await db.collection("download_packages").doc(input.packageId).update({
    download_count: currentCount + 1,
    updated_at: now,
  })

  await db.collection("download_events").add({
    package_id: input.packageId,
    region: "CN",
    user_id: input.userId || null,
    user_email: input.userEmail || null,
    ip: input.ip || null,
    user_agent: input.userAgent || null,
    created_at: now,
  })
}

export async function getSupabaseSignedDownloadUrl(filePath: string): Promise<string> {
  const bucket = getSupabaseDownloadBucket()
  await ensureSupabaseBucketExists(bucket, { public: false })
  const supabase = getSupabaseAdminForDownloads()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60)
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to create signed url")
  }

  return data.signedUrl
}

export async function downloadCloudbasePackageFile(fileID: string): Promise<Buffer> {
  return downloadFileFromCloudBase(fileID)
}

export async function getDownloadStatsSummary() {
  const activeRegion = resolveDeploymentRegion()
  const [allPackages, activeUsers] = await Promise.all([
    listDownloadPackages({ region: activeRegion, onlyActive: false }).catch(() => []),
    (activeRegion === "CN" ? countChinaUsers() : countIntlUsers()).catch(() => 0),
  ])

  const totalDownloads = allPackages.reduce((sum, item) => sum + Number(item.downloadCount || 0), 0)
  const cnPackages = activeRegion === "CN" ? allPackages.length : 0
  const intlPackages = activeRegion === "INTL" ? allPackages.length : 0
  const cnUsers = activeRegion === "CN" ? activeUsers : 0
  const intlUsers = activeRegion === "INTL" ? activeUsers : 0

  return {
    totalUsers: activeUsers,
    cnUsers,
    intlUsers,
    totalDownloads,
    totalPackages: allPackages.length,
    cnPackages,
    intlPackages,
  }
}

async function countIntlUsers(): Promise<number> {
  const supabase = getSupabaseAdminForDownloads()
  const profilesCount = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })

  if (!profilesCount.error) {
    return Number(profilesCount.count || 0)
  }

  // Backward compatibility for projects still on web_users.
  const usersCount = await supabase
    .from("web_users")
    .select("id", { count: "exact", head: true })
  if (usersCount.error) {
    throw new Error(profilesCount.error.message)
  }
  return Number(usersCount.count || 0)
}

async function countChinaUsers(): Promise<number> {
  const db = await getDatabase()
  const users = await safeCloudbaseCollectionGet(db, "web_users")
  return users.length
}

export async function getAdminDashboardStats() {
  const nowIso = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()
  const activeRegion = resolveDeploymentRegion()

  const emptyMetrics = {
    totalUsers: 0,
    paidUsers: 0,
    activeMembers: 0,
    completedOrders: 0,
    revenue: 0,
    todayNewUsers: 0,
  }

  const [downloadStats, activeMetrics] = await Promise.all([
    getDownloadStatsSummary(),
    (activeRegion === "CN" ? getCnBusinessMetrics(todayStartIso, nowIso) : getIntlBusinessMetrics(todayStartIso, nowIso))
      .catch(() => emptyMetrics),
  ])

  const cnMetrics = activeRegion === "CN" ? activeMetrics : emptyMetrics
  const intlMetrics = activeRegion === "INTL" ? activeMetrics : emptyMetrics

  return {
    overview: {
      totalUsers: cnMetrics.totalUsers + intlMetrics.totalUsers,
      paidUsers: cnMetrics.paidUsers + intlMetrics.paidUsers,
      activeMembers: cnMetrics.activeMembers + intlMetrics.activeMembers,
      completedOrders: cnMetrics.completedOrders + intlMetrics.completedOrders,
      totalRevenueCny: Number(cnMetrics.revenue.toFixed(2)),
      totalRevenueUsd: Number(intlMetrics.revenue.toFixed(2)),
      totalDownloads: downloadStats.totalDownloads,
      todayNewUsers: cnMetrics.todayNewUsers + intlMetrics.todayNewUsers,
    },
    cn: cnMetrics,
    intl: intlMetrics,
    downloads: downloadStats,
  }
}

export async function getRecentAdminUsers(limit = 20) {
  const activeRegion = resolveDeploymentRegion()
  const users = await (activeRegion === "CN" ? getCnUsers() : getIntlUsers(limit)).catch(() => [])
  return users
    .sort((a: any, b: any) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, limit)
}

export async function getRecentAdminOrders(limit = 20) {
  const activeRegion = resolveDeploymentRegion()
  const orders = await (activeRegion === "CN" ? getCnOrders() : getIntlOrders(limit)).catch(() => [])
  return orders
    .sort((a: any, b: any) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, limit)
}

export async function getRecentDownloadEvents(limit = 20) {
  const activeRegion = resolveDeploymentRegion()
  const events = await (activeRegion === "CN" ? getCnDownloadEvents() : getIntlDownloadEvents(limit)).catch(() => [])
  return events
    .sort((a: any, b: any) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, limit)
}

async function getCnBusinessMetrics(todayStartIso: string, nowIso: string) {
  const db = await getDatabase()
  const nowMs = toTimestamp(nowIso) || Date.now()
  const todayStartMs = toTimestamp(todayStartIso) || nowMs

  const [users, subscriptions, transactions] = await Promise.all([
    safeCloudbaseCollectionGet(db, "web_users"),
    safeCloudbaseCollectionGet(db, "web_subscriptions").catch(() => []),
    safeCloudbaseCollectionGet(db, "web_payment_transactions").catch(() => []),
  ])

  let todayNewUsers = 0
  const paidUsersSet = new Set<string>()
  const activeUsersSet = new Set<string>()

  for (const item of users) {
    const identity = pickIdentity(item)
    const tier = String(item?.subscription_tier || "").toLowerCase()
    const isPaidTier = Boolean(tier) && tier !== "free"
    const isPaidFlag = Boolean(item?.pro) || Boolean(item?.is_pro)

    if (identity && (isPaidFlag || isPaidTier)) {
      paidUsersSet.add(identity)
    }

    const membershipExpire =
      item?.subscription_expires_at ??
      item?.membership_expires_at ??
      item?.current_period_end ??
      item?.expire_time

    if (identity && isAfterTimestamp(membershipExpire, nowMs)) {
      activeUsersSet.add(identity)
    }

    const createdAt = item?.createdAt ?? item?.created_at
    if (isOnOrAfterTimestamp(createdAt, todayStartMs)) {
      todayNewUsers += 1
    }
  }

  for (const item of subscriptions) {
    const identity = pickIdentity(item)
    if (!identity) continue

    const status = String(item?.status || "").toLowerCase()
    if (status !== "pending" && status !== "failed") {
      paidUsersSet.add(identity)
    }

    if (isActiveSubscription(item, nowMs)) {
      activeUsersSet.add(identity)
    }
  }

  const completedTransactions = transactions.filter((item: any) => isCompletedTransaction(item))
  for (const item of completedTransactions) {
    const identity = pickIdentity(item)
    if (identity) paidUsersSet.add(identity)
  }
  const revenue = completedTransactions.reduce(
    (sum: number, item: any) => sum + getTransactionAmount(item, "CNY"),
    0
  )

  return {
    totalUsers: users.length,
    paidUsers: paidUsersSet.size,
    activeMembers: activeUsersSet.size,
    completedOrders: completedTransactions.length,
    revenue: Number(revenue.toFixed(2)),
    todayNewUsers,
  }
}

async function getIntlBusinessMetrics(todayStartIso: string, nowIso: string) {
  const supabase = getSupabaseAdminForDownloads()
  const nowMs = toTimestamp(nowIso) || Date.now()
  const todayStartMs = toTimestamp(todayStartIso) || nowMs

  const [profilesResult, fallbackUsersResult, subscriptionsResult, transactionsResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("web_users").select("*"),
    supabase.from("web_subscriptions").select("*"),
    supabase.from("web_payment_transactions").select("*"),
  ])

  const profileUsers = profilesResult.error ? [] : profilesResult.data || []
  const fallbackUsers = fallbackUsersResult.error ? [] : fallbackUsersResult.data || []
  const subscriptions = subscriptionsResult.error ? [] : subscriptionsResult.data || []
  const transactions = transactionsResult.error ? [] : transactionsResult.data || []

  const usersByIdentity = new Map<string, any>()
  for (const row of [...profileUsers, ...fallbackUsers]) {
    const identity = pickIdentity(row)
    if (!identity || usersByIdentity.has(identity)) continue
    usersByIdentity.set(identity, row)
  }

  const users = Array.from(usersByIdentity.values())
  const paidUsersSet = new Set<string>()
  const activeUsersSet = new Set<string>()

  let todayNewUsers = 0
  for (const item of users) {
    const identity = pickIdentity(item)
    if (!identity) continue

    const tier = String(item?.subscription_tier || "").toLowerCase()
    const isPaidTier = Boolean(tier) && tier !== "free"
    const isPaidFlag = Boolean(item?.is_pro) || Boolean(item?.pro)
    if (isPaidFlag || isPaidTier) {
      paidUsersSet.add(identity)
    }

    if (isOnOrAfterTimestamp(item?.created_at || item?.createdAt, todayStartMs)) {
      todayNewUsers += 1
    }
  }

  for (const item of subscriptions) {
    const identity = pickIdentity(item)
    if (!identity) continue

    const status = String(item?.status || "").toLowerCase()
    if (status !== "pending" && status !== "failed") {
      paidUsersSet.add(identity)
    }

    if (isActiveSubscription(item, nowMs)) {
      activeUsersSet.add(identity)
    }
  }

  const completedTransactions = transactions.filter((item: any) => isCompletedTransaction(item))
  for (const item of completedTransactions) {
    const identity = pickIdentity(item)
    if (identity) paidUsersSet.add(identity)
  }
  const revenue = completedTransactions.reduce(
    (sum: number, item: any) => sum + getTransactionAmount(item, "USD"),
    0
  )

  return {
    totalUsers: users.length,
    paidUsers: paidUsersSet.size,
    activeMembers: activeUsersSet.size,
    completedOrders: completedTransactions.length,
    revenue: Number(revenue.toFixed(2)),
    todayNewUsers,
  }
}

async function getCnUsers() {
  const db = await getDatabase()
  const rows = await safeCloudbaseCollectionGet(db, "web_users")

  return rows.map((row: any) => ({
    id: String(row?._id || ""),
    email: String(row?.email || ""),
    region: "CN",
    subscriptionTier: String(
      row?.subscription_tier ||
      ((row?.pro || row?.is_pro) ? "pro" : "free")
    ),
    credits: Number(row?.credits || 0),
    createdAt: toIsoString(row?.createdAt || row?.created_at),
  }))
}

async function getIntlUsers(limit = 20) {
  const supabase = getSupabaseAdminForDownloads()
  let queryResult = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (queryResult.error) {
    queryResult = await supabase
      .from("web_users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
  }

  if (queryResult.error) throw new Error(queryResult.error.message)

  return (queryResult.data || []).map((row: any) => ({
    id: String(row?.id || ""),
    email: String(row?.email || ""),
    region: "INTL",
    subscriptionTier: String(
      row?.subscription_tier ||
      ((row?.is_pro || row?.pro) ? "pro" : "free")
    ),
    credits: Number(row?.credits || row?.custom_count || 0),
    createdAt: toIsoString(row?.created_at || row?.createdAt),
  }))
}

async function getCnOrders() {
  const db = await getDatabase()
  const rows = await safeCloudbaseCollectionGet(db, "web_payment_transactions")

  return rows.map((row: any) => ({
    id: String(row?._id || row?.transaction_id || row?.out_trade_no || ""),
    region: "CN",
    method: String(row?.payment_method || "wechat"),
    status: String(row?.status || row?.payment_status || "pending"),
    amount: Number(getTransactionAmount(row, "CNY").toFixed(2)),
    currency: String(row?.currency || "CNY"),
    userEmail: String(row?.user_email || ""),
    createdAt: toIsoString(row?.payment_time || row?.created_at),
  }))
}

async function getIntlOrders(limit = 20) {
  const supabase = getSupabaseAdminForDownloads()
  const { data, error } = await supabase
    .from("web_payment_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data || []).map((row: any) => ({
    id: String(row?.id || ""),
    region: "INTL",
    method: String(row?.payment_method || "stripe"),
    status: String(row?.status || row?.payment_status || "pending"),
    amount: Number(getTransactionAmount(row, "USD").toFixed(2)),
    currency: String(row?.currency || "USD"),
    userEmail: String(row?.user_email || ""),
    createdAt: toIsoString(row?.payment_time || row?.created_at),
  }))
}

async function getCnDownloadEvents() {
  const db = await getDatabase()
  await ensureCloudbaseCollections(db)
  const result = await db.collection("download_events").get()
  const rows = Array.isArray(result?.data) ? result.data : []

  return rows.map((row: any) => ({
    id: String(row?._id || ""),
    region: "CN",
    packageId: String(row?.package_id || ""),
    userEmail: String(row?.user_email || ""),
    ip: String(row?.ip || ""),
    createdAt: String(row?.created_at || new Date().toISOString()),
  }))
}

async function getIntlDownloadEvents(limit = 20) {
  const supabase = getSupabaseAdminForDownloads()
  const { data, error } = await supabase
    .from("download_events")
    .select("id,package_id,user_email,ip,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data || []).map((row: any) => ({
    id: String(row?.id || ""),
    region: "INTL",
    packageId: String(row?.package_id || ""),
    userEmail: String(row?.user_email || ""),
    ip: String(row?.ip || ""),
    createdAt: String(row?.created_at || new Date().toISOString()),
  }))
}
