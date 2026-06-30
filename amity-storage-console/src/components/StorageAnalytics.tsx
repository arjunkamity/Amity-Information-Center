import { useEffect, useState, type ReactNode } from 'react'
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { Building2, AppWindow, Globe, TrendingUp } from 'lucide-react'
import { Card, CardHead, Badge, Loading } from './ui'
import { getStorageBreakdown } from '../data/api'
import type { StorageDimension, StorageSlice } from '../data/types'
import { formatBytes, formatCompact } from '../lib/format'

const tabs: { key: StorageDimension; label: string; icon: typeof Building2; unit: string }[] = [
  { key: 'campus', label: 'Campus-wise', icon: Building2, unit: 'campuses' },
  { key: 'app', label: 'App-wise', icon: AppWindow, unit: 'applications' },
  { key: 'website', label: 'Website-wise', icon: Globe, unit: 'web properties' },
]

const barColors = ['#6366f1', '#7c7ff2', '#22d3ee', '#34d399', '#fbbf24', '#f59e0b', '#f87171', '#c084fc', '#60a5fa', '#94a3b8']
const tooltipStyle = { background: '#1b2130', border: '1px solid #38425a', borderRadius: 8, fontSize: 12, color: '#e6e9f0' }

export default function StorageAnalytics() {
  const [dim, setDim] = useState<StorageDimension>('campus')
  const [data, setData] = useState<StorageSlice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStorageBreakdown(dim).then((d) => { setData(d); setLoading(false) })
  }, [dim])

  const active = tabs.find((t) => t.key === dim)!
  const total = data.reduce((s, d) => s + d.sizeBytes, 0)
  const totalObjects = data.reduce((s, d) => s + d.objectCount, 0)
  const chartData = data.map((d) => ({ ...d, tb: +(d.sizeBytes / 1e12).toFixed(2) }))

  return (
    <Card>
      <CardHead
        title="Storage analytics"
        sub="Breakdown of platform storage by organizational dimension"
        action={
          <div className="flex gap-2 wrap">
            {tabs.map((t) => (
              <button key={t.key} className={`btn sm ${dim === t.key ? 'primary' : 'ghost'}`} onClick={() => setDim(t.key)}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="card-pad">
        {loading ? <Loading label="Loading analytics…" /> : (
          <>
            <div className="flex gap-4 wrap mb-4">
              <SummaryPill icon={<active.icon size={15} />} label={`Total · ${data.length} ${active.unit}`} value={formatBytes(total)} />
              <SummaryPill icon={<Globe size={15} />} label="Objects" value={formatCompact(totalObjects)} />
              <SummaryPill icon={<TrendingUp size={15} />} label="Top consumer" value={data[0]?.name ?? '—'} small />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr', gap: 18 }}>
              <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 30)}>
                <BarChart layout="vertical" data={chartData} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232b3d" horizontal={false} />
                  <XAxis type="number" stroke="#6b7588" fontSize={11} tickLine={false} axisLine={false} unit=" TB" />
                  <YAxis type="category" dataKey="name" stroke="#9aa4b8" fontSize={11.5} tickLine={false} axisLine={false} width={150} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1b2130' }} formatter={(v: number) => [`${v} TB`, 'Storage']} />
                  <Bar dataKey="tb" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="table-wrap" style={{ alignSelf: 'start' }}>
                <table className="tbl">
                  <thead>
                    <tr><th>{active.label.replace('-wise', '')}</th><th>Size</th><th>Objects</th><th>Buckets</th><th>Growth</th></tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={d.name}>
                        <td>
                          <span className="flex items-center gap-2">
                            <span style={{ width: 9, height: 9, borderRadius: 3, background: barColors[i % barColors.length], flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{d.name}</span>
                          </span>
                        </td>
                        <td>{formatBytes(d.sizeBytes)}</td>
                        <td className="muted">{formatCompact(d.objectCount)}</td>
                        <td className="muted">{d.bucketCount}</td>
                        <td><Badge tone={d.growthPct >= 20 ? 'red' : d.growthPct >= 12 ? 'amber' : 'green'}>+{d.growthPct}%</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function SummaryPill({ icon, label, value, small }: { icon: ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--brand-2)', background: 'var(--brand-soft)', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</span>
      <div>
        <div className="dim text-xs">{label}</div>
        <div style={{ fontWeight: 700, fontSize: small ? 14 : 18, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}
