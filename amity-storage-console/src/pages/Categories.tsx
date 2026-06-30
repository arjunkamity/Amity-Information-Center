import { useEffect, useState } from 'react'
import { Boxes, Clock, FileSignature } from 'lucide-react'
import { Card, Badge, Loading } from '../components/ui'
import { listCategories } from '../data/api'
import type { Category } from '../data/types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listCategories().then((c) => { setCategories(c); setLoading(false) }) }, [])

  const years = (days: number) => (days >= 365 ? `${(days / 365).toFixed(days % 365 === 0 ? 0 : 1)} yr` : `${days} d`)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Governance Categories</h1>
          <div className="desc">Each category defines retention rules and a naming standard. Buckets inherit governance from their category (§6).</div>
        </div>
      </div>

      {loading ? <Loading label="Loading categories…" /> : (
        <div className="grid grid-3">
          {categories.map((c) => (
            <Card key={c.id} className="card-pad">
              <div className="flex items-center justify-between mb-3">
                <span className="icon-circle" style={{ background: `var(--${c.color}-soft)`, color: `var(--${c.color})` }}><Boxes size={18} /></span>
                <Badge tone={c.color as never}>{c.bucketCount} buckets</Badge>
              </div>
              <h3>{c.name}</h3>
              <p className="muted text-sm mt-2" style={{ minHeight: 38 }}>{c.description}</p>
              <hr className="divider" />
              <div className="flex items-center gap-2 text-sm muted mb-3"><Clock size={14} /> Retention: <strong style={{ color: 'var(--text)' }}>{years(c.retentionDays)}</strong></div>
              <div className="flex items-center gap-2 text-sm muted"><FileSignature size={14} /> <span className="mono text-xs" style={{ color: 'var(--accent)' }}>{c.namingPattern}</span></div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
