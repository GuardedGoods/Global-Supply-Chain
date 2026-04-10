export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    date: string;
    change: number;
    changePercent: number;
}
export interface CurrencyHistory {
    pair: string;
    data: {
        date: string;
        rate: number;
    }[];
}
export interface CurrencyData {
    rates: ExchangeRate[];
    history: CurrencyHistory[];
    lastUpdated: string;
}
//# sourceMappingURL=currency.d.ts.map