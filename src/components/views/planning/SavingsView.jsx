import React, { useState, useMemo } from 'react';
import { ShieldCheck, Edit2, Brain, PlusCircle, Target, Calculator, Sparkles, Trash2, PieChart } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../../services/firebase';
import { toSentenceCase } from '../../../utils/helpers';
import { MONTH_NAMES } from '../../../utils/constants';

const apiKey = process.env.REACT_APP_GEMINI_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025"; 

export default function SavingsView({ data, user, showNotify, metrics, t }) {
  const [activeTab, setActiveTab] = useState('investments');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
       {/* Tab Switcher */}
       <div className="bg-slate-100 p-1.5 rounded-2xl mb-8 flex mx-4">
          <button onClick={() => setActiveTab('investments')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'investments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('investments')}</button>
          <button onClick={() => setActiveTab('funds')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'funds' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('goals')}</button>
       </div>

       <div className="px-4">
        {activeTab === 'investments' && <InvestmentsSection data={data} t={t} />}
        {activeTab === 'funds' && (
            <div className="space-y-8">
                <EmergencyFundSection data={data} user={user} showNotify={showNotify} metrics={metrics} />
                <SavingGoalsSection data={data} user={user} showNotify={showNotify} metrics={metrics} />
            </div>
        )}
       </div>
    </div>
  );
}

function InvestmentsSection({ data, t }) {
  const currency = data?.user_settings?.currency || '£';
  const investTx = (data.transactions || []).filter(t => t.category === 'Investments' || t.category === 'Savings & Investments');
  const totalInvested = investTx.reduce((acc, t) => acc + t.amount, 0);

  const monthlyData = useMemo(() => {
      const grouped = {};
      investTx.forEach(t => {
          const d = new Date(t.timestamp);
          const key = `${d.getFullYear()}-${d.getMonth()}`; 
          if(!grouped[key]) grouped[key] = { date: d, amount: 0 };
          grouped[key].amount += t.amount;
      });
      return Object.values(grouped).sort((a,b) => a.date - b.date);
  }, [investTx]);

  const breakdown = useMemo(() => {
     const map = {};
     investTx.forEach(t => {
        const desc = t.description || 'Unspecified';
        map[desc] = (map[desc] || 0) + t.amount;
     });
     return Object.entries(map).sort((a,b) => b[1] - a[1]);
  }, [investTx]);

  const pieGradient = useMemo(() => {
    let currentDeg = 0;
    if (totalInvested === 0) return 'conic-gradient(#f1f5f9 0% 100%)';
    const palette = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#84cc16'];
    return 'conic-gradient(' + breakdown.map((item, i) => {
        const start = currentDeg;
        const pct = (item[1] / totalInvested) * 100;
        currentDeg += pct;
        return `${palette[i % palette.length]} ${start}% ${currentDeg}%`;
    }).join(', ') + ')';
  }, [breakdown, totalInvested]);

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('portfolio')}</p>
                  <h2 className="text-3xl font-black text-slate-900">{currency}{totalInvested.toLocaleString()}</h2>
              </div>
          </div>
          <div className="h-40 w-full overflow-x-auto">
             <div className="h-full flex items-end gap-3 min-w-full pb-2">
                 {monthlyData.length > 0 ? monthlyData.map((d, i) => (
                     <div key={i} className="flex-1 min-w-[30px] flex flex-col justify-end items-center group h-full">
                         <div className="w-full bg-emerald-500 rounded-t-sm relative transition-all group-hover:bg-emerald-600" style={{ height: `${Math.max(5, (d.amount / (Math.max(...monthlyData.map(m=>m.amount)) || 1)) * 100)}%` }}>
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap">{currency}{d.amount}</div>
                         </div>
                         <span className="text-[8px] font-bold text-slate-400 mt-2">{MONTH_NAMES[d.date.getMonth()]}</span>
                     </div>
                 )) : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No data yet</div>}
             </div>
          </div>
       </div>
       
       <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-40 h-40 flex-shrink-0">
               <div className="w-full h-full rounded-full border-4 border-slate-50" style={{ background: pieGradient }}></div>
               <div className="absolute inset-0 m-8 bg-white rounded-full flex items-center justify-center flex-col shadow-sm">
                   <span className="text-[10px] text-slate-400 font-bold uppercase">Assets</span>
                   <span className="text-sm font-black text-slate-900">{breakdown.length}</span>
               </div>
          </div>
          <div className="flex-grow w-full space-y-3">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('allocation')}</h3>
             {breakdown.length === 0 ? <p className="text-xs text-slate-400">No investments yet.</p> : breakdown.map(([name, amt], i) => {
                const palette = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-violet-600', 'bg-cyan-600', 'bg-pink-600', 'bg-lime-600'];
                return (
                <div key={name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${palette[i % palette.length]}`}></div>
                       <span className="text-xs font-bold text-slate-700">{toSentenceCase(name)}</span>
                   </div>
                   <div className="text-right">
                       <span className="text-xs font-black text-slate-900">{currency}{amt.toLocaleString()}</span>
                       <span className="text-[10px] font-bold text-slate-400 ml-2">{((amt/totalInvested)*100).toFixed(1)}%</span>
                   </div>
                </div>
                )
             })}
          </div>
       </div>
    </div>
  )
}

function EmergencyFundSection({ data, user, showNotify, metrics }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTarget, setEditTarget] = useState(data.emergency_target || 0);
    const [editDate, setEditDate] = useState(data.emergency_deadline || '');
    const [depositAmt, setDepositAmt] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState(null); 
    const [aiLoading, setAiLoading] = useState(false);
    const currency = data?.user_settings?.currency || '£';

    const goal = data.emergency_target || 0;
    const balance = metrics.emergencyBalance || 0;
    const progress = goal > 0 ? Math.min(100, (balance / goal) * 100) : 0;
    const isFullyFunded = balance >= goal && goal > 0;

    const calculateMonthlyNeed = (targetAmt, targetDate) => {
        if (!targetDate || !targetAmt) return 0;
        const end = new Date(targetDate);
        const now = new Date();
        const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
        const left = Math.max(0, targetAmt - balance);
        if (months <= 0) return left;
        return left / months;
    };

    const monthlyNeeded = useMemo(() => calculateMonthlyNeed(goal, data.emergency_deadline), [goal, data.emergency_deadline, balance]);
    const editMonthlyNeeded = useMemo(() => calculateMonthlyNeed(editTarget, editDate), [editTarget, editDate, balance]);

    const handleSaveEdit = async () => {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        await updateDoc(docRef, { emergency_target: parseFloat(editTarget), emergency_deadline: editDate });
        setIsEditing(false);
        showNotify("Emergency Plan Updated");
    };

    const handleDeposit = async () => {
        if(!depositAmt) return;
        const val = parseFloat(depositAmt);
        const allocated = metrics.emergencyAllocated || 0;
        const spent = metrics.emergencySpent || 0;
        const remainingBudget = Math.max(0, allocated - spent);

        if (val > remainingBudget) {
            showNotify(`Exceeds Monthly Budget! Only ${currency}${remainingBudget.toFixed(0)} left.`, true);
            return;
        }

        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        const tx = { id: Math.random().toString(36).substr(2, 9), amount: val, category: 'Emergency Fund', description: 'Manual Deposit', timestamp: new Date().toISOString(), isContribution: true };
        await updateDoc(docRef, { emergency_deposits: (data.emergency_deposits || 0) + val, transactions: [tx, ...(data.transactions || [])] });
        showNotify(`Deposited ${currency}${val}`);
        setDepositAmt('');
    };

    const runAiAnalysis = async () => {
        setAiLoading(true);
        const disposableIncome = (metrics.totalIncome || 0) - (metrics.bills || 0);
        const prompt = `Analyze emergency fund. Disposable Income: ${currency}${disposableIncome}. Suggest Target Amount (3-6 months), Monthly Contribution, and Date. Return JSON: { "suggestedAmount": number, "deadline": "YYYY-MM-DD", "monthly": number, "reasoning": "string" }`;
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const result = await response.json();
            
            if (result.error) throw new Error(result.error.message || "API Error");

            let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const start = text.indexOf('{'); const end = text.lastIndexOf('}');
            if (start !== -1) {
                text = text.substring(start, end + 1);
                setAiSuggestion(JSON.parse(text));
            }
        } catch(e) { 
            console.error(e); 
            showNotify(`AI Failed: ${e.message}`, true); 
        }
        setAiLoading(false);
    };

    const updateAiField = (field, val) => {
        if (!aiSuggestion) return;
        const newSuggestion = { ...aiSuggestion, [field]: val };
        setAiSuggestion(newSuggestion);
    };

    const acceptAiSuggestion = async () => {
        if(!aiSuggestion) return;
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        await updateDoc(docRef, { emergency_target: parseFloat(aiSuggestion.suggestedAmount), emergency_deadline: aiSuggestion.deadline });
        setAiSuggestion(null);
        showNotify("AI Plan Accepted");
    };

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white text-amber-500 rounded-2xl shadow-sm"><ShieldCheck size={24}/></div>
                    <button onClick={()=>setIsEditing(!isEditing)} className="text-amber-400 hover:text-amber-600 bg-white p-2 rounded-xl"><Edit2 size={16}/></button>
                 </div>
                 {!isEditing ? (
                     <div className="mb-6">
                         <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-1">Emergency Fund</p>
                         <h2 className="text-4xl font-black text-amber-900">{currency}{balance.toLocaleString()}</h2>
                         <div className="grid grid-cols-2 gap-3 mt-6">
                             <div className="bg-white/60 p-3 rounded-2xl">
                                 <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">Target</p>
                                 <p className="text-sm font-black text-amber-900">{currency}{goal.toLocaleString()}</p>
                                 <p className="text-[9px] font-medium text-amber-700/60">{data.emergency_deadline || 'No date set'}</p>
                             </div>
                             <div className="bg-white/60 p-3 rounded-2xl">
                                 <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">Monthly Need</p>
                                 <p className="text-sm font-black text-amber-900">{currency}{monthlyNeeded.toFixed(0)}</p>
                                 <p className="text-[9px] font-medium text-amber-700/60">to meet deadline</p>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div className="mb-6 space-y-3 bg-white/50 p-4 rounded-2xl">
                         <div>
                             <label className="text-[10px] font-bold text-amber-700 uppercase">Target Amount</label>
                             <input type="number" value={editTarget} onChange={e=>setEditTarget(e.target.value)} className="w-full bg-white p-2 rounded-lg font-bold text-amber-900 outline-none border border-amber-200"/>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-amber-700 uppercase">Target Date</label>
                             <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full bg-white p-2 rounded-lg font-bold text-amber-900 outline-none border border-amber-200"/>
                         </div>
                         <div className="text-[10px] font-bold text-amber-600 pt-1 flex items-center gap-1">
                             <Calculator size={12}/> Needs {currency}{editMonthlyNeeded.toFixed(0)}/mo savings
                         </div>
                         <button onClick={handleSaveEdit} className="w-full bg-amber-600 text-white py-2 rounded-lg font-bold text-xs">Save Changes</button>
                     </div>
                 )}
                 <div className="relative">
                    <div className="flex justify-between text-[10px] font-bold text-amber-800/60 mb-1.5 uppercase tracking-wide">
                        <span>{progress.toFixed(0)}% Ready</span>
                        <span>{currency}{Math.max(0, goal - balance).toLocaleString()} to go</span>
                    </div>
                    <div className="w-full h-4 bg-amber-200/50 rounded-full overflow-hidden relative">
                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>
            </div>

            <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3 ${isFullyFunded ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Monthly Allowance</span>
                     <span className="text-xs font-bold text-slate-700">{currency}{Math.max(0, (metrics.emergencyAllocated || 0) - (metrics.emergencySpent || 0))} remaining</span>
                 </div>
                 <div className="flex gap-2">
                     <input type="number" placeholder="Amount" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)} className="flex-grow bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none"/>
                 </div>
                 <button onClick={handleDeposit} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs uppercase shadow-lg">Deposit to Pot</button>
            </div>

            {!aiSuggestion ? (
                <button onClick={runAiAnalysis} disabled={aiLoading} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2">
                    {aiLoading ? "Thinking..." : <><Brain size={16}/> Suggest Goal with AI</>}
                </button>
            ) : (
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex gap-2 items-center mb-3">
                        <Sparkles className="text-indigo-500" size={18}/>
                        <h4 className="font-bold text-indigo-900 text-sm">AI Suggestion</h4>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                        <div className="bg-white/50 p-3 rounded-xl border border-indigo-100">
                            <label className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Target Amount</label>
                            <input type="number" value={aiSuggestion.suggestedAmount} onChange={(e) => updateAiField('suggestedAmount', e.target.value)} 
                                className="w-full bg-transparent font-black text-indigo-900 outline-none border-b border-indigo-200 focus:border-indigo-500 text-sm" />
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-indigo-100">
                            <label className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Target Date</label>
                            <input type="date" value={aiSuggestion.deadline} onChange={(e) => updateAiField('deadline', e.target.value)} 
                                className="w-full bg-transparent font-black text-indigo-900 outline-none border-b border-indigo-200 focus:border-indigo-500 text-sm" />
                        </div>
                        <p className="text-xs text-indigo-700/80 italic leading-relaxed px-1">"{aiSuggestion.reasoning}"</p>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={acceptAiSuggestion} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs">Accept Plan</button>
                        <button onClick={()=>setAiSuggestion(null)} className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-bold text-xs">Decline</button>
                    </div>
                </div>
            )}
        </div>
    )
}

function SavingGoalsSection({ data, user, showNotify, metrics }) {
    const [isCreating, setIsCreating] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', target: '', date: '' });
    
    const [editGoalId, setEditGoalId] = useState(null);
    const [editState, setEditState] = useState({ target: '', date: '' });
    const [depositState, setDepositState] = useState({});
    const currency = data?.user_settings?.currency || '£';

    const createGoal = async () => {
        if(!newGoal.name || !newGoal.target) return;
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        
        const goalObj = {
            id: Math.random().toString(36).substr(2, 9),
            name: newGoal.name,
            targetAmount: parseFloat(newGoal.target),
            targetDate: newGoal.date,
            currentAmount: 0 // Initialize persistent balance
        };
        
        const newCats = [...(data.categories || []), newGoal.name];
        const newAlloc = { ...data.allocations, [newGoal.name]: 0 };
        const newBase = { ...data.base_allocations, [newGoal.name]: 0 };

        await updateDoc(docRef, { 
            custom_goals: [...(data.custom_goals || []), goalObj],
            categories: newCats,
            allocations: newAlloc,
            base_allocations: newBase
        });
        
        setIsCreating(false); 
        setNewGoal({ name: '', target: '', date: '' });
        showNotify("Goal Created & Added to Budget");
    };

    const deleteGoal = async (id, name) => {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        const newGoals = (data.custom_goals || []).filter(g => g.id !== id);
        const newCats = (data.categories || []).filter(c => c !== name);
        
        await updateDoc(docRef, { custom_goals: newGoals, categories: newCats });
        showNotify("Goal Deleted");
    };

    const handleUpdateGoal = async (id) => {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        const updatedGoals = data.custom_goals.map(g => {
            if (g.id === id) {
                return { ...g, targetAmount: parseFloat(editState.target), targetDate: editState.date };
            }
            return g;
        });
        await updateDoc(docRef, { custom_goals: updatedGoals });
        setEditGoalId(null);
        showNotify("Goal Updated");
    };

    const handleDeposit = async (goalName, id) => {
        const val = parseFloat(depositState[id]);
        if (!val) return;

        const allocated = data.allocations[goalName] || 0;
        const spent = metrics.realSpent?.[goalName] || 0;
        const remainingBudget = Math.max(0, allocated - spent);

        if (val > remainingBudget) {
            showNotify(`Exceeds Monthly Allocation! Only ${currency}${remainingBudget.toFixed(0)} left in budget.`, true);
            return;
        }

        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
        
        const tx = { 
            id: Math.random().toString(36).substr(2, 9), 
            amount: val, 
            category: goalName, 
            description: 'Goal Deposit', 
            timestamp: new Date().toISOString(),
            isContribution: true
        };

        const updatedGoals = data.custom_goals.map(g => {
            if (g.id === id) {
                return { ...g, currentAmount: (g.currentAmount || 0) + val };
            }
            return g;
        });

        await updateDoc(docRef, { 
            transactions: [tx, ...(data.transactions || [])],
            custom_goals: updatedGoals
        });
        
        setDepositState({ ...depositState, [id]: '' });
        showNotify(`Deposited ${currency}${val} to ${goalName}`);
    };

    return (
        <div className="space-y-6">
            {!isCreating ? (
                <button onClick={()=>setIsCreating(true)} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                    <PlusCircle size={20}/> Create New Goal
                </button>
            ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl animate-in zoom-in-95">
                    <h3 className="font-black text-slate-900 mb-4">New Saving Goal</h3>
                    <div className="space-y-3 mb-4">
                        <input placeholder="Goal Name (e.g. New Laptop)" value={newGoal.name} onChange={e=>setNewGoal({...newGoal, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none"/>
                        <input type="number" placeholder="Target Amount" value={newGoal.target} onChange={e=>setNewGoal({...newGoal, target: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none"/>
                        <input type="date" value={newGoal.date} onChange={e=>setNewGoal({...newGoal, date: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none text-slate-500"/>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={createGoal} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs">Create</button>
                        <button onClick={()=>setIsCreating(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-xs">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {(data.custom_goals || []).map(g => {
                    const currentAmount = g.currentAmount || 0;
                    const progress = Math.min(100, (currentAmount / g.targetAmount) * 100);
                    const remaining = Math.max(0, g.targetAmount - currentAmount);
                    const isDone = progress >= 100;
                    const isEditingThis = editGoalId === g.id;

                    let monthlyNeed = 0;
                    if (g.targetDate) {
                        const end = new Date(g.targetDate);
                        const now = new Date();
                        const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
                        if (months > 0) monthlyNeed = remaining / months;
                        else monthlyNeed = remaining; // Due now/past due
                    }

                    const allocated = data.allocations[g.name] || 0;
                    const spent = metrics.realSpent?.[g.name] || 0;
                    const remainingBudget = Math.max(0, allocated - spent);

                    return (
                        <div key={g.id} className="bg-blue-50 rounded-3xl p-8 border border-blue-100 relative overflow-hidden group">
                             <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white text-blue-500 rounded-2xl shadow-sm"><Target size={24}/></div>
                                <div className="flex gap-2">
                                    <button onClick={()=>{
                                        if(isEditingThis) setIsEditing(null);
                                        else { setEditGoalId(g.id); setEditState({ target: g.targetAmount, date: g.targetDate }); }
                                    }} className="text-blue-400 hover:text-blue-600 bg-white p-2 rounded-xl transition-colors"><Edit2 size={16}/></button>
                                    <button onClick={()=>deleteGoal(g.id, g.name)} className="text-rose-400 hover:text-rose-600 bg-white p-2 rounded-xl transition-colors"><Trash2 size={16}/></button>
                                </div>
                             </div>

                             {isEditingThis ? (
                                <div className="mb-6 space-y-3 bg-white/50 p-4 rounded-2xl">
                                     <div>
                                         <label className="text-[10px] font-bold text-blue-700 uppercase">Target Amount</label>
                                         <input type="number" value={editState.target} onChange={e=>setEditState({...editState, target: e.target.value})} className="w-full bg-white p-2 rounded-lg font-bold text-blue-900 outline-none border border-blue-200"/>
                                     </div>
                                     <div>
                                         <label className="text-[10px] font-bold text-blue-700 uppercase">Target Date</label>
                                         <input type="date" value={editState.date} onChange={e=>setEditState({...editState, date: e.target.value})} className="w-full bg-white p-2 rounded-lg font-bold text-blue-900 outline-none border border-blue-200"/>
                                     </div>
                                     <button onClick={()=>handleUpdateGoal(g.id)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs">Save Changes</button>
                                </div>
                             ) : (
                                <div className="mb-6">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h4 className="text-lg font-black text-blue-900">{g.name}</h4>
                                         {isDone && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Done</span>}
                                     </div>
                                     <h2 className="text-4xl font-black text-blue-900">{currency}{currentAmount.toLocaleString()}</h2>
                                     
                                     <div className="grid grid-cols-2 gap-3 mt-6">
                                         <div className="bg-white/60 p-3 rounded-2xl">
                                             <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Target</p>
                                             <p className="text-sm font-black text-blue-900">{currency}{g.targetAmount.toLocaleString()}</p>
                                             <p className="text-[9px] font-medium text-blue-700/60">{g.targetDate || 'No date'}</p>
                                         </div>
                                         <div className="bg-white/60 p-3 rounded-2xl">
                                             <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Monthly Need</p>
                                             <p className="text-sm font-black text-blue-900">{monthlyNeed > 0 ? `${currency}${monthlyNeed.toFixed(0)}` : '-'}</p>
                                             <p className="text-[9px] font-medium text-blue-700/60">to meet deadline</p>
                                         </div>
                                     </div>
                                </div>
                             )}

                             <div className="relative mb-6">
                                 <div className="flex justify-between text-[10px] font-bold text-blue-800/60 mb-1.5 uppercase tracking-wide">
                                     <span>{progress.toFixed(0)}%</span>
                                     <span>{currency}{remaining.toLocaleString()} left</span>
                                 </div>
                                 <div className="w-full h-4 bg-blue-200/50 rounded-full overflow-hidden relative">
                                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                 </div>
                             </div>

                             {!isDone && (
                                <div className="bg-white p-4 rounded-2xl border border-blue-100 flex flex-col gap-2">
                                    <div className="flex justify-between px-1">
                                        <span className="text-[10px] font-bold text-blue-300 uppercase">Budget</span>
                                        <span className="text-[10px] font-black text-blue-600">{currency}{remainingBudget.toFixed(0)} avail</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Add funds..." value={depositState[g.id] || ''} 
                                            onChange={e=>setDepositState({...depositState, [g.id]: e.target.value})}
                                            className="flex-grow bg-slate-50 px-3 py-2 rounded-xl text-sm font-bold border border-slate-100 outline-none"/>
                                        <button onClick={()=>setDepositState({...depositState, [g.id]: remainingBudget.toString()})} className="bg-slate-100 text-slate-500 px-3 rounded-xl font-bold text-[10px] uppercase">Max</button>
                                        <button onClick={()=>handleDeposit(g.name, g.id)} className="bg-blue-600 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wider">Add</button>
                                    </div>
                                </div>
                             )}
                        </div>
                    )
                })}
                {(data.custom_goals || []).length === 0 && !isCreating && (
                    <div className="text-center p-8 text-slate-400 text-sm font-medium">No active goals. Create one to start saving!</div>
                )}
            </div>
        </div>
    )
}