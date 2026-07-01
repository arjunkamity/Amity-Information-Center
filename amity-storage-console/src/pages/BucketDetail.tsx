import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Database, Upload, FileText, Image, Video, Music, Archive, FileBox,
  ChevronRight, Shield, Clock, HardDrive, Sparkles, Copy, Globe, Plus,
  Trash2, KeyRound, Terminal, ExternalLink, Eye, EyeOff, Check, Network, Pencil,
  Link2, Lock, ShieldAlert,
} from 'lucide-react'
import { Card, CardHead, Badge, Loading, Empty, Stat } from '../components/ui'
import { CopyField, CopyButton, useCopied } from '../components/Copyable'
import { CodeBlock } from '../components/Code'
import { Modal } from '../components/Modal'
import {
  getBucket, listAssets, getCategory, listKeysForBucket,
  addBucketDomain, removeBucketDomain, createKeyForBucket, updateBucketCors,
  createPresignedUrl, uploadObject, setObjectAccess, type UploadObjectInput,
} from '../data/api'
import type { Bucket, Asset, AssetKind, AccessKey, Permission, CorsRule, ObjectAccess } from '../data/types'
import { formatBytes, formatNumber, formatDate, formatDateTime } from '../lib/format'
import { bucketStatusTone, enrichmentTone, visibilityTone } from '../lib/status'

const kindIcon: Record<AssetKind, typeof FileText> = {
  document: FileText, image: Image, video: Video, audio: Music,
  archive: Archive, data: FileBox, other: FileBox,
}
const permTone: Record<Permission, 'green' | 'blue' | 'amber' | 'red'> = {
  read: 'green', write: 'blue', delete: 'amber', admin: 'red',
}
const S3_ENDPOINT = 'https://s3.amity.internal'

type Tab = 'objects' | 'settings' | 'lifecycle'

export default function BucketDetail() {
  const { id } = useParams<{ id: string }>()
  const [bucket, setBucket] = useState<Bucket | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('objects')
  const [linkAsset, setLinkAsset] = useState<Asset | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBucket(id).then((b) => {
      setBucket(b)
      if (!b) { setLoading(false); return }
      Promise.all([listAssets(id), listKeysForBucket(b.name)]).then(([a, k]) => {
        setAssets(a); setKeys(k); setLoading(false)
      })
    })
  }, [id])

  if (loading) return <Loading label="Loading bucket…" />
  if (!bucket) return <Card><Empty icon={<Database size={34} />} title="Bucket not found" sub="It may have been deleted." /></Card>

  const cat = getCategory(bucket.categoryId)
  const searchable = assets.filter((a) => a.status === 'searchable').length
  const dupes = assets.filter((a) => a.status === 'duplicate').length

  const refreshDomains = (domains: string[]) => setBucket((b) => (b ? { ...b, domains } : b))
  const refreshCors = (cors: CorsRule[]) => setBucket((b) => (b ? { ...b, cors } : b))
  const refreshKeys = () => listKeysForBucket(bucket.name).then(setKeys)
  const addAsset = (a: Asset) => {
    setAssets((prev) => [a, ...prev])
    setBucket((b) => (b ? { ...b, objectCount: b.objectCount + 1 } : b))
  }
  const updateAssetAccess = (id: string, access: ObjectAccess) =>
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, access } : a)))

  return (
    <>
      <div className="breadcrumb">
        <Link to="/buckets">Buckets</Link>
        <ChevronRight size={13} className="sep" />
        <span className="mono">{bucket.name}</span>
      </div>

      <div className="page-head">
        <div className="flex items-center gap-3">
          <span className="icon-circle" style={{ width: 46, height: 46, background: 'var(--brand-soft)', color: 'var(--brand-2)' }}><Database size={22} /></span>
          <div>
            <h1 className="mono" style={{ fontSize: 20 }}>{bucket.name}</h1>
            <div className="desc">{bucket.description}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone={bucketStatusTone[bucket.status]} dot>{bucket.status}</Badge>
          <button className="btn primary" onClick={() => setShowUpload(true)}><Upload size={15} /> Upload</button>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        <Stat label="Objects" value={formatNumber(bucket.objectCount)} icon={<Database size={15} />} iconTone="blue" />
        <Stat label="Size" value={formatBytes(bucket.sizeBytes)} icon={<HardDrive size={15} />} iconTone="brand" />
        <Stat label="Searchable (sample)" value={`${searchable}/${assets.length}`} icon={<Sparkles size={15} />} iconTone="purple" />
        <Stat label="Duplicates (sample)" value={formatNumber(dupes)} icon={<Copy size={15} />} iconTone="amber" />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'objects' ? 'active' : ''}`} onClick={() => setTab('objects')}>Objects</button>
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
        <button className={`tab ${tab === 'lifecycle' ? 'active' : ''}`} onClick={() => setTab('lifecycle')}>Lifecycle & Policy</button>
      </div>

      {tab === 'objects' && (
        <Card>
          <CardHead title="Objects" sub={`Sample of objects in ${bucket.name}. Each upload triggers the enrichment pipeline.`} />
          <div style={{ padding: '14px 18px 0' }}>
            <div className="banner info"><ShieldAlert size={15} /> <span><strong>Access is set per object.</strong> <Badge tone="green">Public</Badge> objects are served at their direct URL; <Badge tone="amber">Presigned-only</Badge> objects return <span className="mono">403</span> on the direct URL and need a time-limited link. Set the flag when uploading, or toggle it in the Access column.</span></div>
          </div>
          {assets.length === 0 ? (
            <Empty icon={<FileBox size={32} />} title="No objects yet" sub="Upload files or point an app at this bucket's S3 endpoint." />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Key</th><th>Type</th><th>Size</th><th>Access</th><th>Enrichment</th><th>Uploaded</th><th></th></tr>
                </thead>
                <tbody>
                  {assets.map((a) => {
                    const KIcon = kindIcon[a.kind]
                    return (
                      <tr key={a.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            <KIcon size={16} className="dim" />
                            <span className="mono" style={{ color: 'var(--text)' }}>{a.key}</span>
                          </span>
                        </td>
                        <td className="muted text-sm">{a.contentType}</td>
                        <td>{formatBytes(a.sizeBytes)}</td>
                        <td><AccessToggle asset={a} onChange={updateAssetAccess} /></td>
                        <td><Badge tone={enrichmentTone[a.status]} dot>{a.status}</Badge></td>
                        <td className="muted text-sm">{formatDateTime(a.uploadedAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn sm ghost" onClick={() => setLinkAsset(a)} title="Generate presigned link"><Link2 size={13} /> Get link</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'settings' && (
        <>
          <div className="banner warn mb-4"><Shield size={15} /> <span>This bucket is administered by its owner, <strong>{bucket.owner}</strong>. Only the owner can manage credentials, custom domains, policies, CORS, and deletion.</span></div>
          <div className="grid grid-2 mb-4">
            <Card className="card-pad">
              <h3 className="mb-4">Configuration</h3>
              <dl className="kv">
                <dt>Owner</dt><dd>{bucket.owner}</dd>
                <dt>Team</dt><dd>{bucket.team}</dd>
                <dt>Region</dt><dd className="mono">{bucket.region}</dd>
                <dt>Visibility</dt><dd><Badge tone={visibilityTone[bucket.visibility]}>{bucket.visibility}</Badge></dd>
                <dt>Versioning</dt><dd>{bucket.versioning ? <Badge tone="green">Enabled</Badge> : <Badge tone="gray">Disabled</Badge>}</dd>
                <dt>Encryption</dt><dd>{bucket.encryption ? <Badge tone="green">At rest (AES-256)</Badge> : <Badge tone="red">Disabled</Badge>}</dd>
                <dt>Created</dt><dd>{formatDate(bucket.createdAt)}</dd>
              </dl>
            </Card>

            <DomainsCard bucket={bucket} onChange={refreshDomains} />
          </div>

          <Card className="mb-4">
            <CardHead title="S3 connection" sub="S3-compatible (MinIO) endpoint for this bucket." />
            <div className="card-pad">
              <CopyField id="endpoint" label="Endpoint" value={S3_ENDPOINT} />
              <CopyField id="bucket-name" label="Bucket name" value={bucket.name} />
              <CopyField id="region" label="Region" value={bucket.region} />
              {bucket.domains.length > 0 && (
                <CopyField id="primary-domain" label="Public base URL (primary domain)" value={`https://${bucket.domains[0]}`} />
              )}
            </div>
          </Card>

          <CorsCard bucket={bucket} onChange={refreshCors} />

          <CredentialsCard bucket={bucket} keys={keys} onChange={refreshKeys} />
        </>
      )}

      {tab === 'lifecycle' && (
        <div className="grid grid-2">
          <Card className="card-pad">
            <h3 className="flex items-center gap-2 mb-4"><Clock size={17} /> Retention & lifecycle</h3>
            <dl className="kv">
              <dt>Governance category</dt><dd>{cat && <Badge tone={cat.color as never}>{cat.name}</Badge>}</dd>
              <dt>Retention</dt><dd>{(bucket.retentionDays ?? cat?.retentionDays ?? 0)} days {bucket.retentionDays == null && <span className="dim text-xs">(inherited)</span>}</dd>
              <dt>Naming standard</dt><dd className="mono text-xs">{cat?.namingPattern}</dd>
            </dl>
            <hr className="divider" />
            <div className="text-sm muted mb-3">Lifecycle transitions</div>
            <div className="flex items-center gap-2 text-sm">
              <Badge tone="blue">Hot</Badge><ChevronRight size={14} className="dim" />
              <Badge tone="amber">Warm · 90d</Badge><ChevronRight size={14} className="dim" />
              <Badge tone="gray">Archive · {(bucket.retentionDays ?? cat?.retentionDays ?? 365) - 30}d</Badge>
            </div>
          </Card>
          <Card className="card-pad">
            <h3 className="flex items-center gap-2 mb-4"><Shield size={17} /> Access policy</h3>
            <p className="muted text-sm mb-4">RBAC is evaluated before any object or search result is returned (§4.2). Policies bound to this bucket:</p>
            <div className="banner mb-3"><Shield size={15} /> <span><strong>{cat?.name}</strong> default policy applied</span></div>
            <Link to="/policies" className="btn ghost">Manage policies <ChevronRight size={14} /></Link>
          </Card>
        </div>
      )}

      {linkAsset && <PresignedUrlModal bucket={bucket} asset={linkAsset} onClose={() => setLinkAsset(null)} />}
      {showUpload && <UploadObjectModal bucket={bucket} onClose={() => setShowUpload(false)} onUploaded={(a) => { addAsset(a); setShowUpload(false) }} />}
    </>
  )
}

/* ---------- Custom domains ---------- */
function DomainsCard({ bucket, onChange }: { bucket: Bucket; onChange: (domains: string[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)

  const add = async () => {
    if (!valid) return
    setBusy(true)
    const domains = await addBucketDomain(bucket.id, value.trim())
    onChange(domains); setValue(''); setAdding(false); setBusy(false)
  }
  const remove = async (d: string) => {
    if (!confirm(`Remove domain "${d}" from this bucket?`)) return
    const domains = await removeBucketDomain(bucket.id, d)
    onChange(domains)
  }

  return (
    <Card className="card-pad">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2"><Globe size={17} /> Custom domains</h3>
        {!adding && <button className="btn sm" onClick={() => setAdding(true)}><Plus size={14} /> Add domain</button>}
      </div>
      <p className="muted text-sm mb-4">Map vanity domains to serve this bucket's objects (e.g. <span className="mono">cdn.amity.edu/logo.svg</span>) instead of the raw S3 path.</p>

      {bucket.domains.length === 0 && !adding && (
        <div className="banner">No custom domains. Objects are served from the S3 endpoint.</div>
      )}

      {bucket.domains.length > 0 && (
        <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
          {bucket.domains.map((d, i) => (
            <div key={d} className="flex items-center justify-between" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
              <span className="flex items-center gap-2">
                <Globe size={15} className="dim" />
                <span className="mono" style={{ color: 'var(--accent)' }}>{d}</span>
                {i === 0 && <Badge tone="green">primary</Badge>}
                <Badge tone="green" dot>verified</Badge>
              </span>
              <button className="btn sm danger" onClick={() => remove(d)} title="Remove"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input className="input mono" autoFocus placeholder="cdn.amity.edu" value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase())} onKeyDown={(e) => e.key === 'Enter' && add()} />
            <button className="btn primary" disabled={!valid || busy} onClick={add}>{busy ? 'Adding…' : 'Add'}</button>
            <button className="btn ghost" onClick={() => { setAdding(false); setValue('') }}>Cancel</button>
          </div>
          <div className="hint">{value === '' || valid ? 'A DNS CNAME to s3.amity.internal will be required.' : <span style={{ color: 'var(--red)' }}>Enter a valid domain.</span>}</div>
        </div>
      )}
    </Card>
  )
}

/* ---------- CORS policy ---------- */
function corsToS3(rules: CorsRule[]) {
  return {
    CORSRules: rules.map((r) => ({
      AllowedOrigins: r.allowedOrigins,
      AllowedMethods: r.allowedMethods,
      AllowedHeaders: r.allowedHeaders,
      ExposeHeaders: r.exposeHeaders,
      MaxAgeSeconds: r.maxAgeSeconds,
    })),
  }
}
function s3ToCors(obj: unknown): CorsRule[] {
  const rules = (obj as { CORSRules?: unknown })?.CORSRules
  if (!Array.isArray(rules)) throw new Error('Expected a top-level "CORSRules" array.')
  return rules.map((r) => ({
    allowedOrigins: r.AllowedOrigins ?? [],
    allowedMethods: r.AllowedMethods ?? [],
    allowedHeaders: r.AllowedHeaders ?? [],
    exposeHeaders: r.ExposeHeaders ?? [],
    maxAgeSeconds: r.MaxAgeSeconds ?? 3000,
  }))
}

function CorsCard({ bucket, onChange }: { bucket: Bucket; onChange: (cors: CorsRule[]) => void }) {
  const [editing, setEditing] = useState(false)
  const hasCors = bucket.cors.length > 0

  return (
    <Card className="mb-4">
      <CardHead
        title="CORS policy"
        sub="Controls which web origins may call this bucket directly from a browser."
        action={<button className="btn sm" onClick={() => setEditing(true)}><Pencil size={13} /> {hasCors ? 'Edit' : 'Configure'}</button>}
      />
      <div className="card-pad">
        {!hasCors ? (
          <div className="banner warn"><Network size={15} /> <span>No CORS policy set. Browser apps hosted on other origins (web apps, landing pages) are blocked from calling this bucket. Add a rule to allow them.</span></div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bucket.cors.map((r, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div className="text-xs dim mb-3">Rule {i + 1}</div>
                  <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
                    <dt>Allowed origins</dt><dd><span className="flex gap-2 wrap">{r.allowedOrigins.map((o) => <Badge key={o} tone="blue">{o}</Badge>)}</span></dd>
                    <dt>Allowed methods</dt><dd><span className="flex gap-2 wrap">{r.allowedMethods.map((m) => <Badge key={m} tone="green">{m}</Badge>)}</span></dd>
                    <dt>Allowed headers</dt><dd className="mono text-sm">{r.allowedHeaders.join(', ') || '—'}</dd>
                    <dt>Expose headers</dt><dd className="mono text-sm">{r.exposeHeaders.join(', ') || '—'}</dd>
                    <dt>Max age</dt><dd>{r.maxAgeSeconds}s</dd>
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <CodeBlock id={`cors-${bucket.id}`} language="json" title="CORS configuration (S3 format)" code={JSON.stringify(corsToS3(bucket.cors), null, 2)} />
            </div>
          </>
        )}
      </div>
      {editing && <CorsEditor bucket={bucket} onClose={() => setEditing(false)} onSaved={(c) => { onChange(c); setEditing(false) }} />}
    </Card>
  )
}

function CorsEditor({ bucket, onClose, onSaved }: { bucket: Bucket; onClose: () => void; onSaved: (c: CorsRule[]) => void }) {
  const template = bucket.cors.length
    ? JSON.stringify(corsToS3(bucket.cors), null, 2)
    : JSON.stringify({ CORSRules: [{ AllowedOrigins: ['https://*.amity.edu'], AllowedMethods: ['GET', 'HEAD'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 3000 }] }, null, 2)
  const [text, setText] = useState(template)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    let rules: CorsRule[]
    try {
      rules = s3ToCors(JSON.parse(text))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON'); return
    }
    setBusy(true)
    const saved = await updateBucketCors(bucket.id, rules)
    onSaved(saved)
  }

  return (
    <Modal
      title="Edit CORS policy"
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save policy'}</button>
      </>}
    >
      <div className="banner warn mb-3"><Shield size={14} /> <span>Owner-only. Restrict origins to your real domains — avoid <code className="mono">"*"</code> in production.</span></div>
      <textarea className="input mono" style={{ minHeight: 260, whiteSpace: 'pre' }} value={text} onChange={(e) => { setText(e.target.value); setError(null) }} spellCheck={false} />
      {error && <div className="text-sm mt-2" style={{ color: 'var(--red)' }}>{error}</div>}
    </Modal>
  )
}

/* ---------- Presigned URL ---------- */
const EXPIRY_OPTIONS = [
  { v: 300, l: '5 minutes' },
  { v: 900, l: '15 minutes' },
  { v: 3600, l: '1 hour' },
  { v: 86400, l: '24 hours' },
]

function PresignedUrlModal({ bucket, asset, onClose }: { bucket: Bucket; asset: Asset; onClose: () => void }) {
  const isPublic = asset.access === 'public'
  const [method, setMethod] = useState<'GET' | 'PUT'>('GET')
  const [expiresIn, setExpiresIn] = useState(900)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { copied, copy } = useCopied()

  const directUrl = bucket.domains[0]
    ? `https://${bucket.domains[0]}/${asset.key}`
    : `${S3_ENDPOINT}/${bucket.name}/${asset.key}`
  const expiryLabel = EXPIRY_OPTIONS.find((o) => o.v === expiresIn)?.l ?? `${expiresIn}s`

  const generate = async () => {
    setBusy(true)
    const p = await createPresignedUrl(bucket.name, asset.key, method, expiresIn)
    setResult(p.url); setBusy(false)
  }

  return (
    <Modal title="Generate presigned URL" onClose={onClose} footer={<button className="btn ghost" onClick={onClose}>Close</button>}>
      <div className="banner mb-3" style={{ display: 'block' }}>
        <div className="dim text-xs mb-3">Object</div>
        <code className="mono text-sm" style={{ color: 'var(--text)', wordBreak: 'break-all' }}>{asset.key}</code>
      </div>

      {isPublic ? (
        <div className="banner info mb-4"><Globe size={15} /> <span>This object is flagged <strong>Public</strong> — it&#39;s already reachable at its direct URL below. Presigned links are optional here.</span></div>
      ) : (
        <div className="banner warn mb-4"><ShieldAlert size={15} /> <span>This object is <strong>Presigned-only</strong>. The direct URL returns <span className="mono">403</span>; a presigned link is the only way to grant access — and it expires.</span></div>
      )}

      <div className="grid grid-2" style={{ gap: 14 }}>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Operation</label>
          <div className="flex gap-2">
            {(['GET', 'PUT'] as const).map((m) => (
              <button key={m} type="button" className={`btn sm ${method === m ? 'primary' : 'ghost'}`} onClick={() => { setMethod(m); setResult(null) }}>{m === 'GET' ? 'GET · download' : 'PUT · upload'}</button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Expires in</label>
          <select className="input" value={expiresIn} onChange={(e) => { setExpiresIn(Number(e.target.value)); setResult(null) }}>
            {EXPIRY_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
      </div>

      <button className="btn primary fill mt-2" onClick={generate} disabled={busy}><Link2 size={15} /> {busy ? 'Signing…' : `Generate ${method} link`}</button>

      {result && (
        <div className="field mt-4" style={{ marginBottom: 0 }}>
          <label>Presigned {method} URL · expires in {expiryLabel}</label>
          <div style={{ position: 'relative' }}>
            <textarea className="input mono text-sm" readOnly value={result} style={{ minHeight: 92, whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingRight: 44 }} />
            <button className="btn sm ghost" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => copy('presigned', result)}>
              {copied === 'presigned' ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="hint">Anyone with this link can {method === 'GET' ? 'download' : 'upload'} until it expires. Don&#39;t post it publicly.</div>
        </div>
      )}

      <hr className="divider" />
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="flex items-center gap-2">Direct URL {isPublic ? <Badge tone="green">public</Badge> : <Badge tone="red"><Lock size={11} /> 403</Badge>}</label>
        <div className="flex items-center gap-2">
          <input className="input mono text-sm" readOnly value={directUrl} style={{ flex: 1, opacity: isPublic ? 1 : 0.6 }} />
          <button className="btn sm ghost" style={{ padding: '8px 9px' }} onClick={() => copy('direct', directUrl)} disabled={!isPublic} title={isPublic ? 'Copy' : 'Blocked for private buckets'}>
            {copied === 'direct' ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
          </button>
        </div>
        {!isPublic && <div className="hint">Blocked — this bucket has no public policy. Use the presigned link above.</div>}
      </div>
    </Modal>
  )
}

/* ---------- Per-object access toggle ---------- */
function AccessToggle({ asset, onChange }: { asset: Asset; onChange: (id: string, access: ObjectAccess) => void }) {
  const [busy, setBusy] = useState(false)
  const isPublic = asset.access === 'public'
  const toggle = async () => {
    setBusy(true)
    const next: ObjectAccess = isPublic ? 'private' : 'public'
    await setObjectAccess(asset.id, next)
    onChange(asset.id, next)
    setBusy(false)
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={`Click to make this object ${isPublic ? 'presigned-only' : 'public'}`}
      className={`badge ${isPublic ? 'green' : 'amber'}`}
      style={{ cursor: 'pointer', border: 'none', opacity: busy ? 0.5 : 1 }}
    >
      {isPublic ? <Globe size={11} /> : <Lock size={11} />}
      {isPublic ? 'Public' : 'Presigned-only'}
    </button>
  )
}

/* ---------- Upload object (with per-object access flag) ---------- */
function UploadObjectModal({ bucket, onClose, onUploaded }: { bucket: Bucket; onClose: () => void; onUploaded: (a: Asset) => void }) {
  const [key, setKey] = useState('')
  const [access, setAccess] = useState<ObjectAccess>(bucket.visibility === 'public' ? 'public' : 'private')
  const [sizeMb, setSizeMb] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = key.trim().length > 2 && !key.trim().startsWith('/')

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const input: UploadObjectInput = {
      key: key.trim(),
      access,
      sizeBytes: sizeMb ? Math.round(Number(sizeMb) * 1024 * 1024) : 1_200_000,
    }
    const a = await uploadObject(bucket.id, input)
    onUploaded(a)
  }

  const AccessOption = ({ value, icon, title, desc }: { value: ObjectAccess; icon: ReactNode; title: string; desc: string }) => (
    <button
      type="button"
      onClick={() => setAccess(value)}
      style={{
        textAlign: 'left', padding: 14, borderRadius: 10, cursor: 'pointer',
        background: access === value ? 'var(--brand-soft)' : 'var(--surface-2)',
        border: `1px solid ${access === value ? 'var(--brand)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-2" style={{ fontWeight: 600 }}>
        <span style={{ color: value === 'public' ? 'var(--green)' : 'var(--amber)' }}>{icon}</span>
        {title}
        {access === value && <Check size={15} color="var(--brand-2)" style={{ marginLeft: 'auto' }} />}
      </div>
      <div className="dim text-xs mt-2" style={{ lineHeight: 1.4 }}>{desc}</div>
    </button>
  )

  return (
    <Modal
      title="Upload object"
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={!valid || busy}><Upload size={15} /> {busy ? 'Uploading…' : 'Upload'}</button>
      </>}
    >
      <div className="field">
        <label>Object key (path)</label>
        <input className="input mono" autoFocus placeholder="uploads/2026/report.pdf" value={key} onChange={(e) => setKey(e.target.value)} />
        <div className="hint">Destination: <span className="mono">{bucket.name}/{key.trim() || '…'}</span></div>
      </div>
      <div className="field">
        <label>Size (MB, optional)</label>
        <input className="input" type="number" min="0" placeholder="1.2" value={sizeMb} onChange={(e) => setSizeMb(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Access</label>
        <div className="grid grid-2" style={{ gap: 10 }}>
          <AccessOption value="public" icon={<Globe size={15} />} title="Public" desc="Served at its direct URL (or CDN domain). Use for non-sensitive web assets." />
          <AccessOption value="private" icon={<Lock size={15} />} title="Presigned-only" desc="Direct URL returns 403. Access only via time-limited presigned links." />
        </div>
        {access === 'public' && bucket.visibility !== 'public' && (
          <div className="banner warn mt-3"><ShieldAlert size={14} /> <span>This is a <strong>{bucket.visibility}</strong> bucket — publishing an object here exposes it to anyone with the URL. Confirm it holds no sensitive data.</span></div>
        )}
      </div>
    </Modal>
  )
}

/* ---------- Developer credentials ---------- */
function CredentialsCard({
  bucket, keys, onChange,
}: { bucket: Bucket; keys: AccessKey[]; onChange: () => void }) {
  const { copied, copy } = useCopied()
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [issuing, setIssuing] = useState(false)
  const [label, setLabel] = useState('')
  const [perms, setPerms] = useState<Permission[]>(['read'])
  const [justIssued, setJustIssued] = useState<AccessKey | null>(null)

  const activeKeys = keys.filter((k) => k.status === 'active')
  const selected = justIssued ?? activeKeys[0] ?? null

  const toggle = (p: Permission) => setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  const issue = async () => {
    if (!label || perms.length === 0) return
    const key = await createKeyForBucket(bucket.name, label, perms)
    setJustIssued(key); setRevealed((r) => ({ ...r, [key.id]: true }))
    setIssuing(false); setLabel(''); setPerms(['read'])
    onChange()
  }

  return (
    <Card>
      <CardHead
        title="Access credentials"
        sub="Keys developers use to connect their apps to this bucket. Scope is matched against the bucket name."
        action={!issuing && <button className="btn primary sm" onClick={() => setIssuing(true)}><KeyRound size={14} /> Generate key</button>}
      />
      <div className="card-pad">
        {justIssued && (
          <div className="banner warn mb-4"><span>New key <strong>{justIssued.label}</strong> created. Copy the secret now — it won't be shown in full again.</span></div>
        )}

        {issuing && (
          <div className="card-pad mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div className="field">
              <label>Key label</label>
              <input className="input" autoFocus placeholder="e.g. my-app-prod" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Permissions</label>
              <div className="flex gap-2 wrap">
                {(['read', 'write', 'delete'] as Permission[]).map((p) => (
                  <button key={p} type="button" className={`btn sm ${perms.includes(p) ? 'primary' : 'ghost'}`} style={{ textTransform: 'capitalize' }} onClick={() => toggle(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn primary" disabled={!label || perms.length === 0} onClick={issue}>Generate</button>
              <button className="btn ghost" onClick={() => setIssuing(false)}>Cancel</button>
            </div>
          </div>
        )}

        {activeKeys.length === 0 && !issuing ? (
          <div className="banner">No active keys grant access to this bucket. Generate one to let an app connect.</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Label</th><th>Access Key ID</th><th>Secret Access Key</th><th>Permissions</th><th>Scope</th></tr>
              </thead>
              <tbody>
                {activeKeys.map((k) => {
                  const show = revealed[k.id]
                  return (
                    <tr key={k.id}>
                      <td style={{ fontWeight: 600 }}>{k.label}{justIssued?.id === k.id && <Badge tone="green">new</Badge>}</td>
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="mono text-sm">{k.accessKeyId}</span>
                          <CopyButton id={`ak-${k.id}`} value={k.accessKeyId} />
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="mono text-sm">{show ? k.secretAccessKey : '•'.repeat(20)}</span>
                          <button className="btn sm ghost" style={{ padding: 5 }} onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))} title={show ? 'Hide' : 'Reveal'}>
                            {show ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button className="btn sm ghost" style={{ padding: 5 }} onClick={() => copy(`sk-${k.id}`, k.secretAccessKey)} title="Copy">
                            {copied === `sk-${k.id}` ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                          </button>
                        </span>
                      </td>
                      <td><span className="flex gap-2 wrap">{k.permissions.map((p) => <Badge key={p} tone={permTone[p]}>{p}</Badge>)}</span></td>
                      <td className="mono text-sm" style={{ color: 'var(--accent)' }}>{k.bucketScope}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {selected && <SdkSnippet bucket={bucket} keyForBucket={selected} secret={revealed[selected.id] ? selected.secretAccessKey : 'YOUR_SECRET_KEY'} />}
      </div>
    </Card>
  )
}

function SdkSnippet({ bucket, keyForBucket, secret }: { bucket: Bucket; keyForBucket: AccessKey; secret: string }) {
  const [lang, setLang] = useState<'js' | 'python' | 'cli'>('js')
  const { copied, copy } = useCopied()

  const code: Record<typeof lang, string> = {
    js: `import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "${S3_ENDPOINT}",
  region: "${bucket.region}",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "${keyForBucket.accessKeyId}",
    secretAccessKey: "${secret}",
  },
});

const res = await s3.send(
  new ListObjectsV2Command({ Bucket: "${bucket.name}" })
);
console.log(res.Contents);`,
    python: `import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="${S3_ENDPOINT}",
    region_name="${bucket.region}",
    aws_access_key_id="${keyForBucket.accessKeyId}",
    aws_secret_access_key="${secret}",
)

for obj in s3.list_objects_v2(Bucket="${bucket.name}").get("Contents", []):
    print(obj["Key"])`,
    cli: `# Authenticate once with the Amity CLI
amity login --endpoint ${S3_ENDPOINT} \\
  --access-key ${keyForBucket.accessKeyId} \\
  --secret-key ${secret}

# List objects in this bucket
amity object list ${bucket.name}`,
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-sm muted"><Terminal size={15} /> Connect your app</span>
        <div className="flex gap-2">
          {(['js', 'python', 'cli'] as const).map((l) => (
            <button key={l} className={`btn sm ${lang === l ? 'primary' : 'ghost'}`} onClick={() => setLang(l)}>
              {l === 'js' ? 'Node.js' : l === 'python' ? 'Python' : 'Amity CLI'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <button className="btn sm ghost" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} onClick={() => copy('snippet', code[lang])}>
          {copied === 'snippet' ? <><Check size={13} color="var(--green)" /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
        <pre style={{ margin: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, overflowX: 'auto' }}>
          <code className="mono text-sm" style={{ color: 'var(--text-muted)', whiteSpace: 'pre' }}>{code[lang]}</code>
        </pre>
      </div>
      {bucket.domains.length > 0 && (
        <div className="banner info mt-3"><ExternalLink size={14} /> <span>Public objects are also reachable at <span className="mono">https://{bucket.domains[0]}/&lt;key&gt;</span></span></div>
      )}
    </div>
  )
}
