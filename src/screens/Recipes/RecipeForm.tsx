import { Fragment, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Slider, Tag } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { METHODS, methodById } from '../../utils/methodDefaults';
import { fmtTime } from '../../utils/formatters';
import {
  shareProblems, MAX_LABEL_LENGTH, MAX_NAME_LENGTH, MAX_STAGES, SHARE_LIMITS,
  type ShareProblem, type SharedRecipe,
} from '../../utils/shareCodec';
import type { Recipe, PourStage } from '../../db/types';
import s from './styles.module.css';

function parseTime(val: string): number | null {
  const m = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

// An empty number input gives NaN. Show it as an empty field, not "NaN".
function numValue(n: number): number | string {
  return Number.isNaN(n) ? '' : n;
}

function readNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : parseFloat(value);
}

type FieldKey = Exclude<ShareProblem['field'], 'stageLabel' | 'stageTime' | 'stageWeight'>;

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
  const savedName = name.trim() || t('recipes.form.defaultName', { method: t(`methods.${method}`) });
  const savedStages = isEspresso ? [] : stages;
  const idBase = useId();

  // Only save what a share link can carry, so every saved recipe can be shared.
  const candidate: SharedRecipe = {
    name: savedName, method, dose, ratio, yield: yieldG, temp, time: timeS, stages: savedStages,
  };
  const problems = shareProblems(candidate);
  const atStageLimit = stages.length >= MAX_STAGES;

  function fieldError(field: FieldKey): string | null {
    if (!problems.some(p => p.field === field)) return null;
    switch (field) {
      case 'name': return t('recipes.form.errors.name', { max: MAX_NAME_LENGTH });
      case 'stages': return t('recipes.form.errors.stages', { max: MAX_STAGES });
      case 'payload': return t('recipes.form.errors.payload');
      case 'method': return t('recipes.form.errors.method');
      case 'time': return t('recipes.form.errors.time');
      default: {
        const [min, max] = SHARE_LIMITS[field];
        return t(`recipes.form.errors.${field}`, { min, max });
      }
    }
  }

  function stageError(index: number): string | null {
    const found = problems.find(p => p.stage === index);
    if (!found) return null;
    const number = index + 1;
    if (found.field === 'stageLabel') return t('recipes.form.errors.stageLabel', { number, max: MAX_LABEL_LENGTH });
    if (found.field === 'stageTime') return t('recipes.form.errors.stageTime', { number });
    const [min, max] = SHARE_LIMITS.stageWeight;
    return t('recipes.form.errors.stageWeight', { number, min, max });
  }

  function errorProps(message: string | null, id: string): { 'aria-invalid'?: true; 'aria-describedby'?: string } {
    return message ? { 'aria-invalid': true, 'aria-describedby': id } : {};
  }

  const errors = {
    name: fieldError('name'),
    method: fieldError('method'),
    dose: fieldError('dose'),
    yield: fieldError('yield'),
    ratio: fieldError('ratio'),
    time: fieldError('time'),
    temp: fieldError('temp'),
    stages: fieldError('stages'),
    payload: fieldError('payload'),
  };
  const errId = (key: string): string => `${idBase}-${key}-error`;

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
    if (atStageLimit) return;
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
    if (problems.length > 0) return;
    onSave({
      name: savedName,
      method,
      dose,
      ratio,
      yield: yieldG,
      temp,
      time: timeS,
      stages: savedStages,
      lastUsedAt: undefined,
    });
  }

  return (
    <div className={`col col-gap-20 ${s.form}`}>
      <Field label={t('recipes.form.name')}>
        <Input
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={e => setName(e.target.value)}
          placeholder={t('recipes.form.namePlaceholder')}
          {...errorProps(errors.name, errId('name'))}
        />
        {errors.name && <p id={errId('name')} className={s.fieldError}>{errors.name}</p>}
      </Field>

      <Field label={t('recipes.form.method')}>
        <div className="row row-wrap row-gap-8" style={{ gap: 8 }}>
          {METHODS.map(m => (
            <Tag key={m.id} active={method === m.id} onClick={() => pickMethod(m.id)}>
              {t(`methods.${m.id}`)}
            </Tag>
          ))}
        </div>
        {errors.method && <p className={s.fieldError}>{errors.method}</p>}
      </Field>

      <div className="grid grid-2">
        <Field label={t('recipes.form.dose')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>g</span>}>
          <Input
            type="number"
            inputMode="decimal"
            min={SHARE_LIMITS.dose[0]}
            max={SHARE_LIMITS.dose[1]}
            step={0.1}
            value={numValue(dose)}
            onChange={e => setDose(readNumber(e.target.value))}
            {...errorProps(errors.dose, errId('dose'))}
          />
          {errors.dose && <p id={errId('dose')} className={s.fieldError}>{errors.dose}</p>}
        </Field>
        <Field label={t('recipes.form.yield')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>{t('recipes.form.yieldAuto')}</span>}>
          <div className="input-underline" style={{ color: 'var(--accent)', padding: '10px 0' }} aria-invalid={errors.yield ? true : undefined}>{numValue(yieldG)}</div>
          {errors.yield && <p className={s.fieldError}>{errors.yield}</p>}
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
        {errors.ratio && <p className={s.fieldError}>{errors.ratio}</p>}
      </Field>

      <div className="grid grid-2">
        <Field label={t('recipes.form.brewTime')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>m:ss</span>}>
          <Input
            value={fmtTime(timeS)}
            onChange={e => {
              const parsed = parseTime(e.target.value);
              if (parsed != null) setTimeS(parsed);
            }}
            {...errorProps(errors.time, errId('time'))}
          />
          {errors.time && <p id={errId('time')} className={s.fieldError}>{errors.time}</p>}
        </Field>
        <Field label={t('recipes.form.temperature')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>°C</span>}>
          <Input
            type="number"
            inputMode="decimal"
            min={SHARE_LIMITS.temp[0]}
            max={SHARE_LIMITS.temp[1]}
            step={0.5}
            value={numValue(temp)}
            onChange={e => setTemp(readNumber(e.target.value))}
            {...errorProps(errors.temp, errId('temp'))}
          />
          {errors.temp && <p id={errId('temp')} className={s.fieldError}>{errors.temp}</p>}
        </Field>
      </div>

      {!isEspresso && (
        <Field label={t('recipes.form.pourSchedule')} hint={t('recipes.form.pourScheduleHint')}>
          <div className="col col-gap-12" style={{ marginTop: 4 }}>
            {stages.map((st, i) => {
              const message = stageError(i);
              const problem = problems.find(p => p.stage === i)?.field;
              const id = errId(`stage-${i}`);
              return (
                <Fragment key={st.id}>
                  <div className="stage-edit-row">
                    <span className="sn">{i + 1}</span>
                    <input
                      className="stage-mini-input"
                      style={{ textAlign: 'left' }}
                      value={st.label}
                      maxLength={MAX_LABEL_LENGTH}
                      onChange={e => updateStage(st.id, { label: e.target.value })}
                      placeholder={t('recipes.form.labelPlaceholder')}
                      {...errorProps(problem === 'stageLabel' ? message : null, id)}
                    />
                    <input
                      className="stage-mini-input"
                      value={fmtTime(st.timeS)}
                      onChange={e => {
                        const parsed = parseTime(e.target.value);
                        if (parsed != null) updateStage(st.id, { timeS: parsed });
                      }}
                      placeholder="0:00"
                      {...errorProps(problem === 'stageTime' ? message : null, id)}
                    />
                    <input
                      className="stage-mini-input"
                      type="number"
                      inputMode="decimal"
                      min={SHARE_LIMITS.stageWeight[0]}
                      max={SHARE_LIMITS.stageWeight[1]}
                      value={numValue(st.weightG)}
                      onChange={e => updateStage(st.id, { weightG: readNumber(e.target.value) })}
                      placeholder="g"
                      {...errorProps(problem === 'stageWeight' ? message : null, id)}
                    />
                    <button className="icon-btn" onClick={() => removeStage(st.id)} aria-label={t('common.removePour')}>
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                  {message && <p id={id} className={`${s.fieldError} ${s.stageError}`}>{message}</p>}
                </Fragment>
              );
            })}
            {errors.stages && <p className={s.fieldError}>{errors.stages}</p>}
            <div className={s.addPourRow}>
              <button
                className="sidebar-link"
                style={{ color: 'var(--accent)', padding: '6px 0', width: 'auto' }}
                onClick={addStage}
                disabled={atStageLimit}
              >
                <Icon name="plus" size={15} /> {t('recipes.form.addPour')}
              </button>
              {atStageLimit && <span className={s.limitNote}>{t('recipes.form.maxPours', { max: MAX_STAGES })}</span>}
            </div>
          </div>
        </Field>
      )}

      <div className={s.saveBlock}>
        {errors.payload && <p className={s.fieldError} role="alert">{errors.payload}</p>}
        {problems.length > 0 && !errors.payload && <p className={s.fieldError} role="status">{t('recipes.form.errors.summary')}</p>}
        <Button full size="lg" onClick={handleSave} disabled={problems.length > 0}>{t('recipes.form.save')}</Button>
      </div>
    </div>
  );
}
