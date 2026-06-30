import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import {
  Database, HardDrive, Sparkles, Copy, ArrowUpRight,
  CheckCircle2, AlertTriangle, Activity,
} from 'lucide-react'
import { Card, CardHead, Stat, Badge, Loading } from '../components/ui'
import StorageAnalytics from '../components/StorageAnalytics'
import {
  listBuckets, listAssets, listJobs, getUsageSeries,
} from '../data/api'
import type { Bucket, Asset, PipelineJob, SeriesPoint } from '../data/types'
import { formatBytes, formatCompact, formatNumber } from '../lib/format'
import { jobStateTone } from '../lib/status'

const chartAxis = { stroke: '#6b7588', fontSize: 11 }
const tooltipStyle = {
  background: '#1b2130', border: '1px solid #38425a', borderRadius: 8,
  fontSize: 12, color: '#e6e9f0',
}

export default function Dashboard() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [jobs, setJobs] = useState<PipelineJob[]>([])
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listBuckets(), listAssets(), listJobs(), getUsageSeries()]).then(
      ([b, a, j, s]) => {
        setBuckets(b); setAssets(a); setJobs(j); setSeries(s); setLoading(false)
      },
    )
  }, [])

  if (loading) return <Loading label="Loading dashboard…" />

  const totalBytes = buckets.reduce((sum, b) => sum + b.sizeBytes, 0)
  const totalObjects = buckets.reduce((sum, b) => sum + b.objectCount, 0)
  const searchable = assets.filter((a) => a.status === 'searchable').length
  const enrichPct = Math.round((searchable / assets.length) * 100)
  const dupes = assets.filter((a) => a.status === 'duplicate').length
  const failedJobs = jobs.filter((j) => j.state === 'failed' || j.state === 'dead-letter').length
  const activeJobs = jobs.filter((j) => j.state === 'running' || j.state === 'queued').length

  // storage by category for pie
  const byCat = buckets.reduce<Record<string, number>>((acc, b) => {
    acc[b.categoryId] = (acc[b.categoryId] ?? 0) + b.sizeBytes
    return acc
  }, {})
  const pieColors = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#f87171']
  const pieData = Object.entries(byCat).map(([id, v], i) => ({
    name: id, value: +(v / 1e12).toFixed(2), color: pieColors[i % pieColors.length],
  }))

  const topBuckets = [...buckets].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5)
  const recentJobs = jobs.slice(0, 6)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Platform Overview</h1>
          <div className="desc">Real-time monitoring across all governed buckets and the AI enrichment pipeline.</div>
        </div>
        <Badge tone="brand" dot>On-prem · DC1 + DC2</Badge>
      </div>

      <div className="grid grid-4 mb-4">
        <Stat label="Total storage" value={formatBytes(totalBytes)} icon={<HardDrive size={16} />} iconTone="brand"
          trend={{ dir: 'up', text: '+15.4% vs last month' }} />
        <Stat label="Objects under management" value={formatCompact(totalObjects)} icon={<Database size={16} />} iconTone="blue"
          trend={{ dir: 'up', text: `${buckets.length} buckets governed` }} />
        <Stat label="AI-searchable corpus" value={`${enrichPct}%`} icon={<Sparkles size={16} />} iconTone="purple"
          trend={{ dir: enrichPct >= 95 ? 'up' : 'flat', text: `target ≥ 95% · ${searchable}/${assets.length} sampled` }} />
        <Stat label="Duplicates flagged" value={formatNumber(dupes)} icon={<Copy size={16} />} iconTone="amber"
          trend={{ dir: 'down', text: '≥20% reclaim goal' }} />
      </div>

      <div className="grid mb-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <Card>
          <CardHead title="Storage growth & throughput" sub="Storage (TB) vs monthly upload/download volume" />
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232b3d" vertical={false} />
                <XAxis dataKey="label" {...chartAxis} tickLine={false} axisLine={false} />
                <YAxis {...chartAxis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#38425a' }} />
                <Area type="monotone" dataKey="storage" name="Storage (TB)" stroke="#6366f1" strokeWidth={2} fill="url(#gStore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Storage by category" sub="TB per governance class" />
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="#11151f" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {pieData.map((d) => (
                <span key={d.name} className="text-xs muted" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color }} />
                  {d.value} TB
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card>
          <CardHead title="Upload / download volume" sub="Monthly operations (thousands)" />
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232b3d" vertical={false} />
                <XAxis dataKey="label" {...chartAxis} tickLine={false} axisLine={false} />
                <YAxis {...chartAxis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1b2130' }} />
                <Bar dataKey="uploads" name="Uploads" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                <Bar dataKey="downloads" name="Downloads" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Pipeline health"
            sub={`${activeJobs} active · ${failedJobs} need attention`}
            action={<Link to="/pipeline" className="btn sm ghost">View all</Link>}
          />
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <div className="grid grid-3 mb-3">
              <MiniStat icon={<Activity size={15} />} tone="blue" label="Active" value={activeJobs} />
              <MiniStat icon={<CheckCircle2 size={15} />} tone="green" label="Completed" value={jobs.filter((j) => j.state === 'completed').length} />
              <MiniStat icon={<AlertTriangle size={15} />} tone="red" label="Failed/DLQ" value={failedJobs} />
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <tbody>
                  {recentJobs.map((j) => (
                    <tr key={j.id}>
                      <td className="mono" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.assetKey.split('/').pop()}</td>
                      <td className="muted text-xs">{j.stage}</td>
                      <td style={{ textAlign: 'right' }}><Badge tone={jobStateTone[j.state]} dot>{j.state}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4">
        <StorageAnalytics />
      </div>

      <Card>
        <CardHead title="Largest buckets" action={<Link to="/buckets" className="btn sm ghost">All buckets</Link>} />
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Bucket</th><th>Team</th><th>Objects</th><th>Size</th><th>Utilization</th><th></th></tr>
            </thead>
            <tbody>
              {topBuckets.map((b) => {
                const pct = Math.round((b.sizeBytes / topBuckets[0].sizeBytes) * 100)
                return (
                  <tr key={b.id}>
                    <td><Link to={`/buckets/${b.id}`} style={{ color: 'var(--brand-2)', fontWeight: 600 }}>{b.name}</Link></td>
                    <td className="muted">{b.team}</td>
                    <td>{formatNumber(b.objectCount)}</td>
                    <td>{formatBytes(b.sizeBytes)}</td>
                    <td style={{ width: 200 }}>
                      <div className="progress"><span style={{ width: `${pct}%` }} /></div>
                    </td>
                    <td style={{ textAlign: 'right' }}><ArrowRightLink id={b.id} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function ArrowRightLink({ id }: { id: string }) {
  return <Link to={`/buckets/${id}`} className="muted" style={{ display: 'inline-flex' }}><ArrowUpRight size={16} /></Link>
}

function MiniStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: 'blue' | 'green' | 'red' }) {
  const c = { blue: 'var(--blue)', green: 'var(--green)', red: 'var(--red)' }[tone]
  const bg = { blue: 'var(--blue-soft)', green: 'var(--green-soft)', red: 'var(--red-soft)' }[tone]
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
      <span style={{ color: c, background: bg, width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center' }}>{icon}</span>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{value}</div>
      <div className="dim text-xs">{label}</div>
    </div>
  )
}
