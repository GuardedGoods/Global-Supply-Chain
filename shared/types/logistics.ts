export interface PortStatus {
  name: string;
  location: string;
  lat: number;
  lon: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  avgWaitDays: number;
  vesselCount: number;
}

export interface FreightIndicator {
  name: string;
  value: number;
  unit: string;
  change: number;
  date: string;
}

export interface LogisticsData {
  ports: PortStatus[];
  freightIndicators: FreightIndicator[];
  lastUpdated: string;
}
