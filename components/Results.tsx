
import React, { useEffect, useState } from 'react';
import { AnalysisResult, RiskLevel, SentinelResult, TextAnalysisResult, AudioAnalysisResult } from '../types';

interface Props {
  result: AnalysisResult;
}

// ─── UTILITY HELPERS ──────────────────────────────────────────────────────────

const verdictBadgeClass = (verdict: string): string => {
  if (verdict === 'HARMFUL' || verdict === 'THREATENING') return 'bg-red-500/15 border-red-500/30 text-red-400';
  if (verdict === 'SAFE' || verdict === 'NOT_THREATENING') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400';
};

const threatLevelClass = (level: string): string => {
  if (level === 'CRITICAL') return 'text-red-500';
  if (level === 'HIGH') return 'text-orange-400';
  if (level === 'MEDIUM') return 'text-yellow-400';
  if (level === 'LOW') return 'text-blue-400';
  return 'text-emerald-400';
};

const threatLevelBarColor = (level: string): string => {
  if (level === 'CRITICAL') return 'bg-red-500';
  if (level === 'HIGH') return 'bg-orange-400';
  if (level === 'MEDIUM') return 'bg-yellow-400';
  if (level === 'LOW') return 'bg-blue-400';
  return 'bg-emerald-400';
};

const severityDot = (severity: string): string => {
  if (severity === 'HIGH') return 'bg-red-500';
  if (severity === 'MEDIUM') return 'bg-yellow-400';
  return 'bg-blue-400';
};

const sentimentIcon = (sentiment: string): string => {
  const icons: Record<string, string> = {
    hostile: 'local_fire_department',
    aggressive: 'bolt',
    manipulative: 'psychology',
    distressed: 'crisis_alert',
    neutral: 'sentiment_neutral',
    positive: 'sentiment_satisfied',
  };
  return icons[sentiment] ?? 'sentiment_neutral';
};

// ─── MODULE BADGE ──────────────────────────────────────────────────────────────

const ModuleBadge: React.FC<{ module: 'AUDIO_ANALYSIS' | 'TEXT_ANALYSIS' }> = ({ module }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
    module === 'AUDIO_ANALYSIS'
      ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
      : 'bg-primary/10 border-primary/30 text-primary'
  }`}>
    <span className="material-symbols-outlined text-sm leading-none">
      {module === 'AUDIO_ANALYSIS' ? 'graphic_eq' : 'sms'}
    </span>
    {module === 'AUDIO_ANALYSIS' ? 'Audio Analysis' : 'Text Analysis'}
  </span>
);

// ─── SCORE RING ────────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; animated: number }> = ({ score, animated }) => {
  const color = score < 30 ? '#10b981' : score < 60 ? '#f59e0b' : score < 80 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${animated * 0.94 /* scale 100 to circumference */}, 94`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{animated}</span>
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Risk Score</span>
      </div>
    </div>
  );
};

// ─── CONFIDENCE BAR ───────────────────────────────────────────────────────────

const ConfidenceBar: React.FC<{ confidence: number; label?: string }> = ({ confidence, label }) => (
  <div className="space-y-1.5">
    {label && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>}
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(13,185,242,0.5)] transition-all duration-1000"
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-primary">{confidence}%</span>
    </div>
  </div>
);

// ─── TEXT ANALYSIS VIEW ───────────────────────────────────────────────────────

const TextAnalysisView: React.FC<{ data: TextAnalysisResult; animatedScore: number; riskScore: number }> = ({ data, animatedScore, riskScore }) => {
  const { threat_assessment, sentiment_profile, context_analysis, summary } = data;

  return (
    <div className="space-y-6">

      {/* Header Row */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <ScoreRing score={riskScore} animated={animatedScore} />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <ModuleBadge module="TEXT_ANALYSIS" />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${verdictBadgeClass(threat_assessment.verdict)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {threat_assessment.verdict.replace(/_/g, ' ')}
            </span>
            {data.MINOR_INVOLVED && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 border border-red-500/40 text-red-400">
                <span className="material-symbols-outlined text-sm">child_care</span>
                Minor Involved
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed font-medium max-w-2xl">{summary}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Threat Level</p>
          <p className={`text-2xl font-black font-mono ${threatLevelClass(threat_assessment.threat_level)}`}>
            {threat_assessment.threat_level}
          </p>
        </div>
      </div>

      {/* Threat Assessment + Sentiment Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Threat Assessment */}
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-red-400">gpp_bad</span>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Threat Assessment</h4>
          </div>

          <ConfidenceBar confidence={threat_assessment.confidence} label="Detection Confidence" />

          {/* Threat level bar */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Threat Level</p>
            <div className="flex items-center gap-3">
              {['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(lvl => (
                <div key={lvl} className="flex-1 space-y-1">
                  <div className={`h-2 rounded-full transition-all duration-700 ${
                    ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf(threat_assessment.threat_level) >=
                    ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf(lvl)
                      ? threatLevelBarColor(lvl)
                      : 'bg-slate-800'
                  }`} />
                  <p className="text-[7px] text-slate-500 text-center uppercase">{lvl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Threat types */}
          {threat_assessment.threat_types.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Identified Threat Categories</p>
              <div className="space-y-2">
                {threat_assessment.threat_types.map((tt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-glass-border hover:border-red-500/20 transition-all group">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">warning</span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-400">{tt.category.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-500 ml-2">→ {tt.target}</span>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tt.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {threat_assessment.threat_types.length === 0 && (
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <p className="text-xs text-emerald-400 font-medium">No specific threat categories identified.</p>
            </div>
          )}

          {/* Urgency + Action */}
          <div className="pt-2 border-t border-glass-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Urgency</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                threat_assessment.urgency === 'IMMEDIATE_ACTION' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                threat_assessment.urgency === 'MONITOR' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}>
                {threat_assessment.urgency.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Recommended Action</p>
              <p className="text-xs text-slate-300 leading-relaxed">{threat_assessment.recommended_action}</p>
            </div>
          </div>
        </div>

        {/* Right column: Sentiment + Context */}
        <div className="space-y-6">
          {/* Sentiment Profile */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-purple">psychology</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sentiment Profile</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                <span className={`material-symbols-outlined text-2xl ${
                  sentiment_profile.overall_sentiment === 'hostile' ? 'text-red-400' :
                  sentiment_profile.overall_sentiment === 'aggressive' ? 'text-orange-400' :
                  sentiment_profile.overall_sentiment === 'manipulative' ? 'text-yellow-400' :
                  sentiment_profile.overall_sentiment === 'distressed' ? 'text-blue-400' :
                  sentiment_profile.overall_sentiment === 'positive' ? 'text-emerald-400' :
                  'text-slate-400'
                }`}>{sentimentIcon(sentiment_profile.overall_sentiment)}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dominant Sentiment</p>
                <p className="text-lg font-black capitalize text-white">{sentiment_profile.overall_sentiment}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Escalation Risk</p>
                <p className={`text-lg font-black ${
                  sentiment_profile.escalation_risk === 'HIGH' ? 'text-red-400' :
                  sentiment_profile.escalation_risk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>{sentiment_profile.escalation_risk}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Emotional Indicators</p>
              <div className="flex flex-wrap gap-2">
                {sentiment_profile.emotional_indicators.map((em, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-glass-border text-slate-300 capitalize">
                    {em}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Context Analysis */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">manage_search</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Context Analysis</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-glass-border">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Language</p>
                <p className="text-sm font-bold text-white">{context_analysis.language}</p>
              </div>
              <div className={`p-3 rounded-lg border ${context_analysis.target_identified ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-glass-border'}`}>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Target ID'd</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${context_analysis.target_identified ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <p className={`text-sm font-bold ${context_analysis.target_identified ? 'text-red-400' : 'text-emerald-400'}`}>
                    {context_analysis.target_identified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-lg border col-span-2 ${context_analysis.personal_info_present ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-glass-border'}`}>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Personal Info</p>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-orange-400">
                    {context_analysis.personal_info_present ? 'badge' : 'shield'}
                  </span>
                  <p className={`text-sm font-bold ${context_analysis.personal_info_present ? 'text-orange-400' : 'text-slate-300'}`}>
                    {context_analysis.personal_info_present ? 'PII Detected' : 'No PII Found'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Likely Intent</p>
              <p className="text-xs text-slate-300 leading-relaxed">{context_analysis.likely_intent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AUDIO ANALYSIS VIEW ──────────────────────────────────────────────────────

const AudioAnalysisView: React.FC<{ data: AudioAnalysisResult; animatedScore: number; riskScore: number }> = ({ data, animatedScore, riskScore }) => {
  const { harmful_content, music_identification, speech_analysis } = data;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <ScoreRing score={riskScore} animated={animatedScore} />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <ModuleBadge module="AUDIO_ANALYSIS" />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${verdictBadgeClass(harmful_content.verdict)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {harmful_content.verdict.replace(/_/g, ' ')}
            </span>
            {data.MINOR_INVOLVED && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 border border-red-500/40 text-red-400">
                <span className="material-symbols-outlined text-sm">child_care</span>
                Minor Involved
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed font-medium max-w-2xl">{harmful_content.summary}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Risk Level</p>
          <p className={`text-2xl font-black font-mono ${threatLevelClass(harmful_content.risk_level)}`}>
            {harmful_content.risk_level}
          </p>
        </div>
      </div>

      {/* Content Flags + Music Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Harmful Content Flags */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">flag</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content Flags</h4>
            </div>
            <ConfidenceBar confidence={harmful_content.confidence} />
          </div>

          {harmful_content.flags.length === 0 ? (
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <p className="text-xs text-emerald-400 font-medium">No harmful content flags raised.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {harmful_content.flags.map((flag, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-glass-border hover:border-red-500/20 transition-all group">
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot(flag.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {flag.type.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          flag.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          flag.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{flag.severity}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono leading-relaxed break-words italic">"{flag.excerpt}"</p>
                      {flag.timestamp && (
                        <p className="text-[10px] text-slate-600 mt-1">@ {flag.timestamp}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Music ID + Speech */}
        <div className="space-y-6">
          {/* Music Identification */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-purple">music_note</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Music Identification</h4>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                music_identification.is_music
                  ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
                  : 'bg-white/5 border-glass-border text-slate-500'
              }`}>
                {music_identification.is_music ? '♪ Music Detected' : 'Not Music'}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                music_identification.copyright_status === 'COPYRIGHTED'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-white/5 border-glass-border text-slate-500'
              }`}>
                {music_identification.copyright_status}
              </div>
            </div>

            {music_identification.is_music && music_identification.track_details.title ? (
              <div className="space-y-2">
                {[
                  ['Title', music_identification.track_details.title],
                  ['Artist', music_identification.track_details.artist],
                  ['Album', music_identification.track_details.album],
                  ['Year', music_identification.track_details.release_year],
                  ['Genre', music_identification.track_details.genre],
                  ['Country', music_identification.track_details.origin_country],
                  ['Language', music_identification.track_details.language],
                  ['Label', music_identification.track_details.label],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{k}</span>
                    <span className="text-xs text-slate-200 font-medium text-right max-w-[60%] truncate">{v}</span>
                  </div>
                ))}
                {music_identification.streaming_availability.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Streaming</p>
                    <div className="flex flex-wrap gap-1.5">
                      {music_identification.streaming_availability.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-glass-border text-slate-400">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic leading-relaxed">{music_identification.notes}</p>
            )}
          </div>

          {/* Speech Analysis */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">record_voice_over</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Speech Analysis</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-glass-border">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Language</p>
                <p className="text-sm font-bold text-white">{speech_analysis.detected_language}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-glass-border">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Speakers</p>
                <p className="text-sm font-bold text-white capitalize">{speech_analysis.speaker_count}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-glass-border col-span-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Content Type</p>
                <p className="text-sm font-bold text-white capitalize">{speech_analysis.content_type}</p>
              </div>
            </div>
            {speech_analysis.key_themes.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Key Themes</p>
                <div className="flex flex-wrap gap-2">
                  {speech_analysis.key_themes.map((theme, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary capitalize">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LEGACY FALLBACK VIEW ─────────────────────────────────────────────────────

const LegacyResultView: React.FC<{ result: AnalysisResult; animatedScore: number }> = ({ result, animatedScore }) => {
  const getScoreColor = () => result.risk_score < 30 ? 'text-emerald-400' : result.risk_score < 60 ? 'text-yellow-400' : 'text-red-500';
  const status = result.risk_level === RiskLevel.SAFE
    ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' }
    : result.risk_level === RiskLevel.SUSPICIOUS
      ? { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' }
      : { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel rounded-2xl p-8 col-span-2 flex items-center gap-10">
        <ScoreRing score={result.risk_score} animated={animatedScore} />
        <div className="space-y-4">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.border} ${status.text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {result.risk_level} Detection
          </span>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium max-w-2xl">
            {result.explanation}
          </div>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-8 flex flex-col justify-center">
        <ConfidenceBar confidence={result.confidence_level === 'High' ? 95 : result.confidence_level === 'Medium' ? 65 : 35} label="Detection Accuracy" />
        <div className="mt-6">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Detected Indicators</p>
          <div className="space-y-2">
            {result.detected_indicators.slice(0, 5).map((ind, i) => (
              <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5 flex-shrink-0">chevron_right</span>
                {ind}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── JSON RAW VIEW ────────────────────────────────────────────────────────────

const JsonView: React.FC<{ data: SentinelResult }> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-glass-border bg-white/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">data_object</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Raw JSON Output</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg glass-button text-slate-400 hover:text-white transition-colors text-[10px] font-bold"
        >
          <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
        {json}
      </pre>
    </div>
  );
};

// ─── MASTER COMPONENT ─────────────────────────────────────────────────────────

const Results: React.FC<Props> = React.memo(({ result }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    setDisplayScore(0);
    let start = 0;
    const end = result.risk_score;
    const duration = 1500;
    const step = 16;
    const increment = end / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, step);

    return () => clearInterval(timer);
  }, [result.risk_score]);

  const sentinel = result.sentinel;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* JSON Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">analytics</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">LexovoxAI Analysis Report</span>
        </div>
        {sentinel && (
          <button
            onClick={() => setShowJson(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button text-slate-400 hover:text-primary transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm">code</span>
            {showJson ? 'Hide' : 'View'} JSON
          </button>
        )}
      </div>

      {/* Main structured view */}
      {sentinel && sentinel.module === 'TEXT_ANALYSIS' && (
        <TextAnalysisView
          data={sentinel as TextAnalysisResult}
          animatedScore={displayScore}
          riskScore={result.risk_score}
        />
      )}
      {sentinel && sentinel.module === 'AUDIO_ANALYSIS' && (
        <AudioAnalysisView
          data={sentinel as AudioAnalysisResult}
          animatedScore={displayScore}
          riskScore={result.risk_score}
        />
      )}
      {!sentinel && (
        <LegacyResultView result={result} animatedScore={displayScore} />
      )}

      {/* Raw JSON view */}
      {showJson && sentinel && (
        <div className="animate-in fade-in duration-300">
          <JsonView data={sentinel} />
        </div>
      )}

      {/* Legacy indicators (when sentinel is present, show as collapsible detail) */}
      {sentinel && result.detected_indicators.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">
            Neural Engine Indicators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.detected_indicators.map((indicator, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-glass-border hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-sm group-hover:scale-110 transition-transform">verified_user</span>
                  <span className="text-xs text-slate-300 font-medium group-hover:text-white">{indicator}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default Results;
