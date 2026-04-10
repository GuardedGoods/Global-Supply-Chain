import { BaseCollector } from './base.collector';
import type {
  WeatherData,
  WeatherAlert,
  WeatherForecast,
} from '../../../shared/types/weather';

// ── Logistics hub coordinates ──────────────────────────────────────────────
interface HubDef {
  name: string;
  lat: number;
  lon: number;
}

const LOGISTICS_HUBS: HubDef[] = [
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Houston', lat: 29.7604, lon: -95.3698 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Atlanta', lat: 33.749, lon: -84.388 },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { name: 'Memphis', lat: 35.1495, lon: -90.049 },
  { name: 'Louisville', lat: 38.2527, lon: -85.7585 },
  { name: 'Dallas', lat: 32.7767, lon: -96.797 },
  { name: 'Miami', lat: 25.7617, lon: -80.1918 },
];

// ── NWS API response shapes ───────────────────────────────────────────────
interface NwsFeature {
  id: string;
  properties: {
    event: string;
    severity: string;
    headline: string;
    description: string;
    areaDesc: string;
    onset: string;
    expires: string;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  };
}

interface NwsResponse {
  features: NwsFeature[];
}

// ── Open-Meteo API response shape ─────────────────────────────────────────
interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  daily?: {
    temperature_2m_max: number[];
    precipitation_sum: number[];
  };
}

// ── Collector ──────────────────────────────────────────────────────────────
export class WeatherCollector extends BaseCollector<WeatherData> {
  readonly name = 'weather';

  protected async fetchData(): Promise<WeatherData> {
    const [alerts, forecasts] = await Promise.allSettled([
      this.fetchAlerts(),
      this.fetchForecasts(),
    ]);

    return {
      alerts: alerts.status === 'fulfilled' ? alerts.value : [],
      forecasts: forecasts.status === 'fulfilled' ? forecasts.value : [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // ── NWS Alerts ─────────────────────────────────────────────────────────
  private async fetchAlerts(): Promise<WeatherAlert[]> {
    const url =
      'https://api.weather.gov/alerts/active?status=actual&message_type=alert';

    const resp = await this.httpGet<NwsResponse>(url, {
      'User-Agent': 'SupplyChainDashboard',
      Accept: 'application/geo+json',
    });

    const features = resp?.features ?? [];

    // Only keep severe/extreme alerts (or moderate), cap at 50
    const relevant = features.slice(0, 100);

    return relevant.map((f): WeatherAlert => {
      const p = f.properties;
      const severity = this.mapSeverity(p.severity);

      // Try to extract coordinates from geometry
      let coordinates: [number, number][] | undefined;
      if (f.geometry?.coordinates) {
        try {
          coordinates = this.extractCoordinates(f.geometry);
        } catch {
          // geometry can be complex; skip if unparseable
        }
      }

      return {
        id: f.id,
        event: p.event,
        severity,
        headline: p.headline ?? p.event,
        description: (p.description ?? '').slice(0, 500),
        areaDesc: p.areaDesc ?? '',
        onset: p.onset ?? new Date().toISOString(),
        expires: p.expires ?? new Date().toISOString(),
        coordinates,
      };
    });
  }

  private mapSeverity(raw: string): WeatherAlert['severity'] {
    const s = (raw ?? '').toLowerCase();
    if (s === 'extreme') return 'Extreme';
    if (s === 'severe') return 'Severe';
    if (s === 'moderate') return 'Moderate';
    return 'Minor';
  }

  private extractCoordinates(
    geometry: { type: string; coordinates: unknown }
  ): [number, number][] | undefined {
    if (geometry.type === 'Point') {
      const coords = geometry.coordinates as [number, number];
      return [coords];
    }
    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates as [number, number][][];
      return rings[0]; // outer ring
    }
    return undefined;
  }

  // ── Open-Meteo Forecasts ───────────────────────────────────────────────
  private async fetchForecasts(): Promise<WeatherForecast[]> {
    const results = await Promise.allSettled(
      LOGISTICS_HUBS.map(async (hub) => {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${hub.lat}` +
          `&longitude=${hub.lon}` +
          `&current=temperature_2m,wind_speed_10m,precipitation` +
          `&daily=temperature_2m_max,precipitation_sum` +
          `&temperature_unit=fahrenheit` +
          `&wind_speed_unit=mph` +
          `&precipitation_unit=inch` +
          `&timezone=auto` +
          `&forecast_days=1`;

        const resp = await this.httpGet<OpenMeteoResponse>(url);

        const current = resp?.current;
        if (!current) {
          throw new Error(`No current data for ${hub.name}`);
        }

        // Derive simple conditions string from temperature + precipitation
        const conditions = this.deriveConditions(
          current.temperature_2m,
          current.precipitation,
          current.wind_speed_10m
        );

        return {
          location: hub.name,
          lat: hub.lat,
          lon: hub.lon,
          temperature: Math.round(current.temperature_2m * 10) / 10,
          windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
          precipitation: Math.round(current.precipitation * 100) / 100,
          conditions,
        } satisfies WeatherForecast;
      })
    );

    const forecasts: WeatherForecast[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        forecasts.push(r.value);
      } else {
        console.warn('[weather] Hub forecast failed:', r.reason);
      }
    }
    return forecasts;
  }

  private deriveConditions(
    tempF: number,
    precipInch: number,
    windMph: number
  ): string {
    const parts: string[] = [];

    if (precipInch > 0.5) parts.push('Heavy Rain');
    else if (precipInch > 0.1) parts.push('Rain');
    else if (precipInch > 0) parts.push('Light Rain');

    if (tempF <= 32 && precipInch > 0) {
      parts.length = 0; // replace rain with snow
      parts.push('Snow');
    }

    if (windMph > 40) parts.push('High Winds');
    else if (windMph > 25) parts.push('Windy');

    if (parts.length === 0) {
      if (tempF > 95) parts.push('Extreme Heat');
      else if (tempF > 85) parts.push('Hot');
      else if (tempF < 20) parts.push('Extreme Cold');
      else if (tempF < 40) parts.push('Cold');
      else parts.push('Clear');
    }

    return parts.join(', ');
  }

  protected getDefault(): WeatherData {
    return {
      alerts: [],
      forecasts: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const weatherCollector = new WeatherCollector();
