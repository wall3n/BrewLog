import { useTranslation } from 'react-i18next';
import { METHODS } from '../../../utils/methodDefaults';
import { Button } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

export function StepMethod({ draft, update, onNext }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <div className="col col-gap-4">
          <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.method.title')}</h2>
          <span className={`t-sec ${css.stepSub}`}>{t('extraction.steps.method.subtitle')}</span>
        </div>
      </div>
      <div className={`grid grid-3 ${css.methodGrid}`}>
        {METHODS.map(m => (
          <div key={m.id} className={`method-card ${draft.method === m.id ? 'selected' : ''}`}
            onClick={() => update({ method: m.id, ratio: m.defaultRatio })}>
            <div className="m-icon"><Icon name={m.icon} size={28} /></div>
            <div className="m-name">{t(`methods.${m.id}`, { defaultValue: m.name })}</div>
          </div>
        ))}
      </div>
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight" disabled={!draft.method}>{t('common.continue')}</Button>
    </div>
  );
}
