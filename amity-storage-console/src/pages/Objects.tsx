import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Image, Video, Music, Archive, FileBox, Search, Boxes,
} from 'lucide-react'
import { Card, Badge, Loading, Empty } from '../components/ui'
import { listAssets, listBuckets } from '../data/api'
import type { Asset, AssetKind, Bucket, EnrichmentStatus } from '../data/types'
import { formatBytes, formatDateTime } from '../lib/format'
import { enrichmentTone } from '../lib/status'

const kindIcon: Record<AssetKind, typeof FileText> = {
  document: FileText, image: Image, video: Video, audio: Music,
  archive: Archive, data: FileBox, other: FileBox,
}
const statuses: (EnrichmentStatus | 'all')[] = ['all', 'searchable', 'processing', 'queued', 'failed', 'duplicate']

export default function Objects() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<EnrichmentStatus | 'all'>('all')

  useEffect(() => {
    Promise.all([listAssets(), listBuckets()]).then(([a, b]) => {
      setAssets(a); setBuckets(b); setLoading(false)
    })
  }, [])

  const bucketName = (id: string) => buckets.find((b) => b.id === id)?.name ?? '—'

  const filtered = useMemo(() => assets.filter((a) => {
    const matchQ = `${a.key} ${a.tags.join(' ')} ${a.category}`.toLowerCase().includes(q.toLowerCase())
    const matchS = status === 'all' || a.status === status
    return matchQ && matchS
  }), [assets, q, status])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>All Objects</h1>
          <div className="desc">Unified view of assets across every bucket, with AI enrichment status and tags.</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 wrap">
        <div className="searchbox" style={{ maxWidth: 360, flex: 1 }}>
          <Search size={16} />
          <input placeholder="Filter by key, tag or category…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 wrap">
          {statuses.map((s) => (
            <button key={s} className={`btn sm ${status === s ? 'primary' : 'ghost'}`} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading label="Loading objects…" />
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <Empty icon={<Boxes size={32} />} title="No objects match" sub="Adjust your filters." />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Key</th><th>Bucket</th><th>Category</th><th>Size</th><th>Tags</th><th>Status</th><th>Uploaded</th></tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const KIcon = kindIcon[a.kind]
                    return (
                      <tr key={a.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            <KIcon size={16} className="dim" />
                            <span className="mono" style={{ color: 'var(--text)' }}>{a.key}</span>
                          </span>
                        </td>
                        <td><Link to={`/buckets/${a.bucketId}`} className="mono text-sm" style={{ color: 'var(--brand-2)' }}>{bucketName(a.bucketId)}</Link></td>
                        <td className="muted text-sm">{a.category}</td>
                        <td>{formatBytes(a.sizeBytes)}</td>
                        <td>
                          <span className="flex gap-2 wrap">
                            {a.tags.length ? a.tags.slice(0, 2).map((t) => <Badge key={t} tone="gray">{t}</Badge>) : <span className="dim text-xs">—</span>}
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
    </>
  )
}
