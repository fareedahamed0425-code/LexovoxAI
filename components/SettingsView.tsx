
import React, { useState } from 'react';

interface SettingsProps {
  onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsProps> = React.memo(({ onClearHistory }) => {
  const [sensitivity, setSensitivity] = useState(75);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 max-w-3xl">
      <div className="glass-card rounded-2xl p-8 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Analysis Calibration</h3>
          <p className="text-slate-500 text-sm">Fine-tune the detection sensitivity of the forensic engine.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Detection Sensitivity</label>
              <span className="text-primary font-mono font-bold">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-bold">
              <span>LEAN (MINIMAL FALSES)</span>
              <span>AGRESSIVE (DEEP SCAN)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-glass-border">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Auto-Archive Analyses</p>
              <p className="text-xs text-slate-500">Automatically save all scans to local storage.</p>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-12 h-6 rounded-full transition-all relative ${autoSave ? 'bg-primary' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSave ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border-red-500/10">
        <h3 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-red-500/5 rounded-xl border border-red-500/20">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Purge System Memory</p>
            <p className="text-xs text-slate-500">This action will permanently delete all forensic history and metadata.</p>
          </div>
          <button
            onClick={() => { if (confirm('Permanent deletion requested. Proceed?')) onClearHistory(); }}
            className="px-6 py-2 glass-button text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-lg border border-red-500/30 transition-all text-sm"
          >
            Execute Purge
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsView;
