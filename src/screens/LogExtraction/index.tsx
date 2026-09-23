import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, Stepper, GrindField, RoastDot, DaysOffRoast, Tag } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { METHODS, methodById, getTargets } from '../../utils/methodDefaults';
import { fmtTime } from '../../utils/formatters';
import { sampleNo, previousShot } from '../../utils/shots';
import { initialRecipeChoice, recipePatchOnChoose, recipePatchOnGuidedDone, recipeIdToSave } from '../../utils/brewStages';
import type { Bean, Equipment, Extraction, Recipe } from '../../db/types';
import { BeanPicker } from './sections/BeanPicker';
import { TimerBlock } from './sections/TimerBlock';
import { ExtractionAssist } from './sections/ExtractionAssist';
import { TastingBlock } from './sections/TastingBlock';
import s from './styles.module.css';

export interface ShotDraft {
  id?: number;
  isEditing?: boolean;
  createdAt?: string;
  method: string;
  beanId: number | null;
  recipeId: number | null;       // linked on save; see RecipeDraft in utils/brewStages
  recipeChoice?: number | null;  // chip the user picked; undefined = not chosen yet
  equipmentIds: number[];
  grindSetting: string;
  dose: number;
  yield: number;
  ratio: number;
  timeS: number;
  temp: number;
  pressure: number;
  tds: number | null;
  showTds: boolean;
  flag: 'dialled' | 'adjust' | 'fail' | null;
  rating: number;
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  balance: number;
  flavours: string[];
  notes: string;
}

export type UpdateDraft = (patch: Partial<ShotDraft>) => void;

const round = (v: number, d: number): number => Math.round(v * 10 ** d) / 10 ** d;
const isPressureMethod = (m: string): boolean => m === 'espresso' || m === 'moka-pot';

function SheetSection({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <div className="section-label">
        <span className="t-upper">{label}</span>
        {aside && <span className={s.sectionAside}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function LogExtractionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as (Partial<Extraction> & { isEditing?: boolean }) | null;
  const { state } = useApp();
  const db = useDb();
  const { t } = useTranslation();

  const [draft, setDraft] = useState<ShotDraft>(() => {
    const method = prefill?.method ?? state.settings?.defaultMethod ?? 'espresso';
    const dose = prefill?.dose ?? (isPressureMethod(method) ? 18 : 20);
    const ratio = prefill?.ratio ?? methodById(method).defaultRatio;
    return {
      id: prefill?.id,
      isEditing: prefill?.isEditing,
      createdAt: prefill?.createdAt,
      method,
      beanId: prefill?.beanId ?? state.activeBeans.find(b => b.status === 'active')?.id ?? null,
      recipeId: prefill?.recipeId ?? null,
      equipmentIds: prefill?.equipmentIds ?? [],
      grindSetting: prefill?.grindSetting ?? '',
      dose,
      yield: prefill?.yield ?? round(dose * ratio, 1),
      ratio,
      timeS: prefill?.timeS ?? (isPressureMethod(method) ? 28 : 210),
      temp: prefill?.temp ?? 93,
      pressure: prefill?.pressure ?? 9,
      tds: prefill?.tds ?? null,
      showTds: !!prefill?.tds,
      flag: prefill?.flag ?? null,
      rating: prefill?.rating ?? 0,
      acidity: prefill?.acidity ?? 0,
      sweetness: prefill?.sweetness ?? 0,
      bitterness: prefill?.bitterness ?? 0,
      body: prefill?.body ?? 0,
      balance: prefill?.balance ?? 0,
      flavours: prefill?.flavours ?? [],
      notes: prefill?.notes ?? '',
    };
  });

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [pickingBean, setPickingBean] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBeans = () => db.getAllBeans().then(all => setBeans(all.filter(b => b.status !== 'wishlist')));

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllEquipment(), db.getAllRecipes()])
      .then(([exts, eq, rs]) => { setExtractions(exts); setEquipment(eq); setRecipes(rs); })
      .catch(() => setError(t('sheet.loadError')));
    loadBeans().catch(() => setError(t('sheet.loadError')));
  }, []);

  const update: UpdateDraft = patch => setDraft(d => ({ ...d, ...patch }));

  const setDose = (v: number) => update({ dose: v, yield: round(v * draft.ratio, 1) });
  const setYield = (v: number) => update({ yield: v, ratio: draft.dose > 0 ? round(v / draft.dose, 2) : draft.ratio });
  const setRatio = (v: number) => update({ ratio: v, yield: round(draft.dose * v, 1) });
  const pickMethod = (id: string) => {
    const m = methodById(id);
    update({ method: id, ratio: m.defaultRatio, yield: round(draft.dose * m.defaultRatio, 1) });
  };
  const toggleGear = (id: number) => update({
    equipmentIds: draft.equipmentIds.includes(id)
      ? draft.equipmentIds.filter(x => x !== id)
      : [...draft.equipmentIds, id],
  });

  const prev = previousShot(extractions, draft);
  const bean = beans.find(b => b.id === draft.beanId);
  const targets = getTargets(draft.method);
  const pressureMethod = isPressureMethod(draft.method);
  const recipesForMethod = (recipes ?? []).filter(r => r.method === draft.method);
  // Derived on every render: the default only fills in until the user taps a chip,
  // and a chip tap (draft.recipeChoice) always wins over it.
  const recipeChoice = initialRecipeChoice(recipesForMethod, draft);
  const recipe = recipesForMethod.find(r => r.id === recipeChoice);
  const chooseRecipe = (id: number | null) => update(recipePatchOnChoose(id));
  const finishGuided = (timeS: number, recipeId: number) => update({ timeS, ...recipePatchOnGuidedDone(recipeId) });
  const nextNo = draft.id ?? extractions.reduce((max, e) => Math.max(max, e.id ?? 0), 0) + 1;

  const close = () => {
    if (draft.isEditing) navigate(`/history/${draft.id}`);
    else if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const onSave = async () => {
    if (!draft.beanId || !draft.flag || saving) return;
    setSaving(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showTds, isEditing, id, createdAt, recipeId: _recipeId, recipeChoice: _recipeChoice, ...payload } = draft;
    // Drop a Start brew recipe when the user switched to another method. Before the
    // recipes load there is nothing to compare with, so keep it.
    const recipeId = recipeIdToSave(draft, recipes ? recipesForMethod : undefined);
    const data = {
      ...payload,
      ...(recipeId != null ? { recipeId } : {}),
      flag: draft.flag,
      tds: showTds ? payload.tds : null,
      beanId: draft.beanId,
    };
    try {
      if (isEditing && id) {
        await db.updateExtraction({ ...data, id, createdAt: createdAt!, updatedAt: new Date().toISOString() });
        navigate(`/history/${id}`);
      } else {
        await db.addExtraction(data);
        if (recipeId != null) await db.updateRecipe({ id: recipeId, lastUsedAt: new Date().toISOString() });
        navigate('/');
      }
    } catch {
      setError(t('sheet.saveError'));
      setSaving(false);
    }
  };

  return (
    <div className={s.root}>
      <header className={s.head}>
        <button type="button" className={s.close} onClick={close} aria-label={t('extraction.cancel')}>
          <Icon name="x" size={22} />
        </button>
        <div className={s.headTitle}>
          <h1 className={s.title}>{draft.isEditing ? t('sheet.editShot') : t('sheet.newShot')}</h1>
          <span className="t-upper">{t('sheet.sampleNo', { no: sampleNo(nextNo) })}</span>
        </div>
      </header>

      <SheetSection label={t('sheet.method')}>
        <div className={`scroll-x bleed-x ${s.methods}`} role="radiogroup" aria-label={t('sheet.method')}>
          {METHODS.map(m => (
            <button
              type="button"
              key={m.id}
              role="radio"
              aria-checked={draft.method === m.id}
              className={`${s.methodChip} ${draft.method === m.id ? s.methodActive : ''}`}
              onClick={() => pickMethod(m.id)}
            >
              <Icon name={m.icon} size={22} />
              <span>{t(`methods.${m.id}`, { defaultValue: m.name })}</span>
            </button>
          ))}
        </div>
      </SheetSection>

      <SheetSection label={t('sheet.bean')}>
        <button type="button" className={`${s.beanRow} ${bean ? '' : s.beanEmpty}`} onClick={() => setPickingBean(true)}>
          {bean ? (
            <>
              <RoastDot level={bean.roast} />
              <span className={s.beanMain}>
                <span className={s.beanName}>{bean.name}</span>
                <span className={s.beanSub}>{[bean.roaster, bean.process].filter(Boolean).join(' · ')}</span>
              </span>
              <DaysOffRoast iso={bean.roastedAt} />
            </>
          ) : (
            <span className={s.beanMain}><span className={s.beanName}>{t('sheet.chooseBean')}</span></span>
          )}
          <span className={s.beanChange}>{t('sheet.change')}</span>
        </button>
      </SheetSection>

      <SheetSection label={t('sheet.recipe')} aside={targets.ratio && t('sheet.target', { range: targets.ratio })}>
        <div className={s.params}>
          <Stepper label={t('extraction.fields.dose')} value={draft.dose} onChange={setDose} step={0.1} unit="g" max={2000} previous={prev?.dose} />
          <Stepper label={t('extraction.fields.yield')} value={draft.yield} onChange={setYield} step={pressureMethod ? 0.5 : 5} unit="g" max={5000} previous={prev?.yield} />
          <Stepper label={t('extraction.fields.ratio')} value={draft.ratio} onChange={setRatio} step={pressureMethod ? 0.05 : 0.5} prefix="1:" max={30} decimals={pressureMethod ? 2 : 1} previous={prev?.ratio} size="md" />
          <Stepper label={t('extraction.fields.temperature')} value={draft.temp} onChange={v => update({ temp: v })} step={1} unit="°C" max={100} decimals={0} previous={prev?.temp} hint={targets.temp} size="md" />
          <GrindField value={draft.grindSetting} previous={prev?.grindSetting} onChange={v => update({ grindSetting: v })} />
          {pressureMethod && (
            <Stepper label={t('extraction.fields.pressure')} value={draft.pressure} onChange={v => update({ pressure: v })} step={0.5} unit="bar" max={20} previous={prev?.pressure} hint={targets.pressure} size="md" />
          )}
        </div>
      </SheetSection>

      <SheetSection label={t('sheet.time')} aside={targets.time && t('sheet.target', { range: targets.time })}>
        <TimerBlock
          timeS={draft.timeS}
          previous={prev?.timeS}
          onTime={v => update({ timeS: v })}
          recipes={recipesForMethod}
          recipe={recipe}
          onChooseRecipe={chooseRecipe}
          onGuidedDone={finishGuided}
        />
      </SheetSection>

      {equipment.length > 0 && (
        <SheetSection label={t('sheet.gear')}>
          <div className="row row-wrap row-gap-8">
            {equipment.map(item => (
              <Tag key={item.id} active={draft.equipmentIds.includes(item.id!)} onClick={() => toggleGear(item.id!)}>
                {draft.equipmentIds.includes(item.id!) && <Icon name="check" size={14} />}
                {item.name}
              </Tag>
            ))}
          </div>
        </SheetSection>
      )}

      <SheetSection label={t('sheet.refractometer')}>
        <ExtractionAssist draft={draft} update={update} />
      </SheetSection>

      <TastingBlock draft={draft} update={update} Section={SheetSection} />

      <div className={s.saveBar}>
        <div className={s.saveSummary}>
          <span className="t-ink">{draft.dose.toFixed(1)} → {draft.yield.toFixed(1)} g</span>
          <span className="t-ink">1:{draft.ratio.toFixed(1)}</span>
          <span className="t-ink">{fmtTime(draft.timeS)}</span>
          {!draft.beanId && <span className={s.saveWarn}>{t('sheet.needBean')}</span>}
          {draft.beanId && !draft.flag && <span className={s.saveHint}>{t('sheet.needOutcome')}</span>}
          {error && <span className={s.saveWarn} role="alert">{error}</span>}
        </div>
        <Button size="lg" full onClick={onSave} disabled={!draft.beanId || !draft.flag || saving} leftIcon="check">
          {saving ? t('common.saving') : draft.isEditing ? t('common.save') : t('sheet.save')}
        </Button>
      </div>

      <BeanPicker
        open={pickingBean}
        beans={beans}
        selectedId={draft.beanId}
        onClose={() => setPickingBean(false)}
        onPick={id => { update({ beanId: id }); setPickingBean(false); }}
        onAdded={async id => { await loadBeans(); update({ beanId: id }); setPickingBean(false); }}
      />
    </div>
  );
}
