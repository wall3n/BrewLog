import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '@vercel/analytics/react';
import { useApp } from './context/AppContext';
import { Icon } from './components/Icons';
import { Button } from './components/UI';
import { WelcomeModal } from './screens/Welcome/WelcomeModal';

const THEME_COLORS = { light: '#F4F5F2', dark: '#121413' } as const;

function ThemeApplier() {
  const { state } = useApp();
  const theme = state.settings?.theme ?? 'system';
  useEffect(() => {
    let mode = theme;
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[mode]);
    try { localStorage.setItem('brewlog-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);
  return null;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);
  const isLog = location.pathname === '/log';

  const NAV_ITEMS = [
    { path: '/',          label: t('nav.home'),      icon: 'home' },
    { path: '/history',   label: t('nav.history'),   icon: 'history' },
    { path: '/beans',     label: t('nav.beans'),     icon: 'bean' },
    { path: '/recipes',   label: t('nav.recipes'),   icon: 'recipe' },
    { path: '/equipment', label: t('nav.equipment'), icon: 'equipment' },
    { path: '/analytics', label: t('nav.analytics'), icon: 'chart' },
    { path: '/settings',  label: t('nav.settings'),  icon: 'settings' },
  ];

  const MORE_ITEMS = [
    { path: '/recipes',   label: t('nav.recipes'),   icon: 'recipe' },
    { path: '/equipment', label: t('nav.equipment'), icon: 'equipment' },
    { path: '/analytics', label: t('nav.analytics'), icon: 'chart' },
    { path: '/settings',  label: t('nav.settings'),  icon: 'settings' },
  ];

  function isActive(path: string): boolean {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  const isMoreActive = MORE_ITEMS.some(n => isActive(n.path));

  useEffect(() => {
    const mainEl = document.querySelector('.main');
    if (mainEl instanceof HTMLElement) {
      mainEl.style.overflow = showMore ? 'hidden' : '';
    }
    return () => {
      if (mainEl instanceof HTMLElement) {
        mainEl.style.overflow = '';
      }
    };
  }, [showMore]);

  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (state.loading) return <ThemeApplier />;

  if (state.showWelcome) {
    return (
      <>
        <ThemeApplier />
        <Analytics />
        <WelcomeModal />
      </>
    );
  }

  const tab = (path: string, label: string, icon: string) => (
    <button
      type="button"
      className={isActive(path) ? 'active' : ''}
      aria-current={isActive(path) ? 'page' : undefined}
      onClick={() => navigate(path)}
    >
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <ThemeApplier />
      <Analytics />
      <div className="app-root">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="title">BrewLog</div>
            <div className="sub">{t('app.tagline')}</div>
          </div>
          <Button full leftIcon="plus" className="sidebar-new" onClick={() => navigate('/log')}>
            {t('sheet.newShot')}
          </Button>
          <nav aria-label={t('nav.main')}>
            {NAV_ITEMS.map(n => (
              <button
                type="button"
                key={n.path}
                className={`sidebar-link ${isActive(n.path) ? 'active' : ''}`}
                aria-current={isActive(n.path) ? 'page' : undefined}
                onClick={() => navigate(n.path)}
              >
                <Icon name={n.icon} size={18} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">{t('sheet.localOnly')} · v{__APP_VERSION__}</div>
        </aside>

        <main className="main">
          <div className={`main-inner${isLog ? ' focus' : ''}`}>
            <div key={location.pathname} className="fade-up">
              <Outlet />
            </div>
          </div>
        </main>

        {!isLog && (
          <nav className="bottom-nav" aria-label={t('nav.main')}>
            {tab('/', t('nav.home'), 'home')}
            {tab('/history', t('nav.history'), 'history')}
            <button
              type="button"
              className="nav-log"
              onClick={() => navigate('/log')}
              aria-label={t('sheet.newShot')}
            >
              <Icon name="plus" size={24} />
            </button>
            {tab('/beans', t('nav.beans'), 'bean')}
            <button
              type="button"
              className={isMoreActive ? 'active' : ''}
              aria-expanded={showMore}
              onClick={() => setShowMore(true)}
            >
              <Icon name="more" size={22} />
              <span>{t('nav.more')}</span>
            </button>
          </nav>
        )}

        {showMore && (
          <>
            <div className="more-sheet-backdrop" onClick={() => setShowMore(false)} />
            <div className="more-sheet" role="dialog" aria-modal="true" aria-label={t('nav.more')}>
              <div className="more-sheet-handle" />
              <div className="more-sheet-grid">
                {MORE_ITEMS.map(n => (
                  <button
                    type="button"
                    key={n.path}
                    className={`more-sheet-item ${isActive(n.path) ? 'active' : ''}`}
                    onClick={() => { navigate(n.path); setShowMore(false); }}
                  >
                    <Icon name={n.icon} size={22} />
                    <span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
