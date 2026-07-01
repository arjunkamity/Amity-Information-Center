import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Sparkles, FileText, Image, Video, Music, Archive, FileBox, ShieldCheck,
} from 'lucide-react'
import { Card, Badge, Loading, Empty } from '../components/ui'
import { semanticSearch } from '../data/api'
import type { AssetKind, SearchResult } from '../data/types'
import { formatBytes } from '../lib/format'

const kindIcon: Record<AssetKind, typeof FileText> = {
  document: FileText, image: Image, video: Video, audio: Music,
  archive: Archive, data: FileBox, other: FileBox,
}
const examples = ['admissions brochure', 'machine learning lecture', 'campus hero banner', 'student transcript', 'brand logo']

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async (query: string) => {
    setQ(query)
    if (!query.trim()) { setResults(null); return }
    setLoading(true)
    const r = await semanticSearch(query)
    setResults(r); setLoading(false)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Semantic Search</h1>
          <div className="desc">Natural-language search over the enriched corpus. Hybrid vector + metadata ranking, permission-filtered (FR-006).</div>
        </div>
      </div>

      <Card className="card-pad mb-4">
        <form onSubmit={(e) => { e.preventDefault(); run(q) }}>
          <div className="searchbox" style={{ padding: '12px 16px' }}>
            <Search size={18} />
            <input autoFocus placeholder="Describe what you're looking for…" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 15 }} />
            <button className="btn primary sm" type="submit"><Sparkles size={14} /> Search</button>
          </div>
        </form>
        <div className="flex items-center gap-2 wrap mt-3">
          <span className="dim text-xs">Try:</span>
          {examples.map((ex) => (
            <button key={ex} className="btn sm ghost" onClick={() => run(ex)}>{ex}</button>
          ))}
        </div>
      </Card>

      <div className="banner info mb-4"><ShieldCheck size={15} /> <span>Results are filtered against your RBAC permissions before display — search never returns assets you cannot access (§3.1).</span></div>

      {loading ? (
        <Loading label="Embedding query & ranking…" />
      ) : results === null ? (
        <Card><Empty icon={<Sparkles size={34} />} title="Search the asset corpus" sub="Enter a natural-language query, or pick an example above." /></Card>
      ) : results.length === 0 ? (
        <Card><Empty icon={<Search size={34} />} title="No matches" sub="Try broadening your query." /></Card>
      ) : (
        <>
          <div className="muted text-sm mb-3">{results.length} results ranked by relevance</div>
          <div className="grid" style={{ gap: 12 }}>
            {results.map((r) => {
              const KIcon = kindIcon[r.asset.kind]
              return (
                <Card key={r.asset.id} className="card-pad">
                  <div className="flex items-center gap-3" style={{ justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <span className="icon-circle" style={{ background: 'var(--brand-soft)', color: 'var(--brand-2)' }}><KIcon size={18} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div className="mono" style={{ fontWeight: 600 }}>{r.asset.key}</div>
                        <div className="dim text-xs mt-2">
                          <Link to={`/buckets/${r.asset.bucketId}`} style={{ color: 'var(--brand-2)' }}>{r.bucketName}</Link>
                          {' · '}{formatBytes(r.asset.sizeBytes)}{' · '}{r.asset.category}
                        </div>
                      </div>
                    </div>
                    <RelevanceMeter score={r.score} />
                  </div>
                  <div className="text-sm muted mt-3" style={{ paddingLeft: 50 }}>{r.snippet}</div>
                  {r.asset.tags.length > 0 && (
                    <div className="flex gap-2 wrap mt-3" style={{ paddingLeft: 50 }}>
                      {r.asset.tags.map((t) => <Badge key={t} tone="gray">{t}</Badge>)}
                      <Badge tone="purple">{r.asset.modelVersion}</Badge>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

function RelevanceMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const tone = score >= 0.85 ? 'green' : score >= 0.7 ? 'blue' : 'amber'
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <Badge tone={tone as never}>{score.toFixed(2)}</Badge>
      <div className="progress" style={{ width: 90, marginTop: 6 }}><span style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
