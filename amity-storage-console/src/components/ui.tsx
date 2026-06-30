/* Small reusable presentational components. */
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'brand'

export function Badge({ tone = 'gray', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label, value, icon, iconTone = 'brand', trend,
}: {
  label: string; value: ReactNode; icon: ReactNode; iconTone?: Tone
  trend?: { dir: 'up' | 'down' | 'flat'; text: string }
}) {
  const toneColor: Record<Tone, string> = {
    green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)',
    blue: 'var(--blue)', purple: 'var(--purple)', gray: 'var(--text-muted)', brand: 'var(--brand-2)',
  }
  const toneBg: Record<Tone, string> = {
    green: 'var(--green-soft)', amber: 'var(--amber-soft)', red: 'var(--red-soft)',
    blue: 'var(--blue-soft)', purple: 'var(--purple-soft)', gray: 'var(--surface-3)', brand: 'var(--brand-soft)',
  }
  return (
    <div className="stat">
      <div className="label">
        <span className="ico" style={{ background: toneBg[iconTone], color: toneColor[iconTone] }}>{icon}</span>
        {label}
      </div>
      <div className="value">{value}</div>
      {trend && <div className={`trend ${trend.dir}`}>{trend.text}</div>}
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="empty">
      <Loader2 size={26} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      <div>{label}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="empty">
      {icon}
      <div style={{ color: 'var(--text)', fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function ProgressBar({ pct }: { pct: number }) {
  return <div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
}
