/* ============================================================
   Domain types — modeled on the PRD's Information Architecture
   (§6 Key Entities). Source entities vs AI-derived entities.
   ============================================================ */

export type Visibility = 'private' | 'internal' | 'public'
export type BucketStatus = 'active' | 'provisioning' | 'archived' | 'error'

/** §6 Bucket — logical container; owns visibility & ownership. */
export interface Bucket {
  id: string
  name: string
  description: string
  owner: string
  team: string
  visibility: Visibility
  status: BucketStatus
  region: string
  categoryId: string
  objectCount: number
  sizeBytes: number
  versioning: boolean
  encryption: boolean
  createdAt: string
  /** lifecycle/retention applied (days), null = inherit from category */
  retentionDays: number | null
  /** custom/vanity domains mapped to this bucket (e.g. cdn.amity.edu) */
  domains: string[]
}

export type AssetKind = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'data' | 'other'
export type EnrichmentStatus = 'searchable' | 'processing' | 'queued' | 'failed' | 'duplicate'

/** §6 Asset — canonical record of a raw stored object, plus derived AI fields. */
export interface Asset {
  id: string
  key: string
  bucketId: string
  kind: AssetKind
  contentType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
  status: EnrichmentStatus
  /** AI-derived (§6) */
  tags: string[]
  category: string
  confidence: number | null
  embedded: boolean
  modelVersion: string | null
  duplicateOf: string | null
}

/** §6 Category — governance class with retention & naming rules. */
export interface Category {
  id: string
  name: string
  description: string
  retentionDays: number
  namingPattern: string
  bucketCount: number
  color: string
}

export type Role = 'admin' | 'developer' | 'content' | 'ai-engineer' | 'viewer'
export type Permission = 'read' | 'write' | 'delete' | 'admin'

/** §6 AccessPolicy — RBAC rules binding roles to bucket permissions. */
export interface AccessPolicy {
  id: string
  name: string
  role: Role
  bucketScope: string // bucket name or "*"
  permissions: Permission[]
  principals: number
  updatedAt: string
}

/** Self-service scoped access keys (FR-001). */
export interface AccessKey {
  id: string
  label: string
  accessKeyId: string
  /** secret — masked in the UI by default, mock value only */
  secretAccessKey: string
  bucketScope: string
  permissions: Permission[]
  createdBy: string
  createdAt: string
  lastUsed: string | null
  status: 'active' | 'revoked'
}

/** §4 Pipeline job — async enrichment (extract → classify → dedupe → embed → index). */
export type PipelineStage = 'extract' | 'classify' | 'dedupe' | 'embed' | 'index'
export type JobState = 'running' | 'queued' | 'completed' | 'failed' | 'dead-letter'

export interface PipelineJob {
  id: string
  assetKey: string
  bucket: string
  stage: PipelineStage
  state: JobState
  attempts: number
  startedAt: string
  durationMs: number | null
  model: string | null
  error: string | null
}

/** §6 AuditLog — immutable record of every action. */
export type AuditAction =
  | 'upload' | 'read' | 'delete' | 'policy.change'
  | 'bucket.create' | 'bucket.delete' | 'key.issue' | 'key.revoke' | 'search'
export interface AuditLog {
  id: string
  ts: string
  actor: string
  action: AuditAction
  target: string
  ip: string
  result: 'success' | 'denied' | 'error'
}

/** Semantic search result (FR-006). */
export interface SearchResult {
  asset: Asset
  bucketName: string
  score: number
  snippet: string
}

/** Dashboard time-series point. */
export interface SeriesPoint {
  label: string
  storage: number
  uploads: number
  downloads: number
}

/** A single slice of storage broken down by some dimension (campus/app/website). */
export interface StorageSlice {
  name: string
  sizeBytes: number
  objectCount: number
  bucketCount: number
  /** month-over-month storage growth, % */
  growthPct: number
}

export type StorageDimension = 'campus' | 'app' | 'website'
