import { useEffect, useMemo, useState } from 'react'
import { ScrollText, Search, Download } from 'lucide-react'
import { Card, CardHead, Badge, Loading, Empty } from '../components/ui'
import { listAudit } from '../data/api'
import type { AuditAction, AuditLog } from '../data/types'
import { formatDateTime } from '../lib/format'
import { auditResultTone } from '../lib/status'

const actionTone: Record<AuditAction, 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray'> = {
  upload: 'blue', read: 'gray', delete: 'red', 'policy.change': 'amber',
  'bucket.create': 'green', 'bucket.delete': 'red', 'key.issue': 'purple', 'key.revoke': 'amber', search: 'gray',
}

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { listAudit().then((l) => { setLogs(l); setLoading(false) }) }, [])

  const filtered = useMemo(() => logs.filter((l) =>
    `${l.actor} ${l.action} ${l.target} ${l.ip}`.toLowerCase().includes(q.toLowerCase())
  ), [logs, q])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit Log</h1>
          <div className="desc">Immutable record of every action — upload, read, deletion, policy change (§6 AuditLog).</div>
        </div>
        <button className="btn ghost"><Download size={15} /> Export CSV</button>
      </div>

      <div className="flex items-center gap-3 mb-4 wrap">
        <div className="topbar search" style={{ maxWidth: 380, position: 'static' as const }}>
          <Search size={16} />
          <input placeholder="Filter by actor, action, target or IP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="muted text-sm">{filtered.length} of {logs.length} events</span>
      </div>

      {loading ? <Loading label="Loading audit log…" /> : (
        <Card>
          <CardHead title="Events" sub="Most recent first" />
          {filtered.length === 0 ? <Empty icon={<ScrollText size={32} />} title="No events match" /> : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Source IP</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id}>
                      <td className="mono text-sm muted">{formatDateTime(l.ts)}</td>
                      <td style={{ fontWeight: 600 }}>{l.actor}</td>
                      <td><Badge tone={actionTone[l.action]}>{l.action}</Badge></td>
                      <td className="mono text-sm" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.target}>{l.target}</td>
                      <td className="mono text-sm muted">{l.ip}</td>
                      <td><Badge tone={auditResultTone[l.result]} dot>{l.result}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  )
}
