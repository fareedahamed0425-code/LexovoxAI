
// ─── LEGACY TYPES (kept for compatibility) ────────────────────────────────────
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

// ─── SENTINEL AI — MODULE TYPES ───────────────────────────────────────────────

/** MODULE 1: AUDIO ANALYSIS */
export interface AudioFlag {
  type: string;
  timestamp: string | null;
  excerpt: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AudioHarmfulContent {
  verdict: 'HARMFUL' | 'SAFE' | 'REVIEW_NEEDED';
  confidence: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  flags: AudioFlag[];
  summary: string;
}

export interface TrackDetails {
  title: string | null;
  artist: string | null;
  album: string | null;
  release_year: string | null;
  genre: string | null;
  origin_country: string | null;
  language: string | null;
  label: string | null;
}

export interface MusicIdentification {
  is_music: boolean;
  found_online: boolean | 'unknown';
  track_details: TrackDetails;
  streaming_availability: string[];
  copyright_status: 'COPYRIGHTED' | 'PUBLIC_DOMAIN' | 'UNKNOWN';
  notes: string;
}

export interface SpeechAnalysis {
  detected_language: string;
  speaker_count: '1' | 'multiple' | 'unknown';
  content_type: 'music' | 'speech' | 'mixed' | 'ambient' | 'unknown';
  key_themes: string[];
}

export interface AudioAnalysisResult {
  module: 'AUDIO_ANALYSIS';
  MINOR_INVOLVED?: true;
  harmful_content: AudioHarmfulContent;
  music_identification: MusicIdentification;
  speech_analysis: SpeechAnalysis;
}

/** MODULE 2: TEXT MESSAGE ANALYSIS */
export interface ThreatType {
  category: string;
  target: 'individual' | 'group' | 'institution' | 'self' | 'unknown';
  description: string;
}

export interface ThreatAssessment {
  verdict: 'THREATENING' | 'NOT_THREATENING' | 'AMBIGUOUS';
  confidence: number;
  threat_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  threat_types: ThreatType[];
  urgency: 'IMMEDIATE_ACTION' | 'MONITOR' | 'NO_ACTION';
  recommended_action: string;
}

export interface SentimentProfile {
  overall_sentiment: 'hostile' | 'aggressive' | 'neutral' | 'distressed' | 'manipulative' | 'positive';
  emotional_indicators: string[];
  escalation_risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ContextAnalysis {
  likely_intent: string;
  target_identified: boolean;
  personal_info_present: boolean;
  language: string;
}

export interface TextAnalysisResult {
  module: 'TEXT_ANALYSIS';
  MINOR_INVOLVED?: true;
  threat_assessment: ThreatAssessment;
  sentiment_profile: SentimentProfile;
  context_analysis: ContextAnalysis;
  summary: string;
}

/** Union type for both modules */
export type SentinelResult = AudioAnalysisResult | TextAnalysisResult;

// ─── LEGACY INTERFACE (for history/stats — kept for compatibility) ──────────────
export interface AnalysisResult {
  risk_score: number;
  risk_level: RiskLevel;
  detected_indicators: string[];
  explanation: string;
  confidence_level: ConfidenceLevel;
  content_type?: string;
  content_description?: string;
  /** Attached Sentinel structured result */
  sentinel?: SentinelResult;
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