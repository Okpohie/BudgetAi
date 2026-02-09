import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export function useBudget(user) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Database Listener & Automation Logic
  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
    
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        let existingData = docSnap.data();
        let needsUpdate = false;
        let updatedTransactions = [...(existingData.transactions || [])];
        const currentMonthId = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // --- ROLLOVER LOGIC ---
        // Formula: Effective Income - Total Previous Transactions (Fixed Bills + Manual Expenses)
        if (existingData.last_month && existingData.last_month !== currentMonthId) {
             const currentMonthTxForTotal = (existingData.transactions || []).filter(t => {
                const d = new Date(t.timestamp);
                return d.getMonth() + 1 === existingData.last_month; 
             });
             
             // Previous Month's Income
             const prevIncomeSum = currentMonthTxForTotal
                .filter(t => t.category === 'Income')
                .reduce((a, b) => a + b.amount, 0);

             const effectivePrevious = prevIncomeSum + (existingData.income_rollover || 0);
             
             // Sum of LAST MONTH SPENDING 
             // Logic: Include Bills and Manual Expenses. 
             // Exclude Income and Savings Contributions (transfers)
             const totalSpentPrevious = currentMonthTxForTotal
                .filter(t => t.category !== 'Income' && !t.isContribution)
                .reduce((a, b) => a + b.amount, 0);

             // Rollover = Previous Effective - Real Spending
             const totalUnspentRollover = effectivePrevious - totalSpentPrevious;

             // Rollover budget allocations
             const newAllocations = { ...existingData.allocations };
             Object.keys(existingData.allocations || {}).forEach(cat => {
                const catSpent = currentMonthTxForTotal.filter(t => t.category === cat).reduce((a, b) => a + b.amount, 0);
                const carryover = (existingData.allocations[cat] || 0) - catSpent;
                newAllocations[cat] = (existingData.base_allocations?.[cat] || 0) + carryover;
             });

             existingData = {
                ...existingData,
                income_rollover: totalUnspentRollover,
                allocations: newAllocations,
                spent: Object.keys(existingData.spent || {}).reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
                last_month: currentMonthId,
             };
             needsUpdate = true;
        }

        // --- AUTO-LOGGING RECURRING ITEMS ---
        const todayDate = new Date();
        
        Object.entries(existingData.bills || {}).forEach(([name, val]) => {
             const amount = typeof val === 'object' ? val.amount : val;
             const dayDue = typeof val === 'object' ? val.date : 1; 
             
             if (todayDate.getDate() >= dayDue) {
               const expectedId = `bill-${name}-${currentMonthId}-${currentYear}`;
               const alreadyLogged = updatedTransactions.some(t => t.id === expectedId);

               if (!alreadyLogged) {
                 const billDate = new Date(currentYear, currentMonthId - 1, dayDue);
                 if (billDate > new Date()) billDate.setTime(new Date().getTime());
                 
                 updatedTransactions.unshift({
                   id: expectedId,
                   amount: amount, category: 'Bills', description: name, 
                   timestamp: billDate.toISOString(), isSystem: true 
                 });
                 needsUpdate = true;
               }
             }
        });

        (existingData.income_sources || []).forEach(source => {
            const dayDue = source.date || 1; 
            if (todayDate.getDate() >= dayDue) {
               const expectedId = `inc-${source.id}-${currentMonthId}-${currentYear}`;
               const alreadyLogged = updatedTransactions.some(t => t.id === expectedId);
               
               if (!alreadyLogged) {
                  const incomeDate = new Date(currentYear, currentMonthId - 1, dayDue);
                  if (incomeDate > new Date()) incomeDate.setTime(new Date().getTime());
                  
                  updatedTransactions.unshift({
                     id: expectedId,
                     amount: source.amount, category: 'Income', description: source.name,
                     timestamp: incomeDate.toISOString(), isSystem: true, type: 'credit'
                  });
                  needsUpdate = true;
               }
            }
        });

        if (needsUpdate) {
             existingData.transactions = updatedTransactions;
             await updateDoc(docRef, existingData);
             setData(existingData);
        } else {
             setData(existingData);
        }

      } else {
        // --- CLEAN INITIALIZATION (NO PSEUDO DATA) ---
        const currentMonthId = new Date().getMonth() + 1;
        const defaultAllocs = { "Groceries": 350, "Eating Out": 150, "Transportation": 120, "Shopping": 100, "Leisure & Events": 100, "Health & Beauty": 50, "Miscellaneous": 50, "Investments": 200, "Emergency Fund": 100 };
        
        const defaultData = {
          monthly_income: 0, 
          income_sources: [], 
          income_rollover: 0,
          bills: {},
          categories: ["Groceries", "Eating Out", "Transportation", "Shopping", "Leisure & Events", "Health & Beauty", "Miscellaneous", "Investments", "Emergency Fund"],
          hidden_categories: [], 
          base_allocations: defaultAllocs, 
          allocations: defaultAllocs,      
          spent: { "Groceries": 0 }, 
          transactions: [], 
          last_month: currentMonthId,
          emergency_deposits: 0, 
          custom_goals: [], 
          emergency_target: 5000,
          onboarding_complete: false,
          user_settings: { currency: '£', language: 'en', country: 'United Kingdom' }
        };
        await setDoc(docRef, defaultData);
        setData(defaultData);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Metrics Calculation
  const metrics = useMemo(() => {
    const safeDefaults = { 
        effective: 0, bills: 0, allocatedRemaining: 0, totalSpent: 0, 
        savingsSpent: 0, savingsAllocated: 0, totalAllocated: 0, totalIncome: 0, 
        emergencySpent: 0, emergencyAllocated: 0, totalInvestedAllTime: 0, 
        emergencyBalance: 0, realSpent: {}, unallocated: 0, totalAllocatedSpent: 0, 
        totalPot: 0, totalVariableSpending: 0, prevMonth: null
    };

    if (!data) return safeDefaults;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    const currentMonthTx = (data.transactions || []).filter(t => {
       const d = new Date(t.timestamp);
       return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthTx = (data.transactions || []).filter(t => {
        const d = new Date(t.timestamp);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    // --- PREVIOUS MONTH METRICS ---
    const prevSpentMap = {};
    let prevInvested = 0;
    let prevEmergAdded = 0;
    let prevSavingsAdded = 0;
    let prevIncome = 0;

    prevMonthTx.forEach(t => {
        if(t.category === 'Income') {
            prevIncome += t.amount;
        } else if (t.category === 'Investments' || t.category === 'Savings & Investments') {
            prevInvested += t.amount;
        } else if (t.category === 'Emergency Fund') {
            if(t.isContribution) prevEmergAdded += t.amount;
        } else if (t.isContribution) {
            prevSavingsAdded += t.amount;
        } else if (t.category !== 'Bills' && !t.isContribution) {
            prevSpentMap[t.category] = (prevSpentMap[t.category] || 0) + t.amount;
        }
    });

    let maxCat = { name: '-', amount: 0 };
    let minCat = { name: '-', amount: Infinity };

    Object.entries(prevSpentMap).forEach(([k, v]) => {
        if(v > maxCat.amount) maxCat = { name: k, amount: v };
        if(v < minCat.amount) minCat = { name: k, amount: v };
    });
    if(minCat.amount === Infinity) minCat = { name: 'None', amount: 0 };
    
    const completedGoalsNames = (data.custom_goals || [])
        .filter(g => (g.currentAmount || 0) >= (g.targetAmount || 1))
        .map(g => g.name);

    const prevMetrics = {
        rollover: data.income_rollover || 0,
        invested: prevInvested,
        emergencyAdded: prevEmergAdded,
        savingsAdded: prevSavingsAdded,
        completedGoals: completedGoalsNames,
        maxCategory: maxCat,
        minCategory: minCat,
        totalIncome: prevIncome,
    };

    // --- CURRENT MONTH METRICS ---
    const totalIncome = currentMonthTx
        .filter(t => t.category === 'Income')
        .reduce((a, b) => a + b.amount, 0);

    const effective = totalIncome + (data.income_rollover || 0);
    const billsTotal = Object.values(data.bills || {}).reduce((a, b) => a + (typeof b === 'object' ? b.amount : b), 0);
    
    const allEmergencyWithdrawals = (data.transactions || []).filter(t => t.category === 'Emergency Fund' && !t.isContribution).reduce((acc, t) => acc + t.amount, 0);
    const emergencyBalance = (data.emergency_deposits || 0) - allEmergencyWithdrawals;
    
    const totalGoalsBalance = (data.custom_goals || []).reduce((acc, g) => acc + (g.currentAmount || 0), 0);
    const totalPot = emergencyBalance + totalGoalsBalance;

    const realSpent = {};
    let savingsSpent = 0;
    let totalContributions = 0; 

    const goalCategories = (data.custom_goals || []).map(g => g.name);

    currentMonthTx.forEach(tx => {
       if (tx.category === 'Income') return; 
       if (tx.category === 'Bills') return;
       
       const isGoalWithdrawal = goalCategories.includes(tx.category) && !tx.isContribution;
       const isEmergWithdrawal = tx.category === 'Emergency Fund' && !tx.isContribution;

       if (isGoalWithdrawal || isEmergWithdrawal) return; 

       if (tx.isContribution) {
           totalContributions += tx.amount;
       }

       realSpent[tx.category] = (realSpent[tx.category] || 0) + tx.amount;
    });

    const investKey = data.categories.includes("Investments") ? "Investments" : "Savings & Investments";
    savingsSpent = realSpent[investKey] || 0;
    
    let totalRemainingAllocated = 0;
    Object.keys(data.allocations || {}).forEach(cat => {
        const amount = data.allocations[cat] || 0;
        const spent = realSpent[cat] || 0;
        const remaining = Math.max(0, amount - spent);
        totalRemainingAllocated += remaining;
    });

    const totalVariableSpending = currentMonthTx
        .filter(t => t.category !== 'Income' && !t.isContribution && t.category !== 'Bills')
        .reduce((a, b) => a + b.amount, 0);

    const unallocated = effective - billsTotal - totalRemainingAllocated - totalPot - totalVariableSpending;
    
    const totalAllocated = Object.values(data.allocations || {}).reduce((a, b) => a + b, 0);
    const savingsAllocated = data.allocations[investKey] || 0;
    const emergencyContributions = currentMonthTx.filter(t => t.category === 'Emergency Fund' && t.isContribution).reduce((acc, t) => acc + t.amount, 0);
    const emergencySpent = emergencyContributions; 
    const emergencyAllocated = data.allocations["Emergency Fund"] || 0;

    const totalAllocatedSpent = Object.values(realSpent).reduce((a, b) => a + b, 0);
    const totalSpent = (totalAllocatedSpent - totalContributions) + billsTotal;

    const totalInvestedAllTime = (data.transactions || [])
        .filter(t => t.category === 'Investments' || t.category === 'Savings & Investments')
        .reduce((acc, t) => acc + t.amount, 0);

    return { 
        effective, bills: billsTotal, allocatedRemaining: totalAllocated - totalAllocatedSpent, 
        totalSpent, savingsSpent, savingsAllocated, totalAllocated, totalAllocatedSpent, 
        emergencySpent, emergencyAllocated, emergencyBalance, totalInvestedAllTime, realSpent, 
        totalIncome, unallocated, totalPot, totalVariableSpending, prevMonth: prevMetrics 
    };
  }, [data]);

  return { data, loading, metrics };
}