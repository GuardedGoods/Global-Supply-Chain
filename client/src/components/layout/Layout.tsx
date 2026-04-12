import { Outlet } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSSE } from '@/hooks/useSSE';
import { useDensity } from '@/hooks/useDensity';
import type { SSEMessage } from '../../../../shared/types/api';

export function Layout() {
  const { density, toggleDensity } = useDensity();

  useEffect(() => {
    document.body.setAttribute('data-density', density);
  }, [density]);

  const handleMessage = useCallback((message: SSEMessage) => {
    if (message.type !== 'heartbeat') {
      // Notify listeners to refetch without remounting the tree
      window.dispatchEvent(new CustomEvent('app:refresh'));
    }
  }, []);

  const { connected, lastUpdate } = useSSE({
    onMessage: handleMessage,
  });

  const handleRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('app:refresh'));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header
          connected={connected}
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          density={density}
          onToggleDensity={toggleDensity}
        />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
