/**
 * SentinAI — AI Service Layer
 * ============================
 * Two-tier analysis engine:
 *
 *   TIER 1 (Primary)  — NVIDIA NIM / DeepSeek-V4-Flash
 *     Calls deepseek-ai/deepseek-v4-flash via NVIDIA's OpenAI-compatible API.
 *     Streaming enabled. DeepSeek "thinking" mode (reasoning_effort: high).
 *     Configure via .env.local:
 *       VITE_NVIDIA_API_KEY=nvapi-...
 *       VITE_NVIDIA_MODEL=deepseek-ai/deepseek-v4-flash
 *       VITE_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
 *
 *   TIER 2 (Fallback) — LexovoxAI On-Device Engine
 *     Fully offline, pattern-based NLP/neural pipeline.
 *     Used automatically when the NVIDIA key is absent or the request fails.
 */

import {
  analyzeTextWithNvidia,
  analyzeAudioWithNvidia,
  checkNvidiaStatus,
  StreamCallback,
} from './nvidiaService';
import { analyze as analyzeLocal } from './ai/index';
import { AnalysisResult } from '../types';

// Re-export types so App.tsx can import from one place
export { checkNvidiaStatus as checkVllmStatus };
export type { NvidiaStatus as VllmStatus } from './nvidiaService';
export type { StreamCallback };

/**
 * Analyzes content using NVIDIA NIM / DeepSeek-V4-Flash (streaming) if the
 * API key is configured, otherwise falls back to the on-device LexovoxAI engine.
 *
 * @param content     - Text content or audio descriptor
 * @param type        - 'TEXT' | 'AUDIO'
 * @param audioBase64 - Base64 audio data (AUDIO type only; reserved for future multimodal)
 * @param onStream    - Optional callback for live streaming tokens (NIM only)
 */
export const analyzeContent = async (
  content: string,
  type: 'TEXT' | 'AUDIO',
  audioBase64?: string,
  onStream?: StreamCallback
): Promise<AnalysisResult> => {
  // ── Tier 1: NVIDIA NIM / DeepSeek-V4-Flash ──────────────────────────────────
  const nimStatus = await checkNvidiaStatus();

  if (nimStatus.available) {
    console.log(`[SentinAI] Engine: NVIDIA NIM / DeepSeek-V4-Flash — ${type} analysis (streaming)`);
    try {
      if (type === 'AUDIO') {
        return await analyzeAudioWithNvidia(content, onStream);
      }
      return await analyzeTextWithNvidia(content, onStream);
    } catch (err) {
      console.warn('[SentinAI] NVIDIA NIM request failed — falling back to on-device engine:', err);
      onStream?.({ done: true }); // Close any open stream UI
    }
  } else {
    console.log('[SentinAI] No NVIDIA API key — using on-device LexovoxAI engine');
  }

  // ── Tier 2: On-device LexovoxAI engine ──────────────────────────────────────
  const startTime = performance.now();
  const result = await analyzeLocal(content, type, audioBase64);
  const elapsed = (performance.now() - startTime).toFixed(1);
  console.log(`[SentinAI] On-device analysis complete in ${elapsed}ms — Risk: ${result.risk_score}/100`);
  return result;
};
