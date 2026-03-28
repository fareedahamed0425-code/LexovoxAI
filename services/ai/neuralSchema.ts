/**
 * LexovoxAI — Neural Scoring Schema v2.0
 * ==========================================
 * Multi-layer scoring model that fuses NLP + Audio features
 * into a final risk assessment.
 *
 * Upgrades over v1.0:
 *  - Uses all new NLP features: tier1/tier2/combo/highRisk scores
 *  - Uses all new audio features: syntheticVoiceScore, anomalyScore, harmonicRatio
 *  - Context-aware weight adjustment (audio-only vs text-only vs combined)
 *  - Scam category amplification (if IRS scam detected → known high severity)
 *  - Confidence now counts indicator quality, not just quantity
 *  - Dynamic explanation generation using scam categories
 *  - Hard-floor risk: if Tier1 keyword detected → minimum "Suspicious"
 */

import { AnalysisResult, RiskLevel, ConfidenceLevel } from '../../types';
import { NLPFeatures } from './nlpEngine';
import { AudioFeatures } from './audioEngine';
import { RISK_SCORE_THRESHOLDS } from './threatPatterns';

// ─── WEIGHT MATRICES ──────────────────────────────────────────────────────────

// NLP feature weights — sum of all positive weights ≈ 1 (before sigmoid)
const NLP_WEIGHTS = {
  tier1Score: 0.55,           // Definitive threats — dominant signal
  tier2Score: 0.20,           // Strong indicators
  comboScore: 0.35,           // Pair co-occurrence — very reliable
  highRiskPatternScore: 0.40, // High-precision regex — increased weight
  manipulation: 0.15,         // Social engineering
  urgency: 0.12,              // Urgency pressure
  impersonation: 0.15,        // Authority claims
  scamDensity: 0.15,          // Overall keyword density
  benignOffset: -0.35,        // Reduced: don't let benign signals mask real threats
};

// Audio feature weights
const AUDIO_WEIGHTS = {
  syntheticVoiceScore: 0.50,  // Fused synthetic voice score (dominant)
  anomalyScore: 0.30,         // Overall audio anomaly
  spectralFlatness: 0.15,     // Supporting
  silenceRatio: 0.10,
  pitchVariance: -0.20,       // Natural pitch = safer
  harmonicRatio: -0.15,       // High harmonics = natural voice
  rmsEnergy: 0.05,
};

// Modality blend weights
const MODALITY_WEIGHTS = {
  nlpWeight: 0.65,
  audioWeight: 0.35,
};

// Category severity amplifiers (some scam types are inherently more severe)
const CATEGORY_AMPLIFIERS: Record<string, number> = {
  'IRS / Tax Scam': 1.25,
  'Social Security Scam': 1.25,
  'Gift Card Scam': 1.30,    // Gift cards = definitive scam signal
  'Tech Support Scam': 1.20,
  'Deepfake / Synthetic Voice': 1.35,
  'Sextortion': 1.40,
  'Romance Scam': 1.15,
  'Investment Fraud': 1.15,
  'Advance Fee / 419 Fraud': 1.10,
  'Vishing / Robocall': 1.10,
  'Grandparent Scam': 1.20,
  'Phishing / Credential Theft': 1.25,
};

// ─── MATH UTILITIES ──────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── NLP SCORE COMPUTATION ────────────────────────────────────────────────────

function computeNLPScore(features: NLPFeatures): number {
  const rawScore =
    features.tier1Score * NLP_WEIGHTS.tier1Score +
    features.tier2Score * NLP_WEIGHTS.tier2Score +
    features.comboScore * NLP_WEIGHTS.comboScore +
    features.highRiskPatternScore * NLP_WEIGHTS.highRiskPatternScore +
    features.manipulation * NLP_WEIGHTS.manipulation +
    features.urgency * NLP_WEIGHTS.urgency +
    features.impersonation * NLP_WEIGHTS.impersonation +
    features.scamDensity * NLP_WEIGHTS.scamDensity +
    features.benignOffset * NLP_WEIGHTS.benignOffset;

  // Apply category amplification (max amplifier if multiple categories)
  let amplifier = 1.0;
  for (const category of features.categoryMatches) {
    const amp = CATEGORY_AMPLIFIERS[category] ?? 1.0;
    if (amp > amplifier) amplifier = amp;
  }

  // Sigmoid with steeper slope — bias adjusted so moderate threats score correctly
  // At rawScore=0.40: biasedInput = 0.40*5.0-1.2 = 0.8 → sigmoid(0.8) = 0.69 → 69pts
  // At rawScore=0.25: biasedInput = 0.25*5.0-1.2 = 0.05 → sigmoid ≈ 0.51 → 51pts
  const biasedInput = rawScore * 5.0 - 1.2;
  const probability = sigmoid(biasedInput);

  return clamp(probability * 100 * amplifier, 0, 100);
}

// ─── AUDIO SCORE COMPUTATION ──────────────────────────────────────────────────

function computeAudioScore(features: AudioFeatures): number {
  const rawScore =
    features.syntheticVoiceScore * AUDIO_WEIGHTS.syntheticVoiceScore +
    features.anomalyScore * AUDIO_WEIGHTS.anomalyScore +
    (features.spectralFlatness > 0.58 ? features.spectralFlatness : 0) * AUDIO_WEIGHTS.spectralFlatness +
    (features.silenceRatio > 0.38 ? features.silenceRatio : 0) * AUDIO_WEIGHTS.silenceRatio +
    (1 - features.pitchVariance) * Math.abs(AUDIO_WEIGHTS.pitchVariance) +
    (1 - features.harmonicRatio) * Math.abs(AUDIO_WEIGHTS.harmonicRatio) +
    (features.rmsEnergy > 0.8 ? features.rmsEnergy : 0) * AUDIO_WEIGHTS.rmsEnergy;

  const biasedInput = rawScore * 5.5 - 2.5;
  const probability = sigmoid(biasedInput);

  return clamp(probability * 100, 0, 100);
}

// ─── HARD FLOOR RULE ─────────────────────────────────────────────────────────

/**
 * Applies hard floor rules: ensures certain definitive signals
 * always produce at minimum Suspicious classification.
 */
function applyHardFloors(
  score: number,
  nlpFeatures: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): number {
  let minScore = score;

  if (nlpFeatures) {
    // Any tier1 keyword match → minimum 52 (Suspicious)
    if (nlpFeatures.tier1Score > 0) {
      minScore = Math.max(minScore, 52);
    }
    // Strong tier1 hit → minimum 65
    if (nlpFeatures.tier1Score > 0.5) {
      minScore = Math.max(minScore, 65);
    }
    // Any high-risk pattern match → minimum 45
    if (nlpFeatures.highRiskPatternScore > 0) {
      minScore = Math.max(minScore, 45);
    }
    // Combo hit → minimum 58
    if (nlpFeatures.comboScore > 0.5) {
      minScore = Math.max(minScore, 58);
    }
    // Gift Card OR remote access category → minimum 65
    if (nlpFeatures.categoryMatches.includes('Gift Card Scam') ||
        nlpFeatures.categoryMatches.includes('Tech Support Scam')) {
      minScore = Math.max(minScore, 65);
    }
    // IRS + any combo → minimum 82
    if (nlpFeatures.categoryMatches.includes('IRS / Tax Scam') && nlpFeatures.comboScore > 0) {
      minScore = Math.max(minScore, 82);
    }
    // Multiple categories detected → minimum 70
    if (nlpFeatures.categoryMatches.length >= 2) {
      minScore = Math.max(minScore, 70);
    }
  }

  if (audioFeatures) {
    // Very high synthetic voice score → minimum 55
    if (audioFeatures.syntheticVoiceScore > 0.75) {
      minScore = Math.max(minScore, 55);
    }
  }

  return minScore;
}

// ─── COMBINED RISK SCORE ──────────────────────────────────────────────────────

export function computeRiskScore(
  nlpFeatures: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): number {
  const hasNLP = nlpFeatures !== null;
  const hasAudio = audioFeatures !== null;

  if (!hasNLP && !hasAudio) return 0;

  let score: number;

  if (hasNLP && !hasAudio) {
    score = computeNLPScore(nlpFeatures!);
  } else if (!hasNLP && hasAudio) {
    score = computeAudioScore(audioFeatures!);
  } else {
    const nlpScore = computeNLPScore(nlpFeatures!);
    const audioScore = computeAudioScore(audioFeatures!);
    score = clamp(
      nlpScore * MODALITY_WEIGHTS.nlpWeight +
      audioScore * MODALITY_WEIGHTS.audioWeight,
      0,
      100
    );
  }

  // Apply hard floor rules (ensure definitive threats aren't under-scored)
  score = applyHardFloors(score, nlpFeatures, audioFeatures);

  return clamp(score, 0, 100);
}

// ─── RISK LEVEL MAPPING ──────────────────────────────────────────────────────

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score <= RISK_SCORE_THRESHOLDS.SAFE_MAX) return RiskLevel.SAFE;
  if (score <= RISK_SCORE_THRESHOLDS.SUSPICIOUS_MAX) return RiskLevel.SUSPICIOUS;
  return RiskLevel.HIGH_RISK;
}

// ─── CONFIDENCE COMPUTATION ───────────────────────────────────────────────────

export function computeConfidence(
  nlpFeatures: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): ConfidenceLevel {
  let points = 0;

  if (nlpFeatures) {
    // Quality of NLP evidence
    points += nlpFeatures.tier1Score > 0 ? 4 : 0;
    points += nlpFeatures.tier1Score > 0.5 ? 3 : 0;
    points += nlpFeatures.comboScore > 0.5 ? 3 : 0;
    points += nlpFeatures.highRiskPatternScore > 0.3 ? 2 : 0;
    points += nlpFeatures.categoryMatches.length * 2;
    points += nlpFeatures.manipulation > 0.5 ? 2 : 0;
    points += nlpFeatures.textLength > 200 ? 1 : 0;
    points += nlpFeatures.textLength > 500 ? 1 : 0;
    points += nlpFeatures.indicators.length;
  }

  if (audioFeatures) {
    points += audioFeatures.syntheticVoiceScore > 0.7 ? 4 : 0;
    points += audioFeatures.syntheticVoiceScore > 0.45 ? 2 : 0;
    points += audioFeatures.anomalyScore > 0.5 ? 2 : 0;
    points += audioFeatures.durationSeconds > 10 ? 1 : 0;
    points += audioFeatures.indicators.length;
  }

  if (points >= 12) return ConfidenceLevel.HIGH;
  if (points >= 6) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

// ─── EXPLANATION GENERATOR ────────────────────────────────────────────────────

export function generateExplanation(
  score: number,
  riskLevel: RiskLevel,
  nlpFeatures: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): string {
  const parts: string[] = [];

  if (riskLevel === RiskLevel.SAFE) {
    parts.push(`LexovoxAI assessed this content as Safe (Neural Score: ${Math.round(score)}/100).`);

    if (nlpFeatures?.benignOffset && nlpFeatures.benignOffset > 0.2) {
      parts.push('Legitimate communication signals reduce threat probability significantly.');
    }
    if (nlpFeatures && nlpFeatures.tier1Score === 0 && nlpFeatures.comboScore === 0) {
      parts.push('No high-confidence threat keywords or dangerous phrase combinations were detected.');
    }
    if (audioFeatures && audioFeatures.syntheticVoiceScore < 0.25) {
      parts.push('Audio analysis confirms natural human voice characteristics.');
    }
    parts.push('Standard precaution advised. No action required.');

  } else if (riskLevel === RiskLevel.SUSPICIOUS) {
    parts.push(`LexovoxAI flagged this content as Suspicious (Neural Score: ${Math.round(score)}/100).`);

    if (nlpFeatures?.categoryMatches.length) {
      parts.push(`Detected pattern: ${nlpFeatures.categoryMatches[0]}.`);
    }
    if (nlpFeatures?.tier2Score > 0) {
      parts.push('Multiple threat-associated keywords were identified in the content.');
    }
    if (audioFeatures?.syntheticVoiceScore && audioFeatures.syntheticVoiceScore > 0.35) {
      parts.push('Audio displays some characteristics of synthetic/AI-generated voices.');
    }
    parts.push('Evidence is present but not conclusive. Verify the source through official channels before responding.');

  } else {
    // HIGH RISK
    parts.push(`⚠ CRITICAL THREAT DETECTED — Neural Score: ${Math.round(score)}/100.`);

    if (nlpFeatures?.categoryMatches.length) {
      parts.push(
        `Classification: ${nlpFeatures.categoryMatches.slice(0, 2).join(' + ')} — a known high-risk fraud vector.`
      );
    }
    if (nlpFeatures?.tier1Score > 0.4) {
      parts.push(
        'Definitive threat phrases were identified that are almost exclusively used in fraud/scam communications.'
      );
    }
    if (nlpFeatures?.comboScore > 0.5) {
      parts.push(
        'Dangerous phrase combinations detected — co-occurring threat signals amplify risk classification.'
      );
    }
    if (nlpFeatures?.manipulation > 0.5) {
      parts.push(
        'Advanced social engineering tactics confirmed — psychological pressure and isolation language is present.'
      );
    }
    if (audioFeatures?.syntheticVoiceScore && audioFeatures.syntheticVoiceScore > 0.65) {
      parts.push(
        `Audio forensics: ${Math.round(audioFeatures.syntheticVoiceScore * 100)}% probability of AI-generated/cloned voice — potential deepfake scam call.`
      );
    }
    parts.push(
      'DO NOT comply with any requests. DO NOT send money, provide personal information, or allow remote access. Report immediately to the FTC at reportfraud.ftc.gov.'
    );
  }

  return parts.join(' ');
}

// ─── MASTER RUNNER ────────────────────────────────────────────────────────────

export function runNeuralSchema(
  nlpFeatures: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): AnalysisResult {
  const score = computeRiskScore(nlpFeatures, audioFeatures);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = computeConfidence(nlpFeatures, audioFeatures);
  const explanation = generateExplanation(score, riskLevel, nlpFeatures, audioFeatures);

  // Merge all indicators
  const allIndicators: string[] = [
    `Neural Risk Score: ${Math.round(score)}/100`,
    ...(nlpFeatures?.indicators ?? []),
    ...(audioFeatures?.indicators ?? []),
  ];

  // Prefix primary scam type if known
  if (nlpFeatures?.detectedScamType && nlpFeatures.detectedScamType !== 'No clear category') {
    allIndicators.unshift(`Primary threat category: ${nlpFeatures.detectedScamType}`);
  }

  return {
    risk_score: Math.round(score),
    risk_level: riskLevel,
    confidence_level: confidence,
    detected_indicators: [...new Set(allIndicators)].slice(0, 12),
    explanation,
    content_type:
      nlpFeatures && audioFeatures
        ? 'Multi-modal (Text + Audio)'
        : audioFeatures
          ? 'Audio Forensic Analysis'
          : 'Text / Transcript Analysis',
    content_description: `LexovoxAI Engine v2.0 — On-Device Analysis — ${new Date().toLocaleString()}`,
  };
}
