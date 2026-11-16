import React from 'react';
import { siteData } from '../data';

const TopBar: React.FC = () => {
  return (
    <div className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/5 text-indigo-200 py-2.5 px-4 text-center text-xs font-bold uppercase tracking-[0.2em]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
        {siteData.announcement}
      </div>
    </div>
  );
};

export default TopBar;
