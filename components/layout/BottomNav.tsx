'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Gamepad2, 
  Target, 
  ReceiptText,
  User,
  X,
  ChevronRight,
  CheckCircle2,
  Wallet,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBet } from '@/lib/bet-context';
import { usePlaceBet } from '@/lib/use-place-bet';
import { translateMarketName, translateOptionValue } from '@/lib/use-matches';

export default function BottomNav() {
  const { selections, totalOdds, clearSlip, removeSelection, isSlipOpen, openSlip, closeSlip } = useBet();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, openLogin, isLoginOpen, isRegisterOpen, user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [stake, setStake] = useState('');

  const { placeBet, isPlacing, error, success, clearError, clearSuccess } = usePlaceBet({
    onSuccess: () => {
      setOrderSuccess(true);
      setTimeout(() => {
        clearSlip();
        setStake('');
        setOrderSuccess(false);
        closeSlip();
      }, 3000);
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearError();
        clearSuccess();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearError, clearSuccess]);

  const potentialReturn = stake ? (parseFloat(stake) * totalOdds).toFixed(1) : '0.0';
  const stakeNum = parseFloat(stake) || 0;
  const insufficientBalance = user ? stakeNum > (user.balance ?? 0) : false;

  const navItems = [
    { name: 'Sports', icon: Target,      href: '/sports' },
    { name: 'Casino', icon: Gamepad2,    href: '/games' },
    ...( (!mounted || user?.role !== 'admin') ? [{ 
      name: 'Paris',   icon: ReceiptText, href: '/bets', action: () => {
        if (!mounted || !isAuthenticated) openLogin();
        else router.push('/bets');
      }
    }] : []),
    { 
      name: (mounted && user?.role === 'admin') ? 'Admin' : 'User', 
      icon: User, 
      href: (mounted && isAuthenticated) ? (user?.role === 'admin' ? '/admin' : '/dashboard') : null, 
      action: (!mounted || !isAuthenticated) ? openLogin : null 
    },
  ];

  if (isLoginOpen || isRegisterOpen || !mounted) return null;

  const handleNavClick = (item: { href: string | null; action?: (() => void) | null }) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-8 left-0 right-0 z-[100] px-6 flex justify-center pointer-events-none">
      
      {}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-[400px] animate-reveal pointer-events-auto">
           <div className={`bezel-shell p-0.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] shadow-red-500/20`}>
              <div className={`bezel-core backdrop-blur-3xl border p-4 rounded-2xl flex items-center space-x-4 bg-red-600/10 border-red-500/20 animate-shake`}>
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/20`}>
                    <X size={20} className="text-red-500" />
                 </div>
                 <div>
                    <p className={`text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1`}>Casanova Arena</p>
                    <p className="text-[11px] font-black text-white uppercase tracking-tighter">{error}</p>
                 </div>
              </div>
           </div>
        </div>
      )}


      <div className={`w-full max-w-[420px] bezel-shell p-1 shadow-[0_30px_60px_rgba(0,0,0,0.8)] pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-[3rem] ${isSlipOpen ? 'translate-y-[-20px]' : ''}`}>
         <div className={`bezel-core bg-[#000000] backdrop-blur-3xl flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-[calc(3rem-0.25rem)] ${isSlipOpen ? 'max-h-[80vh]' : selections.length > 0 ? 'max-h-[160px]' : 'max-h-[80px]'}`}>
            
            {}
            {isSlipOpen && (
               <div className="flex flex-col animate-reveal">
                  <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                     <div className="flex items-center space-x-3">
                        <Trophy size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Vérifier le Ticket</span>
                     </div>
                     <div className="flex items-center space-x-3">
                        {!orderSuccess && (
                          <button onClick={clearSlip} className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">
                            Effacer
                          </button>
                        )}
                        <button onClick={closeSlip} className="p-1 hover:bg-white/10 rounded-full">
                           <X size={20} className="text-gray-500" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-3 max-h-[35vh]">
                     {orderSuccess ? (
                        <div className="py-12 text-center animate-reveal">
                           <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                           <h4 className="text-xl font-black text-white uppercase tracking-tighter">Commande Envoyée !</h4>
                        </div>
                     ) : (
                        selections.map((sel) => (
                           <div key={sel.id} className={`rounded-2xl p-4 border flex items-center justify-between relative overflow-hidden ${sel.suspended ? 'border-red-500/30 bg-red-950/5' : 'bg-white/5 border-white/5'}`}>
                              {sel.suspended && (
                                <div className="absolute top-0 right-0 px-2 py-0.5 text-[6px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg">
                                  Suspendu
                                </div>
                              )}
                              <div className={`flex-1 min-w-0 pr-4 ${sel.suspended ? 'opacity-40' : ''}`}>
                                 <p className="text-[8px] font-black text-gray-600 uppercase mb-1 truncate">
                                   {typeof sel.league === 'object' ? (sel.league as { name?: string }).name : sel.league}
                                 </p>
                                 <h5 className="text-[11px] font-black text-white uppercase truncate">{sel.home} v {sel.away}</h5>
                                  <p className="text-[8px] font-black text-gray-500 uppercase mt-0.5">{translateMarketName(sel.marketName)}</p>
                                  <p className="text-[10px] font-black text-blue-500 uppercase mt-1">{translateOptionValue(sel.handicap ? `${sel.selectionLabel} ${sel.handicap}` : sel.selectionLabel)} @ {sel.odds.toFixed(2)}</p>
                              </div>
                              <button onClick={() => removeSelection(sel.id)} className="p-2 bg-white/5 rounded-lg z-10">
                                 <X size={12} className="text-gray-700" />
                              </button>
                           </div>
                        ))
                     )}
                  </div>

                  {!orderSuccess && (
                     <div className="p-6 bg-black/40 border-t border-white/5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-1">
                              <p className="text-[8px] font-black text-gray-700 uppercase mb-0.5">Cotes</p>
                              <p className="text-sm font-black text-white">{totalOdds.toFixed(2)}</p>
                           </div>
                           <div className="p-1">
                              <p className="text-[8px] font-black text-gray-700 uppercase mb-0.5">Gain</p>
                              <p className="text-sm font-black gold-text">{potentialReturn}</p>
                           </div>
                        </div>
                        <div className="relative">
                           <input 
                              type="number" 
                              placeholder="MISE" 
                              value={stake}
                              onChange={e => setStake(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl py-3 text-center text-xl font-black text-white focus:outline-none focus:border-blue-500" 
                           />
                           <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800" />
                        </div>
                        <button 
                           onClick={() => placeBet(stakeNum)}
                           disabled={isPlacing || stakeNum <= 0 || (isAuthenticated && insufficientBalance) || selections.some(s => s.suspended)}
                           className={`w-full py-4 rounded-full font-black text-xs text-white uppercase tracking-widest active:scale-95 transition-all shadow-lg ${
                             (isAuthenticated && insufficientBalance) || selections.some(s => s.suspended)
                               ? 'bg-blue-900/40 cursor-not-allowed opacity-60 border border-white/5' 
                               : 'bg-blue-600 shadow-blue-600/50'
                           }`}
                        >
                           {isPlacing ? 'Envoi...' : (isAuthenticated && insufficientBalance) ? 'Solde insuffisant' : selections.some(s => s.suspended) ? 'Sélection suspendue' : 'Confirmer la Commande'}
                        </button>
                     </div>
                  )}
               </div>
            )}
            
            {}
            {selections.length > 0 && !isSlipOpen && (
               <button 
                 onClick={openSlip}
                 className="w-full bg-[#000000] border-t border-white/10 p-4 flex items-center justify-between animate-reveal group active:bg-white/5 transition-colors"
               >
                  <div className="flex items-center space-x-3">
                     <div className="flex flex-col text-[7px] font-black text-gray-700 uppercase leading-none tracking-widest">
                        <span>Cotes</span>
                        <span>Totales</span>
                     </div>
                     <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-white tracking-tighter tabular-nums">{totalOdds.toFixed(2)}</span>
                        <span className="text-blue-500 font-black text-[9px]">X</span>
                     </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full shadow-[0_5px_15px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-transform">
                     <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Vérifier</span>
                     <ChevronRight size={14} className="text-white" />
                  </div>
               </button>
            )}

            {}
            <div className="flex items-center justify-around p-2 bg-[#000000]">
               {navItems.map((item) => {
                 const isActive = item.href ? pathname === item.href : false;
                 const Icon = item.icon;

                 return (
                   <button 
                     key={item.name} 
                     onClick={() => handleNavClick(item)}
                     className="outline-none relative group"
                   >
                      <div className={`
                         relative flex flex-col items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                         ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 hover:text-gray-300'}
                      `}>
                         <Icon size={18} />
                         <span className="text-[6px] font-black uppercase tracking-[0.1em] mt-1">{item.name}</span>
                      </div>
                   </button>
                 );
               })}
            </div>
         </div>
      </div>
    </nav>
  );
}
