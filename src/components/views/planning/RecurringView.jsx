import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../../services/firebase';
import { Edit2, Trash2, Save, X } from 'lucide-react';

export default function RecurringView({ data, user, showNotify, metrics }) {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [day, setDay] = useState(1);
  const [type, setType] = useState('bill'); 
  const [incomeFrequency, setIncomeFrequency] = useState('recurring');
  const [editingItem, setEditingItem] = useState(null);

  const unallocated = metrics.unallocated;

  const add = async () => {
    if (!name || !amt) return;
    const val = parseFloat(amt);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    
    if (type === 'bill') {
       if (val > unallocated + 0.01) {
           showNotify(`Cannot add bill. Only £${unallocated.toFixed(2)} available.`, true);
           return;
       }
       await updateDoc(docRef, { bills: { ...(data.bills || {}), [name]: { amount: val, date: parseInt(day) } } });
       showNotify("Added Recurring Bill");
    } else {
       if (incomeFrequency === 'recurring') {
           const newIncome = [...(data.income_sources || []), { id: Math.random().toString(36).substr(2, 5), name, amount: val, date: parseInt(day) }];
           await updateDoc(docRef, { income_sources: newIncome });
           showNotify("Added Recurring Income");
       } else {
           const tx = { id: Math.random().toString(36).substr(2, 9), amount: val, category: 'Income', description: name, timestamp: new Date().toISOString(), isSystem: false, type: 'credit' };
           await updateDoc(docRef, { transactions: [tx, ...(data.transactions || [])] });
           showNotify("One-Time Income Logged");
       }
    }
    setName(''); setAmt('');
  };

  // --- RESTORED LOGIC: UPDATE ITEM ---
  const updateItem = async () => {
    if (!editingItem) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (editingItem.type === 'income') {
         const newIncome = data.income_sources.map(s => s.id === editingItem.id ? editingItem : s);
         const newTransactions = data.transactions.map(tx => {
            if (tx.isSystem && tx.description === editingItem.originalName && tx.category === 'Income') {
                 return { ...tx, description: editingItem.name, amount: parseFloat(editingItem.amount) };
            }
            return tx;
        });
        await updateDoc(docRef, { income_sources: newIncome, transactions: newTransactions });

    } else {
        const newVal = parseFloat(editingItem.amount);
        const oldVal = data.bills[editingItem.originalName]?.amount || 0;
        const diff = newVal - oldVal;

        if (diff > unallocated + 0.01) {
            showNotify(`Cannot increase bill. Only £${unallocated.toFixed(2)} available.`, true);
            return;
        }

        const newBills = { ...data.bills };
        if (editingItem.originalName !== editingItem.name) delete newBills[editingItem.originalName];
        newBills[editingItem.name] = { amount: newVal, date: parseInt(editingItem.date) };
        
        const newTransactions = data.transactions.map(tx => {
            if (tx.isSystem && tx.description === editingItem.originalName && tx.category === 'Bills') {
                 const d = new Date(tx.timestamp);
                 if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    return { ...tx, description: editingItem.name, amount: newVal };
                 }
            }
            return tx;
        });
        await updateDoc(docRef, { bills: newBills, transactions: newTransactions });
    }
    setEditingItem(null);
    showNotify("Item Updated");
  };

  // --- RESTORED LOGIC: DELETE ITEM ---
  const deleteItem = async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (editingItem.type === 'income') {
          const newIncome = data.income_sources.filter(s => s.id !== editingItem.id);
          const newTransactions = data.transactions.filter(tx => {
             if (tx.isSystem && tx.description === editingItem.name && tx.category === 'Income') {
                 const d = new Date(tx.timestamp);
                 return !(d.getMonth() === currentMonth && d.getFullYear() === currentYear);
             }
             return true;
          });
          await updateDoc(docRef, { income_sources: newIncome, transactions: newTransactions });
      } else {
          const newBills = { ...data.bills };
          delete newBills[editingItem.name];
          const newTransactions = data.transactions.filter(tx => {
             if (tx.isSystem && tx.description === editingItem.name && tx.category === 'Bills') {
                 const d = new Date(tx.timestamp);
                 return !(d.getMonth() === currentMonth && d.getFullYear() === currentYear);
             }
             return true;
          });
          await updateDoc(docRef, { bills: newBills, transactions: newTransactions });
      }
      setEditingItem(null);
      showNotify("Item Deleted");
  };

  return (
    <div className="space-y-6">
      {/* RESTORED EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-slate-900">Edit {editingItem.type === 'income' ? 'Income' : 'Bill'}</h3>
                 <button onClick={() => setEditingItem(null)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                    <input type="text" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm border border-slate-100 outline-none"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                    <input type="number" value={editingItem.amount} onChange={e=>setEditingItem({...editingItem, amount: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-lg border border-slate-100 outline-none"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day (1-31)</label>
                    <select value={editingItem.date} onChange={e=>setEditingItem({...editingItem, date: parseInt(e.target.value)})} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm border border-slate-100 outline-none">
                       {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                    </select>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={deleteItem} className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
                 <button onClick={updateItem} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"><Save size={16}/> Update</button>
              </div>
           </div>
        </div>
      )}

      {/* Add New Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl">
           <button onClick={()=>setType('bill')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'bill' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Bill</button>
           <button onClick={()=>setType('income')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Income</button>
        </div>
        {/* RESTORED ONE-TIME TOGGLE */}
        {type === 'income' && (
            <div className="flex gap-4 mb-4 px-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" className="hidden" checked={incomeFrequency === 'recurring'} onChange={() => setIncomeFrequency('recurring')} /><span className={`text-xs font-bold ${incomeFrequency === 'recurring' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" className="hidden" checked={incomeFrequency === 'one-off'} onChange={() => setIncomeFrequency('one-off')} /><span className={`text-xs font-bold ${incomeFrequency === 'one-off' ? 'text-slate-900' : 'text-slate-400'}`}>One-Time</span></label>
            </div>
        )}
        <div className="space-y-3 mb-6">
           <div className="flex gap-2">
             <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="flex-grow bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none text-sm" />
             {incomeFrequency === 'recurring' && <select value={day} onChange={e=>setDay(e.target.value)} className="bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none text-sm w-20 text-center">{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select>}
           </div>
           <input type="number" placeholder="0.00" value={amt} onChange={e=>setAmt(e.target.value)} className="w-full bg-slate-50 p-4 pl-10 rounded-2xl font-black border border-slate-100 outline-none" />
        </div>
        {type === 'bill' && (
             <div className="text-[10px] text-slate-400 font-bold mb-4 flex justify-between px-2">
                <span>Available to allocate:</span>
                <span className={unallocated < 0 ? 'text-rose-500' : 'text-emerald-500'}>£{Math.max(0, unallocated).toLocaleString()}</span>
             </div>
        )}
        <button onClick={add} className={`w-full text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest ${type === 'income' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
           {type === 'income' ? (incomeFrequency === 'recurring' ? 'Add Recurring Income' : 'Log One-Time Income') : 'Add Recurring Bill'}
        </button>
      </div>
      
      <div className="space-y-6">
         <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Recurring Income</h4>
            <div className="space-y-2">{(data.income_sources || []).map(inc => <div key={inc.id} onClick={() => setEditingItem({...inc, originalName: inc.name, type: 'income'})} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 cursor-pointer hover:border-emerald-200"><div><p className="text-sm font-bold text-slate-900">{inc.name}</p></div><div className="flex items-center gap-3"><span className="font-black text-emerald-600">+£{inc.amount}</span><Edit2 size={14} className="text-slate-300"/></div></div>)}</div>
         </div>
         <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Recurring Bills</h4>
            <div className="space-y-2">{Object.entries(data.bills || {}).map(([k, v]) => <div key={k} onClick={() => setEditingItem({name: k, originalName: k, amount: v.amount, date: v.date, type: 'bill'})} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 cursor-pointer hover:border-blue-200"><div><p className="text-sm font-bold text-slate-900">{k}</p></div><div className="flex items-center gap-3"><span className="font-black text-slate-900">£{v.amount}</span><Edit2 size={14} className="text-slate-300"/></div></div>)}</div>
         </div>
      </div>
    </div>
  );
}