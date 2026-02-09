import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Settings, PieChart, Target, Briefcase, 
  ShieldCheck, User, Crown, Receipt, PiggyBank, 
  ClipboardList, Sparkles, Wallet, Brain, PlusCircle
} from 'lucide-react';

import { 
  signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { auth, db, appId } from './services/firebase';

import NavButton from './components/ui/NavButton';
import HomeView from './components/views/HomeView';
import DailyLoggingView from './components/views/DailyLoggingView';
import PlanningView from './components/views/PlanningView';
import SavingsView from './components/views/planning/SavingsView';
import SettingsView from './components/views/SettingsView';
import HelpTip from './components/ui/HelpTip';

import { useBudget } from './hooks/useBudget';
import { TRANSLATIONS } from './utils/constants';

// --- Onboarding Component ---
function OnboardingOverlay({ onComplete }) {
    const [step, setStep] = useState(0);
    
    const getPosition = (s) => {
        if (s === 1) return "top-24 left-6"; // Point to Income Pot
        if (s === 2) return "bottom-20 left-20"; // Point to Plan Tab
        if (s === 3) return "bottom-24 left-1/2 -translate-x-1/2"; // Point to Log Button
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"; // Center
    };

    const steps = [
        { title: "Welcome to BudgetAi! 🚀", text: "Your smart financial companion. Let's take a quick 30s tour to get you set up.", icon: Sparkles },
        { title: "Income Pot 💰", text: "This is your starting point. We automatically subtract your fixed bills from your income. The amount shown here is what you actually have left to spend or save.", icon: Wallet },
        { title: "Smart Planning 🧠", text: "Tap 'Plan' to distribute your money. Use the 'Budget' tab to allocate cash to categories like Groceries. If you're stuck, our AI can write a budget for you!", icon: Brain },
        { title: "Quick Logging 📝", text: "Hit this big '+' button anytime you spend money. Select a category, enter the amount, and we'll track it against your budget instantly.", icon: PlusCircle },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm transition-all duration-500">
            {step > 0 && (
                <div className={`absolute w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse transition-all duration-500 ${getPosition(step)}`} />
            )}
            <div className={`absolute bg-white w-[90%] max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden transition-all duration-500 ${step === 0 ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : getPosition(step).includes('bottom') ? 'top-1/4 left-1/2 -translate-x-1/2' : 'bottom-1/4 left-1/2 -translate-x-1/2'}`}>
                <div className="flex flex-col items-center text-center">
                    {React.createElement(steps[step].icon, { size: 48, className: "text-blue-600 mb-4" })}
                    <h2 className="text-xl font-black text-slate-900 mb-2">{steps[step].title}</h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{steps[step].text}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onComplete} className="flex-1 text-slate-400 font-bold text-xs py-3">Skip Tour</button>
                        <button onClick={() => { if (step < steps.length - 1) setStep(step + 1); else onComplete(); }}
                            className="flex-[2] bg-slate-900 text-white py-3 rounded-2xl font-bold text-xs shadow-xl active:scale-95 transition-all">
                            {step === steps.length - 1 ? "Get Started" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [notification, setNotification] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const { data, metrics, loading } = useBudget(user);

  useEffect(() => {
      if (data && data.onboarding_complete === false) {
          setShowOnboarding(true);
      }
  }, [data]);

  const handleOnboardingComplete = async () => {
      setShowOnboarding(false);
      if (user) {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budgetData');
          await updateDoc(docRef, { onboarding_complete: true });
      }
  };

  const showNotify = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const t = (key) => {
      const lang = data?.user_settings?.language || 'en';
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
    </div>
  );

  const monthName = new Date().toLocaleString(data?.user_settings?.language === 'zh' ? 'zh-CN' : 'default', { month: 'short' }).toUpperCase();
  const dayNum = new Date().getDate();
  const currency = data?.user_settings?.currency || '£';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-32 max-w-xl mx-auto overflow-x-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}

      {activeTab !== 'settings' && (
        <header className="px-6 pt-12 pb-8">
        <div className="flex flex-col items-center mb-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                {monthName} {dayNum} • {t('available')}
                <HelpTip title="Available Balance" text="This is your total income minus fixed bills, savings, and what you've already spent." />
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {currency}{(metrics?.effective || 0).toLocaleString()}
                </span>
            </div>
             <div className={`mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border shadow-sm bg-white`}>
                <span className={`w-2 h-2 rounded-full ${metrics?.unallocated < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                <span className="text-xs font-bold text-slate-600">
                    {metrics?.unallocated >= 0 ? '+' : ''}{currency}{(metrics?.unallocated || 0).toLocaleString()} unallocated
                </span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-50">
                 {(metrics?.totalInvestedAllTime || 0) >= 10000 ? <Crown size={16} className="text-yellow-500 fill-yellow-500"/> : 
                  (metrics?.totalInvestedAllTime || 0) >= 1000 ? <User size={16} className="text-blue-500 fill-blue-500"/> : 
                  <Target size={16} className="text-emerald-500"/>}
             </div>
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><Briefcase size={20}/></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Invested</p>
                <p className="text-lg font-black text-slate-900 leading-none mb-1">{currency}{(metrics?.totalInvestedAllTime || 0).toLocaleString()}</p>
                <p className="text-[9px] font-bold text-emerald-600 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                    {(metrics?.totalInvestedAllTime || 0) >= 10000 ? 'Level: Pro 🏆' : (metrics?.totalInvestedAllTime || 0) >= 1000 ? 'Level: Saver 🌟' : 'Level: Starter 🌱'}
                </p>
             </div>
          </div>
    
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-32">
             <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2"><Receipt size={20}/></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('fixedBills')}</p>
                <p className="text-lg font-black text-slate-900 leading-none">{currency}{(metrics?.bills || 0).toLocaleString()}</p>
             </div>
          </div>
    
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-32">
             <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2"><ShieldCheck size={20}/></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emerg. Balance</p>
                <p className="text-lg font-black text-slate-900 leading-none mb-1">{currency}{(metrics?.emergencyBalance || 0).toLocaleString()}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                   <div className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, ((metrics?.emergencyBalance || 0) / (data?.emergency_target || 1)) * 100))}%` }}></div>
                </div>
             </div>
          </div>
    
          <div className="bg-slate-900 rounded-3xl p-5 shadow-lg shadow-slate-200 flex flex-col justify-between h-32">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white mb-2"><PieChart size={16}/></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-xl font-black text-white leading-none mb-2">{currency}{(metrics?.allocatedRemaining || 0).toLocaleString()}</p>
                
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, ((metrics?.allocatedRemaining || 0) / (metrics?.totalAllocated || 1)) * 100))}%` }}></div>
                </div>

                <div className="flex justify-between text-[8px] font-bold text-slate-400">
                   <span>{currency}{(metrics?.totalAllocatedSpent || 0)} spent</span>
                   <span>of {currency}{(metrics?.totalAllocated || 0).toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>
        </header>
      )}

      <main className="px-6">
        {activeTab === 'home' && <HomeView data={data} metrics={metrics} t={t} />}
        {activeTab === 'daily' && <DailyLoggingView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
        {activeTab === 'planning' && <PlanningView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
        {activeTab === 'savings' && <SavingsView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
        {activeTab === 'settings' && <SettingsView data={data} user={user} showNotify={showNotify} metrics={metrics} t={t} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass border border-white/50 flex justify-around items-end pb-2 z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-2">
        <NavButton active={activeTab === 'home'} icon={Home} label={t('home')} onClick={() => setActiveTab('home')} />
        <NavButton active={activeTab === 'savings'} icon={PiggyBank} label={t('savings')} onClick={() => setActiveTab('savings')} />
        <NavButton active={activeTab === 'daily'} icon={Plus} isMain onClick={() => setActiveTab('daily')} />
        <NavButton active={activeTab === 'planning'} icon={ClipboardList} label={t('plan')} onClick={() => setActiveTab('planning')} />
        <NavButton active={activeTab === 'settings'} icon={Settings} label={t('settings')} onClick={() => setActiveTab('settings')} />
      </nav>

      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 ${notification.isError ? 'bg-rose-600' : 'bg-slate-900'} text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 z-[100] w-[85%] animate-in slide-in-from-top-4`}>
          <span className="font-bold text-sm">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}