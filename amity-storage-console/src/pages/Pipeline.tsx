import { useEffect, useState } from 'react'
import {
  FileSearch, Tags, Copy, Boxes, Database, ArrowRight,
  Activity, AlertTriangle, RotateCcw, Cpu,
} from 'lucide-react'
import { Card, CardHead, Badge, Loading, Stat } from '../components/ui'
import { listJobs } from '../data/api'
import type { PipelineJob, PipelineStage } from '../data/types'
import { formatDateTime } from '../lib/format'
import { jobStateTone } from '../lib/status'

const stageMeta: { key: PipelineStage; label: string; icon: typeof FileSearch; model: string; desc: string }[] = [
  { key: 'extract', label: 'Extract', icon: FileSearch, model: 'Tika · Tesseract · Whisper', desc: 'Pull text & metadata from docs, images, audio.' },
  { key: 'classify', label: 'Classify', icon: Tags, model: 'DistilBERT-gov', desc: 'Assign governance category & tags with confidence.' },
  { key: 'dedupe', label: 'Dedupe', icon: Copy, model: 'pHash + vector sim', desc: 'Detect exact & near-duplicates; short-circuit ingest.' },
  { key: 'embed', label: 'Embed', icon: Boxes, model: 'BGE-base-v1.5', desc: 'Generate semantic vector for similarity & search.' },
  { key: 'index', label: 'Index', icon: Database, model: 'Index Writer → Qdrant', desc: 'Persist derived records; asset becomes searchable.' },
]

export default function Pipeline() {
  const [jobs, setJobs] = useState<PipelineJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listJobs().then((j) => { setJobs(j); setLoading(false) }) }, [])

  if (loading) return <Loading label="Loading pipeline…" />

  const active = jobs.filter((j) => j.state === 'running').length
  const queued = jobs.filter((j) => j.state === 'queued').length
  const failed = jobs.filter((j) => j.state === 'failed').length
  const dlq = jobs.filter((j) => j.state === 'dead-letter').length
  const countByStage = (s: PipelineStage) => jobs.filter((j) => j.stage === s && (j.state === 'running' || j.state === 'queued')).length

  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI Enrichment Pipeline</h1>
          <div className="desc">Asynchronous, queue-buffered processing. Every upload flows through five stages before becoming searchable (§4).</div>
        </div>
        <Badge tone="brand" dot><Cpu size={13} /> GPU pool: 6× on-prem</Badge>
      </div>

      <div className="grid grid-4 mb-4">
        <Stat label="Running" value={active} icon={<Activity size={15} />} iconTone="blue" trend={{ dir: 'flat', text: 'live GPU jobs' }} />
        <Stat label="Queued" value={queued} icon={<RotateCcw size={15} />} iconTone="amber" trend={{ dir: 'flat', text: 'Kafka-buffered' }} />
        <Stat label="Failed" value={failed} icon={<AlertTriangle size={15} />} iconTone="red" trend={{ dir: 'flat', text: 'retrying w/ backoff' }} />
        <Stat label="Dead-letter" value={dlq} icon={<AlertTriangle size={15} />} iconTone="purple" trend={{ dir: 'flat', text: 'needs manual review' }} />
      </div>

      <Card className="mb-4">
        <CardHead title="Stage flow" sub="extract → classify → dedupe → embed → index" />
        <div className="card-pad">
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, overflowX: 'auto' }}>
            {stageMeta.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, minWidth: 150 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="icon-circle" style={{ width: 32, height: 32, background: 'var(--brand-soft)', color: 'var(--brand-2)' }}><s.icon size={16} /></span>
                    {countByStage(s.key) > 0 && <Badge tone="blue" dot>{countByStage(s.key)} active</Badge>}
                  </div>
                  <div style={{ fontWeight: 600 }}>{s.label}</div>
                  <div className="dim text-xs mt-2" style={{ lineHeight: 1.4 }}>{s.desc}</div>
                  <div className="mono text-xs mt-3" style={{ color: 'var(--accent)' }}>{s.model}</div>
                </div>
                {i < stageMeta.length - 1 && <ArrowRight size={18} className="dim" style={{ flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title="Recent jobs" sub="Failed jobs retry with exponential backoff; poison messages route to a dead-letter queue (§4.2)." />
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Job</th><th>Asset</th><th>Bucket</th><th>Stage</th><th>Model</th><th>State</th><th>Attempts</th><th>Started</th></tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td className="mono text-sm">{j.id}</td>
                  <td className="mono text-sm" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={j.assetKey}>{j.assetKey}</td>
                  <td className="muted text-sm">{j.bucket}</td>
                  <td style={{ textTransform: 'capitalize' }}>{j.stage}</td>
                  <td className="mono text-xs" style={{ color: 'var(--accent)' }}>{j.model}</td>
                  <td>
                    <Badge tone={jobStateTone[j.state]} dot>{j.state}</Badge>
                    {j.error && <div className="text-xs" style={{ color: 'var(--red)', marginTop: 4 }}>{j.error}</div>}
                  </td>
                  <td className={j.attempts > 1 ? 'amber' : 'muted'} style={{ color: j.attempts > 2 ? 'var(--red)' : undefined }}>{j.attempts}</td>
                  <td className="muted text-sm">{formatDateTime(j.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
