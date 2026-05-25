import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { seedDemoData } from '../../db/seed';
import { QuickSetupWizard } from './QuickSetupWizard';

export function WelcomeModal() {
  const { dispatch } = useApp();
  const db = useDb();
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
            <div className="welcome-tagline">YOUR EXTRACTION JOURNAL</div>
            <div className="welcome-divider" />
            <div className="welcome-copy">Track every pour. Dial in your perfect cup.</div>
          </div>

          <div className="welcome-sheet">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setShowWizard(true)}
              disabled={loading}
            >
              ✦ Quick setup
            </button>
            <div className="welcome-sheet-row">
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={handleFresh}
                disabled={loading}
              >
                Start fresh
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={handleDemo}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Demo data'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
