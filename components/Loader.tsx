
import React from 'react';

const Loader: React.FC = React.memo(() => {
  return (
    <div className="p-12 glass-panel rounded-2xl flex flex-col items-center justify-center space-y-8">
      <div className="relative w-24 h-24">
        {/* Animated concentric rings */}
        <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
        <div className="absolute inset-2 border-2 border-accent-purple/10 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse">radar</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h4 className="text-xl font-bold tracking-tight text-white">Linguistic Scanning Active</h4>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em]">Mapping Intent Vectors • Analyzing Synthetic Artifacts</p>
      </div>

      <div className="w-full max-w-sm h-[2px] bg-white/5 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full animate-[scan_2s_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
});

export default Loader;
