import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import { Trash2, Eye, EyeOff, Plus, ChevronDown, ChevronUp, Coins, Globe, Flag, BookOpen, Wallet } from 'lucide-react';
import { CURRENCIES, LANGUAGES, COUNTRIES } from '../../utils/constants';

function UserGuide() {
    return (
        <div className="space-y-4 text-slate-600 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Wallet size={14}/> How it works</h4>
                <p>BudgetAi uses a "Zero-Based Budgeting" approach. All your income goes into a pot. You subtract your recurring bills first. What's left is your <b>Free Cash</b>. You allocate this cash to categories (like Food or Shopping) or Savings.</p>
            </div>
            <div className="space-y-2">
                <details className="group bg-white p-3 rounded-xl border border-slate-100">
                    <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                        <span>1. Setting up Income & Bills</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                    </summary>
                    <p className="mt-2 pl-2 border-l-2 border-slate-200">Go to <b>Plan &gt; Recurring</b>. Add your salary and fixed bills (Rent, Netflix, etc.) here. The app automatically deducts bills from your total income.</p>
                </details>
                <details className="group bg-white p-3 rounded-xl border border-slate-100">
                    <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                        <span>2. Creating a Budget</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                    </summary>
                    <p className="mt-2 pl-2 border-l-2 border-slate-200">Go to <b>Plan &gt; Budget</b>. You will see your "Unallocated" cash. Type amounts into the category boxes to assign money. Try to get "Unallocated" to 0.</p>
                </details>
                <details className="group bg-white p-3 rounded-xl border border-slate-100">
                    <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                        <span>3. Logging Expenses</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                    </summary>
                    <p className="mt-2 pl-2 border-l-2 border-slate-200">Tap the big <b>+</b> button. Enter the amount and pick a category. The app will deduct this from your category budget and show you how much is left.</p>
                </details>
                <details className="group bg-white p-3 rounded-xl border border-slate-100">
                    <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                        <span>4. Saving Goals</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                    </summary>
                    <p className="mt-2 pl-2 border-l-2 border-slate-200">Go to <b>Savings</b>. Create goals like "Holiday". You can deposit money into these goals, which removes it from your spending cash.</p>
                </details>
            </div>
        </div>
    )
}

function HelpTip({ title, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block ml-1.5 z-30">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-slate-300 hover:text-blue-500 transition-colors">
        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl z-50">
          <p className="font-bold mb-1 text-slate-300">{title}</p>
          <p className="opacity-90">{text}</p>
        </div>
      )}
    </div>
  )
}

export default function SettingsView({ data, user, showNotify, metrics, t }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCatExpanded, setIsCatExpanded] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  
  const settings = data?.user_settings || { currency: '£', language: 'en', country: 'United Kingdom' };
  const activeCategories = (data?.categories || []).filter(c => !(data?.hidden_categories || []).includes(c));
  const hiddenCategories = data?.hidden_categories || [];
  const DEFAULT_CATEGORIES = ["Groceries", "Eating Out", "Transportation", "Shopping", "Leisure & Events", "Health & Beauty", "Miscellaneous", "Investments", "Emergency Fund"];

  const updateSettings = async (key, val) => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
      await updateDoc(docRef, { user_settings: { ...settings, [key]: val } });
      showNotify("Settings Saved");
  };

  const handleFullReset = async () => {
    if (!user || !data) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    const zeroAlloc = {}; 
    data.categories.forEach(c => { zeroAlloc[c] = 0; });
    
    await updateDoc(docRef, { 
        monthly_income: 0, 
        income_sources: [], 
        income_rollover: 0, 
        base_allocations: zeroAlloc, 
        allocations: zeroAlloc, 
        spent: zeroAlloc, 
        transactions: [], 
        bills: {},
        custom_goals: [],
        emergency_deposits: 0,
        onboarding_complete: false
    });
    setConfirmReset(false); 
    showNotify("All Data Wiped", true);
  };

  const addNewCategory = async () => {
    if (!newCatName) return;
    if (data.categories.includes(newCatName)) {
        showNotify("Category already exists", true);
        return;
    }
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    
    await updateDoc(docRef, { 
        categories: [...(data.categories || []), newCatName],
        base_allocations: {...data.base_allocations, [newCatName]: 0},
        allocations: {...data.allocations, [newCatName]: 0}, 
    });
    setNewCatName('');
    showNotify("Category Added");
  };

  const toggleCategoryVisibility = async (catName) => {
    const spent = metrics.realSpent?.[catName] || 0;
    if (spent > 0) {
        showNotify(`Cannot hide ${catName}. Spend is not 0.`, true);
        return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    let newHidden = [...hiddenCategories];
    let isHiding = false;

    if (newHidden.includes(catName)) {
      newHidden = newHidden.filter(c => c !== catName);
    } else {
      newHidden.push(catName);
      isHiding = true;
    }

    const updates = { hidden_categories: newHidden };
    
    if (isHiding) {
        updates.allocations = { ...data.allocations, [catName]: 0 };
        updates.base_allocations = { ...data.base_allocations, [catName]: 0 };
    }

    await updateDoc(docRef, updates);
    showNotify(isHiding ? "Category Hidden & Budget Cleared" : "Category Restored");
  };

  const deleteCategory = async (catName) => {
      if (DEFAULT_CATEGORIES.includes(catName)) {
         showNotify("Cannot delete default category", true);
         return;
      }

      const spent = metrics.realSpent?.[catName] || 0;
      if (spent > 0) {
        showNotify(`Cannot delete ${catName}. Spend is not 0.`, true);
        return;
      }

      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
      const newCats = data.categories.filter(c => c !== catName);
      
      const newAllocations = { ...data.allocations };
      delete newAllocations[catName];
      const newBaseAllocations = { ...data.base_allocations };
      delete newBaseAllocations[catName];

      await updateDoc(docRef, { 
          categories: newCats,
          allocations: newAllocations,
          base_allocations: newBaseAllocations
      });
      showNotify("Category Deleted");
  };

  return (
    <div className="space-y-6 pt-6">
       <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900">{t('settings')}</h3>
              <HelpTip title="Settings" text="Customize your app experience here." />
          </div>

          <div className="space-y-4">
              {/* User Guide Toggle */}
              <div className="bg-slate-50 rounded-2xl overflow-hidden">
                  <button onClick={() => setShowGuide(!showGuide)} className="w-full flex items-center justify-between p-4 font-bold text-slate-700 text-sm hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-3"><BookOpen size={20} className="text-slate-400"/> {t('openGuide')}</span>
                      <ChevronDown size={16} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
                  </button>
                  {showGuide && (
                      <div className="p-4 border-t border-slate-200">
                          <UserGuide />
                      </div>
                  )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                      <Coins className="text-slate-400" size={20} />
                      <span className="text-sm font-bold text-slate-700">{t('currency')}</span>
                  </div>
                  <select value={settings.currency} onChange={(e) => updateSettings('currency', e.target.value)} className="bg-white text-sm font-bold text-slate-900 px-3 py-2 rounded-xl outline-none border border-slate-200 max-w-[120px]">
                      {CURRENCIES.map(c => <option key={c.label} value={c.code}>{c.label}</option>)}
                  </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                      <Globe className="text-slate-400" size={20} />
                      <span className="text-sm font-bold text-slate-700">{t('language')}</span>
                  </div>
                  <select value={settings.language} onChange={(e) => updateSettings('language', e.target.value)} className="bg-white text-sm font-bold text-slate-900 px-3 py-2 rounded-xl outline-none border border-slate-200 max-w-[120px]">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                      <Flag className="text-slate-400" size={20} />
                      <span className="text-sm font-bold text-slate-700">{t('country')}</span>
                  </div>
                  <select value={settings.country} onChange={(e) => updateSettings('country', e.target.value)} className="bg-white text-sm font-bold text-slate-900 px-3 py-2 rounded-xl outline-none border border-slate-200 max-w-[120px]">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </div>
       </div>

       <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
         <button onClick={() => setIsCatExpanded(!isCatExpanded)} className="w-full flex justify-between items-center mb-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Manage Categories</span>
            {isCatExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
         </button>
         
         {isCatExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
               <div className="flex gap-2">
                  <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="New Category Name" 
                    className="flex-grow bg-white px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 outline-none" />
                  <button onClick={addNewCategory} className="bg-slate-900 text-white w-12 rounded-xl flex items-center justify-center shadow-lg"><Plus size={20}/></button>
               </div>

               <div className="space-y-2">
                  {activeCategories.map(cat => {
                    const spent = metrics.realSpent?.[cat] || 0;
                    const canModify = spent === 0;

                    return (
                        <div key={cat} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                           <span className="text-sm font-bold text-slate-700 pl-2">{cat}</span>
                           <div className="flex gap-2 items-center">
                              {!canModify && <span className="text-[9px] font-bold text-slate-300 mr-1">In Use</span>}
                              <button onClick={() => toggleCategoryVisibility(cat)} className={`p-2 rounded-lg transition-colors ${canModify ? 'text-slate-400 hover:text-blue-600 bg-slate-50' : 'text-slate-200 bg-slate-50 cursor-not-allowed'}`} disabled={!canModify}>
                                  <Eye size={16}/>
                              </button>
                              {!DEFAULT_CATEGORIES.includes(cat) && (
                                  <button onClick={() => deleteCategory(cat)} className={`p-2 rounded-lg transition-colors ${canModify ? 'text-slate-400 hover:text-rose-500 bg-slate-50' : 'text-slate-200 bg-slate-50 cursor-not-allowed'}`} disabled={!canModify}>
                                      <Trash2 size={16}/>
                                  </button>
                              )}
                           </div>
                        </div>
                    );
                  })}
               </div>

               {hiddenCategories.length > 0 && (
                 <div className="space-y-2 pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2">Hidden</p>
                    {hiddenCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-3 bg-slate-100 border border-dashed border-slate-200 rounded-xl opacity-75">
                          <span className="text-sm font-bold text-slate-500 pl-2">{cat}</span>
                          <button onClick={() => toggleCategoryVisibility(cat)} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg"><EyeOff size={16}/></button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
         )}
      </div>
       
       <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100 flex flex-col items-center">
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">{t('dangerZone')}</p>
        {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="text-rose-600 font-bold text-sm">{t('wipeData')}</button>
        ) : (
            <div className="flex gap-4">
                <button onClick={handleFullReset} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase">Confirm</button>
                <button onClick={() => setConfirmReset(false)} className="bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs uppercase">Cancel</button>
            </div>
        )}
      </div>
    </div>
  );
}