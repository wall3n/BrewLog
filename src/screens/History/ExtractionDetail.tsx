import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, Stars, MethodBadge, Empty, FlagMark } from '../../components/UI';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { sampleNo, nextShotFrom } from '../../utils/shots';
import { brewEY } from '../../utils/scaChart';
import type { Extraction, Bean, Equipment } from '../../db/types';
import s from './styles.module.css';

const ATTRIBUTE_KEYS = ['acidity', 'sweetness', 'bitterness', 'body', 'balance'] as const;

interface ReadoutItem { l: string; v: string; u?: string; }

export function ExtractionDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [ext, setExt] = useState<Extraction | null>(null);
  const [bean, setBean] = useState<Bean | undefined>(undefined);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const extraction = await db.getExtraction(Number(id));
      if (!extraction) { setNotFound(true); return; }
      setExt(extraction);
      const [b, allEq] = await Promise.all([
        extraction.beanId ? db.getBean(extraction.beanId) : Promise.resolve(undefined),
        db.getAllEquipment(),
      ]);
      setBean(b);
      setEquipment(allEq.filter(e => (extraction.equipmentIds ?? []).includes(e.id!)));
    }
    load();
  }, [id]);

  if (notFound) return <div><BackBar onClick={() => navigate('/history')} label={t('extraction.backToHistory')} /><Empty icon="flask" title={t('extraction.notFound')} /></div>;
  if (!ext) return null;

  const ey = ext.tds ? brewEY(ext.method, ext.dose, ext.yield, ext.tds) : null;
  const pressureMethod = ext.method === 'espresso' || ext.method === 'moka-pot';

  const readout: ReadoutItem[] = [
    { l: t('extraction.fields.dose'), v: ext.dose.toFixed(1), u: 'g' },
    { l: t('extraction.fields.yield'), v: ext.yield.toFixed(1), u: 'g' },
    { l: t('extraction.fields.ratio'), v: `1:${ext.ratio.toFixed(1)}` },
    { l: t('extraction.fields.time'), v: fmtTime(ext.timeS) },
    { l: t('extraction.fields.temp'), v: String(ext.temp), u: '°C' },
    ...(ext.grindSetting ? [{ l: t('extraction.fields.grind'), v: ext.grindSetting }] : []),
    ...(ext.pressure && pressureMethod ? [{ l: t('extraction.fields.pressure'), v: String(ext.pressure), u: 'bar' }] : []),
    ...(ext.tds ? [{ l: t('extraction.fields.tds'), v: ext.tds.toFixed(2), u: '%' }] : []),
    ...(ey !== null ? [{ l: t('extraction.steps.parameters.eyLabel'), v: ey.toFixed(1), u: '%' }] : []),
  ];

  return (
    <div>
      <BackBar onClick={() => navigate('/history')} label={t('extraction.backToHistory')} />
      <header className={s.detailHead}>
        <h1 className={s.detailTitle}>{bean?.name ?? t('extraction.unknownBean')}</h1>
        {bean && <p className={s.detailSub}>{[bean.roaster, bean.process].filter(Boolean).join(' · ')}</p>}
        <dl className={`field-row ${s.fieldRow}`}>
          <div><dt>{t('home.trail.no')}</dt><dd>{sampleNo(ext.id)}</dd></div>
          <div><dt>{t('sheet.method')}</dt><dd><MethodBadge method={ext.method} /></dd></div>
          <div><dt>{t('home.logged')}</dt><dd>{fmtRelDate(ext.createdAt)}</dd></div>
          <div className="field-row-end"><dt className="sr-only">{t('extraction.steps.tasting.outcome')}</dt><dd><FlagMark flag={ext.flag} stamp /></dd></div>
        </dl>
      </header>

      <div className={`readout-grid grid-paper ${s.readout}`}>
        {readout.map(item => (
          <div key={item.l} className="stat">
            <div className="v">{item.v}{item.u && <span className="u">{item.u}</span>}</div>
            <div className="l">{item.l}</div>
          </div>
        ))}
      </div>

      <section className={s.block}>
        <div className="section-label"><span className="t-upper">{t('sheet.cupping')}</span></div>
        <div className={s.scoreRow}>
          <span className={s.attrLabel}>{t('extraction.steps.tasting.overallRating')}</span>
          <Stars value={ext.rating} size={16} />
        </div>
        {ATTRIBUTE_KEYS.map(k => (
          <div key={k} className={s.attrRow}>
            <span className={s.attrLabel}>{t(`extraction.fields.${k}`)}</span>
            <Stars value={ext[k]} size={12} />
          </div>
        ))}
        {ext.flavours?.length > 0 && (
          <div className={s.flavours}>
            {ext.flavours.map(f => <span key={f} className={s.flavour}>{f}</span>)}
          </div>
        )}
        {ext.notes && <p className={s.note}>{ext.notes}</p>}
      </section>

      {equipment.length > 0 && (
        <section className={s.block}>
          <div className="section-label"><span className="t-upper">{t('extraction.equipmentSection')}</span></div>
          {equipment.map(e => (
            <div key={e.id} className="spec-row">
              <span>{e.name}</span>
              <span className="t-sec">{t(`equipment.types.${e.type}`, { defaultValue: e.type })}</span>
            </div>
          ))}
        </section>
      )}

      <div className={s.actionRow}>
        <Button full size="lg" leftIcon="copy" onClick={() => navigate('/log', { state: nextShotFrom(ext) })}>{t('home.nextShot')}</Button>
        <Button variant="ghost" full leftIcon="edit" onClick={() => navigate('/log', { state: { ...ext, isEditing: true } })}>{t('common.edit')}</Button>
        <Button variant="danger" full leftIcon="trash" onClick={async () => {
          if (confirm(t('extraction.confirmDelete'))) {
            await db.deleteExtraction(ext.id!);
            navigate('/history');
          }
        }}>{t('extraction.delete')}</Button>
      </div>
    </div>
  );
}
