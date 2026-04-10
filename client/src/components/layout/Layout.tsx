import { Outlet } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSSE } from '@/hooks/useSSE';
import type { SSEMessage } from '../../../../shared/types/api';

export function Layout() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMessage = useCallback((message: SSEMessage) => {
    if (message.type !== 'heartbeat') {
      setRefreshKey(prev => prev + 1);
    }
  }, []);

  const { connected, lastUpdate } = useSSE({
    onMessage: handleMessage,
  });

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header
          connected={connected}
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
        />
        <main className="p-6 animate-fade-in" key={refreshKey}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
