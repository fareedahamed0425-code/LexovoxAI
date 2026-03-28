/**
 * LexovoxAI — Audio Analysis Engine (Module 1)
 * =================================================
 * Produces structured AUDIO_ANALYSIS JSON conforming to the LexovoxAI spec.
 * Combines NLP features from transcription and audio signal features into
 * harmful_content, music_identification, and speech_analysis sections.
 */

import {
  AudioAnalysisResult,
  AudioHarmfulContent,
  AudioFlag,
  MusicIdentification,
  SpeechAnalysis,
  TrackDetails,
} from '../../types';
import { NLPFeatures } from './nlpEngine';
import { AudioFeatures } from './audioEngine';

// ─── HARMFUL CONTENT CATEGORIES IN AUDIO ─────────────────────────────────────

const HATE_SPEECH_PATTERNS: RegExp[] = [
  /\b(nigger|faggot|kike|spic|chink|wetback|raghead|gook|dyke)\b/gi,
  /\b(go back to your country|you people|those people are all)\b/gi,
  /\b(white power|white supremacy|ethnic cleansing|final solution|gas the)\b/gi,
];

const VIOLENCE_INCITEMENT_PATTERNS: RegExp[] = [
  /\b(kill them all|burn it down|attack (them|the|all)|we must destroy)\b/gi,
  /\b(take up arms|revolution now|overthrow|rise up and fight)\b/gi,
  /\b(shoot|bomb|attack).{0,30}\b(the government|police|crowd|crowd|rally|protest)\b/gi,
];

const EXPLICIT_CONTENT_PATTERNS: RegExp[] = [
  /\b(fuck|shit|ass|bitch|cunt|motherfucker|pussy|cock|dick)\b/gi,
  /\b(sex|sexual|intercourse|orgasm|masturbat|naked|nude|porn)\b/gi,
];

const DRUG_PROMOTION_PATTERNS: RegExp[] = [
  /\b(pop a molly|roll on x|hit the pipe|smoke crack|sell dope|sling rocks)\b/gi,
  /\b(fentanyl|heroin|meth|cocaine|ecstasy|mdma).{0,30}\b(use|take|do|get|sell|buy)\b/gi,
];

const SELF_HARM_AUDIO_PATTERNS: RegExp[] = [
  /\b(kill myself|end it all|take my life|suicide|self harm|cut myself)\b/gi,
  /\b(no reason to live|want to die|not worth living)\b/gi,
];

// ─── MUSIC KEYWORDS (very rough heuristic for audio transcription) ─────────────

const MUSIC_LYRIC_PATTERNS: RegExp[] = [
  /\b(chorus|verse|bridge|hook|beat drop|drop the beat)\b/gi,
  /\b(yeah yeah yeah|uh uh uh|oh oh oh|na na na|la la la)\b/gi,
  /\b(melody|rhythm|harmony|chord|bass line|tempo)\b/gi,
];

const KNOWN_SONG_PATTERNS: RegExp[] = [
  // 2Pac / hip hop classics
  /\b(all eyez on me|changes|california love|hit 'em up|dear mama)\b/gi,
  // Drake
  /\b(god's plan|hotline bling|started from the bottom|one dance)\b/gi,
  // Generic pop signals
  /\b(we found love|rolling in the deep|shape of you|blinding lights)\b/gi,
];

// ─── SCORE MAPPING ────────────────────────────────────────────────────────────

function scoreToVerdict(riskScore: number): 'HARMFUL' | 'SAFE' | 'REVIEW_NEEDED' {
  if (riskScore >= 60) return 'HARMFUL';
  if (riskScore >= 30) return 'REVIEW_NEEDED';
  return 'SAFE';
}

function scoreToRiskLevel(riskScore: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
  if (riskScore >= 80) return 'CRITICAL';
  if (riskScore >= 60) return 'HIGH';
  if (riskScore >= 40) return 'MEDIUM';
  if (riskScore >= 20) return 'LOW';
  return 'NONE';
}

// ─── FLAG BUILDER ─────────────────────────────────────────────────────────────

function buildAudioFlags(
  text: string,
  features: NLPFeatures | null,
  audioFeatures: AudioFeatures | null
): AudioFlag[] {
  const flags: AudioFlag[] = [];

  if (!text) return flags;

  // Check hate speech
  for (const p of HATE_SPEECH_PATTERNS) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m) {
      flags.push({
        type: 'hate_speech',
        timestamp: null,
        excerpt: m[0].substring(0, 80),
        severity: 'HIGH',
      });
      break;
    }
  }

  // Check violence incitement
  for (const p of VIOLENCE_INCITEMENT_PATTERNS) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m) {
      flags.push({
        type: 'violence_incitement',
        timestamp: null,
        excerpt: m[0].substring(0, 80),
        severity: 'HIGH',
      });
      break;
    }
  }

  // Check explicit content
  let explicitMatches = 0;
  for (const p of EXPLICIT_CONTENT_PATTERNS) {
    p.lastIndex = 0;
    if (p.test(text)) explicitMatches++;
  }
  if (explicitMatches >= 2) {
    flags.push({
      type: 'explicit_content',
      timestamp: null,
      excerpt: 'Multiple explicit content markers detected in audio content.',
      severity: explicitMatches >= 4 ? 'HIGH' : 'MEDIUM',
    });
  }

  // Check drug promotion
  for (const p of DRUG_PROMOTION_PATTERNS) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m) {
      flags.push({
        type: 'drug_promotion',
        timestamp: null,
        excerpt: m[0].substring(0, 80),
        severity: 'MEDIUM',
      });
      break;
    }
  }

  // Check self-harm
  for (const p of SELF_HARM_AUDIO_PATTERNS) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m) {
      flags.push({
        type: 'self_harm',
        timestamp: null,
        excerpt: m[0].substring(0, 80),
        severity: 'HIGH',
      });
      break;
    }
  }

  // From NLP features — scam/fraud content
  if (features) {
    if (features.categoryMatches.length > 0) {
      flags.push({
        type: 'fraud_scam',
        timestamp: null,
        excerpt: `Scam pattern detected: ${features.categoryMatches.slice(0, 2).join(', ')}`,
        severity: features.tier1Score > 0.5 ? 'HIGH' : 'MEDIUM',
      });
    }
    if (features.manipulation > 0.5) {
      flags.push({
        type: 'social_engineering',
        timestamp: null,
        excerpt: 'Psychological manipulation and coercive language patterns detected.',
        severity: 'MEDIUM',
      });
    }
  }

  // From audio features — synthetic voice
  if (audioFeatures && audioFeatures.syntheticVoiceScore > 0.60) {
    flags.push({
      type: 'synthetic_voice_detected',
      timestamp: null,
      excerpt: `Audio forensics: ${Math.round(audioFeatures.syntheticVoiceScore * 100)}% probability of AI-generated or cloned voice.`,
      severity: audioFeatures.syntheticVoiceScore > 0.80 ? 'HIGH' : 'MEDIUM',
    });
  }

  return flags;
}

// ─── MUSIC IDENTIFICATION ─────────────────────────────────────────────────────

function buildMusicIdentification(text: string, isAudioOnly: boolean): MusicIdentification {
  const hasLyricPatterns = MUSIC_LYRIC_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); });
  const hasKnownSong = KNOWN_SONG_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); });

  const is_music = hasLyricPatterns || hasKnownSong;
  const emptyTrack: TrackDetails = {
    title: null, artist: null, album: null,
    release_year: null, genre: null, origin_country: null,
    language: null, label: null,
  };

  if (!is_music) {
    return {
      is_music: false,
      found_online: false,
      track_details: emptyTrack,
      streaming_availability: [],
      copyright_status: 'UNKNOWN',
      notes: isAudioOnly
        ? 'No audio transcription provided. Music identification requires transcription data (e.g., via Whisper or AssemblyAI).'
        : 'Content does not appear to be music based on available transcription.',
    };
  }

  // Try to identify known song (limited heuristic)
  let track_details = emptyTrack;

  if (/\b(god's plan|hotline bling)\b/i.test(text)) {
    track_details = {
      title: /god's plan/i.test(text) ? "God's Plan" : 'Hotline Bling',
      artist: 'Drake',
      album: /god's plan/i.test(text) ? 'Scary Hours' : 'Views',
      release_year: /god's plan/i.test(text) ? '2018' : '2016',
      genre: 'Hip-Hop / R&B',
      origin_country: 'Canada',
      language: 'English',
      label: 'Young Money / Cash Money / Republic',
    };
  } else if (/\b(blinding lights)\b/i.test(text)) {
    track_details = {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      release_year: '2019',
      genre: 'Synth-pop / R&B',
      origin_country: 'Canada',
      language: 'English',
      label: 'XO / Republic',
    };
  } else {
    track_details = {
      title: 'Unknown',
      artist: 'Unknown',
      album: null,
      release_year: null,
      genre: 'Unknown',
      origin_country: null,
      language: 'Unknown',
      label: null,
    };
  }

  return {
    is_music: true,
    found_online: track_details.title !== 'Unknown' ? true : 'unknown',
    track_details,
    streaming_availability: track_details.title !== 'Unknown'
      ? ['Spotify', 'Apple Music', 'YouTube', 'Amazon Music', 'Tidal']
      : [],
    copyright_status: track_details.title !== 'Unknown' ? 'COPYRIGHTED' : 'UNKNOWN',
    notes: isAudioOnly
      ? 'Music identification is based on transcription analysis only. Results may be inaccurate without audio fingerprinting.'
      : track_details.title !== 'Unknown'
        ? `Identified track: "${track_details.title}" by ${track_details.artist}. Copyrighted work — streaming rights apply.`
        : 'Audio contains music characteristics but specific track could not be identified from transcription alone.',
  };
}

// ─── SPEECH ANALYSIS BUILDER ──────────────────────────────────────────────────

function buildSpeechAnalysis(
  text: string,
  features: NLPFeatures | null,
  audioFeatures: AudioFeatures | null,
  isMusic: boolean
): SpeechAnalysis {
  // Language detection (simple)
  function detectLang(t: string): string {
    if (/[\u0600-\u06FF]/.test(t)) return 'Arabic';
    if (/[\u4E00-\u9FFF]/.test(t)) return 'Chinese';
    const lower = t.toLowerCase();
    const spanishWords = ['hola', 'como', 'que', 'para', 'con', 'una', 'por', 'esta'];
    const hits = spanishWords.filter(w => lower.includes(` ${w} `)).length;
    return hits >= 2 ? 'Spanish' : 'English';
  }

  const detected_language = text ? detectLang(text) : 'unknown';

  const content_type: SpeechAnalysis['content_type'] =
    isMusic ? 'music' :
    !text ? 'unknown' :
    'speech';

  // Key themes from NLP
  const key_themes: string[] = [];
  if (features) {
    if (features.categoryMatches.length > 0) key_themes.push(...features.categoryMatches.slice(0, 3));
    if (features.urgency > 0.4) key_themes.push('urgency / time pressure');
    if (features.manipulation > 0.4) key_themes.push('social engineering');
    if (features.impersonation > 0.4) key_themes.push('authority impersonation');
  }
  if (isMusic) key_themes.push('music / lyrics');
  if (!text) key_themes.push('audio-only (no transcription)');
  if (key_themes.length === 0) key_themes.push('general communication');

  // Speaker count heuristic (from audio features)
  const speaker_count: SpeechAnalysis['speaker_count'] =
    audioFeatures
      ? (audioFeatures.durationSeconds > 30 ? 'unknown' : '1')
      : 'unknown';

  return { detected_language, speaker_count, content_type, key_themes };
}

// ─── HARMFUL CONTENT SUMMARY ──────────────────────────────────────────────────

function buildHarmfulContentSummary(
  verdict: string,
  flags: AudioFlag[],
  riskScore: number,
  text: string
): string {
  if (verdict === 'SAFE') {
    return `LexovoxAI assessed this audio as SAFE (Risk Score: ${riskScore}/100). No harmful content patterns were identified in the available transcription or audio signal analysis.`;
  }

  const flagTypes = [...new Set(flags.map(f => f.type.replace(/_/g, ' ')))].join(', ');
  if (verdict === 'HARMFUL') {
    return `LexovoxAI flagged this audio as HARMFUL (Risk Score: ${riskScore}/100). The following content types were detected: ${flagTypes || 'general threat content'}. Content should be reviewed and may require escalation or removal.`;
  }

  return `LexovoxAI requires human review for this audio (Risk Score: ${riskScore}/100). Potential issues identified: ${flagTypes || 'ambiguous threat signals'}. Review recommended before distribution or action.`;
}

// ─── MINOR DETECTION ─────────────────────────────────────────────────────────

function checkForMinorsInAudio(text: string, flags: AudioFlag[]): boolean {
  return /\b(child|children|minor|underage|kid|teen|teenager|youth|juvenile)\b/i.test(text) &&
    flags.some(f => ['explicit_content', 'hate_speech', 'self_harm', 'drug_promotion'].includes(f.type));
}

// ─── MASTER FUNCTION ─────────────────────────────────────────────────────────

export function buildAudioAnalysisResult(
  features: NLPFeatures | null,
  audioFeatures: AudioFeatures | null,
  riskScore: number,
  transcript: string
): AudioAnalysisResult {
  const isAudioOnly = !transcript || transcript.startsWith('Forensic Analysis of audio sample:');
  const effectiveText = isAudioOnly ? '' : transcript;

  const flags = buildAudioFlags(effectiveText, features, audioFeatures);
  const verdict = scoreToVerdict(riskScore);
  const risk_level = scoreToRiskLevel(riskScore);

  // Confidence
  let confidence = Math.min(
    Math.round(
      (flags.length * 20) +
      (features ? features.tier1Score * 30 : 0) +
      (audioFeatures ? audioFeatures.syntheticVoiceScore * 25 : 0) +
      (isAudioOnly ? 0 : 20) // bonus for having transcript
    ),
    100
  );
  if (flags.length === 0 && !isAudioOnly) confidence = Math.max(confidence, 20);

  const harmful_content: AudioHarmfulContent = {
    verdict,
    confidence,
    risk_level,
    flags,
    summary: buildHarmfulContentSummary(verdict, flags, riskScore, effectiveText),
  };

  const musicId = buildMusicIdentification(effectiveText, isAudioOnly);
  const speechAnalysis = buildSpeechAnalysis(effectiveText, features, audioFeatures, musicId.is_music);

  const result: AudioAnalysisResult = {
    module: 'AUDIO_ANALYSIS',
    harmful_content,
    music_identification: musicId,
    speech_analysis: speechAnalysis,
  };

  const minorInvolved = checkForMinorsInAudio(effectiveText, flags);
  if (minorInvolved) {
    result.MINOR_INVOLVED = true;
  }

  return result;
}
