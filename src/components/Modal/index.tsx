import type { ReactNode } from 'react';
import { Icon } from '../Icons';
import s from './styles.module.css';

interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode; }
export function Sheet({ open, onClose, title, children, foot }: SheetProps) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className={`row row-between ${s.header}`}>
          <h3 className={`h-display ${s.title}`}>{title}</h3>
          <button className={s.closeBtn} onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
        {foot && <div className={s.footer}>{foot}</div>}
      </div>
    </div>
  );
}
