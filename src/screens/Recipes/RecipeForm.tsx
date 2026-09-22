import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Stepper, Tag } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { METHODS, methodById } from '../../utils/methodDefaults';
import { fmtTime } from '../../utils/formatters';
import type { Recipe, PourStage } from '../../db/types';
import s from './styles.module.css';

function parseTime(val: string): number | null {
  const m = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface RecipeFormProps {
  initial?: Partial<Recipe>;
  onSave: (payload: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function RecipeForm({ initial = {}, onSave }: RecipeFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(initial.name ?? '');
  const [method, setMethod] = useState(initial.method ?? 'espresso');
  const [dose, setDose] = useState(initial.dose ?? 18);
  const [ratio, setRatio] = useState(initial.ratio ?? methodById(initial.method ?? 'espresso').defaultRatio);
  const [temp, setTemp] = useState(initial.temp ?? 93);
  const [timeS, setTimeS] = useState(initial.time ?? 28);
  const [stages, setStages] = useState<PourStage[]>(initial.stages ?? []);

  const isEspresso = method === 'espresso' || method === 'moka-pot';
  const yieldG = Math.round(dose * ratio * 10) / 10;

  function pickMethod(id: string) {
    const m = methodById(id);
    setMethod(id);
    setRatio(m.defaultRatio);
    if (id === 'espresso' || id === 'moka-pot') {
      setDose(18); setTimeS(28); setTemp(93);
    } else {
      setDose(20); setTimeS(210); setTemp(93);
    }
  }

  function addStage() {
    const last = stages[stages.length - 1];
    setStages([...stages, {
      id: uid(),
      label: t('recipes.form.pourLabel', { number: stages.length + 1 }),
      timeS: last ? last.timeS + 45 : 0,
      weightG: last ? last.weightG + 60 : 60,
    }]);
  }

  function updateStage(id: string, patch: Partial<PourStage>) {
    setStages(stages.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function removeStage(id: string) {
    setStages(stages.filter(s => s.id !== id));
  }

  function handleSave() {
    onSave({
      name: name.trim() || t('recipes.form.defaultName', { method: t(`methods.${method}`) }),
      method,
      dose,
      ratio,
      yield: yieldG,
      temp,
      time: timeS,
      stages: isEspresso ? [] : stages,
      lastUsedAt: undefined,
    });
  }

  return (
    <div className="col col-gap-20">
      <Field label={t('recipes.form.name')}>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('recipes.form.namePlaceholder')}
        />
      </Field>

      <Field label={t('recipes.form.method')}>
        <div className="row row-wrap row-gap-8">
          {METHODS.map(m => (
            <Tag key={m.id} active={method === m.id} onClick={() => pickMethod(m.id)}>
              {t(`methods.${m.id}`)}
            </Tag>
          ))}
        </div>
      </Field>

      <div className={s.params}>
        <Stepper label={t('recipes.form.dose')} value={dose} onChange={setDose} step={0.1} unit="g" max={2000} />
        <div className={s.autoCell}>
          <span className="field-label">{t('recipes.form.yield')}</span>
          <span className={s.autoValue}>{yieldG}<span className={s.autoUnit}>g</span></span>
          <span className="field-hint">{t('recipes.form.yieldAuto')}</span>
        </div>
        <Stepper label={t('recipes.form.ratio')} value={ratio} onChange={setRatio} step={isEspresso ? 0.1 : 0.5} prefix="1:" decimals={1} max={30} size="md" />
        <Stepper label={t('recipes.form.temperature')} value={temp} onChange={setTemp} step={1} decimals={0} unit="°C" max={100} size="md" />
        <Stepper label={t('recipes.form.brewTime')} value={timeS} onChange={setTimeS} step={isEspresso ? 1 : 5} decimals={0} unit="s" max={86400} hint={fmtTime(timeS)} size="md" />
      </div>

      {!isEspresso && (
        <Field label={t('recipes.form.pourSchedule')} hint={t('recipes.form.pourScheduleHint')}>
          <div className={`col col-gap-8 ${s.stagesEdit}`}>
            {stages.map((st, i) => (
              <div key={st.id} className="stage-edit-row">
                <span className="sn">{i + 1}</span>
                <input
                  className="stage-mini-input left"
                  aria-label={t('recipes.form.labelPlaceholder')}
                  value={st.label}
                  onChange={e => updateStage(st.id, { label: e.target.value })}
                  placeholder={t('recipes.form.labelPlaceholder')}
                />
                <input
                  className="stage-mini-input"
                  value={fmtTime(st.timeS)}
                  onChange={e => {
                    const parsed = parseTime(e.target.value);
                    if (parsed != null) updateStage(st.id, { timeS: parsed });
                  }}
                  placeholder="0:00"
                />
                <input
                  className="stage-mini-input"
                  type="number"
                  value={st.weightG}
                  onChange={e => updateStage(st.id, { weightG: parseFloat(e.target.value) || 0 })}
                  placeholder="g"
                />
                <button type="button" className="icon-btn" onClick={() => removeStage(st.id)} aria-label={t('common.removePour')}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
            <button type="button" className="btn-link" onClick={addStage}>
              <Icon name="plus" size={16} /> {t('recipes.form.addPour')}
            </button>
          </div>
        </Field>
      )}

      <Button full size="lg" onClick={handleSave}>{t('recipes.form.save')}</Button>
    </div>
  );
}
