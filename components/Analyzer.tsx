
import React, { useState, useCallback, useMemo } from 'react';
import { analyzeContent } from '../services/aiService';
import { AnalysisResult, HistoryEntry, AnalysisStats } from '../types';
import Results from './Results';
import Loader from './Loader';

interface AnalyzerProps {
  onStatsUpdate: (stats: AnalysisStats) => void;
  onSaveHistory: (entry: HistoryEntry) => void;
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const WaveformMonitor = React.memo(({ audioBase64, isAnalyzing }: { audioBase64: string | null, isAnalyzing: boolean }) => {
  const bars = useMemo(() => [8, 12, 6, 16, 4, 20, 10, 14, 24, 14, 10, 20, 4, 16, 6, 12, 8], []);

  return (
    <div className="glass-card rounded-xl p-6 h-32 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Waveform Monitor</span>
        <div className="flex gap-1 items-center">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${audioBase64 ? 'bg-emerald-500' : 'bg-primary'}`}></span>
          <span className={`text-[10px] ${audioBase64 ? 'text-emerald-500' : 'text-primary'}`}>
            {audioBase64 ? 'SAMPLE READY' : 'SCANNING ACTIVE'}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-center gap-[2px] h-12">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${audioBase64 ? 'bg-emerald-500/40' : 'bg-primary/20'} ${isAnalyzing ? 'animate-bounce' : ''}`}
            style={{
              height: `${h * (audioBase64 ? 1.5 : 1)}px`,
              opacity: h / 24,
              animationDelay: `${i * 0.1}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
});

const FileDropZone = React.memo(({
  isDragging,
  fileName,
  audioBase64,
  isAnalyzing,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onAnalyzeAudio
}: any) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`glass-card rounded-xl p-10 flex flex-col items-center justify-center text-center gap-6 border-dashed border-2 relative overflow-hidden group ${isDragging ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary'
        }`}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center neon-pulse transition-transform duration-500 group-hover:scale-110 ${fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'
        }`}>
        <span className="material-symbols-outlined text-4xl">
          {fileName ? 'check_circle' : 'cloud_upload'}
        </span>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-xl font-bold text-white">{fileName || 'Drop suspicious files'}</h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Upload call recordings or voice messages for forensic audio scanning.
        </p>
      </div>
      <div className="flex gap-3 relative z-10">
        <label className="px-6 py-2.5 glass-button text-slate-300 font-bold rounded-lg cursor-pointer text-sm flex items-center justify-center">
          Select File
          <input
            type="file"
            className="hidden"
            accept="audio/*"
            onChange={onFileSelect}
          />
        </label>
        {audioBase64 && (
          <button
            onClick={onAnalyzeAudio}
            disabled={isAnalyzing}
            className="px-6 py-2.5 bg-emerald-500 text-background-dark font-bold rounded-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-sm disabled:opacity-50"
          >
            Analyze Audio
          </button>
        )}
      </div>
    </div>
  );
});

const LinguisticInput = React.memo(({ text, onChange }: { text: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) => (
  <div className="flex-1 relative">
    <textarea
      value={text}
      onChange={onChange}
      className="w-full h-full min-h-[400px] glass-input rounded-lg p-6 text-slate-100 placeholder:text-slate-600 resize-none font-mono text-sm leading-relaxed"
      placeholder="Paste suspicious transcript, chat logs or email content here..."
    ></textarea>
    <div className="absolute inset-0 rounded-lg pointer-events-none border border-primary/0 group-focus-within:border-primary/50 transition-all duration-300"></div>
  </div>
));

const ControlActions = React.memo(({
  text,
  audioBase64,
  isAnalyzing,
  onPaste,
  onClear,
  onStartAnalysis
}: any) => (
  <div className="mt-6 flex justify-between items-center">
    <div className="flex gap-2">
      <button
        onClick={onPaste}
        className="p-2 rounded-md glass-button text-slate-400"
        title="Paste from clipboard"
      >
        <span className="material-symbols-outlined text-lg">content_paste</span>
      </button>
      <button
        onClick={onClear}
        className="p-2 rounded-md glass-button text-slate-400"
        title="Clear Workspace"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
    <button
      disabled={isAnalyzing || (!text.trim() && !audioBase64)}
      onClick={onStartAnalysis}
      className={`px-10 py-3 bg-gradient-to-r from-primary to-accent-purple text-white font-bold rounded-lg shadow-lg transition-all ${(isAnalyzing || (!text.trim() && !audioBase64)) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-primary/20'
        }`}
    >
      {isAnalyzing ? 'Processing Payload...' : 'Start Global Scan'}
    </button>
  </div>
));

const ResultsView = React.memo(Results);

const Analyzer: React.FC<AnalyzerProps> = ({ onStatsUpdate, onSaveHistory }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleStartAnalysis = useCallback(async (forceType?: 'TEXT' | 'AUDIO') => {
    const activeType = forceType || (audioBase64 ? 'AUDIO' : 'TEXT');

    if (activeType === 'TEXT' && !text.trim()) {
      setError('Linguistic buffer empty. Input required.');
      return;
    }
    if (activeType === 'AUDIO' && !audioBase64) {
      setError('No audio binary detected. Upload required.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    onStatsUpdate({ latency: 'Calculating...', load: 'High (88%)', integrity: 'Scanning...' });

    const startTime = performance.now();

    try {
      const content = activeType === 'AUDIO'
        ? `Forensic Analysis of audio sample: ${fileName}. Text transcript if available: ${text}`
        : text;

      const analysisResult = await analyzeContent(content, activeType, audioBase64 || undefined);

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);

      setResult(analysisResult);

      const historyEntry: HistoryEntry = {
        ...analysisResult,
        id: generateUUID(),
        timestamp: Date.now(),
        type: activeType,
        fileName: activeType === 'AUDIO' ? fileName || undefined : undefined,
        previewText: text.substring(0, 100)
      };
      onSaveHistory(historyEntry);

      onStatsUpdate({
        latency: `${duration}ms`,
        load: `${(Math.random() * 5 + 1).toFixed(1)}%`,
        integrity: 'Verified'
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error occurred';
      setError(`Analysis failed: ${errorMessage}`);
      onStatsUpdate({ latency: 'Fail', load: 'Error', integrity: 'Compromised' });
      console.error("Full analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, audioBase64, fileName, onStatsUpdate, onSaveHistory]); // Dependencies are state values required for the action

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Invalid format. Audio binary required.');
      return;
    }
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAudioBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleAnalyzeAudio = useCallback(() => {
    handleStartAnalysis('AUDIO');
  }, [handleStartAnalysis]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(setText);
  }, []);

  const handleClear = useCallback(() => {
    setText('');
    setAudioBase64(null);
    setFileName(null);
    setResult(null);
    onStatsUpdate({ latency: '0ms', load: 'Idle', integrity: 'Standby' });
  }, [onStatsUpdate]);

  const handleMainStartAnalysis = useCallback(() => {
    handleStartAnalysis();
  }, [handleStartAnalysis]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <FileDropZone
            isDragging={isDragging}
            fileName={fileName}
            audioBase64={audioBase64}
            isAnalyzing={isAnalyzing}
            onDrop={onDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onFileSelect={handleFileSelect}
            onAnalyzeAudio={handleAnalyzeAudio}
          />

          <WaveformMonitor audioBase64={audioBase64} isAnalyzing={isAnalyzing} />
        </div>

        <div className="glass-card rounded-xl p-8 flex flex-col relative group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Linguistic Input</h3>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Payload Depth</p>
              <p className="text-sm font-mono font-bold text-primary">{text.length.toLocaleString()} / 10,000</p>
            </div>
          </div>

          <LinguisticInput text={text} onChange={handleTextChange} />

          <ControlActions
            text={text}
            audioBase64={audioBase64}
            isAnalyzing={isAnalyzing}
            onPaste={handlePaste}
            onClear={handleClear}
            onStartAnalysis={handleMainStartAnalysis}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 glass-panel border-l-4 border-l-red-500 text-red-400 flex items-center gap-3 animate-in slide-in-from-left duration-300">
          <span className="material-symbols-outlined">warning</span>
          <span className="font-bold font-mono">{error}</span>
        </div>
      )}

      {isAnalyzing && <Loader />}
      {result && <ResultsView result={result} />}
    </div>
  );
};

export default Analyzer;