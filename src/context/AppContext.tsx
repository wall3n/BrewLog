import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import i18n from '../i18n';
import { db } from '../db/schema';
import type { Bean, AppSettings } from '../db/types';

interface AppState {
  activeBeans: Bean[];
  settings: AppSettings;
  loading: boolean;
  showWelcome: boolean;
}

type AppAction =
  | { type: 'LOADED'; payload: Omit<AppState, 'loading'> }
  | { type: 'DISMISS_WELCOME' }
  | { type: 'ACTIVE_BEANS_CHANGED'; payload: Bean[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

const defaultSettings: AppSettings = {
  weightUnit: 'g', tempUnit: 'C', volumeUnit: 'ml',
  ratingScale: '5', defaultMethod: 'espresso', theme: 'system', language: 'auto',
};

const initialState: AppState = {
  activeBeans: [],
  settings: defaultSettings,
  loading: true,
  showWelcome: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOADED': return { ...action.payload, loading: false };
    case 'DISMISS_WELCOME': return { ...state, showWelcome: false };
    case 'ACTIVE_BEANS_CHANGED': return { ...state, activeBeans: action.payload };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    default: return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function loadAll() {
      const [activeBeans, settingsArr, settingsCount] = await Promise.all([
        db.beans.where('status').equals('active').toArray(),
        db.settings.toArray(),
        db.settings.count(),
      ]);
      const settings = settingsArr[0] ?? defaultSettings;
      if (settings.language && settings.language !== 'auto') {
        i18n.changeLanguage(settings.language);
      }
      dispatch({
        type: 'LOADED',
        payload: {
          activeBeans,
          settings,
          showWelcome: settingsCount === 0,
        },
      });
    }
    loadAll();
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
