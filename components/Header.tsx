
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Lexovox<span className="text-sky-400">AI</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-sky-400 transition-colors">Analyzer</a>
          <a href="#" className="hover:text-sky-400 transition-colors">Methodology</a>
          <a href="#" className="hover:text-sky-400 transition-colors">Security</a>
        </nav>

        <button className="px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-sky-400 hover:text-white transition-all duration-300 active:scale-95 shadow-lg shadow-white/5">
          Access Vault
        </button>
      </div>
    </header>
  );
};

export default Header;
