export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  cached: boolean;
}

export interface RiskLevel {
  score: number;
  rating: 'Low' | 'Medium' | 'High' | 'Critical';
  color: string;
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  topRisks: RiskItem[];
  regionalBreakdown: RegionalRisk[];
  keyTrends: TrendItem[];
  watchItems: string[];
  generatedAt: string;
  summary: string;
}

export interface RiskItem {
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  description: string;
}

export interface RegionalRisk {
  region: string;
  riskLevel: RiskLevel;
  topConcern: string;
}

export interface TrendItem {
  indicator: string;
  direction: 'improving' | 'worsening' | 'stable';
  detail: string;
}

export interface SSEMessage {
  type: 'commodities' | 'economic' | 'weather' | 'news' | 'logistics' | 'currency' | 'risk-assessment' | 'heartbeat';
  data: unknown;
  timestamp: string;
}
