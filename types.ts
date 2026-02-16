
export enum RiskLevel {
  SAFE = 'Safe',
  SUSPICIOUS = 'Suspicious',
  HIGH_RISK = 'High Risk'
}

export enum ConfidenceLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: RiskLevel;
  detected_indicators: string[];
  explanation: string;
  confidence_level: ConfidenceLevel;
}

export interface AnalysisStats {
  latency: string;
  load: string;
  integrity: string;
}

export interface HistoryEntry extends AnalysisResult {
  id: string;
  timestamp: number;
  type: AnalysisType;
  fileName?: string;
  previewText?: string;
}

export type AnalysisType = 'TEXT' | 'AUDIO';

export type AppView = 'DASHBOARD' | 'HISTORY' | 'THREAT_INTEL' | 'SETTINGS';