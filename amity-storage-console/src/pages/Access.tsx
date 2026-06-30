import { useEffect, useState } from 'react'
import { KeyRound, Plus, Copy, Check, Ban } from 'lucide-react'
import { Card, CardHead, Badge, Loading } from '../components/ui'
import { Modal } from '../components/Modal'
import { listKeys, revokeKey } from '../data/api'
import type { AccessKey, Permission } from '../data/types'
import { timeAgo } from '../lib/format'

const permTone: Record<Permission, 'green' | 'blue' | 'amber' | 'red'> = {
  read: 'green', write: 'blue', delete: 'amber', admin: 'red',
}

export default function Access() {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showIssue, setShowIssue] = useState(false)

  const load = () => { setLoading(true); listKeys().then((k) => { setKeys(k); setLoading(false) }) }
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
          <div className="desc">Scoped S3 access keys. Each key is bound to a bucket scope and a permission set (FR-001). Keys for a bucket are managed by that bucket&#39;s owner.</div>
        </div>
        <button className="btn primary" onClick={() => setShowIssue(true)}><Plus size={16} /> Issue key</button>
      </div>

      {loading ? <Loading label="Loading keys…" /> : (
        <Card>
          <CardHead title="Access keys" sub={`${keys.filter((k) => k.status === 'active').length} active · ${keys.filter((k) => k.status === 'revoked').length} revoked`} />
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Label</th><th>Access Key ID</th><th>Scope</th><th>Permissions</th><th>Created by</th><th>Last used</th><th>Status</th><th></th></tr>
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
                    <td className="mono text-sm" style={{ color: 'var(--accent)' }}>{k.bucketScope}</td>
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

      {showIssue && <IssueKeyModal onClose={() => setShowIssue(false)} />}
    </>
  )
}

function IssueKeyModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [scope, setScope] = useState('*')
  const [perms, setPerms] = useState<Permission[]>(['read'])
  const [issued, setIssued] = useState<{ id: string; secret: string } | null>(null)

  const toggle = (p: Permission) => setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  const issue = () => {
    const rand = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
    setIssued({ id: `AMITY${rand(15)}`, secret: rand(40) })
  }

  return (
    <Modal
      title="Issue access key"
      onClose={onClose}
      footer={issued
        ? <button className="btn primary" onClick={onClose}>Done</button>
        : <>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={!label || perms.length === 0} onClick={issue}><KeyRound size={15} /> Issue key</button>
          </>}
    >
      {issued ? (
        <>
          <div className="banner warn mb-4">Copy the secret now — it will not be shown again.</div>
          <div className="field"><label>Access Key ID</label><input className="input mono" readOnly value={issued.id} /></div>
          <div className="field"><label>Secret Access Key</label><input className="input mono" readOnly value={issued.secret} /></div>
        </>
      ) : (
        <>
          <div className="field"><label>Label</label><input className="input" placeholder="e.g. web-cdn-prod" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div className="field"><label>Bucket scope</label><input className="input mono" placeholder="amity-* or *" value={scope} onChange={(e) => setScope(e.target.value)} /></div>
          <div className="field">
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
