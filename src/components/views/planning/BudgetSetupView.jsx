import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../../services/firebase.js'; 
import { getCategoryIcon } from '../../../utils/helpers.js';
import HelpTip from '../../ui/HelpTip';

export default function BudgetSetupView({ data, user, showNotify, metrics, t }) {
  const [aiProposal, setAiProposal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSmartBudget, setShowSmartBudget] = useState(false);
  const currency = data?.user_settings?.currency || '£';
  
  const activeCategories = (data.categories || []).filter(c => !(data.hidden_categories || []).includes(c));
  
  const availablePool = (metrics.effective || 0) - (metrics.bills || 0) - (metrics.totalPot || 0) - (metrics.totalVariableSpending || 0);
  const unallocatedDisplay = metrics.unallocated || 0;

  const handleUpdateRemaining = async (cat, newRemainingVal) => {
    const spent = metrics.realSpent?.[cat] || 0;
    const amount = parseFloat(newRemainingVal) || 0;
    const newAllocation = amount + spent;

    const currentAllocation = data.allocations[cat] || 0;
    const diff = newAllocation - currentAllocation;
    
    if (diff > unallocatedDisplay + 0.01) { 
        showNotify(`Exceeds Available Cash!`, true);
        return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    
    await updateDoc(docRef, { 
        allocations: { ...data.allocations, [cat]: newAllocation },
        base_allocations: { ...data.base_allocations, [cat]: newAllocation } 
    });
  };

  const generateBudgetWithGemini = async () => {
    setAiLoading(true);
    
    const prompt = `Act as financial advisor. 
    Funds Available for Spending Categories (Remaining): ${currency}${availablePool}. 
    Active Categories: ${JSON.stringify(activeCategories)}. 
    
    Rules: 
    1. Distribute the ENTIRE ${currency}${availablePool} across the categories. 
    2. These values represent the REMAINING amount to budget for the rest of the month.
    3. Suggest realistic amounts based on typical costs.
    4. Return JSON: { "allocations": { "Category Name": number }, "advice": "string" }`;

    const apiKey = process.env.REACT_APP_GEMINI_KEY || ""; 
    const MODEL_NAME = "gemini-2.5-flash-preview-09-2025"; 

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const start = text.indexOf('{'); const end = text.lastIndexOf('}');
      if (start !== -1) text = text.substring(start, end + 1);
      
      const parsed = JSON.parse(text);

      let sum = 0;
      let maxCat = null;
      let maxVal = -1;

      Object.entries(parsed.allocations).forEach(([k, v]) => {
          sum += v;
          if (v > maxVal) {
              maxVal = v;
              maxCat = k;
          }
      });

      const remainder = availablePool - sum;

      if (Math.abs(remainder) > 0.01) {
          const targetCat = parsed.allocations["Miscellaneous"] !== undefined ? "Miscellaneous" : maxCat;
          if (targetCat) {
              parsed.allocations[targetCat] = (parsed.allocations[targetCat] || 0) + remainder;
              if (parsed.allocations[targetCat] < 0) parsed.allocations[targetCat] = 0; 
          }
      }
      
      setAiProposal(parsed);
      setShowSmartBudget(true);
    } catch (e) { 
        console.error(e); 
        showNotify("AI Generation Failed", true); 
    }
    setAiLoading(false);
  };

  const handleProposalChange = (cat, val) => {
      setAiProposal({
          ...aiProposal,
          allocations: { ...aiProposal.allocations, [cat]: parseFloat(val) || 0 }
      });
  };

  const applyProposal = async () => {
    if (!aiProposal) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    
    const newAllocations = { ...data.allocations };
    
    Object.entries(aiProposal.allocations).forEach(([cat, remainingAmount]) => {
        const spent = metrics.realSpent?.[cat] || 0;
        newAllocations[cat] = remainingAmount + spent;
    });
    
    await updateDoc(docRef, { allocations: newAllocations, base_allocations: newAllocations });
    setAiProposal(null);
    setShowSmartBudget(false);
    showNotify("Budget Applied!");
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
         {!showSmartBudget ? (
            <button onClick={generateBudgetWithGemini} disabled={aiLoading} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-sm shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
               {aiLoading ? "Thinking..." : <><Sparkles size={16}/> Auto-Generate Budget</>}
            </button>
         ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                  <p className="text-xs italic opacity-90">"{aiProposal.advice}"</p>
                  <p className="text-[10px] text-blue-200 mt-2 font-bold uppercase tracking-wider">
                      Total Remaining: {currency}{Object.values(aiProposal.allocations).reduce((a,b)=>a+b,0).toLocaleString()}
                  </p>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(aiProposal.allocations).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
                         <span>{k}</span>
                         <input type="number" value={Math.round(v)} onChange={(e) => handleProposalChange(k, e.target.value)} className="w-20 bg-white/20 text-white font-bold p-1 rounded text-right outline-none" />
                      </div>
                  ))}
               </div>
               <div className="flex gap-2">
                  <button onClick={applyProposal} className="flex-1 bg-white text-blue-600 py-3 rounded-xl font-bold text-sm shadow-lg">Accept Plan</button>
                  <button onClick={() => setShowSmartBudget(false)} className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-bold text-sm">Cancel</button>
               </div>
            </div>
         )}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Budget Categories
                <HelpTip title="Allocations" text="Decide how much of your remaining money goes to each bucket."/>
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${unallocatedDisplay < 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {unallocatedDisplay >= 0 ? `${currency}${unallocatedDisplay.toLocaleString()} Unallocated` : `Over by ${currency}${Math.abs(unallocatedDisplay).toLocaleString()}`}
            </span>
         </div>

         <div className="grid grid-cols-1 gap-4">
           {activeCategories.map(cat => {
             const allocated = data.allocations[cat] || 0;
             const spent = metrics.realSpent?.[cat] || 0;
             const remaining = allocated - spent;
             const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
             const Icon = getCategoryIcon(cat);

             return (
               <div key={cat} className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Icon size={20} />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5">{cat}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">{t('spent')}: {currency}{spent.toFixed(0)}</span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-300" style={{ width: `${Math.min(100, percentSpent)}%` }}></div>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('leftToSpend')}</span>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={remaining} 
                            onChange={e => handleUpdateRemaining(cat, e.target.value)} 
                            className="w-20 text-right bg-slate-50 p-2 rounded-xl font-black text-sm outline-none focus:ring-2 ring-blue-100 text-slate-900" 
                        />
                    </div>
                 </div>
               </div>
             );
           })}
         </div>
      </div>
    </div>
  );
}