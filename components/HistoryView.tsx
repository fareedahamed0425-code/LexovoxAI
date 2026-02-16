
import React from 'react';
import { HistoryEntry, RiskLevel } from '../types';

interface HistoryViewProps {
  history: HistoryEntry[];
  onClear: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = React.memo(({ history, onClear }) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case RiskLevel.SUSPICIOUS: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case RiskLevel.HIGH_RISK: return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white">Forensic Archives</h3>
          <p className="text-slate-500 text-sm">Review of past security scans and detected anomalies.</p>
        </div>
        <button
          onClick={onClear}
          className="px-4 py-2 text-xs font-bold text-red-400 glass-button border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all"
        >
          Purge Logs
        </button>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-20 rounded-2xl text-center">
          <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">folder_open</span>
          <p className="text-slate-500">No records found in local database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="glass-card p-6 rounded-xl hover:border-primary/30 transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">
                  {entry.type === 'AUDIO' ? 'audiotrack' : 'description'}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{entry.type} Analysis</span>
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-400 text-sm line-clamp-1 italic">
                  {entry.fileName || entry.previewText || 'No preview available'}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-none mb-1">Risk Score</p>
                  <p className={`text-xl font-bold font-mono ${entry.risk_score > 70 ? 'text-red-500' : entry.risk_score > 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {entry.risk_score}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(entry.risk_level)}`}>
                  {entry.risk_level}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default HistoryView;
