import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpTip({ title, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block ml-1.5 z-30">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-slate-300 hover:text-blue-500 transition-colors">
        <HelpCircle size={16} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900 text-white text-xs rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 border border-slate-700/50">
          <div className="flex justify-between items-start mb-2">
             <p className="font-bold text-blue-300 text-sm">{title}</p>
             <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="text-slate-500 hover:text-white"><X size={14}/></button>
          </div>
          <p className="opacity-90 leading-relaxed text-slate-300">{text}</p>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900"></div>
        </div>
      )}
    </div>
  )
}