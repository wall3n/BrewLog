import { useTranslation } from 'react-i18next';
import { ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
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
// Printed axis figures: graphite tertiary, the sheet's own face.
const TICK = { fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--text-tertiary)' };
// Visible dot radius, and the larger invisible radius that takes the tap.
const DOT_R = 5;
const HIT_R = 14;

function isControlPoint(v: unknown): v is ControlPoint {
  return typeof v === 'object' && v !== null && 'ey' in v && 'tds' in v && 'id' in v;
}

interface DotProps { cx?: number; cy?: number; payload?: unknown }

// Each dot is a logged brew, so it is ink. Inside the ideal zone it is filled; outside it is hollow,
// so the zone still reads without color.
function Dot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  const ideal = isControlPoint(payload) && payload.zone === 'ideal';
  return (
    <g className={s.clickable}>
      <circle cx={cx} cy={cy} r={HIT_R} fill="transparent" />
      {/* A 2 px surface ring keeps overlapping dots apart. */}
      <circle cx={cx} cy={cy} r={DOT_R + 2} fill="var(--bg-surface)" />
      <circle
        cx={cx} cy={cy} r={ideal ? DOT_R : DOT_R - 1}
        fill={ideal ? 'var(--accent)' : 'var(--bg-surface)'}
        stroke="var(--accent)" strokeWidth={ideal ? 0 : 2}
      />
    </g>
  );
}

export function ControlChart({ points, onSelect }: ControlChartProps) {
  const { t, i18n } = useTranslation();
  if (points.length === 0) return <p className={s.emptyCell}>{t('analytics.controlChart.empty')}</p>;

  const locale = i18n.language || 'en';
  const fmt1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt2 = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // An outlier (for example TDS 5 %) stretches the axes; round the ticks so they stay short.
  const fmtEyTick = (v: number): string => fmtInt.format(v);
  const fmtTdsTick = (v: number): string => fmt1.format(Math.round(v * 10) / 10);
  const idealCount = points.filter(p => p.zone === 'ideal').length;

  return (
    <div>
      <p className={s.summaryLine}>
        {t('analytics.controlChart.summary', { count: points.length, ideal: idealCount })}
      </p>
      <div className={`grid-paper ${s.plotBox}`}>
        <span className={`t-upper ${s.plotLabel}`}>{t('analytics.controlChart.tdsAxis')}</span>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <ReferenceArea
              x1={IDEAL.ey[0]} x2={IDEAL.ey[1]} y1={IDEAL.tds[0]} y2={IDEAL.tds[1]}
              fill="var(--success-bg)" fillOpacity={1} stroke="var(--success)" strokeWidth={1}
              label={{ value: t('analytics.zones.ideal'), position: 'insideBottomRight', fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }}
            />
            <XAxis type="number" dataKey="ey" domain={EY_DOMAIN} tickFormatter={fmtEyTick} tick={TICK}
              stroke="var(--rule-strong)" tickLine={false} height={24} />
            <YAxis type="number" dataKey="tds" domain={TDS_DOMAIN} tickFormatter={fmtTdsTick} tick={TICK}
              axisLine={false} tickLine={false} width={40} />
            <Tooltip
              cursor={false}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const point: unknown = payload?.[0]?.payload;
                if (!active || !isControlPoint(point)) return null;
                return (
                  <div className={s.tip}>
                    <div className={`t-upper ${s.tipHead}`}>{fmtDate(point.createdAt)}</div>
                    <div className={s.tipRow}>
                      <span className={s.tipKey}>{t('extraction.fields.tds')}</span>
                      <span className={s.tipLogged}>{fmt2.format(point.tds)}%</span>
                    </div>
                    <div className={s.tipRow}>
                      <span className={s.tipKey}>{t('extraction.steps.parameters.eyLabel')}</span>
                      <span className={s.tipComputed}>{fmt1.format(point.ey)}%</span>
                    </div>
                    <div className={s.tipRow}>
                      <span className={s.tipZone}>{t(`analytics.zones.${point.zone}`)}</span>
                    </div>
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
        <span className={`t-upper ${s.axisCaption}`}>{t('analytics.controlChart.eyAxis')}</span>
      </div>
      <p className={s.plotNote}>{t('analytics.controlChart.note')} {t('analytics.controlChart.hint')}</p>
    </div>
  );
}
