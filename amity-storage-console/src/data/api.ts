/* ============================================================
   Service layer. Every screen talks to THIS, never to mock.ts
   directly. Functions are async + latency-simulated so swapping
   the body for `fetch('/api/...')` later requires no UI changes.
   ============================================================ */

import {
  buckets, assets, categories, accessPolicies, accessKeys,
  pipelineJobs, auditLogs, usageSeries,
  campusStorage, appStorage, websiteStorage,
} from './mock'
import type {
  Bucket, Asset, Category, AccessPolicy, AccessKey,
  PipelineJob, AuditLog, SeriesPoint, SearchResult,
  StorageSlice, StorageDimension,
} from './types'

const delay = <T>(value: T, ms = 280): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))

// ---- Buckets ----
export const listBuckets = () => delay([...buckets])
export const getBucket = (id: string) => delay(buckets.find((b) => b.id === id) ?? null)

export interface NewBucketInput {
  name: string; description: string; categoryId: string
  visibility: Bucket['visibility']; region: string
  versioning: boolean; encryption: boolean; retentionDays: number | null
}
export const createBucket = (input: NewBucketInput) => {
  const bucket: Bucket = {
    id: `b-${Date.now()}`,
    owner: 'admin', team: 'Platform Admin', status: 'provisioning',
    objectCount: 0, sizeBytes: 0, createdAt: new Date().toISOString().slice(0, 10),
    domains: [], cors: [],
    ...input,
  }
  buckets.unshift(bucket)
  return delay(bucket, 600)
}
export const deleteBucket = (id: string) => {
  const i = buckets.findIndex((b) => b.id === id)
  if (i >= 0) buckets.splice(i, 1)
  return delay(true, 400)
}

// ---- Custom domains ----
export const addBucketDomain = (id: string, domain: string) => {
  const b = buckets.find((x) => x.id === id)
  if (b && !b.domains.includes(domain)) b.domains.push(domain)
  return delay(b ? [...b.domains] : [], 350)
}
export const removeBucketDomain = (id: string, domain: string) => {
  const b = buckets.find((x) => x.id === id)
  if (b) b.domains = b.domains.filter((d) => d !== domain)
  return delay(b ? [...b.domains] : [], 300)
}

// ---- CORS ----
export const updateBucketCors = (id: string, cors: import('./types').CorsRule[]) => {
  const b = buckets.find((x) => x.id === id)
  if (b) b.cors = cors
  return delay(b ? [...b.cors] : [], 400)
}

// ---- Assets / objects ----
export const listAssets = (bucketId?: string) =>
  delay(bucketId ? assets.filter((a) => a.bucketId === bucketId) : [...assets])

const kindByExt: Record<string, Asset['kind']> = {
  pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', svg: 'image', gif: 'image', tiff: 'image',
  mp4: 'video', mov: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio',
  zip: 'archive', tar: 'archive', gz: 'archive',
  csv: 'data', json: 'data', parquet: 'data',
}
const kindFromKey = (key: string): Asset['kind'] =>
  kindByExt[key.split('.').pop()?.toLowerCase() ?? ''] ?? 'other'

export interface UploadObjectInput {
  key: string
  access: Asset['access']
  sizeBytes?: number
  contentType?: string
}
/** Upload (create) an object with a per-object access flag (public direct URL vs presigned-only). */
export const uploadObject = (bucketId: string, input: UploadObjectInput): Promise<Asset> => {
  const bucket = buckets.find((b) => b.id === bucketId)
  const kind = kindFromKey(input.key)
  const asset: Asset = {
    id: `a-${Date.now()}`,
    key: input.key,
    bucketId,
    kind,
    contentType: input.contentType || 'application/octet-stream',
    sizeBytes: input.sizeBytes ?? 0,
    uploadedBy: 'you',
    uploadedAt: new Date().toISOString(),
    status: 'queued',
    access: input.access,
    tags: [],
    category: getCategory(bucket?.categoryId ?? '')?.name ?? '—',
    confidence: null,
    embedded: false,
    modelVersion: null,
    duplicateOf: null,
  }
  assets.unshift(asset)
  if (bucket) bucket.objectCount += 1
  return delay(asset, 500)
}

/** Change an object's access flag after upload (owner/writer). */
export const setObjectAccess = (assetId: string, access: Asset['access']): Promise<Asset | null> => {
  const a = assets.find((x) => x.id === assetId)
  if (a) a.access = access
  return delay(a ?? null, 250)
}

const S3_ENDPOINT = 'https://s3.amity.internal'

export interface Presigned {
  url: string
  method: 'GET' | 'PUT'
  expiresIn: number
}
/**
 * Mint a time-limited presigned URL (S3 Signature V4 style). In production this
 * is signed server-side only for callers who pass RBAC — the secret key never
 * leaves the server, and the link expires. Here it's a realistic mock.
 */
export const createPresignedUrl = (
  bucketName: string,
  key: string,
  method: 'GET' | 'PUT',
  expiresIn: number,
): Promise<Presigned> => {
  const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
  const cred = `AMITY7F3K9QX2LMP0WD1/20260701/on-prem-dc1/s3/aws4_request`
  const qs = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(cred)}`,
    `X-Amz-Date=20260701T000000Z`,
    `X-Amz-Expires=${expiresIn}`,
    `X-Amz-SignedHeaders=host`,
    `X-Amz-Signature=${hex(64)}`,
  ].join('&')
  const url = `${S3_ENDPOINT}/${bucketName}/${encodeURI(key)}?${qs}`
  return delay({ url, method, expiresIn }, 350)
}

// ---- Categories ----
export const listCategories = () => delay([...categories])
export const getCategory = (id: string): Category | undefined =>
  categories.find((c) => c.id === id)

// ---- Access policies & keys ----
export const listPolicies = () => delay([...accessPolicies])
export const listKeys = () => delay([...accessKeys])
export const revokeKey = (id: string) => {
  const k = accessKeys.find((x) => x.id === id)
  if (k) k.status = 'revoked'
  return delay(true, 300)
}

/** Does an access-key scope ("*", "amity-web-*", exact) cover this bucket? */
export const scopeMatchesBucket = (scope: string, bucketName: string): boolean => {
  if (scope === '*') return true
  if (scope.endsWith('*')) return bucketName.startsWith(scope.slice(0, -1))
  return scope === bucketName
}

/** Keys whose scope grants access to the given bucket. */
export const listKeysForBucket = (bucketName: string) =>
  delay(accessKeys.filter((k) => scopeMatchesBucket(k.bucketScope, bucketName)))

const randId = (n: number) =>
  Array.from({ length: n }, (_, i) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz/+'[(i * 37 + n * 7) % 58]).join('')

/** Issue a new key scoped to one bucket (FR-001). Secret returned once. */
export const createKeyForBucket = (
  bucketName: string,
  label: string,
  permissions: AccessKey['permissions'],
) => {
  const key: AccessKey = {
    id: `k-${Date.now()}`,
    label,
    accessKeyId: `AMITY${randId(15).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`,
    secretAccessKey: randId(40),
    bucketScope: bucketName,
    permissions,
    createdBy: 'admin',
    createdAt: new Date().toISOString().slice(0, 10),
    lastUsed: null,
    status: 'active',
  }
  accessKeys.unshift(key)
  return delay(key, 500)
}

// ---- Pipeline ----
export const listJobs = () => delay([...pipelineJobs])

// ---- Audit ----
export const listAudit = () => delay([...auditLogs])

// ---- Dashboard ----
export const getUsageSeries = (): Promise<SeriesPoint[]> => delay([...usageSeries])

const breakdowns: Record<StorageDimension, StorageSlice[]> = {
  campus: campusStorage, app: appStorage, website: websiteStorage,
}
/** Storage analytics sliced by campus, app, or website. */
export const getStorageBreakdown = (dim: StorageDimension): Promise<StorageSlice[]> =>
  delay([...breakdowns[dim]].sort((a, b) => b.sizeBytes - a.sizeBytes))

// ---- Semantic search (FR-006, simulated ranking) ----
const snippets = [
  'Matched on extracted text and semantic embedding similarity.',
  'High vector cosine similarity to query intent.',
  'Tag + metadata filter match with strong relevance.',
  'OCR-extracted content semantically aligned to query.',
  'Transcript (Whisper) content matched query meaning.',
]
export const semanticSearch = (query: string): Promise<SearchResult[]> => {
  const q = query.trim().toLowerCase()
  if (!q) return delay([])
  const scored = assets
    .filter((a) => a.status === 'searchable')
    .map((a, i) => {
      const hay = `${a.key} ${a.tags.join(' ')} ${a.category}`.toLowerCase()
      const hit = q.split(/\s+/).some((t) => hay.includes(t))
      const base = hit ? 0.78 : 0.42
      const score = Math.min(0.99, base + ((a.confidence ?? 0.5) * 0.2) - (i % 5) * 0.015)
      const bucket = buckets.find((b) => b.id === a.bucketId)
      return { asset: a, bucketName: bucket?.name ?? '—', score, snippet: snippets[i % snippets.length] }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
  return delay(scored, 420)
}

// re-export types for convenience
export type { Bucket, Asset, Category, AccessPolicy, AccessKey, PipelineJob, AuditLog, SeriesPoint, SearchResult }
