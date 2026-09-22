import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Icon } from '../../components/Icons';
import { beanTimeline, timelineBeanIds, type TimelinePoint } from '../../utils/analytics';
import { fmtDate, fmtTime } from '../../utils/formatters';
import type { Bean, Extraction } from '../../db/types';
import s from './styles.module.css';

export interface BeanTimelineProps {
  extractions: readonly Extraction[];
  beans: readonly Bean[];
}

const TICK = { fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--text-tertiary)' };
const MARGIN = { top: 8, right: 12, bottom: 0, left: 0 };
const Y_WIDTH = 44;
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
    <div className={s.tooltip}>
      <div className="t-upper">{t('analytics.timeline.brew', { n: p.n })} · {fmtDate(p.createdAt)}</div>
      <div className="t-mono">{t('analytics.timeline.time')}: {fmtTime(p.timeS)}</div>
      {p.grind !== null && <div className="t-mono">{t('analytics.timeline.grind')}: {p.grind}</div>}
      {p.rating > 0 && (
        <div className={`t-mono row ${s.tooltipRating}`}>
          <Icon name="starFill" size={12} /> {p.rating}/5
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

  if (beanId === undefined) return <div className={`t-sec ${s.noData}`}>{t('analytics.timeline.empty')}</div>;

  const points = [...beanTimeline(extractions, beanId)];
  const hasGrind = points.some(p => p.grind !== null);
  const xAxis = (showTicks: boolean) => (
    <XAxis dataKey="n" tick={showTicks ? TICK : false} tickLine={false} stroke="var(--border)"
      height={showTicks ? 24 : 1} allowDecimals={false} />
  );

  return (
    <div className="col col-gap-12">
      <label htmlFor={selectId} className={s.srOnly}>{t('analytics.timeline.beanLabel')}</label>
      <select id={selectId} className={`input-underline ${s.beanSelect}`} value={beanId} onChange={e => setPicked(Number(e.target.value))}>
        {beanIds.map(id => (
          <option key={id} value={id}>{beans.find(b => b.id === id)?.name ?? t('common.unknown')}</option>
        ))}
      </select>
      <div className={s.plotBox}>
        <div className={`${s.seriesLabel} ${s.legendTime}`}>{t('analytics.timeline.time')}</div>
        <ResponsiveContainer width="100%" height={hasGrind ? 150 : 200}>
          <LineChart data={points} syncId={syncId} margin={MARGIN}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            {xAxis(!hasGrind)}
            {/* Whole seconds only: a 27.5 s tick would print as "00:27.5". */}
            <YAxis tick={TICK} tickLine={false} stroke="var(--border)" width={Y_WIDTH} domain={['auto', 'auto']}
              allowDecimals={false} tickFormatter={(v: number) => fmtTime(Math.round(v))} />
            <Tooltip content={TimelineTooltip} cursor={{ stroke: 'var(--border)' }} />
            <Line dataKey="timeS" stroke="var(--accent)" strokeWidth={2}
              dot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {hasGrind && (
          <>
            <div className={`${s.seriesLabel} ${s.seriesLabelGap} ${s.legendGrind}`}>{t('analytics.timeline.grind')}</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={points} syncId={syncId} margin={MARGIN}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                {xAxis(true)}
                <YAxis tick={TICK} tickLine={false} stroke="var(--border)" width={Y_WIDTH} domain={['auto', 'auto']}
                  tickFormatter={fmtGrindTick} />
                {/* The time chart above shows the shared tooltip; this one only tracks the pointer. */}
                <Tooltip content={() => null} cursor={{ stroke: 'var(--border)' }} />
                <Line dataKey="grind" stroke="var(--text-secondary)" strokeWidth={2} strokeDasharray="4 3"
                  dot={{ r: 4, fill: 'var(--text-secondary)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: 'var(--text-secondary)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
        <div className={`t-ter ${s.axisCaption}`}>{t('analytics.timeline.brewAxis')}</div>
      </div>
    </div>
  );
}
