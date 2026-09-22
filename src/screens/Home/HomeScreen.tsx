import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Stars, MethodBadge, Empty, RoastDot, DaysOffRoast, FlagMark, Button, StockMeter } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { beanStockView, summariseUsage } from '../../utils/beanStock';
import { sampleNo, previousShot, fmtDelta, nextShotFrom } from '../../utils/shots';
import i18n from '../../i18n';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

const TRAIL_LENGTH = 6;

function todayLabel(): string {
  const locale = i18n.language || 'en';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
}

interface ReadingProps { label: string; value: string; unit?: string; delta?: string | null; }

function Reading({ label, value, unit, delta }: ReadingProps) {
  return (
    <div className={s.reading}>
      <span className="t-upper">{label}</span>
      <span className={`ink-in ${s.readingValue}`}>
        {value}
        {unit && <span className={s.readingUnit}>{unit}</span>}
      </span>
      <span className={s.readingDelta}>{delta ?? ' '}</span>
    </div>
  );
}

export function HomeScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useApp();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); setLoaded(true); });
  }, []);

  const last = extractions[0] ?? null;
  const prev = last ? previousShot(extractions, last) : null;
  const lastBean = last ? beans.find(b => b.id === last.beanId) : undefined;
  const nextNo = extractions.reduce((max, e) => Math.max(max, e.id ?? 0), 0) + 1;

  const trail = last
    ? extractions.filter(e => e.beanId === last.beanId && e.method === last.method).slice(0, TRAIL_LENGTH)
    : [];

  const shelf = beans.filter(b => b.status === 'active');
  const usageByBean = summariseUsage(extractions);
  const runningLow = shelf
    .filter(b => b.weightG != null)
    .map(b => ({ bean: b, stock: beanStockView(b, usageByBean.get(b.id!), state.settings.defaultMethod, new Date()) }))
    .filter(x => x.stock.isLow);

  const startNext = () => {
    if (last) navigate('/log', { state: nextShotFrom(last) });
    else navigate('/log');
  };

  if (!loaded) return null;

  return (
    <div className={s.root}>
      <header className="topbar">
        <span className="wordmark">BrewLog</span>
        <span className={`t-upper ${s.sheetMeta}`}>
          {t('sheet.sampleNo', { no: sampleNo(nextNo) })} · {todayLabel()}
        </span>
      </header>

      {last ? (
        <section className={s.readout} aria-label={t('home.lastShot')}>
          <button type="button" className={s.beanLine} onClick={() => navigate(`/history/${last.id}`)}>
            <span className={s.beanName}>{lastBean?.name ?? t('extraction.unknownBean')}</span>
            {lastBean && <span className={s.beanRoaster}>{lastBean.roaster}</span>}
            <Icon name="chevronRight" size={18} className={s.beanChevron} />
          </button>

          <dl className="field-row">
            <div><dt>{t('home.trail.no')}</dt><dd>{sampleNo(last.id)}</dd></div>
            <div><dt>{t('sheet.method')}</dt><dd><MethodBadge method={last.method} /></dd></div>
            <div><dt>{t('home.logged')}</dt><dd>{fmtRelDate(last.createdAt)}</dd></div>
            <div className="field-row-end"><dt className="sr-only">{t('extraction.steps.tasting.outcome')}</dt><dd><FlagMark flag={last.flag} stamp /></dd></div>
          </dl>

          <div className={`grid-paper ${s.readings}`}>
            <Reading label={t('extraction.fields.dose')} value={last.dose.toFixed(1)} unit="g" delta={fmtDelta(last.dose, prev?.dose)} />
            <Reading label={t('extraction.fields.yield')} value={last.yield.toFixed(1)} unit="g" delta={fmtDelta(last.yield, prev?.yield)} />
            <Reading label={t('extraction.fields.ratio')} value={`1:${last.ratio.toFixed(1)}`} delta={fmtDelta(last.ratio, prev?.ratio)} />
            <Reading label={t('extraction.fields.time')} value={fmtTime(last.timeS)} delta={fmtDelta(last.timeS, prev?.timeS, 0)} />
          </div>

          <div className={s.readoutFoot}>
            {last.grindSetting && (
              <span className={s.footItem}>
                <span className="t-upper">{t('extraction.fields.grind')}</span>
                <span className="t-ink">{last.grindSetting}</span>
                {prev?.grindSetting && prev.grindSetting !== last.grindSetting && (
                  <span className={s.metaDim}>{t('home.wasValue', { value: prev.grindSetting })}</span>
                )}
              </span>
            )}
            <span className={s.footItem}>
              <span className="t-upper">{t('extraction.fields.temp')}</span>
              <span className="t-ink">{last.temp}°</span>
            </span>
            <span className={`${s.footItem} ${s.footScore}`}>
              <Stars value={last.rating} size={11} />
            </span>
          </div>
        </section>
      ) : (
        <section className={s.readout}>
          <Empty icon="flask" title={t('home.noExtractions')} body={t('home.noExtractionsBody')} />
        </section>
      )}

      <div className={s.action}>
        <Button full size="lg" leftIcon={last ? 'copy' : 'plus'} onClick={startNext}>
          {last ? t('home.nextShot') : t('home.firstShot')}
        </Button>
        {last && (
          <div className={s.actionFoot}>
            <span className={s.actionHint}>{t('home.nextShotHint', { no: sampleNo(last.id) })}</span>
            <button type="button" className="btn-link" onClick={() => navigate('/log')}>{t('home.blankSheet')}</button>
          </div>
        )}
      </div>

      {trail.length > 0 && (
        <section className={s.block}>
          <div className="section-label">
            <span className="t-upper">{t('home.dialInTrail')}</span>
            <span className={s.blockNote}>{lastBean?.name} · {t(`methods.${last!.method}`)}</span>
          </div>
          <table className={s.trail}>
            <thead>
              <tr>
                <th scope="col">{t('home.trail.no')}</th>
                <th scope="col">{t('extraction.fields.grind')}</th>
                <th scope="col" className={s.num}>{t('home.trail.doseYield')}</th>
                <th scope="col" className={s.num}>{t('extraction.fields.time')}</th>
                <th scope="col" className={s.flagCol}><span className="sr-only">{t('extraction.steps.tasting.outcome')}</span></th>
              </tr>
            </thead>
            <tbody>
              {trail.map(e => (
                <tr key={e.id} onClick={() => navigate(`/history/${e.id}`)} tabIndex={0}
                  onKeyDown={ev => { if (ev.key === 'Enter') navigate(`/history/${e.id}`); }}>
                  <td className={s.no}>{sampleNo(e.id)}</td>
                  <td className="t-ink">{e.grindSetting || '—'}</td>
                  <td className={`t-ink ${s.num}`}>{e.dose.toFixed(1)} → {e.yield.toFixed(1)}</td>
                  <td className={`t-ink ${s.num}`}>{fmtTime(e.timeS)}</td>
                  <td className={s.flagCol}><FlagMark flag={e.flag} iconOnly size={15} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {trail.length === 1 && (
            <p className={s.trailNote}>{t('home.firstSample', { method: t(`methods.${last!.method}`) })}</p>
          )}
        </section>
      )}

      {runningLow.length > 0 && (
        <section className={s.block}>
          <div className="section-label">
            <span className="t-upper">{t('home.runningLow')}</span>
          </div>
          {runningLow.map(({ bean, stock }) => (
            <button type="button" key={bean.id} className="ledger-row" onClick={() => navigate(`/beans/${bean.id}`)}>
              <RoastDot level={bean.roast} />
              <span className="ledger-main">
                <span className="ledger-title">{bean.name}</span>
                <span className="ledger-sub">{bean.roaster}</span>
              </span>
              <span className={`ledger-aside ${s.lowAside}`}>
                <StockMeter weightG={bean.weightG ?? 0} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow />
              </span>
            </button>
          ))}
        </section>
      )}

      <section className={s.block}>
        <div className="section-label">
          <span className="t-upper">{t('home.onTheShelf')}</span>
          <button type="button" className={s.blockLink} onClick={() => navigate('/beans')}>
            {t('home.seeAll')} <Icon name="chevronRight" size={14} />
          </button>
        </div>
        {shelf.length === 0
          ? <Empty icon="bean" title={t('beans.noActive')} body={t('beans.noBeansBody')} />
          : (
            <div>
              {shelf.map(b => (
                <button type="button" key={b.id} className="ledger-row" onClick={() => navigate(`/beans/${b.id}`)}>
                  <RoastDot level={b.roast} />
                  <div className="ledger-main">
                    <span className="ledger-title">{b.name}</span>
                    <span className="ledger-sub">{[b.roaster, b.process].filter(Boolean).join(' · ')}</span>
                  </div>
                  <DaysOffRoast iso={b.roastedAt} />
                </button>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
