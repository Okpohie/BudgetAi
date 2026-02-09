import React, { useState, useMemo } from 'react';
import { 
  PenLine, History, CheckCircle2, Search, X, Edit2, Trash2, Save 
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../services/firebase.js'; 
import { getCategoryIcon, toSentenceCase } from '../../utils/helpers.js';
import { MONTH_NAMES } from '../../utils/constants.js';
import HelpTip from '../ui/HelpTip';

export default function DailyLoggingView({ data, user, showNotify, metrics, t }) {
  const [view, setView] = useState('log'); 

  const deleteTransaction = async (txId) => {
    if (!user || !data) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    const newTx = data.transactions.filter(t => t.id !== txId);
    await updateDoc(docRef, { transactions: newTx });
    showNotify("Transaction removed");
  };

  const updateTransaction = async (newTx) => {
    if (!user || !data) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    const updatedTxList = data.transactions.map(t => t.id === newTx.id ? newTx : t);
    await updateDoc(docRef, { transactions: updatedTxList });
    showNotify("Transaction updated");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Toggle Header */}
      <div className="bg-slate-100 p-1.5 rounded-2xl mb-8 flex mx-4">
        <button 
          onClick={() => setView('log')} 
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <PenLine size={14} /> {t('logExpense')}
        </button>
        <button 
          onClick={() => setView('history')} 
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${view === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History size={14} /> {t('history')}
        </button>
      </div>

      {view === 'log' ? (
        <LogExpenseInterface 
          data={data} 
          user={user} 
          showNotify={showNotify} 
          metrics={metrics} 
          t={t}
        />
      ) : (
        <TransactionHistoryInterface 
          data={data} 
          onDeleteTx={deleteTransaction} 
          onUpdateTx={updateTransaction} 
          t={t}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Log Interface ---

function LogExpenseInterface({ data, user, showNotify, metrics, t }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const currency = data?.user_settings?.currency || '£';

  const activeCategories = (data?.categories || []).filter(c => !(data?.hidden_categories || []).includes(c));

  const handleRecord = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !category) return;

    // Logic Checks (Goals vs Regular)
    const customGoal = (data.custom_goals || []).find(g => g.name === category);

    if (category === 'Emergency Fund') {
        if (val > metrics.emergencyBalance) {
            showNotify(`Insufficient Emergency Funds`, true);
            return;
        }
    } else if (customGoal) {
        if (val > (customGoal.currentAmount || 0)) {
            showNotify(`Insufficient funds in ${category}`, true);
            return;
        }
    } else {
        const allocated = data.allocations[category] || 0;
        const spent = metrics.realSpent?.[category] || 0;
        const remaining = allocated - spent;
        if (val > remaining) {
             showNotify(`Exceeds budget! Only ${currency}${remaining.toLocaleString()} left.`, true);
             return;
        }
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    const tx = { 
      id: Math.random().toString(36).substr(2, 9), 
      amount: val, 
      category, 
      description: description || category, 
      timestamp: new Date(date).toISOString() 
    };
    
    let updates = { transactions: [tx, ...(data.transactions || [])] };

    // Update Goal Balance if needed (withdraw money from pot)
    if (customGoal) {
        const updatedGoals = data.custom_goals.map(g => {
            if (g.name === category) {
                return { ...g, currentAmount: Math.max(0, (g.currentAmount || 0) - val) };
            }
            return g;
        });
        updates.custom_goals = updatedGoals;
    }

    await updateDoc(docRef, updates);
    showNotify(`Logged ${currency}${val} to ${category}`);
    setAmount(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        
        {/* Category Selector */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {t('selectCategory')}
                <HelpTip title="Categories" text="Choose what you spent money on. Tap to select."/>
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x -mx-2 px-2">
             {activeCategories.map(cat => {
               const Icon = getCategoryIcon(cat);
               const customGoal = (data.custom_goals || []).find(g => g.name === cat);
               let remaining = 0;

               if (cat === 'Emergency Fund') {
                   remaining = metrics.emergencyBalance;
               } else if (customGoal) {
                   remaining = customGoal.currentAmount || 0;
               } else {
                   const alloc = data.allocations[cat] || 0;
                   const spent = metrics.realSpent?.[cat] || 0;
                   remaining = Math.max(0, alloc - spent);
               }
               
               return (
                 <button key={cat} onClick={() => setCategory(cat)}
                   className={`flex-shrink-0 snap-start px-4 py-3 rounded-2xl flex flex-col items-center gap-2 min-w-[85px] transition-all border
                   ${category === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                   <Icon size={20} strokeWidth={2.5} />
                   <span className="text-[10px] font-bold uppercase text-center truncate max-w-[80px]">{cat}</span>
                   <span className={`text-[9px] font-bold ${category === cat ? 'text-slate-400' : 'text-slate-300'}`}>
                       {currency}{remaining.toLocaleString()}
                   </span>
                 </button>
               );
             })}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-4 mb-8">
          <div className="relative">
             <div className="text-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('enterAmount')}</div>
             <div className="relative flex items-center justify-center">
                 <span className="text-2xl font-black text-slate-300 mr-1">{currency}</span>
                 <input type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} 
                   className="w-48 bg-transparent text-center text-5xl font-black outline-none text-slate-900 placeholder:text-slate-200" placeholder="0" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
             <input type="text" value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-slate-50 border border-transparent p-4 rounded-2xl font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 transition-colors text-sm" placeholder="Desc (opt)" />
             <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-50 border border-transparent p-4 rounded-2xl font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 transition-colors text-sm" />
          </div>
        </div>

        <button onClick={handleRecord} disabled={!amount || !category} className="w-full bg-slate-900 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2">
          <CheckCircle2 size={18} /> {t('record')}
        </button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: History Interface ---

function TransactionHistoryInterface({ data, onDeleteTx, onUpdateTx, t }) {
  const [viewMode, setViewMode] = useState(new Date().getMonth());
  const [editingTx, setEditingTx] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const currency = data?.user_settings?.currency || '£';
  
  const transactions = data?.transactions || [];
  const currentYear = new Date().getFullYear();

  // --- FILTERING LOGIC ---
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.timestamp);
      let inTimeRange = false;
      if (viewMode === 'ALL') inTimeRange = true;
      else if (viewMode === 'YTD') inTimeRange = d.getFullYear() === currentYear;
      else inTimeRange = d.getMonth() === viewMode && d.getFullYear() === currentYear;

      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      
      let matchesCategory = true;
      if (categoryFilter !== 'All') {
          if (categoryFilter === 'Recurring Bills') matchesCategory = t.category === 'Bills';
          else matchesCategory = t.category === categoryFilter;
      }

      return inTimeRange && matchesSearch && matchesCategory;
    }).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, viewMode, search, categoryFilter, currentYear]);

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    // 1. All Time: Monthly Expenses vs Income Line Chart
    if (viewMode === 'ALL') {
        const last12Months = [];
        const now = new Date();
        for(let i=11; i>=0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last12Months.push({ name: MONTH_NAMES[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), income: 0, expense: 0 });
        }
        
        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            const match = last12Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
            if (match) {
                if (t.category === 'Income') match.income += t.amount;
                else if (t.category !== 'Bills' && !t.isContribution) match.expense += t.amount;
            }
        });
        return { type: 'all_time', points: last12Months };
    } 
    // 2. Specific Month: Cumulative Spend (This Month vs Last Month) Line Chart
    else {
        const daysInMonth = new Date(currentYear, viewMode + 1, 0).getDate();
        const thisMonthPoints = new Array(daysInMonth).fill(0);
        const prevMonthPoints = new Array(daysInMonth).fill(0);

        const prevMonth = viewMode === 0 ? 11 : viewMode - 1;
        const prevYear = viewMode === 0 ? currentYear - 1 : currentYear;

        let totalIncome = 0;
        let totalSpent = 0;
        let totalPrevSpent = 0;

        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            const day = d.getDate() - 1; // 0-index
            if (day >= daysInMonth) return;

            if (t.category === 'Income') {
                if (d.getMonth() === viewMode && d.getFullYear() === currentYear) totalIncome += t.amount;
            } else if (t.category !== 'Bills' && !t.isContribution) {
                if (d.getMonth() === viewMode && d.getFullYear() === currentYear) {
                    thisMonthPoints[day] += t.amount;
                    totalSpent += t.amount;
                } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
                    prevMonthPoints[day] += t.amount;
                    totalPrevSpent += t.amount;
                }
            }
        });

        let runThis = 0, runPrev = 0;
        const cumulativeThis = thisMonthPoints.map((v, i) => { runThis += v; return i > new Date().getDate() && viewMode === new Date().getMonth() ? null : runThis; });
        const cumulativePrev = prevMonthPoints.map(v => { runPrev += v; return runPrev; });

        return { type: 'monthly', thisMonth: cumulativeThis, prevMonth: cumulativePrev, totalIncome, totalSpent, totalPrevSpent };
    }
  }, [transactions, viewMode, currentYear]);

  const getLinePath = (dataArr, maxVal, width = 100, height = 50) => {
      if (!dataArr || dataArr.length === 0) return '';
      return dataArr.map((val, i) => {
          if (val === null) return null;
          const x = (i / (dataArr.length - 1)) * width;
          const y = height - ((val / (maxVal || 1)) * height);
          return `${x},${y}`;
      }).filter(p => p !== null).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Edit Transaction</h3>
                <button onClick={() => setEditingTx(null)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
             </div>
             <div className="space-y-4 mb-6">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                   <input type="number" value={editingTx.amount} 
                     onChange={e => setEditingTx({...editingTx, amount: e.target.value})}
                     className="w-full bg-slate-50 p-3 rounded-xl font-bold text-lg border border-slate-100 outline-none" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                   <input type="text" value={editingTx.description} 
                     onChange={e => setEditingTx({...editingTx, description: e.target.value})}
                     className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm border border-slate-100 outline-none" />
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => { onDeleteTx(editingTx.id); setEditingTx(null); }} className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
                <button onClick={() => { onUpdateTx({...editingTx, amount: Number(editingTx.amount)}); setEditingTx(null); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"><Save size={16}/> Save</button>
             </div>
          </div>
        </div>
      )}

      {/* Time Filter */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide px-2">
        <button onClick={() => setViewMode('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${viewMode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>All Time</button>
        {MONTH_NAMES.map((m, idx) => {
           if (idx > new Date().getMonth()) return null;
           return (
             <button key={m} onClick={() => setViewMode(idx)}
               className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${viewMode === idx ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
               {m}
             </button>
           )
        })}
      </div>

      {/* DYNAMIC CHART SECTION */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
         {viewMode === 'ALL' ? (
             <div className="space-y-8">
                 {/* 1. All Time Expense Trend (Line) */}
                 <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Expense Trend</h3>
                     <div className="h-32 w-full relative group">
                        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            {[0, 25, 50].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2 2" />)}
                            <polyline 
                                points={getLinePath(chartData.points.map(p => p.expense), Math.max(...chartData.points.map(p => p.expense)) * 1.1)} 
                                fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                            />
                            {/* Points with Values */}
                            {chartData.points.map((p, i) => {
                                const max = Math.max(...chartData.points.map(p => p.expense)) * 1.1 || 1;
                                const x = (i / 11) * 100;
                                const y = 50 - ((p.expense / max) * 50);
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="1.5" fill="#3b82f6" />
                                        {p.expense > 0 && <text x={x} y={y - 3} fontSize="3" textAnchor="middle" fill="#1e293b" fontWeight="bold">{p.expense}</text>}
                                    </g>
                                )
                            })}
                        </svg>
                     </div>
                 </div>

                 {/* 2. All Time Income (Bar) */}
                 <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Income History</h3>
                     <div className="h-32 w-full flex items-end gap-1">
                         {chartData.points.map((p, i) => (
                             <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                 <div className="w-full bg-emerald-100 rounded-t-sm relative transition-colors group-hover:bg-emerald-500" style={{ height: `${Math.max(5, (p.income / (Math.max(...chartData.points.map(x=>x.income)) || 1)) * 100)}%` }}>
                                     <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 rounded">{currency}{p.income}</div>
                                 </div>
                                 <span className="text-[8px] text-slate-400 font-bold mt-1">{p.name.charAt(0)}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
         ) : (
             <div>
                 {/* Monthly Comparison Summary */}
                 <div className="flex justify-between items-start mb-6">
                     <div>
                         <h3 className="text-sm font-black text-slate-900">{t('spentVs')}</h3>
                         <div className="mt-2 space-y-1">
                             <p className="text-[10px] text-slate-500 font-bold">{t('earned')}: <span className="text-emerald-600">{currency}{chartData.totalIncome.toLocaleString()}</span></p>
                             <p className="text-[10px] text-slate-500 font-bold">{t('spent')}: <span className="text-blue-600">{currency}{chartData.totalSpent.toLocaleString()}</span></p>
                             <p className={`text-[10px] font-bold ${chartData.totalSpent > chartData.totalPrevSpent ? 'text-rose-500' : 'text-emerald-500'}`}>
                                 {chartData.totalSpent > chartData.totalPrevSpent ? `▲ Spent ${currency}${Math.abs(chartData.totalSpent - chartData.totalPrevSpent)} more` : `▼ Spent ${currency}${Math.abs(chartData.totalSpent - chartData.totalPrevSpent)} less`}
                             </p>
                         </div>
                     </div>
                 </div>
                 
                 <div className="h-40 w-full relative">
                    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        {[0, 25, 50].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2 2" />)}
                        
                        {/* Prev Month Line */}
                        <polyline 
                            points={getLinePath(chartData.prevMonth, Math.max(...chartData.prevMonth, ...(chartData.thisMonth.filter(x=>x!==null))) * 1.1)} 
                            fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray="4 4"
                        />
                        {/* This Month Line */}
                        <polyline 
                            points={getLinePath(chartData.thisMonth, Math.max(...chartData.prevMonth, ...(chartData.thisMonth.filter(x=>x!==null))) * 1.1)} 
                            fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                 </div>
             </div>
         )}
      </div>

      {/* List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2 relative">
           <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full bg-white pl-8 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
           </div>
           <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-white px-3 py-2 rounded-xl text-xs font-bold border border-slate-100 outline-none text-slate-600">
              <option value="All">All</option>
              <option value="Recurring Bills">Bills</option>
              <option value="Income">Income</option>
              {(data?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        
        <div className="divide-y divide-slate-50">
          {filteredTx.length === 0 ? <div className="p-8 text-center text-slate-400 text-xs">No transactions found.</div> : filteredTx.map(tx => {
              const Icon = getCategoryIcon(tx.category);
              const isEditable = !tx.isSystem && !tx.isContribution;
              const isIncome = tx.category === 'Income';
              
              return (
                <div key={tx.id} onClick={() => isEditable && setEditingTx(tx)}
                  className={`p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group ${isEditable ? 'cursor-pointer' : 'opacity-80'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{toSentenceCase(tx.description)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(tx.timestamp).toLocaleDateString()} • {tx.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-right ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>{isIncome ? '+' : '-'}{currency}{parseFloat(tx.amount).toFixed(2)}</span>
                    {isEditable && <Edit2 size={14} className="text-slate-300 opacity-0 group-hover:opacity-100"/>}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}