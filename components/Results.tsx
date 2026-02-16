
import React, { useEffect, useState } from 'react';
import { AnalysisResult, RiskLevel } from '../types';

interface Props {
  result: AnalysisResult;
}

const Results: React.FC<Props> = React.memo(({ result }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
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

  const getScoreColorClass = () => {
    if (result.risk_score < 30) return 'text-emerald-400';
    if (result.risk_score < 70) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getRiskStatus = () => {
    if (result.risk_level === RiskLevel.SAFE) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
    if (result.risk_level === RiskLevel.SUSPICIOUS) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' };
    return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' };
  };

  const status = getRiskStatus();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-8 col-span-2 flex items-center gap-10">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${displayScore}, 100`}
                className={`${getScoreColorClass()} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold font-mono ${getScoreColorClass()}`}>{displayScore}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Risk Index</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.border} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`}></span>
                {result.risk_level} Detection
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">{result.explanation}</h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Detection Accuracy</p>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold font-mono">{result.confidence_level}</span>
              <span className="text-xs text-slate-500 font-bold">Confidence</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(13,185,242,0.5)]"
                style={{ width: result.confidence_level === 'High' ? '95%' : result.confidence_level === 'Medium' ? '65%' : '35%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Structural Vulnerabilities Identified</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.detected_indicators.map((indicator, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-glass-border hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">verified_user</span>
                <span className="text-sm text-slate-300 font-medium group-hover:text-white">{indicator}</span>
              </div>
            </div>
          ))}
          {result.detected_indicators.length === 0 && (
            <div className="col-span-full py-6 text-center text-slate-500 font-mono text-sm italic">
              No anomalous markers found in existing dataset.
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Results;
