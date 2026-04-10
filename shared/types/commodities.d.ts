export interface CommodityPrice {
    seriesId: string;
    name: string;
    category: 'agricultural' | 'energy' | 'metals';
    value: number;
    unit: string;
    date: string;
    change: number;
    changePercent: number;
}
export interface CommodityHistory {
    seriesId: string;
    name: string;
    data: {
        date: string;
        value: number;
    }[];
}
export interface CommoditiesData {
    prices: CommodityPrice[];
    history: CommodityHistory[];
    lastUpdated: string;
}
//# sourceMappingURL=commodities.d.ts.map