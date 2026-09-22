import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { seedDemoData } from '../../db/seed';
import { QuickSetupWizard } from './QuickSetupWizard';

export function WelcomeModal() {
  const { dispatch } = useApp();
  const db = useDb();
  const { t } = useTranslation();
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFresh() {
    setLoading(true);
    await db.updateSettings({});
    dispatch({ type: 'DISMISS_WELCOME' });
  }

  async function handleDemo() {
    setLoading(true);
    await seedDemoData();
    window.location.reload();
  }

  return (
    <div className="welcome-overlay">
      {showWizard ? (
        <QuickSetupWizard onBack={() => setShowWizard(false)} />
      ) : (
        <>
          <div className="welcome-hero">
            <div className="welcome-logo">BrewLog</div>
            <div className="welcome-tagline">{t('welcome.tagline')}</div>
            <div className="welcome-divider" />
            <div className="welcome-copy">{t('welcome.copy')}</div>
            <div className="readout-grid grid-paper welcome-sample" aria-hidden="true">
              <div className="stat"><div className="v">18.0<span className="u">g</span></div><div className="l">{t('extraction.fields.dose')}</div></div>
              <div className="stat"><div className="v">36.4<span className="u">g</span></div><div className="l">{t('extraction.fields.yield')}</div></div>
              <div className="stat"><div className="v">00:28</div><div className="l">{t('extraction.fields.time')}</div></div>
            </div>
          </div>

          <div className="welcome-sheet">
            <button
              type="button"
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setShowWizard(true)}
              disabled={loading}
            >
              {t('welcome.quickSetup')}
            </button>
            <div className="welcome-sheet-row">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={handleFresh}
                disabled={loading}
              >
                {t('welcome.startFresh')}
              </button>
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={handleDemo}
                disabled={loading}
              >
                {loading ? t('common.loading') : t('welcome.demoData')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
