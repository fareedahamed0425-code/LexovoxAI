
import React from 'react';
import { AppView } from '../types';
import logo from '../assets/logo.svg';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard' },
    { id: 'HISTORY', label: 'History', icon: 'history' },
    { id: 'THREAT_INTEL', label: 'Threat Intel', icon: 'security' },
    { id: 'SETTINGS', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="w-20 lg:w-64 flex flex-col glass-panel border-r border-glass-border h-full transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(13,185,242,0.5)] overflow-hidden">
          <img src={logo} alt="Sentinel Logo" className="w-full h-full object-contain" />
        </div>
        <span className="hidden lg:block font-bold text-xl tracking-tight text-white">SENTINEL</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as AppView)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all group duration-300 ${activeView === item.id
              ? 'bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_rgba(13,185,242,0.2)]'
              : 'glass-button border-transparent text-slate-400 hover:text-white hover:border-white/20'
              }`}
          >
            <span className={`material-symbols-outlined transition-transform duration-300 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="hidden lg:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-glass-border text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">Terminal v2.6.0</p>
      </div>
    </aside>
  );
});

export default Sidebar;
