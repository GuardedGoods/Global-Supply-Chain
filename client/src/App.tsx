import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Layout } from '@/components/layout/Layout';
import { Overview } from '@/pages/Overview';
import { MapView } from '@/pages/MapView';
import { Commodities } from '@/pages/Commodities';
import { Economic } from '@/pages/Economic';
import { News } from '@/pages/News';
import { Logistics } from '@/pages/Logistics';
import { Weather } from '@/pages/Weather';
import { Currency } from '@/pages/Currency';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/commodities" element={<Commodities />} />
              <Route path="/economic" element={<Economic />} />
              <Route path="/news" element={<News />} />
              <Route path="/logistics" element={<Logistics />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/currency" element={<Currency />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
