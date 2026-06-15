import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icons';
import { useApp } from '../../context/AppContext';
import s from './styles.module.css';

interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode; }
export function Sheet({ open, onClose, title, children, foot }: SheetProps) {
  const { dispatch } = useApp();

  useEffect(() => {
    if (!open) return;
    dispatch({ type: 'OPEN_MODAL' });
    document.body.style.overflow = 'hidden';
    return () => {
      dispatch({ type: 'CLOSE_MODAL' });
      document.body.style.overflow = '';
    };
  }, [open, dispatch]);

  if (!open) return null;

  return createPortal(
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
    </div>,
    document.body
  );
}
