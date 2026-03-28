/**
 * LexovoxAI — Text Analysis Engine (Module 2)
 * ================================================
 * Produces structured TEXT_ANALYSIS JSON conforming to the LexovoxAI spec.
 * Routes through the existing NLP pipeline then maps results to the
 * structured schema: threat_assessment, sentiment_profile, context_analysis.
 */

import {
  TextAnalysisResult,
  ThreatAssessment,
  ThreatType,
  SentimentProfile,
  ContextAnalysis,
} from '../../types';
import { NLPFeatures } from './nlpEngine';
import {
  TIER1_THREAT_KEYWORDS,
  URGENCY_PHRASES,
  SOCIAL_ENGINEERING_PATTERNS,
} from './threatPatterns';

// ─── THREAT CATEGORY → SENTINEL CATEGORY MAPPING ─────────────────────────────

const SCAM_TO_THREAT_CATEGORY: Record<string, string> = {
  'IRS / Tax Scam': 'financial_fraud',
  'Social Security Scam': 'identity_theft',
  'Tech Support Scam': 'social_engineering',
  'Gift Card Scam': 'financial_fraud',
  'Romance Scam': 'emotional_manipulation',
  'Investment Fraud': 'financial_fraud',
  'Advance Fee / 419 Fraud': 'advance_fee_fraud',
  'Lottery / Prize Scam': 'financial_fraud',
  'Phishing / Credential Theft': 'credential_theft',
  'Grandparent Scam': 'social_engineering',
  'Vishing / Robocall': 'vishing',
  'Deepfake / Synthetic Voice': 'deepfake_impersonation',
  'Sextortion': 'blackmail',
  'Employment Scam': 'employment_fraud',
};

// ─── VIOLENCE / EXPLICIT / HARM PATTERNS ──────────────────────────────────────

const DIRECT_THREAT_PATTERNS: RegExp[] = [
  /\b(i will|i'm going to|i am going to|gonna)\b.{0,40}\b(kill|hurt|attack|shoot|stab|destroy|burn|murder)\b/gi,
  /\b(you('re| are) (dead|finished|going to regret)|watch your back|you'll pay for this)\b/gi,
  /\b(kill you|murder you|hurt you|attack you|shoot you|i'll find you)\b/gi,
  /\b(you better|you should be|be afraid|fear me|run while you can)\b/gi,
];

const IMPLICIT_THREAT_PATTERNS: RegExp[] = [
  /\b(consequences|repercussions|you'll regret|you will regret|you're going to regret)\b/gi,
  /\b(better watch out|better be careful|accidents happen|things happen to people)\b/gi,
  /\b(i know where you|i know your address|i know where you live)\b/gi,
  /\b(don't make me|don't push me|don't test me)\b/gi,
];

const HARASSMENT_PATTERNS: RegExp[] = [
  /\b(worthless|pathetic|disgusting|loser|garbage|trash|no one likes you)\b/gi,
  /\b(nobody wants you|you should disappear|you don't deserve)\b/gi,
  /\b(everyone hates you|you're a joke|laughingstock)\b/gi,
];

const SELF_HARM_PATTERNS: RegExp[] = [
  /\b(want to (die|kill myself|end it all|not be here))\b/gi,
  /\b(suicide|suicidal|self harm|self-harm|cutting myself|hurt myself)\b/gi,
  /\b(no reason to live|can't go on|life is not worth|ending my life)\b/gi,
];

const STALKING_PATTERNS: RegExp[] = [
  /\b(i('ve| have) been watching|been following you|i know your routine)\b/gi,
  /\b(know where you go|i see you every|watching your every)\b/gi,
];

const RADICALIZATION_PATTERNS: RegExp[] = [
  /\b(infidels|kafir|jihad|die for the cause|martyr|holy war)\b/gi,
  /\b(great replacement|white genocide|race war|ZOG|accelerationism)\b/gi,
  /\b(join the fight|rise up against|take down the system|destroy the)\.{0,30}\b(government|state|establishment)\b/gi,
];

// ─── LANGUAGE DETECTOR (simple heuristic) ─────────────────────────────────────

function detectLanguage(text: string): string {
  const spanishWords = ['hola', 'como', 'que', 'para', 'con', 'una', 'por', 'esta'];
  const frenchWords = ['bonjour', 'merci', 'vous', 'est', 'avec', 'dans', 'pour', 'les'];
  const arabicRe = /[\u0600-\u06FF]/;
  const chineseRe = /[\u4E00-\u9FFF]/;

  const lower = text.toLowerCase();
  if (arabicRe.test(text)) return 'Arabic';
  if (chineseRe.test(text)) return 'Chinese';

  let spanishHits = 0, frenchHits = 0;
  for (const w of spanishWords) if (lower.includes(` ${w} `)) spanishHits++;
  for (const w of frenchWords) if (lower.includes(` ${w} `)) frenchHits++;

  if (spanishHits >= 2) return 'Spanish';
  if (frenchHits >= 2) return 'French';
  return 'English';
}

// ─── PERSONAL INFO DETECTOR ───────────────────────────────────────────────────

function hasPersonalInfo(text: string): boolean {
  const patterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,      // phone
    /\b\d{3}-\d{2}-\d{4}\b/,                    // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, // email
    /\b\d{1,5}\s\w+\s(?:st|ave|blvd|rd|dr|ln|ct|way)\b/i, // address
    /\b(your address|your home|your phone|your email|your number)\b/i,
  ];
  return patterns.some(p => p.test(text));
}

// ─── TARGET IDENTIFICATION ────────────────────────────────────────────────────

function isTargetIdentified(text: string): boolean {
  const patterns = [
    /\b(you|your|you're|you'll|you've)\b/i,
    /\b(he|she|they|him|her|them)\b.{0,20}\b(will|gonna|going to)\b/i,
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/, // name-like
  ];
  return patterns.slice(0, 2).some(p => p.test(text));
}

// ─── SCORE → SENTINEL THREAT LEVEL ───────────────────────────────────────────

function scoreToThreatLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  if (score >= 15) return 'LOW';
  return 'NONE';
}

function scoreToVerdict(score: number, threatTypes: ThreatType[]): 'THREATENING' | 'NOT_THREATENING' | 'AMBIGUOUS' {
  if (threatTypes.some(t => ['direct_threat', 'blackmail', 'violent_extremism', 'stalking'].includes(t.category))) {
    return score >= 30 ? 'THREATENING' : 'AMBIGUOUS';
  }
  if (score >= 50) return 'THREATENING';
  if (score >= 25) return 'AMBIGUOUS';
  return 'NOT_THREATENING';
}

// ─── EMOTIONAL INDICATORS EXTRACTOR ──────────────────────────────────────────

function extractEmotionalIndicators(text: string, features: NLPFeatures): string[] {
  const indicators: string[] = [];
  const lower = text.toLowerCase();

  if (DIRECT_THREAT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) indicators.push('rage');
  if (HARASSMENT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) indicators.push('contempt');
  if (SELF_HARM_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) indicators.push('desperation');
  if (features.urgency > 0.4) indicators.push('urgency');
  if (features.manipulation > 0.4) indicators.push('manipulation');
  if (/\b(please|sorry|help me|i need|desperate|begging)\b/i.test(lower)) indicators.push('desperation');
  if (/\b(hate|despise|detest|loathe)\b/i.test(lower)) indicators.push('hatred');
  if (/\b(fear|scared|terrified|afraid)\b/i.test(lower)) indicators.push('fear');
  if (/\b(!{2,}|[A-Z]{4,})/g.test(text)) indicators.push('anger');
  if (features.impersonation > 0.5) indicators.push('deception');
  if (indicators.length === 0) indicators.push('neutral');

  return [...new Set(indicators)];
}

// ─── SENTIMENT PROFILER ───────────────────────────────────────────────────────

function buildSentimentProfile(text: string, features: NLPFeatures, riskScore: number): SentimentProfile {
  const emotional_indicators = extractEmotionalIndicators(text, features);

  let overall_sentiment: SentimentProfile['overall_sentiment'] = 'neutral';

  if (DIRECT_THREAT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    overall_sentiment = 'hostile';
  } else if (features.manipulation > 0.5 || features.impersonation > 0.5) {
    overall_sentiment = 'manipulative';
  } else if (riskScore >= 60) {
    overall_sentiment = 'aggressive';
  } else if (SELF_HARM_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    overall_sentiment = 'distressed';
  } else if (riskScore <= 20 && !emotional_indicators.includes('anger')) {
    overall_sentiment = 'positive';
  } else if (riskScore >= 35) {
    overall_sentiment = 'aggressive';
  }

  const escalation_risk: 'HIGH' | 'MEDIUM' | 'LOW' =
    riskScore >= 65 ? 'HIGH' :
    riskScore >= 35 ? 'MEDIUM' : 'LOW';

  return { overall_sentiment, emotional_indicators, escalation_risk };
}

// ─── THREAT TYPE BUILDER ──────────────────────────────────────────────────────

function buildThreatTypes(text: string, features: NLPFeatures): ThreatType[] {
  const types: ThreatType[] = [];

  // Direct physical threat
  if (DIRECT_THREAT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'direct_threat',
      target: 'individual',
      description: 'Explicit statements of intent to cause physical harm to a specific person.',
    });
  }

  // Implicit threat
  if (IMPLICIT_THREAT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'implicit_threat',
      target: 'individual',
      description: 'Veiled or indirect language suggesting harm or negative consequences without explicit statement.',
    });
  }

  // Cyberbullying / harassment
  if (HARASSMENT_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'cyberbullying',
      target: 'individual',
      description: 'Demeaning, humiliating, or aggressive language targeted at an individual.',
    });
  }

  // Stalking
  if (STALKING_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'stalking',
      target: 'individual',
      description: 'Surveillance or tracking language suggesting unwanted monitoring of a person\'s movements/activities.',
    });
  }

  // Self-harm risk
  if (SELF_HARM_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'self_harm_risk',
      target: 'self',
      description: 'Language indicating the sender may be at risk of self-harm or suicidal ideation.',
    });
  }

  // Blackmail / extortion
  if (/\b(blackmail|extort|pay or|unless you pay|i'll release|i'll expose|i'll send)\b/i.test(text) ||
      features.categoryMatches.includes('Sextortion')) {
    types.push({
      category: 'blackmail',
      target: 'individual',
      description: 'Coercive demand for payment or action under threat of releasing damaging material.',
    });
  }

  // Radicalization
  if (RADICALIZATION_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); })) {
    types.push({
      category: 'radicalization',
      target: 'group',
      description: 'Language associated with extremist ideologies, recruitment, or incitement to political violence.',
    });
  }

  // Financial fraud / scam (map from existing NLP categories)
  for (const category of features.categoryMatches) {
    const mappedCategory = SCAM_TO_THREAT_CATEGORY[category];
    if (mappedCategory && !types.some(t => t.category === mappedCategory)) {
      types.push({
        category: mappedCategory,
        target: 'individual',
        description: `${category} detected — ${getCategoryDescription(category)}`,
      });
    }
  }

  // Harassment from impersonation
  if (features.impersonation > 0.6 && !types.some(t => t.category === 'direct_threat')) {
    types.push({
      category: 'harassment',
      target: 'individual',
      description: 'Authority impersonation used as psychological pressure — false claims of legal/government power.',
    });
  }

  return types;
}

function getCategoryDescription(category: string): string {
  const descs: Record<string, string> = {
    'IRS / Tax Scam': 'fraudulent IRS claim with demands for immediate payment',
    'Social Security Scam': 'SSA impersonation claiming account suspension to harvest credentials',
    'Tech Support Scam': 'fake technical support using remote access to compromise devices',
    'Gift Card Scam': 'gift card demand is the #1 identifier of phone scams targeting victims',
    'Romance Scam': 'emotional manipulation to extract funds from romantically engaged victim',
    'Investment Fraud': 'fraudulent investment opportunity with manufactured guarantee of returns',
    'Advance Fee / 419 Fraud': 'upfront fee demanded for access to false inheritance/windfall',
    'Lottery / Prize Scam': 'fraudulent prize notification requiring fee payment to claim',
    'Phishing / Credential Theft': 'credential harvesting via impersonated legitimate communication',
    'Grandparent Scam': 'impersonation of distressed family member to extract emergency payment',
    'Vishing / Robocall': 'automated or scripted voice phishing call',
    'Deepfake / Synthetic Voice': 'AI-generated voice used to impersonate a trusted person',
    'Sextortion': 'explicit content used as leverage in extortion scheme',
    'Employment Scam': 'fraudulent job offer involving advance fee or check overpayment',
  };
  return descs[category] ?? 'social engineering attack vector identified';
}

// ─── URGENCY MAP ──────────────────────────────────────────────────────────────

function buildUrgency(riskScore: number, threatTypes: ThreatType[]): 'IMMEDIATE_ACTION' | 'MONITOR' | 'NO_ACTION' {
  if (
    riskScore >= 70 ||
    threatTypes.some(t => ['direct_threat', 'self_harm_risk', 'blackmail', 'stalking', 'violent_extremism'].includes(t.category))
  ) {
    return 'IMMEDIATE_ACTION';
  }
  if (riskScore >= 35) return 'MONITOR';
  return 'NO_ACTION';
}

// ─── RECOMMENDED ACTION ───────────────────────────────────────────────────────

function buildRecommendedAction(verdict: string, threatTypes: ThreatType[], riskScore: number): string {
  const hasDirectThreat = threatTypes.some(t => t.category === 'direct_threat');
  const hasSelfHarm = threatTypes.some(t => t.category === 'self_harm_risk');
  const hasBlackmail = threatTypes.some(t => t.category === 'blackmail');
  const hasStalking = threatTypes.some(t => t.category === 'stalking');
  const hasFinancialScam = threatTypes.some(t => ['financial_fraud', 'credential_theft', 'advance_fee_fraud'].includes(t.category));

  if (hasDirectThreat) return 'Report to local law enforcement immediately. Preserve all message records. Do not respond to sender.';
  if (hasSelfHarm) return 'Contact crisis support services immediately (988 Suicide & Crisis Lifeline). Notify trusted contacts of the sender.';
  if (hasBlackmail) return 'Report to FBI IC3 (ic3.gov) and local police. Do NOT pay. Preserve all evidence.';
  if (hasStalking) return 'Report to local police and document all contact. Consider a protective order.';
  if (hasFinancialScam) return 'Report to FTC (reportfraud.ftc.gov). Do NOT send money, provide personal info, or comply with any demands.';
  if (verdict === 'THREATENING' || riskScore >= 60) return 'Flag for human review. Consider reporting to platform and/or authorities.';
  if (verdict === 'AMBIGUOUS') return 'Monitor for escalation. Flag for human review if pattern continues.';
  return 'Safe to ignore. No action required.';
}

// ─── SUMMARY GENERATOR ────────────────────────────────────────────────────────

function buildSummary(verdict: string, threatLevel: string, threatTypes: ThreatType[], score: number, text: string): string {
  if (verdict === 'NOT_THREATENING') {
    return `LexovoxAI assessed this message as non-threatening (Risk Score: ${score}/100). No credible threat indicators were identified in the content. The message does not exhibit patterns associated with harassment, coercion, or violent intent.`;
  }

  const typeList = threatTypes.map(t => t.category.replace(/_/g, ' ')).join(', ');
  const urgency = score >= 70 ? 'Immediate action is recommended.' : score >= 40 ? 'The content warrants human review and monitoring.' : 'Evidence is preliminary and should be noted.';

  return `LexovoxAI flagged this message as ${verdict} (Threat Level: ${threatLevel}, Risk Score: ${score}/100). ` +
    (typeList ? `Detected threat categories: ${typeList}. ` : '') +
    urgency;
}

// ─── MINOR DETECTION ─────────────────────────────────────────────────────────

function checkForMinors(text: string): boolean {
  return /\b(child|children|minor|underage|kid|teen|teenager|youth|juvenile|\d{1,2}[-\s]year[-\s]old)\b/i.test(text) &&
    /\b(explicit|sexual|inappropriate|abuse|exploit)\b/i.test(text);
}

// ─── MASTER FUNCTION ─────────────────────────────────────────────────────────

export function buildTextAnalysisResult(
  features: NLPFeatures,
  riskScore: number,
  text: string
): TextAnalysisResult {
  const threatTypes = buildThreatTypes(text, features);
  const verdict = scoreToVerdict(riskScore, threatTypes);
  const threatLevel = scoreToThreatLevel(riskScore);
  const urgency = buildUrgency(riskScore, threatTypes);
  const recommendedAction = buildRecommendedAction(verdict, threatTypes, riskScore);
  const sentimentProfile = buildSentimentProfile(text, features, riskScore);
  const language = detectLanguage(text);
  const personalInfoPresent = hasPersonalInfo(text);
  const targetIdentified = isTargetIdentified(text);
  const minorInvolved = checkForMinors(text);

  // Confidence: combination of NLP quality signals
  let confidence = Math.min(
    Math.round(
      (features.tier1Score * 40) +
      (features.comboScore * 25) +
      (features.highRiskPatternScore * 20) +
      (features.categoryMatches.length * 5) +
      (threatTypes.length * 3)
    ),
    100
  );
  // If no strong signals at all, keep low
  if (features.tier1Score === 0 && features.comboScore === 0 && threatTypes.length === 0) {
    confidence = Math.min(confidence, 30);
  }

  const likely_intent = buildLikelyIntent(features, threatTypes, riskScore, text);

  const threat_assessment: ThreatAssessment = {
    verdict,
    confidence,
    threat_level: threatLevel,
    threat_types: threatTypes,
    urgency,
    recommended_action: recommendedAction,
  };

  const context_analysis: ContextAnalysis = {
    likely_intent,
    target_identified: targetIdentified,
    personal_info_present: personalInfoPresent,
    language,
  };

  const result: TextAnalysisResult = {
    module: 'TEXT_ANALYSIS',
    threat_assessment,
    sentiment_profile: sentimentProfile,
    context_analysis,
    summary: buildSummary(verdict, threatLevel, threatTypes, riskScore, text),
  };

  if (minorInvolved) {
    result.MINOR_INVOLVED = true;
  }

  return result;
}

function buildLikelyIntent(features: NLPFeatures, threatTypes: ThreatType[], score: number, text: string): string {
  if (threatTypes.some(t => t.category === 'direct_threat')) {
    return 'Sender appears to intend physical harm or intimidation against a specific target. Message contains explicit violent language.';
  }
  if (threatTypes.some(t => t.category === 'self_harm_risk')) {
    return 'Sender may be experiencing a mental health crisis and could be at risk of self-harm. Requires urgent compassionate intervention.';
  }
  if (threatTypes.some(t => t.category === 'blackmail')) {
    return 'Sender is attempting to extort the recipient using real or fabricated threatening material as leverage for financial or behavioral compliance.';
  }
  if (threatTypes.some(t => t.category === 'stalking')) {
    return 'Sender demonstrates knowledge of the target\'s physical location or routine, suggesting active surveillance.';
  }
  if (threatTypes.some(t => ['financial_fraud', 'credential_theft', 'advance_fee_fraud'].includes(t.category))) {
    return 'Sender is attempting to defraud the recipient using a known social engineering script (scam). Goal is financial theft or personal data extraction.';
  }
  if (features.impersonation > 0.5) {
    return 'Sender is falsely claiming authoritative identity to coerce compliance. Classic social engineering pretext.';
  }
  if (threatTypes.some(t => t.category === 'cyberbullying')) {
    return 'Sender is attempting to demean, humiliate, or psychologically harm the target through repeated negative messaging.';
  }
  if (score < 20) {
    return 'No clear harmful intent detected. Message appears to be routine communication.';
  }
  return 'Sender intent is ambiguous but exhibits patterns consistent with manipulation or coercion. Further review recommended.';
}
