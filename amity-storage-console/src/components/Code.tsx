import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useCopied } from './Copyable'

export interface Snippet {
  label: string
  language: string
  code: string
}

const langColor: Record<string, string> = {
  bash: '#34d399', shell: '#34d399', json: '#fbbf24', javascript: '#f7df1e',
  typescript: '#60a5fa', python: '#c084fc', swift: '#f87171', kotlin: '#22d3ee',
  http: '#818cf8', xml: '#94a3b8',
}

export function CodeBlock({ code, language = 'bash', title, id }: { code: string; language?: string; title?: string; id: string }) {
  const { copied, copy } = useCopied()
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="flex items-center justify-between" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <span className="flex items-center gap-2 text-xs">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: langColor[language] ?? 'var(--text-dim)' }} />
          <span className="dim">{title ?? language}</span>
        </span>
        <button className="btn sm ghost" style={{ padding: '4px 8px' }} onClick={() => copy(id, code)}>
          {copied === id ? <><Check size={12} color="var(--green)" /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: 16, overflowX: 'auto' }}>
        <code className="mono text-sm" style={{ color: 'var(--text-muted)', whiteSpace: 'pre' }}>{code}</code>
      </pre>
    </div>
  )
}

export function CodeTabs({ tabs, id }: { tabs: Snippet[]; id: string }) {
  const [active, setActive] = useState(0)
  const tab = tabs[active]
  return (
    <div>
      <div className="flex gap-2 wrap mb-3">
        {tabs.map((t, i) => (
          <button key={t.label} className={`btn sm ${i === active ? 'primary' : 'ghost'}`} onClick={() => setActive(i)}>{t.label}</button>
        ))}
      </div>
      <CodeBlock code={tab.code} language={tab.language} title={tab.label} id={`${id}-${active}`} />
    </div>
  )
}
