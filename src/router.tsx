import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { HomeScreen } from './screens/Home/HomeScreen';
import { LogExtractionScreen } from './screens/LogExtraction';
import { HistoryScreen } from './screens/History/HistoryScreen';
import { ExtractionDetail } from './screens/History/ExtractionDetail';
import { BeansScreen } from './screens/Beans/BeansScreen';
import { BeanDetail } from './screens/Beans/BeanDetail';
import { RecipesScreen } from './screens/Recipes/RecipesScreen';
import { RecipeDetail } from './screens/Recipes/RecipeDetail';
import { EquipmentScreen } from './screens/Equipment/EquipmentScreen';
import { AnalyticsScreen } from './screens/Analytics/AnalyticsScreen';
import { SettingsScreen } from './screens/Settings/SettingsScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'log', element: <LogExtractionScreen /> },
      { path: 'history', element: <HistoryScreen /> },
      { path: 'history/:id', element: <ExtractionDetail /> },
      { path: 'beans', element: <BeansScreen /> },
      { path: 'beans/:id', element: <BeanDetail /> },
      { path: 'recipes', element: <RecipesScreen /> },
      { path: 'recipes/:id', element: <RecipeDetail /> },
      { path: 'equipment', element: <EquipmentScreen /> },
      { path: 'analytics', element: <AnalyticsScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
    ],
  },
]);
