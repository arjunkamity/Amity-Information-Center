import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Plus, Search, Lock, Globe, Building2, Trash2, Eye } from 'lucide-react'
import { Card, Badge, Loading, Empty } from '../components/ui'
import { Modal } from '../components/Modal'
import {
  listBuckets, listCategories, createBucket, deleteBucket, getCategory,
  type NewBucketInput,
} from '../data/api'
import type { Bucket, Category } from '../data/types'
import { formatBytes, formatNumber, formatDate } from '../lib/format'
import { bucketStatusTone } from '../lib/status'

const visIcon = { public: Globe, internal: Building2, private: Lock }

export default function Buckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([listBuckets(), listCategories()]).then(([b, c]) => {
      setBuckets(b); setCategories(c); setLoading(false)
    })
  }
  useEffect(load, [])

  const filtered = useMemo(
    () => buckets.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()) || b.team.toLowerCase().includes(q.toLowerCase())),
    [buckets, q],
  )

  const handleDelete = async (b: Bucket) => {
    if (!confirm(`Delete bucket "${b.name}"? This cannot be undone.`)) return
    await deleteBucket(b.id)
    load()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Buckets</h1>
          <div className="desc">Self-service, policy-governed S3-compatible containers. {buckets.length} buckets across 2 data centers.</div>
        </div>
        <button className="btn primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Provision bucket</button>
      </div>

      <div className="flex items-center gap-3 mb-4 wrap">
        <div className="searchbox" style={{ maxWidth: 360, flex: 1 }}>
          <Search size={16} />
          <input placeholder="Filter by name or team…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="muted text-sm">{filtered.length} shown</span>
      </div>

      {loading ? (
        <Loading label="Loading buckets…" />
      ) : filtered.length === 0 ? (
        <Card><Empty icon={<Database size={34} />} title="No buckets match" sub="Try a different search or provision a new bucket." /></Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th><th>Category</th><th>Visibility</th><th>Objects</th>
                  <th>Size</th><th>Owner</th><th>Status</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const cat = getCategory(b.categoryId)
                  const VIcon = visIcon[b.visibility]
                  return (
                    <tr key={b.id} className="row-click">
                      <td>
                        <Link to={`/buckets/${b.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="icon-circle" style={{ background: 'var(--brand-soft)', color: 'var(--brand-2)' }}><Database size={17} /></span>
                          <span>
                            <span style={{ display: 'block', fontWeight: 600, color: 'var(--brand-2)' }}>{b.name}</span>
                            <span className="dim text-xs">{b.region} · {b.team}</span>
                          </span>
                        </Link>
                      </td>
                      <td>{cat && <Badge tone={cat.color as never}>{cat.name}</Badge>}</td>
                      <td><span className="flex items-center gap-2 muted text-sm" style={{ textTransform: 'capitalize' }}><VIcon size={14} /> {b.visibility}</span></td>
                      <td>{formatNumber(b.objectCount)}</td>
                      <td>{formatBytes(b.sizeBytes)}</td>
                      <td className="muted">{b.owner}</td>
                      <td><Badge tone={bucketStatusTone[b.status]} dot>{b.status}</Badge></td>
                      <td className="muted text-sm">{formatDate(b.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <Link to={`/buckets/${b.id}`} className="btn sm ghost" title="View bucket data"><Eye size={14} /> View</Link>
                          <button className="btn sm danger" onClick={() => handleDelete(b)} title="Delete bucket"><Trash2 size={14} /></button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateBucketModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </>
  )
}

function CreateBucketModal({
  categories, onClose, onCreated,
}: { categories: Category[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewBucketInput>({
    name: '', description: '', categoryId: categories[0]?.id ?? '',
    visibility: 'internal', region: 'on-prem-dc1', versioning: true, encryption: true, retentionDays: null,
  })
  const [busy, setBusy] = useState(false)
  const valid = /^[a-z0-9][a-z0-9-]{2,40}$/.test(form.name)

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    await createBucket(form)
    onCreated()
  }

  const set = <K extends keyof NewBucketInput>(k: K, v: NewBucketInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      title="Provision new bucket"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={!valid || busy}>{busy ? 'Provisioning…' : 'Create bucket'}</button>
        </>
      }
    >
      <div className="banner info mb-4"><span>FR-001: bucket + scoped keys provisioned in &lt; 1 minute. Default policy & category applied automatically.</span></div>
      <div className="field">
        <label>Bucket name</label>
        <input className="input mono" placeholder="amity-my-service" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className="hint">{valid || form.name === '' ? 'Lowercase letters, numbers, hyphens. 3–41 chars.' : <span style={{ color: 'var(--red)' }}>Invalid name.</span>}</div>
      </div>
      <div className="field">
        <label>Description</label>
        <input className="input" placeholder="What will this bucket store?" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid grid-2">
        <div className="field">
          <label>Governance category</label>
          <select className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Visibility</label>
          <select className="input" value={form.visibility} onChange={(e) => set('visibility', e.target.value as never)}>
            <option value="private">Private</option>
            <option value="internal">Internal</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div className="field">
          <label>Region</label>
          <select className="input" value={form.region} onChange={(e) => set('region', e.target.value)}>
            <option value="on-prem-dc1">on-prem-dc1</option>
            <option value="on-prem-dc2">on-prem-dc2</option>
          </select>
        </div>
        <div className="field">
          <label>Retention override (days)</label>
          <input className="input" type="number" placeholder="inherit from category" value={form.retentionDays ?? ''}
            onChange={(e) => set('retentionDays', e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-2 text-sm muted">
          <input type="checkbox" checked={form.versioning} onChange={(e) => set('versioning', e.target.checked)} /> Versioning
        </label>
        <label className="flex items-center gap-2 text-sm muted">
          <input type="checkbox" checked={form.encryption} onChange={(e) => set('encryption', e.target.checked)} /> Encryption at rest
        </label>
      </div>
    </Modal>
  )
}
