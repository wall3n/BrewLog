import { useTranslation } from 'react-i18next';
import { Button, Field, Slider, Stars, Tag, Textarea } from '../../../components/UI';
import { FLAVOUR_PRESETS } from '../../../utils/methodDefaults';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onSave: () => void; }

const ATTRIBUTE_KEYS = ['acidity', 'sweetness', 'bitterness', 'body', 'balance'] as const;

export function StepTasting({ draft, update, onSave }: Props) {
  const { t } = useTranslation();

  const toggleFlavour = (f: string) => {
    const next = draft.flavours.includes(f)
      ? draft.flavours.filter(x => x !== f)
      : [...draft.flavours, f];
    update({ flavours: next });
  };

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>{t('extraction.steps.tasting.title')}</h2>
          <span className="t-sec" style={{ fontSize: 12 }}>{t('extraction.steps.tasting.subtitle')}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 12 }}>{t('extraction.steps.tasting.outcome')}</div>
        <div className="row row-gap-8">
          {[
            { key: 'dialled', sym: '✓', cls: 'dialled' },
            { key: 'adjust',  sym: '!', cls: 'adjust' },
            { key: 'fail',    sym: '✗', cls: 'fail' },
          ].map(f => (
            <button key={f.key} type="button"
              className={`flag-toggle ${f.cls} ${draft.flag === f.key ? 'selected' : ''}`}
              onClick={() => update({ flag: f.key as WizardDraft['flag'] })}>
              <span className="e">{f.sym}</span>
              {t(`extraction.steps.tasting.flags.${f.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row row-between" style={{ marginBottom: 12 }}>
          <span className="t-upper">{t('extraction.steps.tasting.overallRating')}</span>
          <span className="t-mono t-sec" style={{ fontSize: 12 }}>{draft.rating || '—'} / 5</span>
        </div>
        <Stars value={draft.rating} onChange={v => update({ rating: v })} size={28} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>{t('extraction.steps.tasting.flavourProfile')}</div>
        <div className="col col-gap-12">
          {ATTRIBUTE_KEYS.map(k => (
            <Slider key={k} label={t(`extraction.fields.${k}`)} value={draft[k]} min={1} max={5} step={1}
              onChange={v => update({ [k]: v })} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 12 }}>{t('extraction.steps.tasting.flavourNotes')}</div>
        <div className="scroll-x">
          {FLAVOUR_PRESETS.map(f => (
            <Tag key={f} active={draft.flavours.includes(f)} onClick={() => toggleFlavour(f)}>{f}</Tag>
          ))}
          <Tag subtle onClick={() => {
            const c = window.prompt(t('extraction.steps.tasting.customFlavourPrompt'));
            if (c) toggleFlavour(c.toLowerCase().trim());
          }}>{t('extraction.steps.tasting.customFlavour')}</Tag>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <Field label={t('extraction.steps.tasting.notesLabel')}>
          <Textarea value={draft.notes} onChange={e => update({ notes: e.target.value })}
            placeholder={t('extraction.steps.tasting.notesPlaceholder')} rows={4} />
        </Field>
      </div>

      <Button full size="lg" onClick={onSave}>{t('extraction.steps.tasting.save')}</Button>
    </div>
  );
}
