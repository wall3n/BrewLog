import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { db } from '../db/schema';
import type { Bean, Equipment, Recipe, Extraction, AppSettings } from '../db/types';

interface AppState {
  beans: Bean[];
  equipment: Equipment[];
  recipes: Recipe[];
  extractions: Extraction[];
  settings: AppSettings;
  loading: boolean;
  showWelcome: boolean;
}

type AppAction =
  | { type: 'LOADED'; payload: Omit<AppState, 'loading'> }
  | { type: 'DISMISS_WELCOME' }
  | { type: 'ADD_EXTRACTION'; payload: Extraction }
  | { type: 'UPDATE_EXTRACTION'; payload: Extraction }
  | { type: 'DELETE_EXTRACTION'; id: number }
  | { type: 'ADD_BEAN'; payload: Bean }
  | { type: 'UPDATE_BEAN'; payload: Bean }
  | { type: 'DELETE_BEAN'; id: number }
  | { type: 'ADD_EQUIPMENT'; payload: Equipment }
  | { type: 'DELETE_EQUIPMENT'; id: number }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; id: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

const defaultSettings: AppSettings = {
  weightUnit: 'g', tempUnit: 'C', volumeUnit: 'ml',
  ratingScale: '5', defaultMethod: 'espresso', theme: 'system',
};

const initialState: AppState = {
  beans: [], equipment: [], recipes: [], extractions: [],
  settings: defaultSettings, loading: true, showWelcome: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOADED': return { ...action.payload, loading: false };
    case 'DISMISS_WELCOME': return { ...state, showWelcome: false };
    case 'ADD_EXTRACTION': return { ...state, extractions: [action.payload, ...state.extractions] };
    case 'UPDATE_EXTRACTION': return { ...state, extractions: state.extractions.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EXTRACTION': return { ...state, extractions: state.extractions.filter(e => e.id !== action.id) };
    case 'ADD_BEAN': return { ...state, beans: [...state.beans, action.payload] };
    case 'UPDATE_BEAN': return { ...state, beans: state.beans.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BEAN': return { ...state, beans: state.beans.filter(b => b.id !== action.id) };
    case 'ADD_EQUIPMENT': return { ...state, equipment: [...state.equipment, action.payload] };
    case 'DELETE_EQUIPMENT': return { ...state, equipment: state.equipment.filter(e => e.id !== action.id) };
    case 'ADD_RECIPE': return { ...state, recipes: [...state.recipes, action.payload] };
    case 'DELETE_RECIPE': return { ...state, recipes: state.recipes.filter(r => r.id !== action.id) };
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
      const [beans, equipment, recipes, extractions, settingsArr, settingsCount] = await Promise.all([
        db.beans.orderBy('createdAt').toArray(),
        db.equipment.orderBy('createdAt').toArray(),
        db.recipes.orderBy('createdAt').toArray(),
        db.extractions.orderBy('createdAt').reverse().toArray(),
        db.settings.toArray(),
        db.settings.count(),
      ]);
      dispatch({
        type: 'LOADED',
        payload: {
          beans,
          equipment,
          recipes,
          extractions,
          settings: settingsArr[0] ?? defaultSettings,
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
