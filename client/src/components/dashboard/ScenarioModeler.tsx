import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import type { CommodityPrice } from '../../../../shared/types/commodities';

interface ScenarioModelerProps {
  commodities: CommodityPrice[];
}

interface Scenario {
  seriesId: string;
  name: string;
  currentPrice: number;
  unit: string;
  shockPercent: number;
}

// CPG basket templates — weight each commodity by rough impact on CPG COGS
const CPG_BASKETS: Record<string, { label: string; commodities: { seriesId: string; weight: number }[] }> = {
  cereal: {
    label: 'Cereal Maker',
    commodities: [
      { seriesId: 'WPU0121', weight: 0.25 }, // Corn
      { seriesId: 'WPU0911', weight: 0.25 }, // Wheat
      { seriesId: 'WPU0113', weight: 0.15 }, // Oats
      { seriesId: 'WPU01220105', weight: 0.10 }, // Sugar
      { seriesId: 'DCOILWTICO', weight: 0.15 }, // Energy (oil)
      { seriesId: 'WPU091103', weight: 0.10 }, // Pulp/paper (packaging)
    ],
  },
  petfood: {
    label: 'Pet Food',
    commodities: [
      { seriesId: 'WPU0121', weight: 0.30 }, // Corn
      { seriesId: 'WPU01830111', weight: 0.25 }, // Soybeans
      { seriesId: 'DCOILWTICO', weight: 0.15 }, // Energy
      { seriesId: 'WPU07210201', weight: 0.15 }, // Plastics (packaging)
      { seriesId: 'WPU1017', weight: 0.10 }, // Aluminum (cans)
      { seriesId: 'WPU091103', weight: 0.05 }, // Paper
    ],
  },
  peanut: {
    label: 'Peanut Butter',
    commodities: [
      { seriesId: 'WPU01830131', weight: 0.50 }, // Peanuts
      { seriesId: 'DCOILWTICO', weight: 0.15 }, // Energy
      { seriesId: 'WPU01220105', weight: 0.10 }, // Sugar
      { seriesId: 'WPU07210201', weight: 0.15 }, // Plastics
      { seriesId: 'WPU102', weight: 0.10 }, // Steel (lids)
    ],
  },
};

export function ScenarioModeler({ commodities }: ScenarioModelerProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeBasket, setActiveBasket] = useState<string | null>(null);

  const addScenario = (commodity: CommodityPrice) => {
    if (scenarios.find(s => s.seriesId === commodity.seriesId)) return;
    setScenarios(prev => [...prev, {
      seriesId: commodity.seriesId,
      name: commodity.name,
      currentPrice: commodity.value,
      unit: commodity.unit,
      shockPercent: 0,
    }]);
  };

  const updateShock = (seriesId: string, shockPercent: number) => {
    setScenarios(prev => prev.map(s => s.seriesId === seriesId ? { ...s, shockPercent } : s));
  };

  const removeScenario = (seriesId: string) => {
    setScenarios(prev => prev.filter(s => s.seriesId !== seriesId));
  };

  const loadBasket = (basketKey: string) => {
    const basket = CPG_BASKETS[basketKey];
    if (!basket) return;
    const newScenarios: Scenario[] = [];
    for (const item of basket.commodities) {
      const commodity = commodities.find(c => c.seriesId === item.seriesId);
      if (commodity) {
        newScenarios.push({
          seriesId: commodity.seriesId,
          name: commodity.name,
          currentPrice: commodity.value,
          unit: commodity.unit,
          shockPercent: 0,
        });
      }
    }
    setScenarios(newScenarios);
    setActiveBasket(basketKey);
  };

  const weightedImpact = useMemo(() => {
    if (!activeBasket) return null;
    const basket = CPG_BASKETS[activeBasket];
    if (!basket) return null;
    let total = 0;
    let totalWeight = 0;
    for (const item of basket.commodities) {
      const s = scenarios.find(sc => sc.seriesId === item.seriesId);
      if (s) {
        total += s.shockPercent * item.weight;
        totalWeight += item.weight;
      }
    }
    return totalWeight > 0 ? total / totalWeight : 0;
  }, [scenarios, activeBasket]);

  const availableCommodities = commodities.filter(
    c => !scenarios.find(s => s.seriesId === c.seriesId)
  );

  return (
    <div className="minimal-card rounded p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
          <Calculator className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Scenario Modeler</h3>
          <p className="text-[10px] text-muted-foreground">Project COGS impact from commodity shocks</p>
        </div>
      </div>

      {/* Basket templates */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold self-center">CPG Templates:</span>
        {Object.entries(CPG_BASKETS).map(([key, basket]) => (
          <button
            key={key}
            onClick={() => loadBasket(key)}
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
              activeBasket === key
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {basket.label}
          </button>
        ))}
        {scenarios.length > 0 && (
          <button
            onClick={() => { setScenarios([]); setActiveBasket(null); }}
            className="text-[11px] px-2 py-0.5 rounded-full text-muted-foreground hover:text-destructive"
          >
            Clear
          </button>
        )}
      </div>

      {/* Scenario rows */}
      <div className="space-y-2">
        {scenarios.map(s => {
          const shockedPrice = s.currentPrice * (1 + s.shockPercent / 100);
          const delta = shockedPrice - s.currentPrice;
          return (
            <div key={s.seriesId} className="flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.name}</p>
                <p className="numeric text-[10px] text-muted-foreground">
                  Current: {formatCurrency(s.currentPrice)}
                </p>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="1"
                value={s.shockPercent}
                onChange={(e) => updateShock(s.seriesId, Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <div className="w-20 text-right">
                <p className={cn(
                  'numeric text-sm font-semibold',
                  s.shockPercent > 0 ? 'text-red-500' : s.shockPercent < 0 ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {s.shockPercent >= 0 ? '+' : ''}{s.shockPercent}%
                </p>
                <p className="numeric text-[10px] text-muted-foreground">
                  {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                </p>
              </div>
              <button
                onClick={() => removeScenario(s.seriesId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          Select a CPG template or add commodities below to model impact
        </p>
      )}

      {/* Add commodity */}
      {availableCommodities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <select
            onChange={(e) => {
              const c = commodities.find(cm => cm.seriesId === e.target.value);
              if (c) addScenario(c);
              e.target.value = '';
            }}
            value=""
            className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">+ Add commodity...</option>
            {availableCommodities.map(c => (
              <option key={c.seriesId} value={c.seriesId}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Weighted impact summary */}
      {weightedImpact !== null && scenarios.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Weighted COGS Impact
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Based on {CPG_BASKETS[activeBasket!]?.label} basket weights
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                'numeric text-2xl font-bold flex items-center gap-1',
                weightedImpact > 0 ? 'text-red-500' : weightedImpact < 0 ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {weightedImpact > 0 ? <TrendingUp className="h-4 w-4" /> : weightedImpact < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                {formatPercent(weightedImpact)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
