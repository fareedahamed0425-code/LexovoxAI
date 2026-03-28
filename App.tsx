
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Analyzer from './components/Analyzer';
import HistoryView from './components/HistoryView';
import ThreatIntelView from './components/ThreatIntelView';
import SettingsView from './components/SettingsView';
import { AnalysisStats, AppView, HistoryEntry } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('DASHBOARD');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({
    latency: '0ms',
    load: 'Idle',
    integrity: 'Standby'
  });

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = React.useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem('sentinel_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = React.useCallback(() => {
    setHistory([]);
    localStorage.removeItem('sentinel_history');
  }, []);

  const handleAnalysisStats = React.useCallback((newStats: AnalysisStats) => {
    setStats(newStats);
  }, []);

  const renderContent = React.useMemo(() => {
    switch (activeView) {
      case 'DASHBOARD':
        return <Analyzer onStatsUpdate={handleAnalysisStats} onSaveHistory={saveToHistory} />;
      case 'HISTORY':
        return <HistoryView history={history} onClear={clearHistory} />;
      case 'THREAT_INTEL':
        return <ThreatIntelView history={history} />;
      case 'SETTINGS':
        return <SettingsView onClearHistory={clearHistory} />;
      default:
        return <Analyzer onStatsUpdate={handleAnalysisStats} onSaveHistory={saveToHistory} />;
    }
  }, [activeView, history, handleAnalysisStats, saveToHistory, clearHistory]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark relative">
      <div className="blob top-[-10%] left-[-10%] delay-2000"></div>
      <div className="blob bottom-[-10%] right-[-10%] delay-5000"></div>
      <div className="blob top-[40%] left-[40%] w-[300px] h-[300px] opacity-40 animation-delay-4000"></div>

      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <header className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-bold tracking-widest uppercase mb-4">
            LexovoxAI — Content Analysis Engine
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
            Lexovox<span className="text-primary tracking-tighter">AI</span> <span className="text-slate-500 font-light">/</span> <span className="text-primary/80 lowercase text-3xl font-mono">{activeView.replace('_', ' ')}</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            Advanced content analysis engine. Dual-module forensics: Audio Analysis (Module 1) + Text Threat Assessment (Module 2).
          </p>
        </header>

        {renderContent}

        {activeView === 'DASHBOARD' && <StatsBar stats={stats} />}

        <footer className="mt-12 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] border-t border-glass-border pt-6">
          <div className="flex items-center gap-3">
          <span className={`flex h-2 w-2 rounded-full ${stats.integrity.includes('Verified') || stats.integrity.includes('Ready') ? 'bg-emerald-500' : 'bg-primary'} animate-pulse`}></span>
            <span>System {stats.integrity.includes('Verified') ? 'Optimal' : 'Ready'} • LexovoxAI Engine v2.0 (On-Device)</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Forensic API</a>
            <a href="#" className="hover:text-primary transition-colors">Incident Report</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

const StatsBar: React.FC<{ stats: AnalysisStats }> = React.memo(({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
    <div className="glass-card p-6 rounded-xl border-l-4 border-l-primary flex items-center gap-4 transition-all duration-500">
      <div className="p-3 bg-primary/10 rounded-lg text-primary">
        <span className="material-symbols-outlined">network_check</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analysis Latency</p>
        <p className="text-xl font-bold font-mono text-white">{stats.latency}</p>
      </div>
    </div>
    <div className="glass-card p-6 rounded-xl border-l-4 border-l-accent-purple flex items-center gap-4 transition-all duration-500">
      <div className="p-3 bg-accent-purple/10 rounded-lg text-accent-purple">
        <span className="material-symbols-outlined">memory</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engine Load</p>
        <p className="text-xl font-bold font-mono text-white">{stats.load}</p>
      </div>
    </div>
    <div className="glass-card p-6 rounded-xl border-l-4 border-l-slate-600 flex items-center gap-4 transition-all duration-500">
      <div className="p-3 bg-slate-400/10 rounded-lg text-slate-400">
        <span className="material-symbols-outlined">database</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Threat Intelligence</p>
        <p className={`text-xl font-bold text-white ${stats.integrity.includes('Verified') ? 'text-emerald-400' : ''}`}>
          {stats.integrity}
        </p>
      </div>
    </div>
  </div>
));

export default App;
