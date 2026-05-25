export interface Bean {
  id?: number;
  name: string;
  roaster: string;
  origin?: string;
  process?: string;
  roast: 'light' | 'medium' | 'dark';
  roastedAt?: string;
  notes?: string;
  status: 'active' | 'finished' | 'wishlist';
  weightG?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id?: number;
  type: string;
  name: string;
  model?: string;
  notes?: string;
  usage: number;
  createdAt: string;
  updatedAt: string;
}

export interface PourStage {
  id: string;
  label: string;
  timeS: number;
  weightG: number;
}

export interface Recipe {
  id?: number;
  name: string;
  method: string;
  ratio: number;
  dose: number;
  yield: number;
  temp: number;
  time: number;
  stages: PourStage[];
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Extraction {
  id?: number;
  method: string;
  beanId: number;
  equipmentIds: number[];
  grindSetting?: string;
  dose: number;
  yield: number;
  ratio: number;
  timeS: number;
  temp: number;
  pressure?: number;
  tds?: number | null;
  flag: 'dialled' | 'adjust' | 'fail';
  rating: number;
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  balance: number;
  flavours: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id?: number;
  weightUnit: 'g' | 'oz';
  tempUnit: 'C' | 'F';
  volumeUnit: 'ml' | 'oz';
  ratingScale: '5' | '10';
  defaultMethod: string;
  theme: 'system' | 'light' | 'dark';
}

export interface MethodConfig {
  id: string;
  name: string;
  icon: string;
  defaultRatio: number;
}
