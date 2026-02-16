
import React, { useEffect, useState } from 'react';

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden hero-gradient">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            SYSTEMS ONLINE: THREAT DETECTION ACTIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Neutralize AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Deepfakes</span> and Scams
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Protect your communications with enterprise-grade linguistic analysis. Detect synthetic voices, AI-generated fraud, and sophisticated social engineering in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-2">
              Start Analysis
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl glass hover:bg-white/10 text-white font-bold transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px]"></div>
    </section>
  );
};

export default Hero;
