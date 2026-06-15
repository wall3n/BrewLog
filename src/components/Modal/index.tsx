import type { ReactNode } from 'react';
import { Icon } from '../Icons';

interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode; }
export function Sheet({ open, onClose, title, children, foot }: SheetProps) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="row row-between" style={{ marginBottom: 20 }}>
          <h3 className="h-display" style={{ margin: 0, fontSize: 22 }}>{title}</h3>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }} onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
        {foot && <div style={{ marginTop: 20 }}>{foot}</div>}
      </div>
    </div>
  );
}
