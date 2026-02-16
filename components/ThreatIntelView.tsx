
import React, { useMemo } from 'react';
import { HistoryEntry } from '../types';

interface ThreatIntelProps {
  history: HistoryEntry[];
}

const ThreatIntelView: React.FC<ThreatIntelProps> = React.memo(({ history }) => {
  // Derive some mock global stats mixed with real local history data
  const globalAlerts = useMemo(() => [
    { country: 'USA', level: 'High', vector: 'Voice Deepfake', time: '2m ago' },
    { country: 'DEU', level: 'Medium', vector: 'Linguistic Phish', time: '14m ago' },
    { country: 'JPN', level: 'Critical', vector: 'Financial Scam', time: '1h ago' },
  ], []);

  // Fix arithmetic operation errors by ensuring operands are numbers
  const commonIndicators = useMemo(() => {
    return history.reduce((acc, entry) => {
      entry.detected_indicators.forEach(ind => {
        const currentCount = Number(acc[ind]) || 0;
        acc[ind] = currentCount + 1;
      });
      return acc;
    }, {} as Record<string, number>);
  }, [history]);

  const topIndicators = useMemo(() => {
    return Object.entries(commonIndicators)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
  }, [commonIndicators]);

  // Memoize random dots so they don't jump around on re-renders
  const mapDots = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      left: Math.random() * 80,
      top: Math.random() * 40,
      isActive: Math.random() > 0.7
    }));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-2xl p-8 overflow-hidden relative">
          <h3 className="text-xl font-bold text-white mb-6">Global Threat Distribution</h3>
          <div className="h-64 flex items-center justify-center relative">
            {/* Simple CSS-based "World Map" visualization */}
            <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex flex-wrap gap-4 p-4">
              {mapDots.map((dot, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${dot.isActive ? 'bg-red-500 animate-ping' : 'bg-primary/40'}`}
                  style={{ marginLeft: `${dot.left}%`, marginTop: `${dot.top}%` }}
                ></div>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Live Feed: Monitoring Active
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {globalAlerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-glass-border">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary">{alert.country}</span>
                  <span className="text-sm text-slate-300">{alert.vector}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold uppercase ${alert.level === 'Critical' ? 'text-red-500' : alert.level === 'High' ? 'text-orange-500' : 'text-yellow-500'}`}>
                    {alert.level}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Top Anomalies</h3>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-6 font-bold">Detected in Local Cluster</p>

          <div className="space-y-6">
            {topIndicators.length > 0 ? topIndicators.map(([name, count], i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{name}</span>
                  <span className="text-primary font-bold">{count} Hits</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(Number(count) / Math.max(history.length, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-slate-600 italic text-sm py-10 text-center">No data vectors mapped yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ThreatIntelView;