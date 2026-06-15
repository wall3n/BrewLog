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
          </div>

          <div className="welcome-sheet">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setShowWizard(true)}
              disabled={loading}
            >
              {t('welcome.quickSetup')}
            </button>
            <div className="welcome-sheet-row">
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={handleFresh}
                disabled={loading}
              >
                {t('welcome.startFresh')}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
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
