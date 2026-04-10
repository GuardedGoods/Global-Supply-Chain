export interface EconomicIndicator {
    id: string;
    name: string;
    value: number;
    unit: string;
    date: string;
    change: number;
    changePercent: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}
export interface EconomicHistory {
    id: string;
    name: string;
    data: {
        date: string;
        value: number;
    }[];
}
export interface EconomicData {
    indicators: EconomicIndicator[];
    history: EconomicHistory[];
    lastUpdated: string;
}
//# sourceMappingURL=economic.d.ts.map