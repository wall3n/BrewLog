import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Slider, Tag } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { METHODS, methodById } from '../../utils/methodDefaults';
import { fmtTime } from '../../utils/formatters';
import type { Recipe, PourStage } from '../../db/types';

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
      label: `Pour ${stages.length + 1}`,
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
      name: name.trim() || `${methodById(method).name} recipe`,
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
        <div className="row row-wrap row-gap-8" style={{ gap: 8 }}>
          {METHODS.map(m => (
            <Tag key={m.id} active={method === m.id} onClick={() => pickMethod(m.id)}>
              {m.name}
            </Tag>
          ))}
        </div>
      </Field>

      <div className="grid grid-2">
        <Field label={t('recipes.form.dose')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>g</span>}>
          <Input
            type="number"
            value={dose}
            onChange={e => setDose(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label={t('recipes.form.yield')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>{t('recipes.form.yieldAuto')}</span>}>
          <div className="input-underline" style={{ color: 'var(--accent)', padding: '10px 0' }}>{yieldG}</div>
        </Field>
      </div>

      <Field label={`${t('recipes.form.ratio')}  ·  1 : ${ratio.toFixed(1)}`}>
        <Slider
          value={ratio}
          min={isEspresso ? 1.0 : 5}
          max={isEspresso ? 3.0 : 20}
          step={0.1}
          onChange={setRatio}
          displayValue={`1:${ratio.toFixed(1)}`}
        />
      </Field>

      <div className="grid grid-2">
        <Field label={t('recipes.form.brewTime')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>m:ss</span>}>
          <Input
            value={fmtTime(timeS)}
            onChange={e => {
              const parsed = parseTime(e.target.value);
              if (parsed != null) setTimeS(parsed);
            }}
          />
        </Field>
        <Field label={t('recipes.form.temperature')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>°C</span>}>
          <Input
            type="number"
            value={temp}
            onChange={e => setTemp(parseFloat(e.target.value) || 0)}
          />
        </Field>
      </div>

      {!isEspresso && (
        <Field label={t('recipes.form.pourSchedule')} hint={t('recipes.form.pourScheduleHint')}>
          <div className="col col-gap-12" style={{ marginTop: 4 }}>
            {stages.map((s, i) => (
              <div key={s.id} className="stage-edit-row">
                <span className="sn">{i + 1}</span>
                <input
                  className="stage-mini-input"
                  style={{ textAlign: 'left' }}
                  value={s.label}
                  onChange={e => updateStage(s.id, { label: e.target.value })}
                  placeholder="Label"
                />
                <input
                  className="stage-mini-input"
                  value={fmtTime(s.timeS)}
                  onChange={e => {
                    const parsed = parseTime(e.target.value);
                    if (parsed != null) updateStage(s.id, { timeS: parsed });
                  }}
                  placeholder="0:00"
                />
                <input
                  className="stage-mini-input"
                  type="number"
                  value={s.weightG}
                  onChange={e => updateStage(s.id, { weightG: parseFloat(e.target.value) || 0 })}
                  placeholder="g"
                />
                <button className="icon-btn" onClick={() => removeStage(s.id)} aria-label="Remove pour">
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
            <button
              className="sidebar-link"
              style={{ color: 'var(--accent)', padding: '6px 0', width: 'auto' }}
              onClick={addStage}
            >
              <Icon name="plus" size={15} /> {t('recipes.form.addPour')}
            </button>
          </div>
        </Field>
      )}

      <Button full size="lg" onClick={handleSave}>{t('recipes.form.save')}</Button>
    </div>
  );
}
