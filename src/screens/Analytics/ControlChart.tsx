import { useTranslation } from 'react-i18next';
import {
  CartesianGrid, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ControlPoint } from '../../utils/analytics';
import { CHART_BOX, IDEAL_EY, IDEAL_TDS, RATIO_LINES_G_PER_L, ratioSegment, type ControlZone } from '../../utils/scaChart';
import { fmtDate } from '../../utils/formatters';
import s from './styles.module.css';

export interface ControlChartProps {
  points: readonly ControlPoint[];
  onSelect: (id: number) => void;
}

// The classic SCA Coffee Brewing Control Chart, printed as a form on the lab sheet:
// zones, bands and ratio lines are graphite print, and each logged brew is an ink dot.

const EY_TICKS = Array.from({ length: CHART_BOX.ey[1] - CHART_BOX.ey[0] + 1 }, (_, i) => CHART_BOX.ey[0] + i);
const TDS_TICKS = Array.from({ length: 9 }, (_, i) => Math.round((CHART_BOX.tds[0] + i * 0.1) * 100) / 100);
const EY_EDGES = [CHART_BOX.ey[0], IDEAL_EY[0], IDEAL_EY[1], CHART_BOX.ey[1]] as const;
const TDS_EDGES = [CHART_BOX.tds[1], IDEAL_TDS[1], IDEAL_TDS[0], CHART_BOX.tds[0]] as const;
// Rows top to bottom, columns left to right, as on the printed chart.
const ZONES: readonly (readonly ControlZone[])[] = [
  ['strongUnder', 'strong', 'strongBitter'],
  ['under', 'ideal', 'bitter'],
  ['weakUnder', 'weak', 'weakBitter'],
];
const RATIO_LINES = RATIO_LINES_G_PER_L.flatMap(g => {
  const seg = ratioSegment(g, CHART_BOX);
  return seg ? [{ g, seg }] : [];
});

// Printed axis figures: graphite tertiary, the sheet's own face.
const TICK = { fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--text-tertiary)' };
// Visible dot radius, and the larger invisible radius that takes the tap.
const DOT_R = 5;
const HIT_R = 14;

type Edge = 'up' | 'down' | 'left' | 'right';
interface PlotPoint extends ControlPoint { px: number; py: number; off: Edge | null; }

// An off-chart brew sits just inside the edge, so the plot clip does not cut its arrowhead.
const EDGE_INSET = { ey: 0.3, tds: 0.008 };
const clamp = (v: number, [lo, hi]: readonly [number, number], inset: number): number =>
  Math.min(hi - inset, Math.max(lo + inset, v));

function toPlotPoint(p: ControlPoint): PlotPoint {
  let off: Edge | null = null;
  if (p.tds > CHART_BOX.tds[1]) off = 'up';
  else if (p.tds < CHART_BOX.tds[0]) off = 'down';
  else if (p.ey > CHART_BOX.ey[1]) off = 'right';
  else if (p.ey < CHART_BOX.ey[0]) off = 'left';
  if (!off) return { ...p, px: p.ey, py: p.tds, off };
  return { ...p, px: clamp(p.ey, CHART_BOX.ey, EDGE_INSET.ey), py: clamp(p.tds, CHART_BOX.tds, EDGE_INSET.tds), off };
}

function isPlotPoint(v: unknown): v is PlotPoint {
  return typeof v === 'object' && v !== null && 'ey' in v && 'tds' in v && 'id' in v && 'off' in v;
}

interface LabelBox { x?: number; y?: number; width?: number; height?: number }

interface ZoneLabelProps { viewBox?: LabelBox; text: string; ideal: boolean }

// A zone name centred on the middle of its zone. The paper-coloured stroke behind the letters keeps
// the name readable where a ratio line crosses it.
function ZoneLabel({ viewBox, text, ideal }: ZoneLabelProps) {
  const { x = 0, y = 0, width = 0, height = 0 } = viewBox ?? {};
  const lines = text.split('\n');
  const lineH = 12;
  const top = y + height / 2 - ((lines.length - 1) * lineH) / 2;
  return (
    <text x={x + width / 2} y={top} textAnchor="middle" dominantBaseline="central" className={ideal ? s.zoneIdeal : s.zoneName}>
      {lines.map((line, i) => <tspan key={i} x={x + width / 2} dy={i === 0 ? 0 : lineH}>{line}</tspan>)}
    </text>
  );
}

interface RatioLabelProps { viewBox?: LabelBox; text: string; atTop: boolean }

// The g/L figure at the end of a ratio line: above it on the top edge, beside it on the right edge.
function RatioLabel({ viewBox, text, atTop }: RatioLabelProps) {
  const { x = 0, y = 0 } = viewBox ?? {};
  return atTop
    ? <text x={x} y={y - 6} textAnchor="middle" className={s.ratioFigure}>{text}</text>
    : <text x={x + 5} y={y} dominantBaseline="central" className={s.ratioFigure}>{text}</text>;
}

interface DotProps { cx?: number; cy?: number; payload?: unknown }

const EDGE_ROTATION: Record<Edge, number> = { up: 0, right: 90, down: 180, left: 270 };

// Each dot is a logged brew, so it is ink. Inside the ideal zone it is filled; outside it is hollow,
// so the zone still reads without color. A brew off the chart sits on the edge as an arrowhead
// that points to where it really is.
function Dot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !isPlotPoint(payload)) return null;
  if (payload.off) {
    return (
      <g className={s.clickable}>
        <circle cx={cx} cy={cy} r={HIT_R} fill="transparent" />
        <path
          d="M 0 -6 L 5.5 4 L -5.5 4 Z"
          transform={`translate(${cx} ${cy}) rotate(${EDGE_ROTATION[payload.off]})`}
          fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round"
        />
      </g>
    );
  }
  const ideal = payload.zone === 'ideal';
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
  const plotted = points.map(toPlotPoint);
  const idealCount = points.filter(p => p.zone === 'ideal').length;
  const offCount = plotted.filter(p => p.off).length;

  return (
    <div>
      <p className={s.summaryLine}>
        {t('analytics.controlChart.summary', { count: points.length, ideal: idealCount })}
      </p>
      <div className={`${s.plotBox} ${s.scaBox}`} role="group" aria-label={t('analytics.controlChart.figure', { count: points.length })}>
        <span className={`t-upper ${s.plotLabel}`}>{t('analytics.controlChart.tdsAxis')}</span>
        <div className={s.scaPlot}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeWidth={1} />

              {/* The ideal extraction band and the ideal strength band; the ideal box is where they cross. */}
              <ReferenceArea x1={IDEAL_EY[0]} x2={IDEAL_EY[1]} fill="var(--text-primary)" fillOpacity={0.05} strokeWidth={0} />
              <ReferenceArea y1={IDEAL_TDS[0]} y2={IDEAL_TDS[1]} fill="var(--text-primary)" fillOpacity={0.05} strokeWidth={0} />
              <ReferenceArea
                x1={IDEAL_EY[0]} x2={IDEAL_EY[1]} y1={IDEAL_TDS[0]} y2={IDEAL_TDS[1]}
                fillOpacity={0} stroke="var(--rule-strong)" strokeWidth={1.5}
              />

              {RATIO_LINES.map(({ g, seg }) => (
                <ReferenceLine
                  key={g}
                  segment={[{ x: seg[0].ey, y: seg[0].tds }, { x: seg[1].ey, y: seg[1].tds }]}
                  stroke="var(--text-tertiary)" strokeWidth={1.25} ifOverflow="visible"
                />
              ))}

              {/* Zone names hang on zero-size reference dots, which recharts draws above the ratio lines. */}
              {ZONES.flatMap((row, r) => row.map((zone, c) => (
                <ReferenceDot
                  key={zone}
                  x={(EY_EDGES[c] + EY_EDGES[c + 1]) / 2} y={(TDS_EDGES[r] + TDS_EDGES[r + 1]) / 2}
                  r={0} ifOverflow="visible"
                  label={<ZoneLabel text={t(`analytics.zones.${zone}`)} ideal={zone === 'ideal'} />}
                />
              )))}

              {RATIO_LINES.map(({ g, seg }) => (
                <ReferenceDot
                  key={`label-${g}`}
                  x={seg[1].ey} y={seg[1].tds} r={0} ifOverflow="visible"
                  label={<RatioLabel text={t('analytics.controlChart.ratioLine', { g })} atTop={seg[1].tds === CHART_BOX.tds[1]} />}
                />
              ))}

              <XAxis type="number" dataKey="px" domain={[...CHART_BOX.ey]} ticks={EY_TICKS} tickFormatter={(v: number) => fmtInt.format(v)}
                tick={TICK} stroke="var(--rule-strong)" tickLine={false} height={24} allowDataOverflow />
              <YAxis type="number" dataKey="py" domain={[...CHART_BOX.tds]} ticks={TDS_TICKS} tickFormatter={(v: number) => fmt2.format(v)}
                tick={TICK} axisLine={false} tickLine={false} width={40} allowDataOverflow />
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const point: unknown = payload?.[0]?.payload;
                  if (!active || !isPlotPoint(point)) return null;
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
                        <span className={s.tipZone}>{t(`analytics.zones.${point.zone}`).replace('\n', ' ')}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={plotted}
                shape={Dot}
                isAnimationActive={false}
                onClick={(item: { payload?: unknown }) => { if (isPlotPoint(item.payload)) onSelect(item.payload.id); }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <span className={`t-upper ${s.axisCaption}`}>{t('analytics.controlChart.eyAxis')}</span>
      </div>
      <p className={s.ratioKey}>
        <span className={s.ratioSwatch} aria-hidden="true" />
        {t('analytics.controlChart.ratioAxis')}
      </p>
      <p className={s.plotNote}>
        {t('analytics.controlChart.note')} {offCount > 0 && `${t('analytics.controlChart.offChart', { count: offCount })} `}
        {t('analytics.controlChart.hint')}
      </p>
    </div>
  );
}
