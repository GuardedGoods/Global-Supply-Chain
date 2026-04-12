import { Outlet } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSSE } from '@/hooks/useSSE';
import { useDensity } from '@/hooks/useDensity';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { SSEMessage } from '../../../../shared/types/api';

export function Layout() {
  const { density, toggleDensity } = useDensity();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-density', density);
  }, [density]);

  // Close drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Body scroll lock while drawer is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [isMobile, sidebarOpen]);

  const handleMessage = useCallback((message: SSEMessage) => {
    if (message.type !== 'heartbeat') {
      window.dispatchEvent(new CustomEvent('app:refresh'));
    }
  }, []);

  const { connected, lastUpdate } = useSSE({ onMessage: handleMessage });

  const handleRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('app:refresh'));
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Backdrop for mobile drawer */}
      {isMobile && sidebarOpen && (
        <div
          className="drawer-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="md:ml-64 flex-1 flex flex-col min-w-0">
        <Header
          connected={connected}
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          density={density}
          onToggleDensity={toggleDensity}
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
        />
        <main className="flex-1 p-4 md:p-6 safe-pl safe-pr">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
