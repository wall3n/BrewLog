import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import { useApp } from '../../context/AppContext';
import s from './styles.module.css';

interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode; }
export function Sheet({ open, onClose, title, children, foot }: SheetProps) {
  const { dispatch } = useApp();
  const { t } = useTranslation();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    dispatch({ type: 'OPEN_MODAL' });
    const mainEl = document.querySelector('.main');
    if (mainEl instanceof HTMLElement) {
      mainEl.style.overflow = 'hidden';
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      dispatch({ type: 'CLOSE_MODAL' });
      window.removeEventListener('keydown', onKey);
      if (mainEl instanceof HTMLElement) {
        mainEl.style.overflow = '';
      }
    };
  }, [open, dispatch]);

  if (!open) return null;

  return createPortal(
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={`h-display ${s.title}`}>{title}</h3>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label={t('common.close')}>
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
