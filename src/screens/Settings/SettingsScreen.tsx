import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, SegToggle } from '../../components/UI';
import { METHODS } from '../../utils/methodDefaults';
import type { AppSettings } from '../../db/types';
import css from './styles.module.css';

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={`row row-between ${css.settingRow}`}>
      <span className={css.settingLabel}>{label}</span>
      {children}
    </div>
  );
}

export function SettingsScreen() {
  const { state } = useApp();
  const db = useDb();
  const { t } = useTranslation();
  const s = state.settings;

  const set = async (patch: Partial<typeof s>) => {
    await db.updateSettings(patch);
  };

  const handleLanguageChange = async (lang: string) => {
    const l = lang as AppSettings['language'];
    await set({ language: l });
    if (l === 'auto') {
      i18n.changeLanguage(navigator.language);
    } else {
      i18n.changeLanguage(l);
    }
  };

  const handleExport = async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brewlog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text) as Parameters<ReturnType<typeof useDb>['importAll']>[0];
        if (confirm(t('settings.data.confirmImport'))) {
          await db.importAll(data);
          window.location.reload();
        }
      } catch { alert(t('settings.data.invalidJson')); }
    };
    input.click();
  };

  const handleClear = async () => {
    if (confirm(t('settings.data.confirmClear'))) {
      await db.clearAll();
      window.location.reload();
    }
  };

  if (!s) return null;

  return (
    <div>
      <div className="page-head">
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </div>

      <div className={`card ${css.cardMb}`}>
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.units.title')}</div>
        <div className="col col-gap-16">
          <SettingRow label={t('settings.units.weight')}><SegToggle value={s.weightUnit} options={[['g','grams'],['oz','ounces']]} onChange={v => set({ weightUnit: v as 'g'|'oz' })} /></SettingRow>
          <SettingRow label={t('settings.units.temperature')}><SegToggle value={s.tempUnit} options={[['C','°C'],['F','°F']]} onChange={v => set({ tempUnit: v as 'C'|'F' })} /></SettingRow>
          <SettingRow label={t('settings.units.volume')}><SegToggle value={s.volumeUnit} options={[['ml','ml'],['oz','fl oz']]} onChange={v => set({ volumeUnit: v as 'ml'|'oz' })} /></SettingRow>
        </div>
      </div>

      <div className={`card ${css.cardMb}`}>
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.defaults.title')}</div>
        <div className="col col-gap-16">
          <SettingRow label={t('settings.defaults.method')}>
            <select className={`input-underline ${css.methodSelect}`} value={s.defaultMethod} onChange={e => set({ defaultMethod: e.target.value })}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{t(`methods.${m.id}`)}</option>)}
            </select>
          </SettingRow>
          <SettingRow label={t('settings.defaults.ratingScale')}>
            <SegToggle value={s.ratingScale} options={[['5','5 stars'],['10','1–10']]} onChange={v => set({ ratingScale: v as '5'|'10' })} />
          </SettingRow>
        </div>
      </div>

      <div className={`card ${css.cardMb}`}>
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.appearance.title')}</div>
        <SettingRow label={t('settings.appearance.theme')}>
          <SegToggle
            value={s.theme}
            options={[
              ['system', t('settings.appearance.themes.system')],
              ['light',  t('settings.appearance.themes.light')],
              ['dark',   t('settings.appearance.themes.dark')],
            ]}
            onChange={v => set({ theme: v as 'system'|'light'|'dark' })}
          />
        </SettingRow>
      </div>

      <div className={`card ${css.cardMb}`}>
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.language.title')}</div>
        <SettingRow label={t('settings.language.title')}>
          <SegToggle
            value={s.language ?? 'auto'}
            options={[
              ['auto', t('settings.language.options.auto')],
              ['en',   t('settings.language.options.en')],
              ['es',   t('settings.language.options.es')],
              ['fr',   t('settings.language.options.fr')],
            ]}
            onChange={handleLanguageChange}
          />
        </SettingRow>
      </div>

      <div className="card">
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.data.title')}</div>
        <div className="col col-gap-12">
          <Button variant="ghost" full leftIcon="download" onClick={handleExport}>{t('settings.data.exportJson')}</Button>
          <Button variant="ghost" full leftIcon="upload" onClick={handleImport}>{t('settings.data.importJson')}</Button>
          <Button variant="danger" full leftIcon="trash" onClick={handleClear}>{t('settings.data.clearAll')}</Button>
        </div>
      </div>

      <div className={`card ${css.cardMt}`}>
        <div className={`t-upper ${css.sectionHead}`}>{t('settings.about.title')}</div>
        <div className="col col-gap-12">
          <SettingRow label={t('settings.about.version')}>
            <span className="t-mono t-sec">v{__APP_VERSION__}</span>
          </SettingRow>
          <SettingRow label={t('settings.about.storage')}>
            <span className="t-sec">{t('settings.about.storageValue')}</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
