import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Icon } from './components/Icons';
import { FAB } from './components/UI';

const NAV_ITEMS = [
  { path: '/',          label: 'Home',      icon: 'home' },
  { path: '/history',   label: 'History',   icon: 'history' },
  { path: '/recipes',   label: 'Recipes',   icon: 'recipe' },
  { path: '/beans',     label: 'Beans',     icon: 'bean' },
  { path: '/equipment', label: 'Equipment', icon: 'equipment' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/settings',  label: 'Settings',  icon: 'settings' },
];

const MOBILE_NAV = [
  { path: '/',          label: 'Home',      icon: 'home' },
  { path: '/history',   label: 'History',   icon: 'history' },
  { path: '/beans',     label: 'Beans',     icon: 'bean' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/settings',  label: 'Settings',  icon: 'settings' },
];

function ThemeApplier() {
  const { state } = useApp();
  const theme = state.settings?.theme ?? 'system';
  useEffect(() => {
    let mode = theme;
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', mode);
  }, [theme]);
  return null;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLog = location.pathname === '/log';

  function isActive(path: string): boolean {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <>
      <ThemeApplier />
      <div className="app-root">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="title">BrewLog</div>
            <div className="sub">your extraction journal</div>
          </div>
          {NAV_ITEMS.map(n => (
            <button key={n.path} className={`sidebar-link ${isActive(n.path) ? 'active' : ''}`} onClick={() => navigate(n.path)}>
              <Icon name={n.icon} size={18} />
              <span>{n.label}</span>
            </button>
          ))}
          <div className="sidebar-foot">v1.0 · local-first</div>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div key={location.pathname} className="fade-up">
              <Outlet />
            </div>
          </div>
        </main>

        <nav className="bottom-nav">
          {MOBILE_NAV.map(n => (
            <button key={n.path} className={isActive(n.path) ? 'active' : ''} onClick={() => navigate(n.path)}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        {!isLog && <FAB onClick={() => navigate('/log')} />}
      </div>
    </>
  );
}
