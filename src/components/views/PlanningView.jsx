import React, { useState } from 'react';
import { RefreshCcw, Brain } from 'lucide-react';

import RecurringView from './planning/RecurringView';
import BudgetSetupView from './planning/BudgetSetupView';

export default function PlanningView({ data, user, showNotify, metrics, t }) {
  const [planView, setPlanView] = useState('budget'); 
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Navigation Tabs (Segmented Control) */}
      <div className="bg-slate-100 p-1.5 rounded-2xl mb-8 flex mx-4">
        <button 
            onClick={() => setPlanView('budget')} 
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${planView === 'budget' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <Brain size={14} /> {t('budget')}
        </button>
        <button 
            onClick={() => setPlanView('recurring')} 
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${planView === 'recurring' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <RefreshCcw size={14} /> {t('recurring')}
        </button>
      </div>
      
      {planView === 'recurring' && <RecurringView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
      {planView === 'budget' && <BudgetSetupView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
    </div>
  );
}