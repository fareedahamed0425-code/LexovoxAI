/**
 * SentinAI — NVIDIA NIM Service (Multi-Algorithm Ensemble)
 * ==========================================================
 * Calls deepseek-ai/deepseek-v4-flash via NVIDIA's OpenAI-compatible API
 * with streaming + DeepSeek thinking mode (reasoning_effort: high).
 *
 * ENSEMBLE APPROACH
 * -----------------
 * Before hitting the LLM, we run all local analysis algorithms:
 *   1. Tier-1/2/3 weighted keyword scoring (threatPatterns.ts)
 *   2. Combo threat pair co-occurrence detector
 *   3. High-precision regex pattern matching (26 patterns)
 *   4. Scam category classifier (15 categories)
 *   5. Urgency / time-pressure scorer
 *   6. Authority impersonation scorer
 *   7. Social engineering / manipulation scorer
 *   8. Sentence-level coercion detector
 *   9. Benign indicator offset (false positive suppressor)
 *
 * The pre-analysis brief is injected into the DeepSeek system prompt,
 * giving the LLM structured signals to reason about rather than raw text alone.
 * DeepSeek then validates, enriches, and finalises the verdict.
 *
 * Endpoint:  https://integrate.api.nvidia.com/v1
 * Model:     deepseek-ai/deepseek-v4-flash
 * SDK:       openai (npm)
 */

import OpenAI from 'openai';
import {
  AnalysisResult,
  RiskLevel,
  ConfidenceLevel,
  SentinelResult,
  TextAnalysisResult,
  AudioAnalysisResult,
} from '../types';

// Local algorithm imports
import { extractNLPFeatures, NLPFeatures } from './ai/nlpEngine';

// ── Config ────────────────────────────────────────────────────────────────────
const NVIDIA_API_KEY =
  (import.meta.env.VITE_NVIDIA_API_KEY as string | undefined) ??
  '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';

const NVIDIA_BASE_URL =
  (import.meta.env.VITE_NVIDIA_BASE_URL as string | undefined) ??
  'https://integrate.api.nvidia.com/v1';

const NVIDIA_MODEL =
  (import.meta.env.VITE_NVIDIA_MODEL as string | undefined) ??
  'deepseek-ai/deepseek-v4-flash';

// dangerouslyAllowBrowser: required because the app runs in-browser (Electron/Vite)
const client = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
  dangerouslyAllowBrowser: true,
});

// ── Public types ──────────────────────────────────────────────────────────────
export interface NvidiaStatus {
  available: boolean;
  model: string;
  baseUrl: string;
}

/** Called incrementally with reasoning tokens and/or answer tokens */
export type StreamCallback = (opts: {
  reasoning?: string;
  content?: string;
  done: boolean;
}) => void;

// ── Pre-analysis brief builder ────────────────────────────────────────────────

/**
 * Runs all local NLP algorithms on the text and returns a structured
 * pre-analysis brief string that will be injected into the system prompt.
 * This gives DeepSeek rich signal context before it reads the raw text.
 */
function buildPreAnalysisBrief(features: NLPFeatures): string {
  const f = features;

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const lines: string[] = [
    '=== LOCAL ALGORITHM PRE-ANALYSIS BRIEF ===',
    'The following signals were computed by 9 independent local algorithms BEFORE you see the text.',
    'Use these as strong prior evidence when forming your verdict.',
    '',
    '[ Algorithm 1 — Tier-1 Weighted Keyword Scorer (Definitive Threat Phrases) ]',
    `  Score: ${pct(f.tier1Score)} | Confidence: ${f.tier1Score >= 0.5 ? 'HIGH' : f.tier1Score >= 0.2 ? 'MEDIUM' : 'LOW'}`,
    `  Finding: ${f.tier1Score >= 0.5 ? '⚠ Definitive threat keywords detected' : f.tier1Score >= 0.2 ? 'Possible threat keywords present' : 'No definitive threat keywords found'}`,
    '',
    '[ Algorithm 2 — Tier-2 Contextual Keyword Scorer (Strong Indicators) ]',
    `  Score: ${pct(f.tier2Score)} | Finding: ${f.tier2Score >= 0.4 ? '⚠ Multiple strong threat indicators' : f.tier2Score >= 0.15 ? 'Some threat indicator terms present' : 'Low threat indicator density'}`,
    '',
    '[ Algorithm 3 — Combo Threat Pair Detector (Co-occurrence Amplifier) ]',
    `  Score: ${pct(f.comboScore)} | Finding: ${f.comboScore >= 0.5 ? '⚠ CRITICAL — dangerous keyword combinations detected' : f.comboScore >= 0.2 ? 'Some co-occurring threat terms' : 'No dangerous keyword co-occurrences'}`,
    '',
    '[ Algorithm 4 — High-Precision Regex Pattern Matcher (26 patterns) ]',
    `  Score: ${pct(f.highRiskPatternScore)} | Finding: ${f.highRiskPatternScore >= 0.5 ? '⚠ High-risk structural patterns matched' : f.highRiskPatternScore >= 0.25 ? 'Some suspicious phrase structures detected' : 'No high-risk patterns matched'}`,
    '',
    '[ Algorithm 5 — Scam Category Classifier (15 categories) ]',
    `  Categories detected: ${f.categoryMatches.length > 0 ? f.categoryMatches.join(', ') : 'None'}`,
    `  Primary classification: ${f.detectedScamType}`,
    '',
    '[ Algorithm 6 — Urgency / Time-Pressure Scorer ]',
    `  Score: ${pct(f.urgency)} | Finding: ${f.urgency >= 0.5 ? '⚠ High time-pressure manipulation detected' : f.urgency >= 0.25 ? 'Moderate urgency language present' : 'No urgency manipulation detected'}`,
    '',
    '[ Algorithm 7 — Authority Impersonation Scorer ]',
    `  Score: ${pct(f.impersonation)} | Finding: ${f.impersonation >= 0.5 ? '⚠ Strong government/authority impersonation signals' : f.impersonation >= 0.25 ? 'Some authority claim language' : 'No impersonation signals'}`,
    '',
    '[ Algorithm 8 — Social Engineering / Manipulation Scorer ]',
    `  Score: ${pct(f.manipulation)} | Finding: ${f.manipulation >= 0.5 ? '⚠ Confirmed social engineering patterns' : f.manipulation >= 0.25 ? 'Some manipulation tactics present' : 'No manipulation patterns detected'}`,
    '',
    '[ Algorithm 9 — Sentence-Level Coercion Detector ]',
    `  Score: ${pct(f.comboScore)} | Finding: ${f.manipulation >= 0.5 ? '⚠ Coercive sentence structures detected (pay-or-else)' : 'No coercion structures found'}`,
    '',
    '[ Benign Offset (False Positive Suppressor) ]',
    `  Offset: ${pct(f.benignOffset)} | ${f.benignOffset >= 0.4 ? 'Strong benign signals — reduce score' : f.benignOffset >= 0.2 ? 'Some benign indicators present' : 'No benign signals — do not reduce risk'}`,
    '',
    '[ Composite Scam Density ]',
    `  Overall density: ${pct(f.scamDensity)} — ${f.scamDensity >= 0.6 ? '⚠ HIGH' : f.scamDensity >= 0.3 ? 'MEDIUM' : 'LOW'}`,
    '',
    '[ Pre-computed Indicators ]',
    ...(f.indicators.length > 0
      ? f.indicators.map(i => `  • ${i}`)
      : ['  • No specific indicators flagged by local algorithms']),
    '',
    '=== END OF PRE-ANALYSIS BRIEF ===',
    '',
    'Now analyse the original text below and produce a final verdict that reconciles',
    'your own deep reasoning WITH the algorithmic signals above.',
    'If you disagree with any algorithm finding, explain why in your reasoning.',
  ];

  return lines.join('\n');
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildTextSystemPrompt(features: NLPFeatures): string {
  const brief = buildPreAnalysisBrief(features);
  return `You are SentinAI, an expert threat-intelligence analyst combining classical NLP algorithms with deep language understanding.

${brief}

After reading the text, return a JSON object with EXACTLY this structure — no prose, no markdown fences:

{
  "risk_score": <integer 0-100>,
  "risk_level": <"Safe" | "Suspicious" | "High Risk">,
  "confidence_level": <"Low" | "Medium" | "High">,
  "detected_indicators": [<string>, ...],
  "explanation": "<one concise paragraph that references both algorithm findings and your own linguistic analysis>",
  "sentinel": {
    "module": "TEXT_ANALYSIS",
    "threat_assessment": {
      "verdict": <"THREATENING" | "NOT_THREATENING" | "AMBIGUOUS">,
      "confidence": <float 0-1>,
      "threat_level": <"CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE">,
      "threat_types": [{ "category": "<string>", "target": <"individual"|"group"|"institution"|"self"|"unknown">, "description": "<string>" }],
      "urgency": <"IMMEDIATE_ACTION" | "MONITOR" | "NO_ACTION">,
      "recommended_action": "<string>"
    },
    "sentiment_profile": {
      "overall_sentiment": <"hostile"|"aggressive"|"neutral"|"distressed"|"manipulative"|"positive">,
      "emotional_indicators": [<string>, ...],
      "escalation_risk": <"HIGH" | "MEDIUM" | "LOW">
    },
    "context_analysis": {
      "likely_intent": "<string>",
      "target_identified": <boolean>,
      "personal_info_present": <boolean>,
      "language": "<ISO 639-1 code>"
    },
    "summary": "<two-sentence summary>"
  }
}`;
}

function buildAudioSystemPrompt(): string {
  return `You are SentinAI, an expert forensic audio analyst.
The user will provide a description of an audio sample. Analyse it and return a JSON object with EXACTLY this structure — no prose, no markdown fences:

{
  "risk_score": <integer 0-100>,
  "risk_level": <"Safe" | "Suspicious" | "High Risk">,
  "confidence_level": <"Low" | "Medium" | "High">,
  "detected_indicators": [<string>, ...],
  "explanation": "<one concise paragraph>",
  "sentinel": {
    "module": "AUDIO_ANALYSIS",
    "harmful_content": {
      "verdict": <"HARMFUL" | "SAFE" | "REVIEW_NEEDED">,
      "confidence": <float 0-1>,
      "risk_level": <"CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE">,
      "flags": [{ "type": "<string>", "timestamp": <"HH:MM:SS" | null>, "excerpt": "<string>", "severity": <"HIGH"|"MEDIUM"|"LOW"> }],
      "summary": "<string>"
    },
    "music_identification": {
      "is_music": <boolean>,
      "found_online": <boolean | "unknown">,
      "track_details": { "title": <string|null>, "artist": <string|null>, "album": <string|null>, "release_year": <string|null>, "genre": <string|null>, "origin_country": <string|null>, "language": <string|null>, "label": <string|null> },
      "streaming_availability": [<string>, ...],
      "copyright_status": <"COPYRIGHTED" | "PUBLIC_DOMAIN" | "UNKNOWN">,
      "notes": "<string>"
    },
    "speech_analysis": {
      "detected_language": "<string>",
      "speaker_count": <"1" | "multiple" | "unknown">,
      "content_type": <"music" | "speech" | "mixed" | "ambient" | "unknown">,
      "key_themes": [<string>, ...]
    }
  }
}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapRiskLevel(raw: string): RiskLevel {
  if (raw === 'High Risk') return RiskLevel.HIGH_RISK;
  if (raw === 'Suspicious') return RiskLevel.SUSPICIOUS;
  return RiskLevel.SAFE;
}

function mapConfidence(raw: string): ConfidenceLevel {
  if (raw === 'High') return ConfidenceLevel.HIGH;
  if (raw === 'Medium') return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

// ── Core streaming call ───────────────────────────────────────────────────────

async function callNvidiaNim(
  systemPrompt: string,
  userContent: string,
  onStream?: StreamCallback
): Promise<string> {
  const stream = await client.chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    // @ts-ignore — NVIDIA-specific extension for DeepSeek thinking mode
    chat_template_kwargs: { thinking: true, reasoning_effort: 'high' },
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as any;
    const reasoning: string | undefined =
      delta?.reasoning || delta?.reasoning_content || undefined;
    const content: string | undefined = delta?.content || undefined;

    if (reasoning) onStream?.({ reasoning, done: false });
    if (content) {
      fullContent += content;
      onStream?.({ content, done: false });
    }
  }

  onStream?.({ done: true });
  return fullContent;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function checkNvidiaStatus(): Promise<NvidiaStatus> {
  return {
    available: Boolean(NVIDIA_API_KEY && NVIDIA_API_KEY.startsWith('nvapi-')),
    model: NVIDIA_MODEL,
    baseUrl: NVIDIA_BASE_URL,
  };
}

/**
 * TEXT analysis — ensemble of 9 local algorithms + DeepSeek reasoning.
 *
 * Flow:
 *   1. Run all local NLP algorithms on the raw text
 *   2. Build a structured pre-analysis brief from algorithm outputs
 *   3. Inject the brief into the DeepSeek system prompt
 *   4. Stream DeepSeek's reasoning + final JSON verdict
 *   5. Merge: include LOCAL algorithm indicators alongside LLM indicators
 */
export async function analyzeTextWithNvidia(
  content: string,
  onStream?: StreamCallback
): Promise<AnalysisResult> {
  // Step 1: Run all local algorithms
  console.log('[SentinAI] Running 9 local algorithms on text...');
  const features = extractNLPFeatures(content);
  console.log('[SentinAI] Pre-analysis brief ready:', {
    tier1: features.tier1Score.toFixed(2),
    tier2: features.tier2Score.toFixed(2),
    combo: features.comboScore.toFixed(2),
    categories: features.categoryMatches,
    scamDensity: features.scamDensity.toFixed(2),
  });

  // Step 2: Build prompt with algorithm brief
  const systemPrompt = buildTextSystemPrompt(features);

  // Step 3: Call DeepSeek with streaming
  const raw = await callNvidiaNim(systemPrompt, content, onStream);
  const parsed = JSON.parse(extractJson(raw));

  // Step 4: Merge LLM indicators with locally detected ones (deduplicated)
  const llmIndicators: string[] = Array.isArray(parsed.detected_indicators)
    ? parsed.detected_indicators
    : [];
  const mergedIndicators = [
    ...new Set([...features.indicators, ...llmIndicators]),
  ].slice(0, 12);

  const sentinel: SentinelResult = {
    ...(parsed.sentinel as TextAnalysisResult),
    module: 'TEXT_ANALYSIS',
  };

  return {
    risk_score: Number(parsed.risk_score ?? 0),
    risk_level: mapRiskLevel(parsed.risk_level ?? 'Safe'),
    confidence_level: mapConfidence(parsed.confidence_level ?? 'Low'),
    detected_indicators: mergedIndicators,
    explanation: parsed.explanation ?? '',
    content_type: 'text',
    sentinel,
  };
}

/**
 * AUDIO analysis — DeepSeek description-based forensic analysis with streaming.
 */
export async function analyzeAudioWithNvidia(
  description: string,
  onStream?: StreamCallback
): Promise<AnalysisResult> {
  const systemPrompt = buildAudioSystemPrompt();
  const raw = await callNvidiaNim(systemPrompt, description, onStream);
  const parsed = JSON.parse(extractJson(raw));

  const sentinel: SentinelResult = {
    ...(parsed.sentinel as AudioAnalysisResult),
    module: 'AUDIO_ANALYSIS',
  };

  return {
    risk_score: Number(parsed.risk_score ?? 0),
    risk_level: mapRiskLevel(parsed.risk_level ?? 'Safe'),
    confidence_level: mapConfidence(parsed.confidence_level ?? 'Low'),
    detected_indicators: Array.isArray(parsed.detected_indicators)
      ? parsed.detected_indicators
      : [],
    explanation: parsed.explanation ?? '',
    content_type: 'audio',
    sentinel,
  };
}
