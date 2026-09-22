import { useTranslation } from 'react-i18next';
import { CartesianGrid, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { ControlPoint } from '../../utils/analytics';
import { fmtDate } from '../../utils/formatters';
import s from './styles.module.css';

export interface ControlChartProps {
  points: readonly ControlPoint[];
  onSelect: (id: number) => void;
}

const EY_DOMAIN: [number, number] = [14, 26];
const TDS_DOMAIN: [number, number] = [0.9, 1.7];
const IDEAL = { ey: [18, 22], tds: [1.15, 1.35] } as const;
const TICK = { fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--text-tertiary)' };
const AXIS_LABEL = { fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--text-secondary)' };
// Visible dot radius, and the larger invisible radius that takes the tap.
const DOT_R = 5;

// An outlier (for example TDS 5 %) stretches the axes; round the ticks so they stay short.
const fmtEyTick = (v: number): string => `${Math.round(v)}%`;
const fmtTdsTick = (v: number): string => `${Math.round(v * 10) / 10}%`;
const HIT_R = 14;

function isControlPoint(v: unknown): v is ControlPoint {
  return typeof v === 'object' && v !== null && 'ey' in v && 'tds' in v && 'id' in v;
}

interface DotProps { cx?: number; cy?: number; payload?: unknown }

function Dot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  const ideal = isControlPoint(payload) && payload.zone === 'ideal';
  return (
    <g className={s.clickable}>
      <circle cx={cx} cy={cy} r={HIT_R} fill="transparent" />
      {/* A 2 px surface ring keeps overlapping dots apart. Dots outside the ideal zone are hollow. */}
      <circle
        cx={cx} cy={cy} r={DOT_R}
        fill={ideal ? 'var(--accent)' : 'var(--bg-surface)'}
        stroke="var(--accent)" strokeWidth={ideal ? 0 : 2}
      />
      {ideal && <circle cx={cx} cy={cy} r={DOT_R + 1} fill="none" stroke="var(--bg-surface)" strokeWidth={2} />}
    </g>
  );
}

export function ControlChart({ points, onSelect }: ControlChartProps) {
  const { t } = useTranslation();
  if (points.length === 0) return <div className={`t-sec ${s.noData}`}>{t('analytics.controlChart.empty')}</div>;
  const idealCount = points.filter(p => p.zone === 'ideal').length;
  return (
    <div className={s.plotBox}>
      <p className={`t-mono ${s.chartSummary}`}>
        {t('analytics.controlChart.summary', { count: points.length, ideal: idealCount })}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <ReferenceArea
            x1={IDEAL.ey[0]} x2={IDEAL.ey[1]} y1={IDEAL.tds[0]} y2={IDEAL.tds[1]}
            fill="var(--accent)" fillOpacity={0.12} stroke="var(--accent-dim)" strokeDasharray="3 3"
          />
          <XAxis type="number" dataKey="ey" domain={EY_DOMAIN} tickFormatter={fmtEyTick} tick={TICK} stroke="var(--border)" tickLine={false}
            label={{ value: t('analytics.controlChart.eyAxis'), position: 'insideBottom', offset: -8, ...AXIS_LABEL }} />
          <YAxis type="number" dataKey="tds" domain={TDS_DOMAIN} tickFormatter={fmtTdsTick} tick={TICK} stroke="var(--border)" tickLine={false} width={52}
            label={{ value: t('analytics.controlChart.tdsAxis'), angle: -90, position: 'insideLeft', offset: 4, ...AXIS_LABEL }} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const point: unknown = payload?.[0]?.payload;
              if (!active || !isControlPoint(point)) return null;
              return (
                <div className={s.tooltip}>
                  <div className="t-upper">{fmtDate(point.createdAt)} · {t(`analytics.zones.${point.zone}`)}</div>
                  <div className="t-mono">{t('analytics.controlChart.tooltip', { ey: point.ey, tds: point.tds })}</div>
                </div>
              );
            }}
          />
          <Scatter
            data={[...points]}
            shape={Dot}
            isAnimationActive={false}
            onClick={(item: { payload?: unknown }) => { if (isControlPoint(item.payload)) onSelect(item.payload.id); }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className={`t-ter ${s.chartNote}`}>{t('analytics.controlChart.note')} {t('analytics.controlChart.hint')}</p>
    </div>
  );
}
