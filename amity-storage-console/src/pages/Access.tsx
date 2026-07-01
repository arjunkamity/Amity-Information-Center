import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Plus, Copy, Check, Ban, Database } from 'lucide-react'
import { Card, CardHead, Badge, Loading } from '../components/ui'
import { Modal } from '../components/Modal'
import {
  listKeys, listBuckets, revokeKey, createKeyForBucket, scopeMatchesBucket,
} from '../data/api'
import type { AccessKey, Bucket, Permission } from '../data/types'
import { timeAgo } from '../lib/format'

const permTone: Record<Permission, 'green' | 'blue' | 'amber' | 'red'> = {
  read: 'green', write: 'blue', delete: 'amber', admin: 'red',
}

export default function Access() {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showIssue, setShowIssue] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([listKeys(), listBuckets()]).then(([k, b]) => {
      setKeys(k); setBuckets(b); setLoading(false)
    })
  }
  useEffect(load, [])

  const copy = (id: string, val: string) => {
    navigator.clipboard?.writeText(val)
    setCopied(id); setTimeout(() => setCopied(null), 1500)
  }
  const revoke = async (k: AccessKey) => {
    if (!confirm(`Revoke key "${k.label}"? Applications using it will lose access.`)) return
    await revokeKey(k.id); load()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Access & Keys</h1>
          <div className="desc">Scoped S3 access keys. The <strong>Scope</strong> column shows which bucket(s) each key can access — set it when you issue the key. Keys for a bucket are managed by that bucket&#39;s owner.</div>
        </div>
        <button className="btn primary" onClick={() => setShowIssue(true)}><Plus size={16} /> Issue key</button>
      </div>

      {loading ? <Loading label="Loading keys…" /> : (
        <Card>
          <CardHead title="Access keys" sub={`${keys.filter((k) => k.status === 'active').length} active · ${keys.filter((k) => k.status === 'revoked').length} revoked`} />
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Label</th><th>Access Key ID</th><th>Scope (bucket)</th><th>Permissions</th><th>Created by</th><th>Last used</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ opacity: k.status === 'revoked' ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 600 }}>{k.label}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="mono">{k.accessKeyId}</span>
                        <button className="btn sm ghost" style={{ padding: 4 }} onClick={() => copy(k.id, k.accessKeyId)}>
                          {copied === k.id ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                        </button>
                      </span>
                    </td>
                    <td><ScopeCell scope={k.bucketScope} buckets={buckets} /></td>
                    <td><span className="flex gap-2 wrap">{k.permissions.map((p) => <Badge key={p} tone={permTone[p]}>{p}</Badge>)}</span></td>
                    <td className="muted text-sm">{k.createdBy}</td>
                    <td className="muted text-sm">{k.lastUsed ? timeAgo(k.lastUsed) : <span className="dim">never</span>}</td>
                    <td>{k.status === 'active' ? <Badge tone="green" dot>active</Badge> : <Badge tone="gray">revoked</Badge>}</td>
                    <td style={{ textAlign: 'right' }}>
                      {k.status === 'active' && <button className="btn sm danger" onClick={() => revoke(k)}><Ban size={13} /> Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showIssue && <IssueKeyModal buckets={buckets} onClose={() => setShowIssue(false)} onIssued={load} />}
    </>
  )
}

/** Renders the bucket a key is scoped to: exact → link; wildcard/* → match count. */
function ScopeCell({ scope, buckets }: { scope: string; buckets: Bucket[] }) {
  if (scope === '*') {
    return <span className="flex items-center gap-2"><Badge tone="amber">all buckets</Badge><span className="dim text-xs">{buckets.length} buckets</span></span>
  }
  const exact = buckets.find((b) => b.name === scope)
  if (exact) {
    return (
      <Link to={`/buckets/${exact.id}`} className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
        <Database size={13} /> <span className="mono text-sm">{scope}</span>
      </Link>
    )
  }
  const matches = buckets.filter((b) => scopeMatchesBucket(scope, b.name))
  return (
    <span className="flex items-center gap-2">
      <span className="mono text-sm" style={{ color: 'var(--accent)' }}>{scope}</span>
      <span className="dim text-xs" title={matches.map((b) => b.name).join(', ')}>{matches.length} bucket{matches.length === 1 ? '' : 's'}</span>
    </span>
  )
}

function IssueKeyModal({ buckets, onClose, onIssued }: { buckets: Bucket[]; onClose: () => void; onIssued: () => void }) {
  const [label, setLabel] = useState('')
  const [scopeSel, setScopeSel] = useState('*')
  const [customScope, setCustomScope] = useState('amity-')
  const [perms, setPerms] = useState<Permission[]>(['read'])
  const [issued, setIssued] = useState<AccessKey | null>(null)
  const [busy, setBusy] = useState(false)

  const scope = scopeSel === '__custom' ? customScope.trim() : scopeSel
  const matchCount = scope === '*' ? buckets.length : buckets.filter((b) => scopeMatchesBucket(scope, b.name)).length

  const toggle = (p: Permission) => setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  const issue = async () => {
    if (!label || perms.length === 0 || !scope) return
    setBusy(true)
    const key = await createKeyForBucket(scope, label, perms)
    setIssued(key)
    onIssued()
    setBusy(false)
  }

  return (
    <Modal
      title="Issue access key"
      onClose={onClose}
      footer={issued
        ? <button className="btn primary" onClick={onClose}>Done</button>
        : <>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={!label || perms.length === 0 || !scope || busy} onClick={issue}><KeyRound size={15} /> {busy ? 'Issuing…' : 'Issue key'}</button>
          </>}
    >
      {issued ? (
        <>
          <div className="banner warn mb-4">Copy the secret now — it will not be shown again.</div>
          <div className="field"><label>Access Key ID</label><input className="input mono" readOnly value={issued.accessKeyId} /></div>
          <div className="field"><label>Secret Access Key</label><input className="input mono" readOnly value={issued.secretAccessKey} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Scope</label><input className="input mono" readOnly value={issued.bucketScope} /></div>
        </>
      ) : (
        <>
          <div className="field"><label>Label</label><input className="input" placeholder="e.g. web-cdn-prod" value={label} onChange={(e) => setLabel(e.target.value)} /></div>

          <div className="field">
            <label>Which bucket can this key access?</label>
            <select className="input" value={scopeSel} onChange={(e) => setScopeSel(e.target.value)}>
              <option value="*">All buckets ( * )</option>
              <optgroup label="Single bucket">
                {buckets.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </optgroup>
              <option value="__custom">Custom pattern…</option>
            </select>
            {scopeSel === '__custom' && (
              <input className="input mono mt-2" placeholder="amity-web-*" value={customScope} onChange={(e) => setCustomScope(e.target.value.toLowerCase())} />
            )}
            <div className="hint">
              {scope === '*'
                ? 'This key can access every bucket. Prefer scoping to one bucket.'
                : <>This key can access <strong>{matchCount}</strong> bucket{matchCount === 1 ? '' : 's'} matching <span className="mono">{scope || '—'}</span>.</>}
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Permissions</label>
            <div className="flex gap-2 wrap">
              {(['read', 'write', 'delete', 'admin'] as Permission[]).map((p) => (
                <button key={p} className={`btn sm ${perms.includes(p) ? 'primary' : 'ghost'}`} onClick={() => toggle(p)} type="button" style={{ textTransform: 'capitalize' }}>{p}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
