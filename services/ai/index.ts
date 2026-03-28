/**
 * LexovoxAI — Unified Engine Entry Point
 * ==========================================
 * Single public API for the complete LexovoxAI analysis engine.
 *
 * Modules:
 *   MODULE 1 — AUDIO_ANALYSIS: Audio forensics, harmful content, music ID, speech analysis
 *   MODULE 2 — TEXT_ANALYSIS:  Threat assessment, sentiment profiling, context analysis
 *
 * Usage:
 *   import { analyze } from './services/ai';
 *   const result = await analyze(text, 'TEXT');
 *   const result = await analyze(transcript, 'AUDIO', audioBase64);
 *
 * No external dependencies. No LLMs. No API keys.
 * Fully self-contained. Runs in the browser.
 */

import { AnalysisResult, SentinelResult } from '../../types';
import { extractNLPFeatures, NLPFeatures } from './nlpEngine';
import { extractAudioFeatures, AudioFeatures } from './audioEngine';
import { runNeuralSchema } from './neuralSchema';
import { buildTextAnalysisResult } from './sentinelTextEngine';
import { buildAudioAnalysisResult } from './sentinelAudioEngine';

// Re-export types for convenience
export type { NLPFeatures } from './nlpEngine';
export type { AudioFeatures } from './audioEngine';

/**
 * Core analysis function — routes input through LexovoxAI pipeline.
 *
 * @param content     - Raw text content or transcript (used for NLP)
 * @param type        - Analysis type: 'TEXT' or 'AUDIO'
 * @param audioBase64 - Base64-encoded audio data (required when type='AUDIO')
 * @returns Complete AnalysisResult with legacy fields + sentinel structured JSON
 */
export async function analyze(
  content: string,
  type: 'TEXT' | 'AUDIO',
  audioBase64?: string
): Promise<AnalysisResult> {
  let nlpFeatures: NLPFeatures | null = null;
  let audioFeatures: AudioFeatures | null = null;
  const errors: string[] = [];

  // ── NLP analysis ──────────────────────────────────────────────────────────
  // Always run NLP if there is text content (even for audio descriptors)
  if (content && content.trim().length > 0) {
    try {
      nlpFeatures = extractNLPFeatures(content);
    } catch (err) {
      console.warn('[LexovoxAI] NLP engine error:', err);
      errors.push('NLP pipeline encountered an error');
    }
  }

  // ── Audio analysis ────────────────────────────────────────────────────────
  if (type === 'AUDIO' && audioBase64) {
    try {
      audioFeatures = await extractAudioFeatures(audioBase64);
    } catch (err) {
      console.warn('[LexovoxAI] Audio engine error:', err);
      errors.push('Audio decoding failed — ensure the file is a valid audio format');
    }
  }

  // ── Neural schema — legacy scoring ────────────────────────────────────────
  const legacyResult = runNeuralSchema(nlpFeatures, audioFeatures);

  // Append any engine errors to indicators for transparency
  if (errors.length > 0) {
    legacyResult.detected_indicators = [
      ...legacyResult.detected_indicators,
      ...errors.map(e => `[Engine Warning] ${e}`),
    ];
  }

  // ── LexovoxAI structured output ───────────────────────────────────────────
  let sentinelResult: SentinelResult;

  if (type === 'AUDIO') {
    sentinelResult = buildAudioAnalysisResult(
      nlpFeatures,
      audioFeatures,
      legacyResult.risk_score,
      content
    );
  } else {
    sentinelResult = buildTextAnalysisResult(
      nlpFeatures!,
      legacyResult.risk_score,
      content
    );
  }

  return {
    ...legacyResult,
    sentinel: sentinelResult,
  };
}
