import { useEffect, useState } from 'react'
import { Shield, Users } from 'lucide-react'
import { Card, CardHead, Badge, Loading } from '../components/ui'
import { listPolicies } from '../data/api'
import type { AccessPolicy, Permission, Role } from '../data/types'
import { formatDate } from '../lib/format'

const permTone: Record<Permission, 'green' | 'blue' | 'amber' | 'red'> = {
  read: 'green', write: 'blue', delete: 'amber', admin: 'red',
}
const roleTone: Record<Role, 'red' | 'blue' | 'purple' | 'green' | 'gray'> = {
  admin: 'red', developer: 'blue', content: 'green', 'ai-engineer': 'purple', viewer: 'gray',
}

export default function Policies() {
  const [policies, setPolicies] = useState<AccessPolicy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listPolicies().then((p) => { setPolicies(p); setLoading(false) }) }, [])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Policies (RBAC)</h1>
          <div className="desc">Role-based access policies binding roles to bucket permissions. Evaluated before every object read and search result (§4.2).</div>
        </div>
      </div>

      <div className="banner info mb-4"><Shield size={15} /> <span>RBAC is integrated with the institutional identity provider (LDAP/SSO); principals are resolved at request time. <strong>Bucket administration is owner-only</strong> — only a bucket&#39;s owner can create/revoke its keys, edit its policy &amp; CORS, map domains, or delete it.</span></div>

      {loading ? <Loading label="Loading policies…" /> : (
        <Card>
          <CardHead title="Access policies" sub={`${policies.length} policies governing bucket access`} />
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Policy</th><th>Role</th><th>Bucket scope</th><th>Permissions</th><th>Principals</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="icon-circle" style={{ width: 32, height: 32, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Shield size={15} /></span>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </span>
                    </td>
                    <td><Badge tone={roleTone[p.role]}>{p.role}</Badge></td>
                    <td className="mono text-sm" style={{ color: 'var(--accent)' }}>{p.bucketScope}</td>
                    <td><span className="flex gap-2 wrap">{p.permissions.map((perm) => <Badge key={perm} tone={permTone[perm]}>{perm}</Badge>)}</span></td>
                    <td><span className="flex items-center gap-2 muted"><Users size={14} /> {p.principals}</span></td>
                    <td className="muted text-sm">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
