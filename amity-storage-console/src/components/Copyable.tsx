import { useState } from 'react'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'

export function useCopied() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (id: string, value: string) => {
    navigator.clipboard?.writeText(value)
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
  }
  return { copied, copy }
}

export function CopyButton({ value, id }: { value: string; id: string }) {
  const { copied, copy } = useCopied()
  return (
    <button className="btn sm ghost" style={{ padding: 5 }} onClick={() => copy(id, value)} title="Copy">
      {copied === id ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
    </button>
  )
}

/** Labeled, monospace, copyable value. Set `secret` to mask with a reveal toggle. */
export function CopyField({
  label, value, secret = false, id,
}: { label: string; value: string; secret?: boolean; id: string }) {
  const { copied, copy } = useCopied()
  const [shown, setShown] = useState(!secret)
  const display = shown ? value : '•'.repeat(Math.min(value.length, 40))
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <input className="input mono" readOnly value={display} style={{ flex: 1 }} />
        {secret && (
          <button className="btn sm ghost" style={{ padding: '8px 9px' }} onClick={() => setShown((s) => !s)} title={shown ? 'Hide' : 'Reveal'}>
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        <button className="btn sm ghost" style={{ padding: '8px 9px' }} onClick={() => copy(id, value)} title="Copy">
          {copied === id ? <Check size={15} color="var(--green)" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  )
}
