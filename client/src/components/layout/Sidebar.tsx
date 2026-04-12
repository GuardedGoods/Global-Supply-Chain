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

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-14 items-center gap-3 border-b border-border px-6">
        <Activity className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Supply Chain</h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Risk Intelligence
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 border-l-2 px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-3 right-3">
        <div className="minimal-card p-3 text-xs">
          <p className="font-semibold text-foreground">Auto-refresh</p>
          <p className="text-muted-foreground">Data updates every 15 min</p>
        </div>
      </div>
    </aside>
  );
}
