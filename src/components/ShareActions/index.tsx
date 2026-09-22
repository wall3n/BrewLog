import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { renderCardPng } from '../../utils/renderCard';
import { shareImage, shareLink, type ShareOutcome } from '../../utils/shareFile';
import type { CardModel } from '../../utils/shareCard';
import s from './styles.module.css';

export interface ShareActionsProps {
  model: CardModel | null;
  fileName: string;
  link?: string;
}

type Status = ShareOutcome | 'failed' | null;

export function ShareActions({ model, fileName, link }: ShareActionsProps) {
  const { t } = useTranslation();
  const [rendered, setRendered] = useState<{ model: CardModel; blob: Blob } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  // A blob for an older model is stale. Treat it as "not ready".
  const blob = rendered !== null && rendered.model === model ? rendered.blob : null;

  // Render the image before the tap, so share() runs inside the user gesture.
  useEffect(() => {
    if (!model) return;
    let cancelled = false;
    renderCardPng(model)
      .then(b => { if (!cancelled) setRendered({ model, blob: b }); })
      .catch(() => { if (!cancelled) setStatus('failed'); });
    return () => { cancelled = true; };
  }, [model]);

  const run = async (action: () => Promise<ShareOutcome>): Promise<void> => {
    try {
      setStatus(await action());
    } catch {
      setStatus('failed');
    }
  };

  const title = model?.title ?? '';
  const message =
    status === 'copied' ? t('share.copied')
    : status === 'downloaded' ? t('share.downloaded')
    : status === 'failed' ? t('share.failed')
    : null;

  return (
    <div className={s.root}>
      <div className={s.buttons}>
        <Button variant="ghost" full leftIcon="share" className={s.action} disabled={!blob} aria-busy={!blob}
          onClick={() => { if (blob) void run(() => shareImage(blob, fileName, title)); }}>
          {blob ? t('share.image') : t('share.preparing')}
        </Button>
        {link && (
          <Button variant="ghost" full leftIcon="link" className={s.action} onClick={() => void run(() => shareLink(link, title))}>
            {t('share.link')}
          </Button>
        )}
      </div>
      <span className={`t-mono ${s.status} ${status === 'failed' ? s.statusError : ''}`} aria-live="polite">{message}</span>
    </div>
  );
}
