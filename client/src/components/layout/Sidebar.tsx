import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  TrendingUp,
  Newspaper,
  Truck,
  CloudLightning,
  DollarSign,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/map', icon: Map, label: 'Risk Map' },
  { to: '/commodities', icon: BarChart3, label: 'Commodities' },
  { to: '/economic', icon: TrendingUp, label: 'Economic' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/logistics', icon: Truck, label: 'Logistics' },
  { to: '/weather', icon: CloudLightning, label: 'Weather' },
  { to: '/currency', icon: DollarSign, label: 'Currency' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-[100dvh] w-64 border-r border-border bg-card safe-pl',
        'transition-transform duration-200 ease-out',
        // Desktop: always visible. Mobile: slide in from left when open.
        'md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
      aria-label="Primary navigation"
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6 safe-pt">
        <div className="flex items-center gap-3 min-w-0">
          <Activity className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              Supply Chain
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Risk Intelligence
            </p>
          </div>
        </div>

        {/* Close button on mobile only */}
        <button
          onClick={onClose}
          className="md:hidden rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground tap-target"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-3 right-3 safe-pb">
        <div className="minimal-card p-3 text-xs">
          <p className="font-semibold text-foreground">Auto-refresh</p>
          <p className="text-muted-foreground">Data updates every 15 min</p>
        </div>
      </div>
    </aside>
  );
}
