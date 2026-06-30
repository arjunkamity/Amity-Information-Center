import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title, onClose, children, footer,
}: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="topbar icon-btn" style={{ width: 30, height: 30, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
