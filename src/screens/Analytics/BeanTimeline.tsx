import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Stars } from '../../components/UI';
import { beanTimeline, timelineBeanIds, type TimelinePoint } from '../../utils/analytics';
import { fmtDate, fmtTime } from '../../utils/formatters';
import type { Bean, Extraction } from '../../db/types';
import s from './styles.module.css';

export interface BeanTimelineProps {
  extractions: readonly Extraction[];
  beans: readonly Bean[];
}

// Printed axis figures: graphite tertiary, the sheet's own face.
const TICK = { fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--text-tertiary)' };
const MARGIN = { top: 4, right: 12, bottom: 0, left: 0 };
const Y_WIDTH = 44;
// Time and grind are both logged values, so both lines are ink. A surface ring separates the dots.
const DOT = { r: 4, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 };
const ACTIVE_DOT = { r: 6, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 };
const CURSOR = { stroke: 'var(--text-tertiary)', strokeDasharray: '2 3' };
// Fine grinders step in tenths (2.3, 2.4); keep ticks at 2 decimals at most.
const fmtGrindTick = (v: number): string => String(Number(v.toFixed(2)));

function isTimelinePoint(v: unknown): v is TimelinePoint {
  return typeof v === 'object' && v !== null && 'n' in v && 'timeS' in v && 'createdAt' in v;
}

function TimelineTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  const { t } = useTranslation();
  const p: unknown = payload?.[0]?.payload;
  if (!active || !isTimelinePoint(p)) return null;
  return (
    <div className={s.tip}>
      <div className={`t-upper ${s.tipHead}`}>{t('analytics.timeline.brew', { n: p.n })} · {fmtDate(p.createdAt)}</div>
      <div className={s.tipRow}>
        <span className={s.tipKey}>{t('analytics.timeline.time')}</span>
        <span className={s.tipLogged}>{fmtTime(p.timeS)}</span>
      </div>
      {p.grind !== null && (
        <div className={s.tipRow}>
          <span className={s.tipKey}>{t('analytics.timeline.grind')}</span>
          <span className={s.tipLogged}>{p.grind}</span>
        </div>
      )}
      {p.rating > 0 && (
        <div className={s.tipRow}>
          <span className={s.tipKey}>{t('extraction.fields.rating')}</span>
          <Stars value={p.rating} size={9} />
        </div>
      )}
    </div>
  );
}

// Time and grind have different units, so each gets its own small chart on a shared brew axis
// (no dual y axis). syncId links the two tooltips.
export function BeanTimeline({ extractions, beans }: BeanTimelineProps) {
  const { t } = useTranslation();
  const syncId = useId();
  const selectId = useId();
  const beanIds = timelineBeanIds(extractions);
  const [picked, setPicked] = useState<number | null>(null);
  const beanId = picked !== null && beanIds.includes(picked) ? picked : beanIds[0];

  if (beanId === undefined) return <p className={s.emptyCell}>{t('analytics.timeline.empty')}</p>;

  const points = [...beanTimeline(extractions, beanId)];
  const hasGrind = points.some(p => p.grind !== null);
  const xAxis = (showTicks: boolean) => (
    <XAxis dataKey="n" tick={showTicks ? TICK : false} tickLine={false} stroke="var(--rule-strong)"
      height={showTicks ? 24 : 1} allowDecimals={false} />
  );

  return (
    <div>
      <div className={`field ${s.beanField}`}>
        <label htmlFor={selectId} className="field-label">{t('analytics.timeline.beanLabel')}</label>
        <select id={selectId} className={`input-underline ${s.beanSelect}`} value={beanId} onChange={e => setPicked(Number(e.target.value))}>
          {beanIds.map(id => (
            <option key={id} value={id}>{beans.find(b => b.id === id)?.name ?? t('common.unknown')}</option>
          ))}
        </select>
      </div>
      <div className={`grid-paper ${s.plotBox}`}>
        <span className={`t-upper ${s.plotLabel}`}>{t('analytics.timeline.time')}</span>
        <ResponsiveContainer width="100%" height={hasGrind ? 150 : 200}>
          <LineChart data={points} syncId={syncId} margin={MARGIN}>
            {xAxis(!hasGrind)}
            {/* Whole seconds only: a 27.5 s tick would print as "00:27.5". */}
            <YAxis tick={TICK} tickLine={false} axisLine={false} width={Y_WIDTH} domain={['auto', 'auto']}
              allowDecimals={false} tickFormatter={(v: number) => fmtTime(Math.round(v))} />
            <Tooltip content={TimelineTooltip} cursor={CURSOR} isAnimationActive={false} />
            <Line dataKey="timeS" stroke="var(--accent)" strokeWidth={2}
              dot={DOT} activeDot={ACTIVE_DOT} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {!hasGrind && <span className={`t-upper ${s.axisCaption}`}>{t('analytics.timeline.brewAxis')}</span>}
      </div>
      {hasGrind && (
        <div className={`grid-paper ${s.plotBox}`}>
          <span className={`t-upper ${s.plotLabel}`}>{t('analytics.timeline.grind')}</span>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={points} syncId={syncId} margin={MARGIN}>
              {xAxis(true)}
              <YAxis tick={TICK} tickLine={false} axisLine={false} width={Y_WIDTH} domain={['auto', 'auto']}
                tickFormatter={fmtGrindTick} />
              {/* The time chart above shows the shared tooltip; this one only tracks the pointer. */}
              <Tooltip content={() => null} cursor={CURSOR} />
              <Line dataKey="grind" stroke="var(--accent)" strokeWidth={2}
                dot={DOT} activeDot={ACTIVE_DOT} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <span className={`t-upper ${s.axisCaption}`}>{t('analytics.timeline.brewAxis')}</span>
        </div>
      )}
    </div>
  );
}
