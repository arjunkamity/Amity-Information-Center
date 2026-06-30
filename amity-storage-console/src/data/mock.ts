/* ============================================================
   In-memory mock dataset. Amity-themed, derived from the PRD.
   This is the ONLY file that fabricates data; the service layer
   (api.ts) wraps it so it can later be swapped for a real API.
   ============================================================ */

import type {
  Bucket, Asset, Category, AccessPolicy, AccessKey,
  PipelineJob, AuditLog, SeriesPoint, StorageSlice,
} from './types'

export const categories: Category[] = [
  { id: 'cat-pub', name: 'Public Web', description: 'Assets served on public websites & promotional pages.', retentionDays: 1095, namingPattern: 'web/{site}/{yyyy}/{slug}', bucketCount: 4, color: 'blue' },
  { id: 'cat-mkt', name: 'Marketing Media', description: 'Campaign creatives, brand media, video.', retentionDays: 730, namingPattern: 'mkt/{campaign}/{asset}', bucketCount: 3, color: 'purple' },
  { id: 'cat-doc', name: 'Academic Documents', description: 'Course material, records, official documents.', retentionDays: 3650, namingPattern: 'acad/{dept}/{yyyy}/{doc}', bucketCount: 5, color: 'green' },
  { id: 'cat-app', name: 'Application Data', description: 'User-generated & app runtime assets.', retentionDays: 365, namingPattern: 'app/{service}/{uuid}', bucketCount: 6, color: 'amber' },
  { id: 'cat-int', name: 'Internal / Restricted', description: 'Confidential internal documents.', retentionDays: 1825, namingPattern: 'int/{dept}/{doc}', bucketCount: 2, color: 'red' },
]

const bucketSeed: Omit<Bucket, 'domains'>[] = [
  { id: 'b-01', name: 'amity-web-public', description: 'Primary public website static assets.', owner: 'Priya Sharma', team: 'Web Platform', visibility: 'public', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-pub', objectCount: 184302, sizeBytes: 412_000_000_000, versioning: true, encryption: true, createdAt: '2025-01-14', retentionDays: null },
  { id: 'b-02', name: 'amity-promo-pages', description: '1,500+ promotional landing page media.', owner: 'Rahul Verma', team: 'Marketing', visibility: 'public', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-mkt', objectCount: 98211, sizeBytes: 271_500_000_000, versioning: true, encryption: true, createdAt: '2025-02-03', retentionDays: 730 },
  { id: 'b-03', name: 'amity-lms-content', description: 'Learning management system course assets.', owner: 'Dr. Meera Nair', team: 'Academics', visibility: 'internal', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-doc', objectCount: 512840, sizeBytes: 1_840_000_000_000, versioning: true, encryption: true, createdAt: '2024-11-20', retentionDays: 3650 },
  { id: 'b-04', name: 'amity-student-records', description: 'Official student academic records.', owner: 'Anil Gupta', team: 'Registrar', visibility: 'private', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-int', objectCount: 76520, sizeBytes: 88_300_000_000, versioning: true, encryption: true, createdAt: '2024-10-01', retentionDays: 1825 },
  { id: 'b-05', name: 'amity-mobile-uploads', description: 'User uploads from Amity mobile apps.', owner: 'Sana Khan', team: 'Mobile', visibility: 'internal', status: 'active', region: 'on-prem-dc2', categoryId: 'cat-app', objectCount: 1_204_330, sizeBytes: 642_000_000_000, versioning: false, encryption: true, createdAt: '2025-03-11', retentionDays: 365 },
  { id: 'b-06', name: 'amity-video-lectures', description: 'Recorded lectures, transcribed via Whisper.', owner: 'Dr. Meera Nair', team: 'Academics', visibility: 'internal', status: 'active', region: 'on-prem-dc2', categoryId: 'cat-doc', objectCount: 41280, sizeBytes: 3_120_000_000_000, versioning: true, encryption: true, createdAt: '2025-01-28', retentionDays: 3650 },
  { id: 'b-07', name: 'amity-brand-media', description: 'Brand kit, logos, hi-res campaign video.', owner: 'Rahul Verma', team: 'Marketing', visibility: 'internal', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-mkt', objectCount: 23110, sizeBytes: 920_400_000_000, versioning: true, encryption: true, createdAt: '2025-02-19', retentionDays: 730 },
  { id: 'b-08', name: 'amity-research-data', description: 'Research datasets & supporting documents.', owner: 'Dr. Vikram Rao', team: 'Research', visibility: 'private', status: 'active', region: 'on-prem-dc2', categoryId: 'cat-doc', objectCount: 308400, sizeBytes: 2_410_000_000_000, versioning: true, encryption: true, createdAt: '2024-12-05', retentionDays: 3650 },
  { id: 'b-09', name: 'amity-events-gallery', description: 'Event photos & galleries for websites.', owner: 'Priya Sharma', team: 'Web Platform', visibility: 'public', status: 'active', region: 'on-prem-dc1', categoryId: 'cat-pub', objectCount: 67900, sizeBytes: 156_700_000_000, versioning: false, encryption: true, createdAt: '2025-04-02', retentionDays: null },
  { id: 'b-10', name: 'amity-app-cache', description: 'Derived/cached assets for app services.', owner: 'Sana Khan', team: 'Mobile', visibility: 'internal', status: 'provisioning', region: 'on-prem-dc2', categoryId: 'cat-app', objectCount: 0, sizeBytes: 0, versioning: false, encryption: true, createdAt: '2026-06-29', retentionDays: 90 },
  { id: 'b-11', name: 'amity-legacy-import', description: 'Migration staging from legacy file servers.', owner: 'Anil Gupta', team: 'Platform Admin', visibility: 'private', status: 'error', region: 'on-prem-dc1', categoryId: 'cat-int', objectCount: 14820, sizeBytes: 51_200_000_000, versioning: false, encryption: false, createdAt: '2026-06-12', retentionDays: 30 },
]

const bucketDomains: Record<string, string[]> = {
  'b-01': ['cdn.amity.edu', 'static.amity.edu'],
  'b-02': ['promo.amity.edu'],
  'b-07': ['brand.amity.edu'],
  'b-09': ['gallery.amity.edu'],
}

export const buckets: Bucket[] = bucketSeed.map((b) => ({ ...b, domains: bucketDomains[b.id] ?? [] }))

const assetSeed: Array<Partial<Asset> & { key: string; bucketId: string; kind: Asset['kind'] }> = [
  { key: 'web/home/2026/hero-banner.webp', bucketId: 'b-01', kind: 'image', status: 'searchable', tags: ['hero', 'campus', 'banner'], category: 'Public Web', confidence: 0.97 },
  { key: 'web/admissions/2026/brochure.pdf', bucketId: 'b-01', kind: 'document', status: 'searchable', tags: ['admissions', 'brochure'], category: 'Public Web', confidence: 0.93 },
  { key: 'mkt/spring-intake/reel-01.mp4', bucketId: 'b-02', kind: 'video', status: 'processing', tags: ['campaign', 'reel'], category: 'Marketing Media', confidence: null },
  { key: 'mkt/spring-intake/poster-a3.png', bucketId: 'b-02', kind: 'image', status: 'searchable', tags: ['poster', 'print'], category: 'Marketing Media', confidence: 0.88 },
  { key: 'acad/cse/2026/ds-lecture-04.pdf', bucketId: 'b-03', kind: 'document', status: 'searchable', tags: ['lecture', 'data-structures', 'cse'], category: 'Academic Documents', confidence: 0.95 },
  { key: 'acad/cse/2026/ds-lecture-04-dup.pdf', bucketId: 'b-03', kind: 'document', status: 'duplicate', tags: ['lecture', 'data-structures'], category: 'Academic Documents', confidence: 0.95, duplicateOf: 'acad/cse/2026/ds-lecture-04.pdf' },
  { key: 'int/registrar/transcript-batch-22.pdf', bucketId: 'b-04', kind: 'document', status: 'searchable', tags: ['transcript', 'records'], category: 'Internal / Restricted', confidence: 0.99 },
  { key: 'app/uploads/9f2a-profile.jpg', bucketId: 'b-05', kind: 'image', status: 'queued', tags: [], category: 'Application Data', confidence: null },
  { key: 'app/uploads/3c81-assignment.docx', bucketId: 'b-05', kind: 'document', status: 'processing', tags: [], category: 'Application Data', confidence: null },
  { key: 'acad/lectures/ml-week-07.mp4', bucketId: 'b-06', kind: 'video', status: 'searchable', tags: ['lecture', 'ml', 'transcribed'], category: 'Academic Documents', confidence: 0.91 },
  { key: 'acad/lectures/ml-week-08.mp4', bucketId: 'b-06', kind: 'video', status: 'failed', tags: [], category: 'Academic Documents', confidence: null },
  { key: 'mkt/brand/amity-logo-master.svg', bucketId: 'b-07', kind: 'image', status: 'searchable', tags: ['logo', 'brand'], category: 'Marketing Media', confidence: 0.99 },
  { key: 'mkt/brand/anthem-2026.wav', bucketId: 'b-07', kind: 'audio', status: 'searchable', tags: ['audio', 'anthem'], category: 'Marketing Media', confidence: 0.84 },
  { key: 'research/genomics/dataset-04.parquet', bucketId: 'b-08', kind: 'data', status: 'searchable', tags: ['dataset', 'genomics'], category: 'Academic Documents', confidence: 0.9 },
  { key: 'research/genomics/methods.pdf', bucketId: 'b-08', kind: 'document', status: 'searchable', tags: ['methods', 'research'], category: 'Academic Documents', confidence: 0.92 },
  { key: 'web/events/2026/convocation-001.jpg', bucketId: 'b-09', kind: 'image', status: 'searchable', tags: ['event', 'convocation'], category: 'Public Web', confidence: 0.96 },
  { key: 'web/events/2026/convocation-archive.zip', bucketId: 'b-09', kind: 'archive', status: 'searchable', tags: ['event', 'archive'], category: 'Public Web', confidence: 0.7 },
  { key: 'int/legacy/scan-batch-0099.tiff', bucketId: 'b-11', kind: 'image', status: 'failed', tags: [], category: 'Internal / Restricted', confidence: null },
]

const contentTypeByKind: Record<Asset['kind'], string> = {
  document: 'application/pdf', image: 'image/webp', video: 'video/mp4',
  audio: 'audio/wav', archive: 'application/zip', data: 'application/octet-stream', other: 'application/octet-stream',
}
const uploaders = ['priya.sharma', 'rahul.verma', 'm.nair', 'a.gupta', 'sana.khan', 'v.rao', 'app-service']

export const assets: Asset[] = assetSeed.map((s, i) => ({
  id: `a-${String(i + 1).padStart(3, '0')}`,
  key: s.key,
  bucketId: s.bucketId,
  kind: s.kind,
  contentType: contentTypeByKind[s.kind],
  sizeBytes: [2_400_000, 880_000, 142_000_000, 9_200_000, 1_100_000, 1_100_000, 640_000, 320_000, 410_000, 188_000_000][i % 10],
  uploadedBy: uploaders[i % uploaders.length],
  uploadedAt: `2026-06-${String(10 + (i % 18)).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:2${i % 6}:00Z`,
  status: s.status!,
  tags: s.tags ?? [],
  category: s.category!,
  confidence: s.confidence ?? null,
  embedded: s.status === 'searchable',
  modelVersion: s.status === 'searchable' ? 'bge-base-v1.5' : null,
  duplicateOf: s.duplicateOf ?? null,
}))

export const accessPolicies: AccessPolicy[] = [
  { id: 'p-01', name: 'Platform Admins — Full', role: 'admin', bucketScope: '*', permissions: ['read', 'write', 'delete', 'admin'], principals: 4, updatedAt: '2026-05-20' },
  { id: 'p-02', name: 'Web Devs — Public Buckets', role: 'developer', bucketScope: 'amity-web-*', permissions: ['read', 'write'], principals: 12, updatedAt: '2026-06-01' },
  { id: 'p-03', name: 'Marketing — Media RW', role: 'content', bucketScope: 'amity-promo-pages', permissions: ['read', 'write'], principals: 8, updatedAt: '2026-06-15' },
  { id: 'p-04', name: 'Registrar — Records RO', role: 'viewer', bucketScope: 'amity-student-records', permissions: ['read'], principals: 6, updatedAt: '2026-04-30' },
  { id: 'p-05', name: 'AI Engineers — Pipeline', role: 'ai-engineer', bucketScope: '*', permissions: ['read'], principals: 3, updatedAt: '2026-06-10' },
  { id: 'p-06', name: 'Mobile — App Uploads RW', role: 'developer', bucketScope: 'amity-mobile-uploads', permissions: ['read', 'write', 'delete'], principals: 5, updatedAt: '2026-06-22' },
]

const keySeed: Omit<AccessKey, 'secretAccessKey'>[] = [
  { id: 'k-01', label: 'web-cdn-prod', accessKeyId: 'AMITY7F3K9QX2LMP0WD1', bucketScope: 'amity-web-public', permissions: ['read'], createdBy: 'priya.sharma', createdAt: '2026-01-15', lastUsed: '2026-06-30', status: 'active' },
  { id: 'k-02', label: 'lms-ingest', accessKeyId: 'AMITY2A8C4VNB6RTY9KJ3', bucketScope: 'amity-lms-content', permissions: ['read', 'write'], createdBy: 'm.nair', createdAt: '2025-11-21', lastUsed: '2026-06-29', status: 'active' },
  { id: 'k-03', label: 'mobile-app-uploads', accessKeyId: 'AMITY5D1E7HGU3QWZ8PLO', bucketScope: 'amity-mobile-uploads', permissions: ['read', 'write'], createdBy: 'sana.khan', createdAt: '2026-03-12', lastUsed: '2026-06-30', status: 'active' },
  { id: 'k-04', label: 'legacy-migrator', accessKeyId: 'AMITY9X2W5FRT0MNB7CVD', bucketScope: 'amity-legacy-import', permissions: ['read', 'write', 'delete'], createdBy: 'a.gupta', createdAt: '2026-06-12', lastUsed: null, status: 'active' },
  { id: 'k-05', label: 'analytics-readonly', accessKeyId: 'AMITY0P3L6KJH9GFD2SAQ', bucketScope: '*', permissions: ['read'], createdBy: 'v.rao', createdAt: '2026-02-08', lastUsed: '2026-05-14', status: 'revoked' },
]

// Mock secrets (fake; for the developer-credentials view only).
const keySecrets: Record<string, string> = {
  'k-01': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY01',
  'k-02': 'aB3dEfGhIjKlMnOpQrStUvWxYz0123456789LMSkey',
  'k-03': 'mNoPqRsTuVwXyZaBcDeFgHiJkLmNoP9876543MOBkey',
  'k-04': 'zYxWvUtSrQpOnMlKjIhGfEdCbA0192837465LEGkey',
  'k-05': 'qWeRtYuIoPaSdFgHjKlZxCvBnM5647382910ANLkey',
}

export const accessKeys: AccessKey[] = keySeed.map((k) => ({
  ...k,
  secretAccessKey: keySecrets[k.id] ?? 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
}))

const stages: PipelineJob['stage'][] = ['extract', 'classify', 'dedupe', 'embed', 'index']
const states: PipelineJob['state'][] = ['running', 'queued', 'completed', 'failed', 'dead-letter']
const models = ['tika-2.9', 'distilbert-gov', 'phash+bge', 'bge-base-v1.5', 'index-writer']
export const pipelineJobs: PipelineJob[] = Array.from({ length: 22 }, (_, i) => {
  const state = states[i % 5 === 0 ? (i % 7 < 5 ? i % 5 : 2) : (i < 6 ? 0 : i < 10 ? 1 : i < 18 ? 2 : i < 20 ? 3 : 4)]
  const stage = stages[i % 5]
  return {
    id: `j-${String(i + 1).padStart(3, '0')}`,
    assetKey: assets[i % assets.length].key,
    bucket: buckets[i % 9].name,
    stage,
    state,
    attempts: state === 'dead-letter' ? 5 : state === 'failed' ? 2 : 1,
    startedAt: `2026-06-30T1${i % 5}:${String(10 + i).padStart(2, '0')}:00Z`,
    durationMs: state === 'completed' ? 1200 + i * 230 : state === 'running' ? null : state === 'queued' ? null : 4200,
    model: models[stages.indexOf(stage)],
    error: state === 'failed' ? 'Whisper OOM on GPU-2' : state === 'dead-letter' ? 'Max retries exceeded (corrupt header)' : null,
  }
})

const actions: AuditLog['action'][] = ['upload', 'read', 'delete', 'policy.change', 'bucket.create', 'key.issue', 'key.revoke', 'search']
const actors = ['priya.sharma', 'rahul.verma', 'm.nair', 'a.gupta', 'sana.khan', 'v.rao', 'admin']
export const auditLogs: AuditLog[] = Array.from({ length: 40 }, (_, i) => ({
  id: `log-${String(i + 1).padStart(3, '0')}`,
  ts: `2026-06-30T${String(23 - Math.floor(i / 2)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:0${i % 10}Z`,
  actor: actors[i % actors.length],
  action: actions[i % actions.length],
  target: i % 8 === 4 ? buckets[i % buckets.length].name : assets[i % assets.length].key,
  ip: `10.20.${i % 12}.${(i * 13) % 250}`,
  result: i % 11 === 0 ? 'denied' : i % 17 === 0 ? 'error' : 'success',
}))

const GB = 1_000_000_000
const TB = 1_000 * GB

/** Storage broken down by Amity campus. */
export const campusStorage: StorageSlice[] = [
  { name: 'Noida (HQ)', sizeBytes: 3.42 * TB, objectCount: 1_120_400, bucketCount: 9, growthPct: 16.2 },
  { name: 'Lucknow', sizeBytes: 1.86 * TB, objectCount: 540_210, bucketCount: 6, growthPct: 12.4 },
  { name: 'Gwalior', sizeBytes: 1.21 * TB, objectCount: 388_900, bucketCount: 5, growthPct: 9.8 },
  { name: 'Jaipur', sizeBytes: 1.04 * TB, objectCount: 301_550, bucketCount: 5, growthPct: 14.1 },
  { name: 'Mumbai', sizeBytes: 0.92 * TB, objectCount: 264_300, bucketCount: 4, growthPct: 18.7 },
  { name: 'Gurugram (Manesar)', sizeBytes: 0.74 * TB, objectCount: 198_700, bucketCount: 4, growthPct: 11.0 },
  { name: 'Kolkata', sizeBytes: 0.58 * TB, objectCount: 151_200, bucketCount: 3, growthPct: 8.3 },
  { name: 'Patna', sizeBytes: 0.39 * TB, objectCount: 96_800, bucketCount: 2, growthPct: 6.9 },
  { name: 'Raipur', sizeBytes: 0.31 * TB, objectCount: 71_400, bucketCount: 2, growthPct: 7.5 },
  { name: 'Ranchi', sizeBytes: 0.23 * TB, objectCount: 52_100, bucketCount: 2, growthPct: 5.4 },
]

/** Storage broken down by enterprise application. */
export const appStorage: StorageSlice[] = [
  { name: 'AMIGO LMS', sizeBytes: 2.94 * TB, objectCount: 812_300, bucketCount: 5, growthPct: 19.6 },
  { name: 'Amity Mobile App', sizeBytes: 1.62 * TB, objectCount: 1_204_330, bucketCount: 3, growthPct: 22.1 },
  { name: 'ERP / AMICloud', sizeBytes: 1.18 * TB, objectCount: 442_900, bucketCount: 4, growthPct: 10.4 },
  { name: 'Admissions Portal', sizeBytes: 0.86 * TB, objectCount: 311_200, bucketCount: 3, growthPct: 27.8 },
  { name: 'Examination System', sizeBytes: 0.71 * TB, objectCount: 268_500, bucketCount: 3, growthPct: 9.1 },
  { name: 'Library (Knimbus)', sizeBytes: 0.64 * TB, objectCount: 154_700, bucketCount: 2, growthPct: 6.2 },
  { name: 'HRMS', sizeBytes: 0.41 * TB, objectCount: 88_400, bucketCount: 2, growthPct: 4.8 },
  { name: 'Alumni Portal', sizeBytes: 0.28 * TB, objectCount: 61_900, bucketCount: 2, growthPct: 13.5 },
  { name: 'Finance & Fees', sizeBytes: 0.22 * TB, objectCount: 47_300, bucketCount: 1, growthPct: 5.1 },
  { name: 'Research Portal', sizeBytes: 0.19 * TB, objectCount: 39_800, bucketCount: 2, growthPct: 8.7 },
]

/** Storage broken down by website / web property. */
export const websiteStorage: StorageSlice[] = [
  { name: 'amity.edu (main)', sizeBytes: 1.74 * TB, objectCount: 420_100, bucketCount: 4, growthPct: 11.3 },
  { name: 'amityonline.com', sizeBytes: 1.32 * TB, objectCount: 366_200, bucketCount: 3, growthPct: 24.9 },
  { name: 'Promotional landing pages', sizeBytes: 0.98 * TB, objectCount: 512_700, bucketCount: 5, growthPct: 17.4 },
  { name: 'Admissions microsite', sizeBytes: 0.62 * TB, objectCount: 188_400, bucketCount: 2, growthPct: 21.2 },
  { name: 'Campus sites (regional)', sizeBytes: 0.55 * TB, objectCount: 201_900, bucketCount: 6, growthPct: 9.6 },
  { name: 'Events & news', sizeBytes: 0.37 * TB, objectCount: 142_300, bucketCount: 2, growthPct: 13.8 },
  { name: 'Research & journals', sizeBytes: 0.29 * TB, objectCount: 88_700, bucketCount: 3, growthPct: 7.1 },
  { name: 'International / global', sizeBytes: 0.21 * TB, objectCount: 54_600, bucketCount: 2, growthPct: 15.5 },
  { name: 'Careers & placements', sizeBytes: 0.14 * TB, objectCount: 33_100, bucketCount: 1, growthPct: 6.4 },
]

export const usageSeries: SeriesPoint[] = [
  { label: 'Jan', storage: 6.2, uploads: 142, downloads: 980 },
  { label: 'Feb', storage: 6.9, uploads: 168, downloads: 1120 },
  { label: 'Mar', storage: 7.8, uploads: 201, downloads: 1340 },
  { label: 'Apr', storage: 8.6, uploads: 188, downloads: 1410 },
  { label: 'May', storage: 9.7, uploads: 232, downloads: 1605 },
  { label: 'Jun', storage: 11.2, uploads: 274, downloads: 1820 },
]
