/**
 * LexovoxAI — Advanced NLP Engine v2.0
 * =======================================
 * Context-aware, multi-layer text threat analysis pipeline.
 * 
 * Key improvements over v1.0:
 *  - Weighted keyword scoring (not all keywords equal)
 *  - Combo threat detection (co-occurrence amplification)
 *  - Sentence-level coercion analysis
 *  - Scam category classification with confidence
 *  - High/medium risk pattern matching
 *  - Named entity approximation (agency detection)
 *  - Negation detection (reduces false positives)
 *  - Dynamic indicator generation (specific, not generic)
 */

import {
  TIER1_THREAT_KEYWORDS,
  TIER2_THREAT_KEYWORDS,
  TIER3_CONTEXTUAL_KEYWORDS,
  COMBO_THREAT_PAIRS,
  HIGH_RISK_PATTERNS,
  MEDIUM_RISK_PATTERNS,
  SCAM_CATEGORIES,
  URGENCY_PHRASES,
  IMPERSONATION_SIGNALS,
  SOCIAL_ENGINEERING_PATTERNS,
  BENIGN_INDICATORS,
  KEYWORD_WEIGHTS,
} from './threatPatterns';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface NLPFeatures {
  urgency: number;              // 0–1
  impersonation: number;        // 0–1
  manipulation: number;         // 0–1
  scamDensity: number;          // 0–1 weighted keyword density
  tier1Score: number;           // 0–1 definitive threat keyword score
  tier2Score: number;           // 0–1 strong indicator score
  comboScore: number;           // 0–1 co-occurrence amplification
  highRiskPatternScore: number; // 0–1 high-precision regex matches
  categoryMatches: string[];    // detected scam categories
  textLength: number;
  tokenCount: number;
  sentenceCount: number;
  indicators: string[];
  benignOffset: number;
  detectedScamType: string;     // primary scam classification
}

// ─── TEXT NORMALIZER ──────────────────────────────────────────────────────────

/**
 * Normalize text: lowercase, collapse whitespace, expand contractions.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/won't/g, 'will not')
    .replace(/can't/g, 'cannot')
    .replace(/don't/g, 'do not')
    .replace(/doesn't/g, 'does not')
    .replace(/didn't/g, 'did not')
    .replace(/aren't/g, 'are not')
    .replace(/isn't/g, 'is not')
    .replace(/haven't/g, 'have not')
    .replace(/hasn't/g, 'has not')
    .replace(/shouldn't/g, 'should not')
    .replace(/wouldn't/g, 'would not')
    .replace(/couldn't/g, 'could not')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into lowercase words.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Split text into sentences.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

/**
 * Term frequency map.
 */
export function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return freq;
}

// ─── WEIGHTED KEYWORD SCORING ─────────────────────────────────────────────────

/**
 * Computes a weighted keyword match score.
 * Uses KEYWORD_WEIGHTS for precise per-keyword weighting.
 * Returns raw weighted hit sum (not capped — used for further normalization).
 */
function weightedKeywordScore(
  normalizedText: string,
  keywords: string[],
  defaultWeight: number
): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    if (normalizedText.includes(kwLower)) {
      const weight = KEYWORD_WEIGHTS[kwLower] ?? defaultWeight;
      score += weight;
      matched.push(kw);
    }
  }

  return { score, matched };
}

// ─── TIER SCORING ──────────────────────────────────────────────────────────────

/**
 * Tier 1: Definitive threats — highest weight keywords.
 * Even 1 match = high tier1 score.
 */
export function tier1Score(normalizedText: string): { score: number; matched: string[] } {
  const { score, matched } = weightedKeywordScore(normalizedText, TIER1_THREAT_KEYWORDS, 2.5);
  // 1 tier1 hit (avg weight 2.5) → 2.5/3.0 = 0.83; 2+ hits → capped at 1.0
  return { score: Math.min(score / 3.0, 1.0), matched };
}

/**
 * Tier 2: Strong indicators — context-dependent.
 * Need 3–4 hits for a meaningful signal.
 */
export function tier2Score(normalizedText: string): { score: number; matched: string[] } {
  const { score, matched } = weightedKeywordScore(normalizedText, TIER2_THREAT_KEYWORDS, 1.0);
  // 2 tier2 hits → ~0.2; 8 hits → ~0.8
  return { score: Math.min(score / 10.0, 1.0), matched };
}

/**
 * Tier 3: Contextual signals — weak alone but boost other scores.
 */
export function tier3Score(normalizedText: string): number {
  const { score } = weightedKeywordScore(normalizedText, TIER3_CONTEXTUAL_KEYWORDS, 0.5);
  return Math.min(score / 8.0, 1.0);
}

// ─── COMBO DETECTION ─────────────────────────────────────────────────────────

/**
 * Detects co-occurring threat pairs. Each matched pair amplifies risk.
 * Returns 0–1 score and matched pair labels.
 */
export function comboThreatScore(normalizedText: string): { score: number; matched: string[] } {
  let hits = 0;
  const matched: string[] = [];

  for (const [termA, termB] of COMBO_THREAT_PAIRS) {
    const aPresent = normalizedText.includes(termA.toLowerCase());
    const bPresent = normalizedText.includes(termB.toLowerCase());
    if (aPresent && bPresent) {
      hits++;
      matched.push(`"${termA}" + "${termB}"`);
    }
  }

  // Each combo pair is a very strong signal — 1 pair → 0.67; 2+ pairs → 1.0
  return { score: Math.min(hits / 1.5, 1.0), matched };
}

// ─── PATTERN MATCHING ─────────────────────────────────────────────────────────

/**
 * Runs all HIGH_RISK_PATTERNS regex against text.
 * Returns 0–1 score and matched pattern extracts.
 */
export function highRiskPatternScore(text: string): { score: number; extracts: string[] } {
  let hits = 0;
  const extracts: string[] = [];

  for (const pattern of HIGH_RISK_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      hits++;
      // Capture a short excerpt of the matched text
      const excerpt = match[0].substring(0, 60).trim();
      if (extracts.length < 5) extracts.push(excerpt);
    }
  }

  return { score: Math.min(hits / 2.0, 1.0), extracts };
}

/**
 * Runs MEDIUM_RISK_PATTERNS — count for boost but not primary score.
 */
export function mediumRiskPatternScore(text: string): number {
  let hits = 0;
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) hits++;
  }
  return Math.min(hits / 4.0, 1.0);
}

// ─── SCAM CATEGORY CLASSIFIER ─────────────────────────────────────────────────

/**
 * Classifies text into scam categories using category signature patterns.
 * Returns list of matched categories with confidence labels.
 */
export function classifyScamCategories(text: string): string[] {
  const matchedCategories: string[] = [];

  for (const [category, patterns] of Object.entries(SCAM_CATEGORIES)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        matchedCategories.push(category);
        break; // one match per category is enough
      }
    }
  }

  return matchedCategories;
}

// ─── URGENCY SCORING ─────────────────────────────────────────────────────────

/**
 * Returns 0–1 urgency score from expanded urgency phrase list.
 */
export function urgencyScore(normalizedText: string): number {
  let hits = 0;
  let weightedHits = 0;

  for (const phrase of URGENCY_PHRASES) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      hits++;
      const weight = KEYWORD_WEIGHTS[phrase] ?? 1.0;
      weightedHits += weight;
    }
  }

  // Cap: 2 weighted urgency signals → score near 1.0
  return Math.min(weightedHits / 3.0, 1.0);
}

// ─── IMPERSONATION SCORING ────────────────────────────────────────────────────

/**
 * Returns 0–1 impersonation score using exhaustive authority-claim list.
 */
export function impersonationScore(normalizedText: string): number {
  let hits = 0;

  for (const signal of IMPERSONATION_SIGNALS) {
    if (normalizedText.includes(signal.toLowerCase())) {
      hits++;
    }
  }

  // 1 hit → moderate signal; 2+ hits → strong signal
  return Math.min(hits / 1.5, 1.0);
}

// ─── SOCIAL ENGINEERING SCORING ──────────────────────────────────────────────

/**
 * Returns 0–1 manipulation score from advanced SE regex patterns.
 */
export function manipulationScore(text: string): number {
  let hits = 0;

  for (const pattern of SOCIAL_ENGINEERING_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      hits++;
    }
  }

  // 1 match → 0.5; 2 matches → 1.0
  return Math.min(hits / 2.0, 1.0);
}

// ─── BENIGN SCORING ───────────────────────────────────────────────────────────

/**
 * Returns 0–1 benign offset — reduces false positives.
 */
export function benignScore(normalizedText: string): number {
  let hits = 0;

  for (const indicator of BENIGN_INDICATORS) {
    if (normalizedText.includes(indicator.toLowerCase())) {
      hits++;
    }
  }

  return Math.min(hits / 3.0, 1.0);
}

// ─── SENTENCE-LEVEL COERCION DETECTION ────────────────────────────────────────

/**
 * Analyzes individual sentences for coercive structures.
 * Pattern: "X UNLESS/OR you Y" — threat + consequence.
 */
export function sentenceCoercionScore(text: string): number {
  const sentences = splitSentences(text);
  const coercionPatterns = [
    /\b(unless|or\s+(you|else))\b.{0,40}\b(arrested|sued|deported|charged|prosecuted|face\s+consequences)/gi,
    /\b(if\s+you\s+(do\s+not|don't|fail\s+to))\b.{0,50}\b(arrest|legal|action|charges|prosecute)/gi,
    /\b(pay|send|transfer)\b.{0,30}\b(or\s+(you|we\s+will|they\s+will))\b/gi,
    /\b(cooperate|comply|agree)\b.{0,30}\b(or\s+(face|be\s+charged|be\s+arrested))\b/gi,
  ];

  let coerciveSentences = 0;
  for (const sentence of sentences) {
    for (const pattern of coercionPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(sentence)) {
        coerciveSentences++;
        break;
      }
    }
  }

  return Math.min(coerciveSentences / 2.0, 1.0);
}

// ─── INDICATOR SYNTHESIS ──────────────────────────────────────────────────────

/**
 * Synthesizes all analysis results into specific, actionable indicator strings.
 * These appear directly in the UI analysis results.
 */
export function synthesizeIndicators(
  tier1: { matched: string[] },
  tier2: { matched: string[] },
  combo: { matched: string[] },
  highRisk: { extracts: string[] },
  categories: string[],
  urgency: number,
  impersonation: number,
  manipulation: number,
  coercion: number,
  normalizedText: string
): string[] {
  const indicators: string[] = [];

  // Category-based indicators (most important to show first)
  if (categories.length > 0) {
    indicators.push(`Scam type detected: ${categories.slice(0, 3).join(', ')}`);
  }

  // Tier 1 keyword matches — show actual matched terms
  if (tier1.matched.length > 0) {
    const sample = tier1.matched.slice(0, 2).map(k => `"${k}"`).join(', ');
    indicators.push(`High-confidence threat phrase: ${sample}`);
  }

  // Combo threat pairs
  if (combo.matched.length > 0) {
    indicators.push(`Threat signal combination: ${combo.matched[0]}`);
    if (combo.matched.length > 1) {
      indicators.push(`Additional combo: ${combo.matched[1]}`);
    }
  }

  // High-risk regex extracts
  if (highRisk.extracts.length > 0) {
    indicators.push(`Pattern match: "${highRisk.extracts[0]}"`);
  }

  // Specific threat category checks
  if (/\b(irs|internal\s+revenue|tax\s+debt)\b/i.test(normalizedText)) {
    indicators.push('IRS/Tax authority impersonation detected');
  }
  if (/\b(social\s+security|ssa|ssn)\b.{0,40}\b(suspend|criminal|compromised|illegal)\b/gi.test(normalizedText)) {
    indicators.push('Social Security Administration impersonation — SSN threat scam');
  }
  if (/\b(gift\s+card|itunes|google\s+play|steam|amazon\s+card)\b/i.test(normalizedText)) {
    indicators.push('Gift card payment demand — #1 indicator of phone/government scam');
  }
  if (/\b(bitcoin|btc|crypto|ethereum|usdt|tether)\b/i.test(normalizedText)) {
    indicators.push('Cryptocurrency payment demand — common in blackmail/scam vectors');
  }
  if (/\b(anydesk|teamviewer|ultraviewer|logmein|remote\s+access)\b/i.test(normalizedText)) {
    indicators.push('Remote computer access requested — tech support scam indicator');
  }
  if (/\b(ssn|social\s+security\s+number|bank\s+account\s+number|routing\s+number|card\s+number|cvv|pin)\b/i.test(normalizedText)) {
    indicators.push('PII/credential harvesting attempt — personal financial data requested');
  }
  if (/\b(warrant|arrest|criminal\s+charges|prosecuted|deported)\b/i.test(normalizedText)) {
    indicators.push('Legal threat coercion — arrest/deportation used as pressure tactic');
  }
  if (/\b(wire\s+transfer|western\s+union|moneygram|wire\s+the\s+money)\b/i.test(normalizedText)) {
    indicators.push('Wire transfer demand — untraceable payment method preferred by fraudsters');
  }
  if (urgency >= 0.4) {
    const urgMatch = URGENCY_PHRASES.find(p => normalizedText.includes(p));
    indicators.push(`Time-pressure manipulation: "${urgMatch ?? 'urgent demand detected'}"`);
  }
  if (impersonation >= 0.5) {
    indicators.push('Authority impersonation — caller/sender is falsely claiming government/law status');
  }
  if (manipulation >= 0.5) {
    indicators.push('Social engineering pattern confirmed — psychological pressure tactics employed');
  }
  if (coercion >= 0.5) {
    indicators.push('Coercive sentence structure: "pay or face [consequences]"');
  }

  // Specific rare but devastating patterns
  if (/\b(sextortion|explicit\s+video|intimate\s+photos|embarrassing\s+footage)\b/i.test(normalizedText)) {
    indicators.push('Sextortion attempt — explicit material used as blackmail leverage');
  }
  if (/\b(grandchild|grandson|granddaughter)\b.{0,60}\b(arrested|trouble|bail|money)\b/gi.test(normalizedText)) {
    indicators.push('Grandparent scam — impersonating family member in distress');
  }
  if (/\b(inheritance|deceased\s+relative|next\s+of\s+kin|unclaimed\s+funds)\b/i.test(normalizedText)) {
    indicators.push('Advance fee (419) scam — fake inheritance/funds transfer scheme');
  }
  if (/\b(investment|trading|forex|crypto)\b.{0,30}\b(guaranteed|risk[\-\s]free|double)\b/gi.test(normalizedText)) {
    indicators.push('Investment fraud — guaranteed returns are always a scam signal');
  }

  // Tier 2 summary if no specific categories caught
  if (indicators.length === 0 && tier2.matched.length >= 3) {
    indicators.push(`Multiple threat indicators: ${tier2.matched.slice(0, 4).join(', ')}`);
  }

  return [...new Set(indicators)].slice(0, 10); // deduplicate, max 10 indicators
}

// ─── MASTER NLP FEATURE EXTRACTOR ────────────────────────────────────────────

/**
 * Master function — full multi-layer NLP analysis pipeline.
 */
export function extractNLPFeatures(text: string): NLPFeatures {
  const normalizedText = normalizeText(text);
  const tokens = tokenize(text);
  const sentences = splitSentences(text);

  // Run all scoring layers
  const tier1Result = tier1Score(normalizedText);
  const tier2Result = tier2Score(normalizedText);
  const tier3 = tier3Score(normalizedText);
  const comboResult = comboThreatScore(normalizedText);
  const highRiskResult = highRiskPatternScore(text);
  const mediumRisk = mediumRiskPatternScore(text);
  const categories = classifyScamCategories(text);
  const urgency = urgencyScore(normalizedText);
  const impersonation = impersonationScore(normalizedText);
  const manipulation = manipulationScore(text);
  const coercion = sentenceCoercionScore(text);
  const benignOffset = benignScore(normalizedText);

  // Compute combined scam density: weighted combination of all tier scores
  const scamDensity = Math.min(
    tier1Result.score * 0.50 +
    tier2Result.score * 0.25 +
    comboResult.score * 0.15 +
    tier3 * 0.10,
    1.0
  );

  // Synthesize human-readable indicators
  const indicators = synthesizeIndicators(
    tier1Result,
    tier2Result,
    comboResult,
    highRiskResult,
    categories,
    urgency,
    impersonation,
    manipulation,
    coercion,
    normalizedText
  );

  // Determine primary scam type
  const detectedScamType = categories.length > 0
    ? categories[0]
    : tier1Result.matched.length > 0
      ? 'Unknown Fraud'
      : 'No clear category';

  return {
    urgency,
    impersonation,
    manipulation,
    scamDensity,
    tier1Score: tier1Result.score,
    tier2Score: tier2Result.score,
    comboScore: comboResult.score,
    highRiskPatternScore: highRiskResult.score,
    categoryMatches: categories,
    textLength: text.length,
    tokenCount: tokens.length,
    sentenceCount: sentences.length,
    indicators,
    benignOffset,
    detectedScamType,
  };
}
