import React from 'react';
import { Database, Calculator, Activity, AlertCircle, ArrowRight } from 'lucide-react';

export default function DebugView({ data, metrics, user }) {
  if (!data || !metrics) return (
    <div className="p-8 text-center text-slate-400">
      <Activity className="mx-auto mb-2 animate-spin" />
      <p>Waiting for hook data...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 1. STATE OVERVIEW */}
      <div className="bg-slate-900 text-slate-50 p-6 rounded-[2rem] shadow-xl">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Database className="text-blue-400" /> Hook State
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-800 p-3 rounded-xl">
            <span className="text-slate-500 block">User Auth</span>
            <span className={user ? "text-emerald-400" : "text-rose-400"}>
              {user?.uid ? 'OK' : 'NULL'}
            </span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl">
            <span className="text-slate-500 block">Firestore Data</span>
            <span className={data ? "text-blue-400" : "text-rose-400"}>
              {data ? 'LOADED' : 'NULL'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE BUDGET EQUATION */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Calculator size={20} className="text-purple-500" /> The Budget Equation
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Verifying: <code>unallocated = effective - bills - allocated</code>
        </p>
        
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Effective Income</span>
            <span className="font-bold text-emerald-600">£{metrics.effective}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">(-) Fixed Bills</span>
            <span className="text-rose-500">£{metrics.bills}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">(-) Total Allocated</span>
            <span className="text-rose-500">£{metrics.totalAllocated}</span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between">
            <span className="font-bold text-slate-900">(=) Unallocated</span>
            <span className={`font-bold ${metrics.unallocated < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
              £{metrics.unallocated}
            </span>
          </div>
        </div>
      </div>

      {/* 3. EMERGENCY & INVESTMENTS */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-600/70 uppercase mb-1">Emergency Math</p>
            <div className="text-xs space-y-1">
               <div className="flex justify-between">
                  <span>Deposits:</span>
                  <span className="font-bold">£{data.emergency_deposits || 0}</span>
               </div>
               <div className="flex justify-between text-amber-700">
                  <span>Balance:</span>
                  <span className="font-bold">£{metrics.emergencyBalance}</span>
               </div>
            </div>
         </div>
         <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">Investment Math</p>
            <div className="text-xs space-y-1">
               <div className="flex justify-between">
                  <span>Lifetime:</span>
                  <span className="font-bold">£{metrics.totalInvestedAllTime}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 4. REAL SPENT TRACKER */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Activity size={20} className="text-orange-500" /> Real Spending
        </h3>
        <div className="space-y-2">
           {Object.keys(metrics.realSpent || {}).length === 0 && (
             <p className="text-xs text-slate-400 italic">No spending recorded this month.</p>
           )}
           {Object.entries(metrics.realSpent || {}).map(([cat, amount]) => (
             <div key={cat} className="flex justify-between items-center text-xs">
                <span className="text-slate-600">{cat}</span>
                <div className="flex items-center gap-2">
                   <span className="text-slate-300">of £{data.allocations?.[cat] || 0}</span>
                   <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">£{amount}</span>
                </div>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
}