/**
 * LexovoxAI — AI Service Layer (On-Device Engine)
 * ===================================================
 * All analysis runs entirely on-device using the LexovoxAI
 * dual-module engine located at ./ai/index.ts
 *
 * Module 1: AUDIO_ANALYSIS — harmful content, music ID, speech
 * Module 2: TEXT_ANALYSIS  — threat assessment, sentiment, context
 *
 * Zero external network calls. Zero API keys required.
 * Zero latency from network. Works fully offline.
 */

import { analyze } from './ai/index';
import { AnalysisResult } from '../types';

/**
 * Analyzes content (text or audio) using the LexovoxAI on-device engine.
 *
 * @param content     - Text content or description string
 * @param type        - 'TEXT' for Module 2 (threat assessment), 'AUDIO' for Module 1 (forensic audio)
 * @param audioBase64 - Base64 audio data (required for AUDIO type)
 */
export const analyzeContent = async (
  content: string,
  type: 'TEXT' | 'AUDIO',
  audioBase64?: string
): Promise<AnalysisResult> => {
  console.log(`[LexovoxAI] Starting ${type} analysis — Module ${type === 'AUDIO' ? '1: AUDIO_ANALYSIS' : '2: TEXT_ANALYSIS'}...`);
  const startTime = performance.now();

  const result = await analyze(content, type, audioBase64);

  const elapsed = (performance.now() - startTime).toFixed(1);
  console.log(`[LexovoxAI] Analysis complete in ${elapsed}ms — Risk Score: ${result.risk_score}/100`);

  return result;
};
