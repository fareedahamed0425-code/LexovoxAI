/**
 * LexovoxAI — Advanced Threat Intelligence Knowledge Base v2.0
 * ================================================================
 * Comprehensive threat pattern library derived from:
 *   - FTC Consumer Sentinel Network fraud reports
 *   - FBI IC3 (Internet Crime Complaint Center) annual reports
 *   - CISA phishing/vishing advisories
 *   - IRS "Dirty Dozen" scam list (2019–2024)
 *   - FCC robocall/spoofing threat database
 *   - AARP Fraud Watch Network scam descriptions
 *   - Anti-Phishing Working Group (APWG) datasets
 *   - Real-world transcripts from ScamBaiting communities
 *   - Academic NLP fraud detection research corpora
 *
 * Patterns are organized into TIERS by confidence level:
 *   TIER_1: Definitive threat (score += high weight)
 *   TIER_2: Strong indicator (score += medium weight)
 *   TIER_3: Supporting signal (score += low weight)
 */

// ─── TIER 1: DEFINITIVE THREAT KEYWORDS (very high confidence) ───────────────
// Any match from this tier alone should push score toward Suspicious/High Risk

export const TIER1_THREAT_KEYWORDS: string[] = [
  // === GOVERNMENT IMPERSONATION (exact long phrases) ===
  'warrant out for your arrest', 'federal warrant', 'arrest warrant has been issued',
  'you are being sued by the federal', 'dea is coming to your address',
  'irs criminal investigation division', 'social security number has been suspended',
  'your social security is compromised', 'social security administration suspended your number',
  'medicare fraud investigation', 'your benefits have been suspended',
  'homeland security has flagged', 'immigration has flagged your name',
  'interpol has issued a red notice', 'us marshals are on their way',

  // === GOVERNMENT IMPERSONATION (short-form — real world usage) ===
  'arrest warrant', 'federal arrest', 'criminal warrant',
  'you will be arrested', 'getting arrested', 'face arrest',
  'irs agent', 'irs officer', 'tax fraud', 'you owe taxes',
  'social security suspended', 'your ssn has been', 'ssn suspended',
  'your social security has been', 'benefits suspended',
  'badge number', 'warrant number', 'case number',

  // === FINANCIAL SCAM DEMANDS (exact) ===
  'send gift cards immediately', 'buy google play cards', 'buy itunes gift cards',
  'purchase amazon gift cards now', 'pay with gift cards', 'send gift card numbers',
  'buy steam gift cards', 'walmart gift cards payment', 'target gift cards',
  'send the redemption code', 'scratch the back of the card and read the numbers',
  'wire transfer immediately', 'wire the money now', 'international wire transfer',
  'send via western union', 'send via moneygram', 'send money via cashapp',
  'send zelle payment', 'bitcoin atm', 'send bitcoin to this address',
  'cryptocurrency wallet address', 'send usdt', 'ethereum wallet address',
  'processing fee to release your funds', 'customs clearance fee',
  'release fee for your package', 'pay to claim your prize',

  // === FINANCIAL SCAM DEMANDS (short-form — real world usage) ===
  'gift cards', 'itunes gift card', 'google play gift card',
  'steam gift card', 'amazon gift card', 'walmart gift card',
  'pay in gift cards', 'payment in gift cards', 'gift card payment',
  'send gift card', 'buy gift card', 'get gift card',
  'read me the numbers', 'card numbers', 'redemption code',
  'pay in bitcoin', 'send bitcoin', 'bitcoin payment', 'crypto wallet',
  'wire the money', 'wire funds', 'wire transfer',
  'western union', 'moneygram payment',

  // === DEEPFAKE / SYNTHETIC VOICE ===
  'this is a recorded message from', 'your account has been compromised call',
  'this is your final notice before legal', 'this is not a sales call',
  'your computer has been hacked', 'illegal activity has been detected on your computer',
  'do not shut down your computer', 'your ip address has been traced',

  // === CREDENTIAL THEFT (exact) ===
  'verify your social security number', 'confirm your ssn', 'provide your ssn',
  'what is your bank account number', 'provide your routing number',
  'give us your card number', 'verify your card details', 'read me your card number',
  'what are the last 4 digits', 'confirm your full card number',
  'remote access to your computer', 'give me remote access', 'download anydesk',
  'download teamviewer now', 'install this software immediately',
  'share your screen with me', 'allow remote connection',

  // === CREDENTIAL THEFT (short-form) ===
  'your social security number', 'routing number', 'account number',
  'your card number', 'your pin', 'your cvv', 'your bank account',
  'anydesk', 'teamviewer', 'remote desktop',

  // === PRIZE / LOTTERY SCAM ===
  'you have won the lottery', 'you are the winner of', 'claim your prize money',
  'foreign lottery winner', 'mega million winner', 'powerball winner notification',
  'you have been selected to receive', 'unclaimed prize', 'you won a sweepstakes',
  'publisher clearing house winner',
  'you won', 'you are a winner', 'claim your prize', 'collect your winnings',
  'prize claim', 'lottery prize', 'sweepstakes winner',

  // === INHERITANCE / ADVANCE FEE (419) ===
  'i am a lawyer writing on behalf', 'next of kin unclaimed funds',
  'deceased relative left funds', 'foreign inheritance transfer',
  'nigerian prince', 'barrister writing to you', 'i need your assistance to transfer funds',
  'share of the sum of', 'us dollars into your account', 'percentage for your assistance',
  'strictly confidential business proposal', 'dying and want to donate my wealth',
  'inheritance funds', 'unclaimed inheritance', 'dormant account',

  // === ROMANCE SCAM ===
  'i am stationed on an oil rig', 'i am a military officer deployed',
  'i need money for my flight to meet you', 'stuck at the airport need money',
  'in hospital need emergency funds', 'send me money via western union',
  'my daughter is sick i need help', 'i will repay you when i arrive',
  'love you deeply need financial help',
  'oil rig worker', 'deployed overseas', 'military deployment',

  // === TECH SUPPORT SCAM ===
  'your computer is sending error reports', 'windows has detected virus',
  'microsoft has detected malware', 'call microsoft support immediately',
  'your license has expired call us', 'critical error on your device',
  'your computer will be blocked', 'virus detected in your system call now',
  'we are from the windows technical department',
  'computer has a virus', 'device is infected', 'your computer is infected',
  'microsoft security alert', 'windows security alert', 'tech support',

  // === HIGH-SEVERITY ISOLATION ===
  'do not tell anyone', 'do not tell your family', 'do not contact your bank',
  'do not hang up', 'stay on the line', 'keep this between us',
  'do not call anyone else', 'keep this confidential',
];

// ─── TIER 2: STRONG THREAT INDICATORS (high confidence in context) ────────────
export const TIER2_THREAT_KEYWORDS: string[] = [
  // Government agencies used as threats
  'irs', 'internal revenue service', 'social security administration', 'ssa',
  'medicare', 'medicaid', 'fbi', 'federal bureau', 'dea', 'drug enforcement',
  'department of homeland security', 'dhs', 'us customs', 'border patrol',
  'department of justice', 'doj', 'federal trade commission', 'ftc',
  'us marshals', 'secret service', 'interpol', 'treasury department',

  // Financial demands
  'wire transfer', 'bank transfer', 'send money', 'money order',
  'western union', 'moneygram', 'bitcoin', 'cryptocurrency', 'crypto payment',
  'gift card', 'itunes', 'google play', 'amazon card', 'steam card',
  'prepaid card', 'cashapp', 'cash app', 'zelle', 'venmo payment',
  'walmart-to-walmart', 'money gram', 'worldremit',
  'advance fee', 'upfront payment', 'processing fee', 'clearance fee',

  // Legal threats
  'arrest warrant', 'criminal charges', 'federal charges', 'facing prosecution',
  'lawsuit filed against you', 'court summons', 'legal action', 'sue you',
  'law enforcement', 'police will arrive', 'officers will be dispatched',
  'you will be arrested', 'deportation proceedings', 'license suspended',
  'account frozen', 'assets seized', 'bank account blocked',

  // Credential theft
  'social security number', 'ssn', 'bank account number', 'routing number',
  'credit card number', 'debit card number', 'card verification', 'cvv code',
  'pin number', 'one time password', 'otp', 'verification code',
  'two factor code', '2fa code', 'authentication code', 'access code',
  'mother maiden name', 'date of birth', 'passport number', 'drivers license',

  // Tech support / remote access
  'remote access', 'teamviewer', 'anydesk', 'logmein', 'ultraviewer',
  'install software', 'download application', 'share your screen',
  'tech support', 'technical support', 'windows support', 'microsoft support',
  'apple support call', 'mcafee renewing', 'norton renewing',

  // Urgency/isolation
  'do not tell anyone', 'keep this confidential', 'do not contact your bank',
  'do not hang up', 'stay on the line', 'do not tell your family',
  'this is classified information', 'between you and me',

  // Prize/lottery
  'lottery winner', 'prize claim', 'sweepstakes winner', 'you have been selected',
  'unclaimed funds', 'inheritance claim', 'dormant account funds',

  // Romance
  'oil rig', 'deployed soldier', 'military officer', 'peacekeeping mission',
  'widower', 'widow looking for love', 'online relationship',
];

// ─── TIER 3: SUPPORTING/CONTEXTUAL SIGNALS (lower confidence alone) ───────────
export const TIER3_CONTEXTUAL_KEYWORDS: string[] = [
  // Urgency/time pressure
  'act now', 'call immediately', 'call back', 'urgent matter', 'time sensitive',
  'expires today', 'final notice', 'last chance', 'do not delay', 'right away',
  'within 24 hours', 'within the next hour', 'failure to respond', 'do not ignore',
  'limited time', 'deadline today', 'respond immediately', 'contact us now',

  // Suspicious monetary mention
  'prize money', 'claim funds', 'lottery', 'unclaimed', 'inheritance',
  'investment opportunity', 'guaranteed return', 'risk free', '100% profit',
  'double your money', 'get rich', 'passive income', 'work from home earn',

  // Authority names (need context)
  'officer', 'agent', 'detective', 'inspector', 'supervisor', 'senior official',
  'government representative', 'federal agent', 'badge number', 'employee id',

  // Vague financial
  'funds transfer', 'account compromised', 'suspicious transaction',
  'unauthorized charge', 'account breach', 'security breach',
  'your account', 'verify account', 'confirm identity',

  // Isolation tactics
  'confidential', 'do not share', 'top secret', 'classified',
  'this is private', 'just between us', 'tell no one',

  // Phone/contact insistence
  'call this number', 'contact us immediately', 'call back within',
  'toll free number', '1-800', '1-888', '1-877', '1-866',
];

// ─── COMBO THREAT PATTERNS (phrase co-occurrence = amplified risk) ────────────
// If BOTH elements of a pair are present → very high confidence scam

export const COMBO_THREAT_PAIRS: Array<[string, string]> = [
  // Government + financial demand
  ['irs', 'gift card'],
  ['irs', 'wire transfer'],
  ['irs', 'bitcoin'],
  ['irs', 'arrest'],
  ['social security', 'suspended'],
  ['social security', 'criminal'],
  ['social security', 'warrant'],
  ['medicare', 'arrested'],
  ['fbi', 'gift card'],
  ['federal', 'wire transfer'],
  ['government', 'gift card'],

  // Legal threat + payment demand
  ['arrest', 'pay'],
  ['warrant', 'payment'],
  ['criminal charges', 'money'],
  ['lawsuit', 'immediately'],
  ['deported', 'pay'],
  ['license suspended', 'fee'],

  // Remote access + financial
  ['remote access', 'bank'],
  ['teamviewer', 'bank account'],
  ['anydesk', 'money'],
  ['share screen', 'account'],

  // Account + credential
  ['account', 'ssn'],
  ['verify', 'credit card'],
  ['confirm', 'bank account'],
  ['update', 'social security'],

  // Prize + personal info
  ['winner', 'social security'],
  ['prize', 'fee'],
  ['lottery', 'send money'],
  ['claim', 'gift card'],

  // Urgency + financial
  ['immediately', 'wire'],
  ['urgent', 'bitcoin'],
  ['right now', 'gift card'],
  ['within the hour', 'payment'],

  // Isolation + financial
  ['do not tell', 'money'],
  ['do not contact bank', 'wire'],
  ['confidential', 'transfer'],
  ['keep secret', 'payment'],

  // New short-form combos (real-world scam phrases)
  ['irs', 'arrest warrant'],
  ['irs', 'gift cards'],
  ['irs', 'bitcoin payment'],
  ['social security', 'gift card'],
  ['arrest warrant', 'pay'],
  ['arrest warrant', 'gift card'],
  ['arrest', 'gift cards'],
  ['warrant', 'gift card'],
  ['gift cards', 'immediately'],
  ['gift cards', 'pay'],
  ['bitcoin', 'arrest'],
  ['wire transfer', 'arrest'],
  ['do not tell anyone', 'pay'],
  ['stay on the line', 'pay'],
  ['anydesk', 'bank account'],
  ['teamviewer', 'send money'],
  ['tech support', 'bank account'],
  ['gift cards', 'clear'],
  ['gift cards', 'settle'],
  ['irs agent', 'pay'],
  ['irs officer', 'pay'],
  ['tax fraud', 'pay'],
  ['routing number', 'verify'],
  ['account number', 'provide'],
];

// ─── HIGH-RISK REGEX PATTERNS (contextual phrase matching) ───────────────────
export const HIGH_RISK_PATTERNS: RegExp[] = [
  // Government threat + action required
  /\b(irs|social\s+security|medicare|fbi|dea|homeland)\b.{0,60}\b(arrest|warrant|criminal|charges|suspended|compromised)\b/gi,
  /\b(warrant|arrest|deport)\b.{0,40}\b(pay|send|transfer|buy)\b/gi,
  /\b(officer|agent|detective)\b.{0,30}\b(badge|number|id)\b.{0,30}\b\d+\b/gi,
  // IRS scam variants
  /\b(irs|tax\s+authority|revenue\s+service)\b.{0,50}\b(call|contact|reach|call\s+back)/gi,
  /\b(tax\s+fraud|tax\s+evasion|tax\s+criminal)\b/gi,
  /\b(you\s+owe|amount\s+owed|outstanding\s+amount)\b.{0,30}\b(irs|tax|government)\b/gi,
  /\b(irs|government|federal)\b.{0,30}\b(warrant|officer|agent)\b/gi,
  // SSA scam variants
  /\b(social\s+security|ssa)\b.{0,40}\b(number|account|benefit)\b.{0,30}\b(suspend|frozen|block|flag|comprom)/gi,

  // Gift card payment instructions — expanded
  /\b(buy|purchase|get|go\s+get|pick\s+up)\b.{0,30}\b(gift\s+card|itunes|google\s+play|amazon|steam|walmart)\b/gi,
  /\b(scratch|read|send|give\s+me|read\s+out|read\s+me)\b.{0,30}\b(gift\s+card|card\s+number|redemption\s+code|pin\s+number)\b/gi,
  /\b(pay(ment)?|settle|clear)\b.{0,30}\b(gift\s+card|itunes|google\s+play|bitcoin|crypto)/gi,
  /\b(gift\s+cards?)\b.{0,40}\b(to\s+(clear|settle|pay|resolve)|as\s+payment|for\s+payment)/gi,
  /\b(in|using|via|with|through)\b.{0,10}\b(gift\s+cards?|itunes\s+cards?|google\s+play\s+cards?)\b/gi,

  // Remote access demands
  /\b(download|install|run)\b.{0,30}\b(anydesk|teamviewer|logmein|ultraviewer|remote)\b/gi,
  /\b(give|allow|grant)\b.{0,30}\b(remote|access|control)\b.{0,30}\b(computer|device|pc|laptop)\b/gi,

  // Credential harvesting
  /\b(provide|give|tell|read)\b.{0,20}\b(ssn|social\s+security|account\s+number|card\s+number|routing)\b/gi,
  /\b(verify|confirm|update)\b.{0,30}\b(ssn|pin|password|credit\s+card|bank\s+account)\b/gi,

  // Payment urgency combos
  /\b(pay|send|transfer|wire)\b.{0,20}\b(immediately|now|today|right\s+away|within\b.{0,15}hour)\b/gi,
  /\b\$[\d,]+\b.{0,30}\b(immediately|or\s+(face|be|you\s+will)|right\s+now)\b/gi,

  // Isolation tactics
  /\b(do\s+not|don't)\b.{0,20}\b(tell|call|contact|inform)\b.{0,30}\b(bank|family|police|anyone|wife|husband)\b/gi,
  /\b(keep|this\s+is|remain)\b.{0,20}\b(confidential|secret|private|between\s+us|classified)\b/gi,

  // Tech support scripts
  /\b(microsoft|windows|apple|mcafee|norton)\b.{0,40}\b(detected|found|blocked|infected|virus|error)\b/gi,
  /\b(your\s+computer|your\s+device|your\s+pc)\b.{0,40}\b(hacked|compromised|infected|blocked|sending)\b/gi,

  // Fake legal process
  /\b(case\s+number|docket\s+number|badge\s+number)\b.{0,20}\b[A-Z0-9\-]+\b/gi,
  /\b(this\s+call|this\s+message)\s+is\s+being\s+(recorded|monitored)\b/gi,

  // Financial prediction scams
  /\b(guaranteed|risk[\-\s]free)\b.{0,30}\b(return|profit|investment|income)\b/gi,
  /\b(double|triple)\b.{0,20}\b(your\s+money|investment|return|bitcoin)\b/gi,

  // Advance fee / inheritance
  /\b(deceased|died)\b.{0,60}\b(funds|money|account|inheritance|million)\b/gi,
  /\b(transfer|move)\b.{0,30}\b(million|billion)\b.{0,30}\b(dollar|usd)\b/gi,
  /\b(percentage|commission)\b.{0,30}\b(for\s+your|as\s+your)\b.{0,30}\b(assistance|help|role)\b/gi,

  // Vishing scripts
  /this\s+is\s+(not\s+)?a?\s*(sales|marketing|commercial)\s*(call|message)/gi,
  /\b(press|dial)\s+\d\b.{0,30}\b(speak|talk|connect)\b.{0,30}\b(agent|representative|officer)\b/gi,

  // Sextortion
  /\b(video|footage|images|photos)\b.{0,40}\b(send|share|post|release|expose)\b.{0,30}\b(unless|if\s+you\s+don't|pay)\b/gi,
  /\b(embarrassing|explicit|intimate)\b.{0,40}\b(unless|payment|bitcoin)\b/gi,
];

// ─── MEDIUM-RISK PATTERNS (suspicious but not conclusive alone) ───────────────
export const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /\b(call|contact)\b.{0,20}\b(immediately|urgently|right\s+now)\b/gi,
  /\b(your\s+)?(account|number|benefits)\b.{0,30}\b(suspended|frozen|blocked|terminated)\b/gi,
  /\b(final|last)\b.{0,10}\b(warning|notice|chance|opportunity)\b/gi,
  /\b(claim|collect)\b.{0,20}\b(prize|reward|money|funds|winnings)\b/gi,
  /\b(investment|opportunity)\b.{0,30}\b(guaranteed|risk[\-\s]free|profit)\b/gi,
  /\b(limited|exclusive)\b.{0,20}\b(offer|opportunity|deal|access)\b/gi,
  /\b(you\s+have\s+been\s+selected|you\s+are\s+a\s+winner)\b/gi,
  /\b(suspicious\s+activity|unauthorized\s+access)\b.{0,30}\b(your\s+account|detected)\b/gi,
];

// ─── SCAM CATEGORY SIGNATURES (for precise category labeling) ─────────────────
export const SCAM_CATEGORIES: Record<string, RegExp[]> = {
  'IRS / Tax Scam': [
    /\birs\b.{0,80}\b(arrest|warrant|criminal|suspend|owe|payment|call|agent|officer)/gi,
    /\btax\s+(debt|owed|outstanding|fraud|evasion)\b/gi,
    /\bincome\s+tax\b.{0,40}\b(fraud|evasion|criminal|owe)/gi,
    /\b(irs|internal\s+revenue)\b.{0,40}\b(officer|agent|investigat|department)/gi,
    /\byou\s+owe.{0,30}(irs|tax|government)/gi,
  ],
  'Social Security Scam': [
    /\bsocial\s+security\b.{0,60}\b(suspended|compromised|criminal|illegal|number|administration)/gi,
    /\bssn?\b.{0,40}\b(suspended|used|fraud|illegal|criminal|compromised)/gi,
    /\b(your|the)\s+social\s+security\b/gi,
  ],
  'Tech Support Scam': [
    /\b(microsoft|windows|apple|google)\b.{0,40}\b(call|support|error|virus|hack|detected|security|alert)/gi,
    /\b(your\s+computer|your\s+device|your\s+pc)\b.{0,30}\b(infected|hacked|blocked|error|virus|malware|compromised)/gi,
    /\b(tech|technical)\s+support\b/gi,
    /\bvirus\s+(detected|found|identified)\b/gi,
  ],
  'Gift Card Scam': [
    /\b(buy|purchase|send|get|pick\s+up|go\s+get)\b.{0,30}\b(gift\s+card|itunes|google\s+play|amazon|steam)\b/gi,
    /\b(redemption|scratch|card|gift)\b.{0,20}\b(code|number|pin)\b/gi,
    /\bgift\s+cards?\b/gi,
    /\b(pay|payment)\b.{0,20}\b(gift\s+card|itunes|google\s+play)/gi,
    /\bin\s+gift\s+cards?\b/gi,
  ],
  'Romance Scam': [
    /\b(oil\s+rig|military|deployed|soldier|overseas)\b.{0,60}\b(money|send|help|emergency)/gi,
    /\b(love|feelings|met\s+online)\b.{0,60}\b(money|send|help|stuck|hospital)/gi,
  ],
  'Investment Fraud': [
    /\b(guaranteed|risk[\-\s]free)\b.{0,30}\b(return|profit|investment)\b/gi,
    /\b(crypto|bitcoin|forex)\b.{0,30}\b(guaranteed|double|multiply|profit)\b/gi,
  ],
  'Advance Fee / 419 Fraud': [
    /\b(deceased|died|barrister|lawyer)\b.{0,60}\b(million|fund|transfer|account)\b/gi,
    /\b(inheritance|next\s+of\s+kin|unclaimed)\b.{0,40}\b(fund|money|million)\b/gi,
  ],
  'Lottery / Prize Scam': [
    /\b(lottery|sweepstakes|prize|winner)\b.{0,40}\b(claim|collect|fee|deposit)\b/gi,
    /\b(won|selected|chosen)\b.{0,30}\b(prize|lottery|million|reward)\b/gi,
  ],
  'Phishing / Credential Theft': [
    /\b(verify|confirm|update)\b.{0,30}\b(account|password|ssn|card|bank)\b/gi,
    /\b(click|link|login|log\s+in)\b.{0,30}\b(verify|confirm|secure|update)\b/gi,
  ],
  'Grandparent Scam': [
    /\b(grandson|granddaughter|grandchild|grandpa|grandma|grandparent)\b.{0,60}\b(arrested|trouble|accident|hospital|bail|money)/gi,
    /\ball\s+they\s+need\s+is\b.{0,40}\b(bail|money|pay)/gi,
  ],
  'Vishing / Robocall': [
    /\b(press|dial)\s+\d\b.{0,20}\b(speak|agent|representative|opt\s+out)/gi,
    /\bthis\s+is\s+(an?\s+)?(automated|recorded|important)\b/gi,
  ],
  'Deepfake / Synthetic Voice': [
    /\b(ai|artificial\s+intelligence|deepfake|cloned\s+voice|voice\s+synthesis)/gi,
  ],
  'Sextortion': [
    /\b(video|footage|photos)\b.{0,40}\b(pay|bitcoin|release|expose|send)\b/gi,
    /\b(explicit|intimate|embarrassing)\b.{0,30}\b(unless|pay|bitcoin|money)\b/gi,
  ],
  'Employment Scam': [
    /\b(job\s+offer|work\s+from\s+home|remote\s+position)\b.{0,60}\b(advance|pay|fee|deposit|equipment)/gi,
    /\b(deposit\s+check|send\s+back|overpayment)\b/gi,
  ],
};

// ─── URGENCY & PRESSURE PHRASES (exhaustive list) ─────────────────────────────
export const URGENCY_PHRASES: string[] = [
  'act now', 'act immediately', 'call immediately', 'call back immediately',
  'call right now', 'respond immediately', 'respond urgently', 'contact immediately',
  'urgent', 'urgently', 'time sensitive', 'time critical', 'extremely urgent',
  'limited time', 'expires today', 'expires in 24 hours', 'deadline today',
  'final warning', 'final notice', 'last warning', 'last notice',
  'last chance', 'final opportunity', 'last opportunity',
  'do not delay', 'do not wait', 'do not ignore this',
  'right away', 'right now', 'immediately', 'at once',
  'within 24 hours', 'within the next hour', 'within the hour', 'within minutes',
  'before it is too late', 'before it\'s too late', 'before we take action',
  'failure to comply', 'failure to respond', 'failure to call',
  'do not ignore', 'do not disregard', 'serious consequences',
  'do not hang up', 'do not disconnect', 'stay on the line',
  'press 1 now', 'press 2 immediately', 'call this number now',
  'this is your final opportunity', 'this is a time-sensitive matter',
  'time is running out', 'running out of time', 'your time is almost up',
  'today is your last day', 'by end of business today', 'by close of business',
  'must be paid today', 'payment required today', 'immediate payment required',
];

// ─── IMPERSONATION SIGNALS (authority claim phrases) ──────────────────────────
export const IMPERSONATION_SIGNALS: string[] = [
  'i am calling from the irs', 'this is the irs calling',
  'i am an agent from the irs', 'irs officer speaking',
  'i am calling from social security', 'this is social security administration',
  'calling from the fbi', 'i am an fbi agent', 'federal bureau of investigation',
  'i am calling from the dea', 'drug enforcement agency calling',
  'department of homeland security', 'this is homeland security',
  'i am from the us marshal office', 'us marshals service',
  'i am a law enforcement officer', 'officer from the police department',
  'i am calling from microsoft', 'microsoft security division',
  'this is apple support', 'calling from apple technical',
  'this is an official government notice', 'official government communication',
  'this call is regarding a federal matter', 'federal matter',
  'i am calling from your bank', 'your bank\'s fraud department',
  'this is the fraud department', 'bank security calling',
  'i am a lawyer representing', 'attorney at law contacting you',
  'this is a legal notice', 'official legal communication',
  'your case number is', 'docket number', 'reference number',
  'badge number', 'employee id number', 'agent number',
  'this call is being recorded for legal purposes',
  'you are legally obligated to', 'you are required by law',
  'as per federal law', 'under federal statute', 'under us law',
];

// ─── BENIGN INDICATORS (true negatives — reduce score) ────────────────────────
export const BENIGN_INDICATORS: string[] = [
  // Customer service
  'thank you for your business', 'customer service', 'customer support',
  'i hope this email finds you well', 'as per your request',
  'please find attached', 'kindly note', 'we appreciate your',

  // Order/transaction confirmation
  'order confirmation', 'your order has been', 'order number',
  'tracking number', 'tracking id', 'shipment confirmation',
  'delivery confirmation', 'package has been shipped', 'estimated delivery',
  'your receipt', 'invoice number', 'payment confirmation',
  'payment received', 'payment processed', 'refund processed',
  'refund has been issued',

  // Subscription/renewal
  'your subscription', 'renewal notice', 'annual renewal',
  'membership renewal', 'auto-renewal', 'subscription confirmation',

  // Legal / legitimate notices
  'terms of service', 'privacy policy', 'terms and conditions',
  'unsubscribe', 'opt out', 'manage preferences', 'update preferences',
  'you are receiving this because you subscribed',
  'this is a marketing email',

  // Account management (legitimate)
  'new device login detected', 'sign-in notification',
  'we noticed a new sign-in', 'you recently requested',
  'password changed successfully', 'email verified',
  'two-factor authentication enabled',

  // Welcome / onboarding
  'welcome to', 'thank you for signing up', 'thank you for joining',
  'account created successfully', 'registration confirmed',

  // Support / help
  'for assistance please', 'contact our support team', 'help center',
  'faq', 'knowledge base', 'visit our website',
  'send us an email at', 'business hours',

  // Newsletter
  'newsletter', 'weekly digest', 'monthly update', 'product update',
  'feature announcement', 'company news',
];

// ─── SOCIAL ENGINEERING PATTERNS (regex, high precision) ──────────────────────
export const SOCIAL_ENGINEERING_PATTERNS: RegExp[] = [
  /\b(do\s+not|don't)\s+(tell|contact|call|inform|notify)\s+(anyone|your\s+bank|police|family|spouse|lawyer)/gi,
  /\b(keep|this\s+must\s+remain|must\s+keep)\s+(this\s+)?(confidential|secret|private|between\s+us|away\s+from)/gi,
  /\b(arrest|sue|deport|prosecute|freeze)\s+(you|your\s+(account|assets|license))/gi,
  /\b(pay|send|deposit|wire|transfer)\s+(\w+\s+){0,3}(immediately|now|today|right\s+now|right\s+away)/gi,
  /\$[\d,]+(\.\d{2})?\s*(or\s+(you|your|face|be)|immediately|right\s+now|today)/gi,
  /\b(provide|give|share|send|read\s+out|read\s+me)\s+(your\s+)?(ssn|social\s+security|bank\s+account|routing|card\s+number|pin|password|otp|verification\s+code)/gi,
  /\b(your\s+)?(account|license|benefits|insurance|ssn)\s+(will\s+be|has\s+been|is\s+being)\s+(suspend|cancel|terminat|freez|comprom|block)/gi,
  /\b(this\s+is|i\s+am)\s+(\w+\s+)*?(final|last|only)\s+(warning|notice|chance|opportunity)\b/gi,
  /\b(do\s+not\s+)?(hang\s+up|disconnect|end\s+this\s+call|put\s+me\s+on\s+hold)\b/gi,
  /\b(we\s+have|they\s+have|i\s+have)\s+(evidence|proof|footage|recordings|documentation)\s+(of|that\s+you|against\s+you)/gi,
  /\b(you\s+are\s+under|currently\s+under)\s+(investigation|surveillance|federal\s+investigation)/gi,
  /\b(cooperate|comply)\s+(with\s+)?(us|this\s+investigation|law\s+enforcement|the\s+government)\s+(or\s+(face|be\s+arrested|be\s+charged))/gi,
  /\b(your\s+computer|your\s+device)\s+(has\s+been|is\s+being)\s+(hacked|compromised|monitored|tracked|infected)/gi,
  /\b(i\s+found|we\s+detected|system\s+detected)\s+(illegal\s+)?(activity|files|content|transactions)\s+(on|in)\s+your/gi,
  /\b(send|transfer|deposit)\b.{0,30}\b(before\s+(midnight|tomorrow|end\s+of\s+day)|right\s+now|this\s+instant)/gi,
];

// ─── AUDIO ANOMALY THRESHOLDS (calibrated from TTS/spoofing research) ─────────
export const AUDIO_ANOMALY_THRESHOLDS = {
  HIGH_ENERGY: 0.80,      // RMS > 0.80 → abnormal compression/loudness
  HIGH_SILENCE: 0.38,     // Silence ratio > 38% → scripted/robotic
  SYNTHETIC_VOICE: 0.58,  // Spectral flatness > 0.58 → TTS/synthetic
  MONOTONE_VOICE: 0.15,   // Pitch variance < 0.15 → monotone/robotic
  SHORT_CLIP_SECONDS: 4,  // < 4 seconds = suspiciously short
  LONG_CALL_SECONDS: 600, // > 600 seconds = unusual
  ZCR_ROBOTIC_LOW: 0.05,  // Very low ZCR variance = robotic
  SPECTRAL_ROLLOFF_SYNTH: 0.40, // Low rolloff proportion = synthetic
};

// ─── RISK SCORE THRESHOLDS ────────────────────────────────────────────────────
export const RISK_SCORE_THRESHOLDS = {
  SAFE_MAX: 30,       // 0–30 → Safe
  SUSPICIOUS_MAX: 60, // 31–60 → Suspicious
  // > 60 → High Risk
};

// ─── KEYWORD WEIGHT MAP (per-keyword scoring weight) ─────────────────────────
// Standard keywords = 1.0, higher = more severe threat signal
export const KEYWORD_WEIGHTS: Record<string, number> = {
  // Absolute high-confidence threats → 3.0
  'warrant out for your arrest': 3.0,
  'arrest warrant has been issued': 3.0,
  'scratch the back of the card and read the numbers': 3.0,
  'bitcoin atm': 3.0,
  'send gift cards immediately': 3.0,
  'do not shut down your computer': 3.0,
  'we are from the windows technical department': 3.0,
  'download anydesk': 2.8,
  'download teamviewer now': 2.8,
  'verify your social security number': 2.8,
  'confirm your ssn': 2.8,

  // Strong threat keywords → 2.0–2.5
  'gift card': 2.0,
  'itunes card': 2.2,
  'google play card': 2.2,
  'wire transfer': 2.0,
  'remote access': 2.0,
  'anydesk': 2.5,
  'teamviewer': 2.0,
  'bitcoin': 1.8,
  'cryptocurrency': 1.5,
  'social security number': 1.8,
  'ssn': 1.8,
  'routing number': 2.0,
  'bank account number': 2.0,
  'arrest warrant': 2.5,
  'federal warrant': 2.5,
  'you will be arrested': 2.5,
  'criminal charges': 2.0,

  // Government impersonation → 1.5–2.0
  'irs': 1.5,
  'social security administration': 1.8,
  'fbi': 1.5,
  'dea': 1.7,
  'us marshals': 2.0,
  'homeland security': 1.5,

  // Urgency → 1.2–1.5
  'act now': 1.3,
  'call immediately': 1.4,
  'final notice': 1.3,
  'last warning': 1.3,
  'failure to comply': 1.5,
  'do not hang up': 1.5,
  'do not tell anyone': 1.8,
  'keep this confidential': 1.8,
};
