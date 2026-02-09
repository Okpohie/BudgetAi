import React from 'react';

export default function NavButton({ active, icon: Icon, label, onClick, isMain }) {
  if (isMain) {
    return (
      <button 
        onClick={onClick} 
        className="relative -top-6 bg-slate-900 text-white w-16 h-16 rounded-full shadow-xl shadow-slate-300 active:scale-95 transition-all flex items-center justify-center border-4 border-[#F8FAFC]"
      >
        <Icon className="w-7 h-7" strokeWidth={2.5} />
      </button>
    );
  }
  
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 transition-all p-2 ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}