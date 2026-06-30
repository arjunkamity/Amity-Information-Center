import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Database, Upload, FileText, Image, Video, Music, Archive, FileBox,
  ChevronRight, Shield, Clock, HardDrive, Sparkles, Copy, Globe, Plus,
  Trash2, KeyRound, Terminal, ExternalLink, Eye, EyeOff, Check,
} from 'lucide-react'
import { Card, CardHead, Badge, Loading, Empty, Stat } from '../components/ui'
import { CopyField, CopyButton, useCopied } from '../components/Copyable'
import {
  getBucket, listAssets, getCategory, listKeysForBucket,
  addBucketDomain, removeBucketDomain, createKeyForBucket,
} from '../data/api'
import type { Bucket, Asset, AssetKind, AccessKey, Permission } from '../data/types'
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
  const refreshKeys = () => listKeysForBucket(bucket.name).then(setKeys)

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
          <button className="btn primary"><Upload size={15} /> Upload</button>
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
          {assets.length === 0 ? (
            <Empty icon={<FileBox size={32} />} title="No objects yet" sub="Upload files or point an app at this bucket's S3 endpoint." />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Key</th><th>Type</th><th>Size</th><th>Tags</th><th>Enrichment</th><th>Uploaded</th></tr>
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
                        <td>
                          <span className="flex gap-2 wrap">
                            {a.tags.length ? a.tags.slice(0, 3).map((t) => <Badge key={t} tone="gray">{t}</Badge>) : <span className="dim text-xs">—</span>}
                          </span>
                        </td>
                        <td><Badge tone={enrichmentTone[a.status]} dot>{a.status}</Badge></td>
                        <td className="muted text-sm">{formatDateTime(a.uploadedAt)}</td>
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
