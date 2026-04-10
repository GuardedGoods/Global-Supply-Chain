export interface WeatherAlert {
    id: string;
    event: string;
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
    headline: string;
    description: string;
    areaDesc: string;
    onset: string;
    expires: string;
    coordinates?: [number, number][];
}
export interface WeatherForecast {
    location: string;
    lat: number;
    lon: number;
    temperature: number;
    windSpeed: number;
    precipitation: number;
    conditions: string;
}
export interface WeatherData {
    alerts: WeatherAlert[];
    forecasts: WeatherForecast[];
    lastUpdated: string;
}
//# sourceMappingURL=weather.d.ts.map