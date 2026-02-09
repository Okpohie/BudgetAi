import React, { useMemo } from 'react';
import { PieChart, Target, Briefcase, Receipt, ShieldCheck, Activity, TrendingDown } from 'lucide-react';
import { getCategoryIcon, toSentenceCase } from '../../utils/helpers';

export default function HomeView({ data, metrics }) {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'short' }).toUpperCase();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const monthProgress = (currentDay / daysInMonth) * 100;
  const currency = data?.user_settings?.currency || '£';

  const displayCats = data?.categories.filter(c => !(data.hidden_categories || []).includes(c)) || [];

  // Calculate distinct allocations
  const expensesAllocated = Math.max(0, metrics.totalAllocated - metrics.savingsAllocated - metrics.emergencyAllocated);
  const unallocated = Math.max(0, metrics.unallocated);

  const incomeBreakdown = [
      { label: 'Fixed Bills', amount: metrics.bills, color: '#f43f5e', tailwind: 'bg-rose-500' },
      { label: 'Daily Expenses', amount: expensesAllocated, color: '#3b82f6', tailwind: 'bg-blue-500' },
      { label: 'Emergency Fund', amount: metrics.emergencyAllocated, color: '#f59e0b', tailwind: 'bg-amber-500' },
      { label: 'Investments', amount: metrics.savingsAllocated, color: '#10b981', tailwind: 'bg-emerald-500' },
      { label: 'Free Cash', amount: unallocated, color: '#cbd5e1', tailwind: 'bg-slate-300' }
  ];

  // Circular Chart Gradient Logic
  const chartGradient = useMemo(() => {
    const total = metrics.effective || 1;
    let currentDeg = 0;
    
    const stops = incomeBreakdown.map((item) => {
        if (item.amount <= 0) return null;
        const start = currentDeg;
        const pct = (item.amount / total) * 100;
        currentDeg += pct;
        return `${item.color} ${start}% ${currentDeg}%`;
    }).filter(Boolean);

    if (stops.length === 0) return 'conic-gradient(#f1f5f9 0% 100%)'; 
    return `conic-gradient(${stops.join(', ')})`;
  }, [incomeBreakdown, metrics.effective]);

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. MONTHLY FLOW (Circular) */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                 <PieChart size={18} className="text-blue-600"/> Monthly Flow
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                  {monthName}
              </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Donut Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                  <div className="w-full h-full rounded-full shadow-inner" style={{ background: chartGradient }}></div>
                  <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border border-slate-50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total In</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{currency}{(metrics.effective || 0).toLocaleString()}</p>
                  </div>
              </div>

              {/* Legend */}
              <div className="flex-grow w-full space-y-3">
                  {incomeBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${item.tailwind} ring-2 ring-white shadow-sm`}></div>
                              <span className="text-xs font-bold text-slate-600">{item.label}</span>
                          </div>
                          <div className="text-right">
                              <span className="text-xs font-black text-slate-900">{currency}{item.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 ml-1 font-medium">
                                  {((item.amount / (metrics.effective || 1)) * 100).toFixed(0)}%
                              </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* 2. SAVING GOALS OVERVIEW */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
              <Target size={18} className="text-blue-600"/> Your Goals
           </h3>
           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
               {(data.custom_goals || []).length > 0 ? (data.custom_goals || []).map(g => (
                   <div key={g.id} className="min-w-[140px] bg-slate-50 p-4 rounded-2xl border border-slate-100 snap-start">
                       <p className="text-xs font-bold text-slate-900 mb-1 truncate">{g.name}</p>
                       <p className="text-[10px] text-slate-500 mb-2">Target: {currency}{g.targetAmount}</p>
                       <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (g.currentAmount/g.targetAmount)*100)}%`}}></div>
                       </div>
                       <p className="text-[10px] font-bold text-blue-600 mt-2 text-right">{currency}{g.currentAmount}</p>
                   </div>
               )) : <p className="text-xs text-slate-400 italic">No goals set yet.</p>}
           </div>
      </div>

      {/* 3. PREVIOUS MONTH VISUAL SUMMARY */}
      {metrics.prevMonth && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-white/10 rounded-xl"><Activity size={18} className="text-emerald-400"/></div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Last Month Recap</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Rollover</p>
                      <p className="text-xl font-black text-emerald-400">+{currency}{metrics.prevMonth.rollover.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Added to Emergency</p>
                      <p className="text-xl font-black text-amber-400">+{currency}{metrics.prevMonth.emergencyAdded.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Added to Goals</p>
                      <p className="text-xl font-black text-blue-400">+{currency}{metrics.prevMonth.savingsAdded.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Goals Completed</p>
                      <div className="text-xs font-bold text-white">
                         {metrics.prevMonth.completedGoals.length > 0 ? metrics.prevMonth.completedGoals.join(', ') : 'None'}
                      </div>
                  </div>
              </div>

              <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg"><TrendingDown size={14}/></div>
                          <div>
                              <p className="text-[10px] text-slate-400 font-bold">Top Expense</p>
                              <p className="text-xs font-bold">{toSentenceCase(metrics.prevMonth.maxCategory.name)}</p>
                          </div>
                      </div>
                      <span className="text-sm font-black">{currency}{metrics.prevMonth.maxCategory.amount}</span>
                  </div>
              </div>
        </div>
      )}

      {/* 4. CATEGORY SPENDING */}
    </div>
  );
}