import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Stars, Tag, Textarea } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { flagIcon } from '../../../utils/shots';
import { FLAVOUR_PRESETS } from '../../../utils/methodDefaults';
import type { ShotDraft, UpdateDraft } from '../index';
import s from '../styles.module.css';

const ATTRIBUTE_KEYS = ['acidity', 'sweetness', 'bitterness', 'body', 'balance'] as const;
const FLAGS = ['dialled', 'adjust', 'fail'] as const;

type SectionComponent = (props: { label: string; aside?: ReactNode; children: ReactNode }) => ReactNode;

interface TastingBlockProps { draft: ShotDraft; update: UpdateDraft; Section: SectionComponent; }

function ScaleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className={s.scaleRow}>
      <span className={s.scaleLabel}>{label}</span>
      <div className={s.scaleCells} role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${label} ${n}`}
            className={`${s.scaleCell} ${n <= value ? s.scaleOn : ''}`}
            onClick={() => onChange(n)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TastingBlock({ draft, update, Section }: TastingBlockProps) {
  const { t } = useTranslation();
  const [custom, setCustom] = useState('');

  const toggleFlavour = (f: string) => update({
    flavours: draft.flavours.includes(f) ? draft.flavours.filter(x => x !== f) : [...draft.flavours, f],
  });
  const addCustom = () => {
    const v = custom.toLowerCase().trim();
    if (v && !draft.flavours.includes(v)) update({ flavours: [...draft.flavours, v] });
    setCustom('');
  };
  const extraFlavours = draft.flavours.filter(f => !FLAVOUR_PRESETS.includes(f));

  return (
    <>
      <Section label={t('extraction.steps.tasting.outcome')}>
        <div className="row row-gap-8" role="radiogroup" aria-label={t('extraction.steps.tasting.outcome')}>
          {FLAGS.map(f => (
            <button
              type="button"
              key={f}
              role="radio"
              aria-checked={draft.flag === f}
              className={`flag-toggle ${f} ${draft.flag === f ? 'selected' : ''}`}
              onClick={() => update({ flag: f })}
            >
              <Icon name={flagIcon(f)} size={20} strokeWidth={2.25} />
              {t(`extraction.steps.tasting.flags.${f}`)}
            </button>
          ))}
        </div>
      </Section>

      <Section label={t('sheet.cupping')} aside={t('sheet.scoreOutOf', { value: draft.rating || '—' })}>
        <div className={s.scoreRow}>
          <span className={s.scaleLabel}>{t('extraction.steps.tasting.overallRating')}</span>
          <Stars value={draft.rating} onChange={v => update({ rating: v })} size={24} />
        </div>
        <div className={s.scales}>
          {ATTRIBUTE_KEYS.map(k => (
            <ScaleRow key={k} label={t(`extraction.fields.${k}`)} value={draft[k]} onChange={v => update({ [k]: v })} />
          ))}
        </div>
      </Section>

      <Section label={t('extraction.steps.tasting.flavourNotes')}>
        <div className="row row-wrap row-gap-8">
          {[...FLAVOUR_PRESETS, ...extraFlavours].map(f => (
            <Tag key={f} active={draft.flavours.includes(f)} onClick={() => toggleFlavour(f)}>{f}</Tag>
          ))}
        </div>
        <form className={s.customFlavour} onSubmit={e => { e.preventDefault(); addCustom(); }}>
          <input
            className="input-underline"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder={t('sheet.customFlavourPlaceholder')}
            aria-label={t('extraction.steps.tasting.customFlavour')}
          />
          <button type="submit" className="btn btn-ghost" disabled={!custom.trim()}>{t('common.add')}</button>
        </form>
      </Section>

      <Section label={t('extraction.steps.tasting.notesLabel')}>
        <Textarea value={draft.notes} onChange={e => update({ notes: e.target.value })}
          placeholder={t('extraction.steps.tasting.notesPlaceholder')} rows={3} />
      </Section>
    </>
  );
}
