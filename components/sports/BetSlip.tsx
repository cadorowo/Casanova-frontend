'use client';

import { useState, useEffect } from 'react';
import { useBet } from '@/lib/bet-context';
import { useAuth } from '@/lib/auth-context';
import { usePlaceBet } from '@/lib/use-place-bet';
import { translateOptionValue, translateMarketName } from '@/lib/use-matches';
import { 
  X, Trash2, Trophy, AlertTriangle, 
  CheckCircle2, ChevronRight,
  TrendingUp, TrendingDown,
  Wallet
} from 'lucide-react';

export default function BetSlip() {
  const { 
    selections, isSlipOpen, openSlip, closeSlip,
    removeSelection, clearSlip, totalOdds
  } = useBet();
  const { user, token } = useAuth();

  const [stake, setStake] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { placeBet, isPlacing, error, success, clearError, clearSuccess } = usePlaceBet({
    onSuccess: () => {
      setBetPlaced(true);
      clearSlip();
      setTimeout(() => {
        setStake('');
        setBetPlaced(false);
        closeSlip();
      }, 3000);
    }
  });

  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);

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

  if (!mounted || (selections.length === 0 && !betPlaced)) return null;

  return (
    <>
      {}
      {(error || success) && (
        <div className="hidden md:block fixed top-12 left-1/2 -translate-x-1/2 z-[300] w-full max-w-[450px] animate-reveal">
           <div className={`bezel-shell p-0.5 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] ${error ? 'shadow-red-500/20' : 'shadow-green-500/20'}`}>
              <div className={`bezel-core backdrop-blur-3xl border p-5 rounded-2xl flex items-center space-x-5 ${error ? 'bg-red-600/10 border-red-500/20 animate-shake' : 'bg-green-600/10 border-green-500/20'}`}>
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${error ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    {error ? <AlertTriangle size={24} className="text-red-500" /> : <CheckCircle2 size={24} className="text-green-500" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${error ? 'text-red-500' : 'text-green-500'}`}>Casanova Arena</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate">{error || success}</p>
                 </div>
                 <button onClick={() => { clearError(); clearSuccess(); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <X size={18} className="text-gray-600" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {}
      {isSlipOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] md:hidden transition-opacity duration-500"
          onClick={closeSlip}
        />
      )}

      {}
      {!isSlipOpen && selections.length > 0 && (
        <button 
          onClick={openSlip}
          className="hidden md:flex fixed bottom-6 right-6 z-[100] items-center space-x-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-full shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)] transition-all animate-reveal"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Vérifier le Ticket</span>
            <span className="text-sm font-black uppercase tracking-tight">{selections.length} Sélections</span>
          </div>
          <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
            <ChevronRight size={20} />
          </div>
        </button>
      )}

      {}
      <div className={`
        hidden md:block fixed z-[90] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        bottom-6 right-6 w-[380px]
        ${isSlipOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}
      `}>
        <div className="mx-auto max-w-[500px] md:max-w-none">
          <div className="bezel-shell p-0.5 !rounded-t-[2.5rem] !rounded-b-none md:!rounded-b-[2.5rem]">
            <div className="bezel-core bg-[#050505] rounded-t-[2.5rem] md:rounded-b-[2.5rem] flex flex-col max-h-[85vh] md:max-h-[700px] overflow-hidden">
            
            {}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-2 md:hidden" />

            {}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                  <Trophy size={18} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Éditeur de Paris</h3>
                  <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">{selections.length} Sélections Actives</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={clearSlip} className="p-2.5 hover:bg-red-500/10 rounded-xl group transition-all">
                  <Trash2 size={18} className="text-gray-600 group-hover:text-red-500" />
                </button>
                <button onClick={closeSlip} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                  <X size={22} className="text-gray-600" />
                </button>
              </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3 min-h-[200px]">
              {betPlaced ? (
                <div className="py-20 text-center animate-reveal">
                  <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">Commande Envoyée</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em]">Attente de règlement</p>
                </div>
              ) : (
                selections.map((sel) => (
                  <div key={sel.id} className={`bg-white/[0.02] hover:bg-white/[0.04] rounded-[1.5rem] p-5 border relative overflow-hidden group transition-all ${sel.suspended ? 'border-red-500/30 bg-red-950/5' : 'border-white/5'}`}>
                    {sel.suspended ? (
                      <div className="absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg">
                        Suspendu
                      </div>
                    ) : sel.oddsChangeType ? (
                      <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest ${sel.oddsChangeType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {sel.oddsChangeType === 'up' ? 'Cote en hausse' : 'Cote en baisse'}
                      </div>
                    ) : null}
                    
                    <div className={`flex justify-between items-start mb-3 ${sel.suspended ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1 h-1 rounded-full bg-blue-600" />
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest truncate">
                            {typeof sel.league === 'object' ? (sel.league as { name?: string }).name : sel.league}
                          </p>
                        </div>
                        <h5 className="text-[13px] font-black text-white uppercase tracking-tight truncate">{sel.home} v {sel.away}</h5>
                      </div>
                      <button onClick={() => removeSelection(sel.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                        <X size={14} className="text-gray-700" />
                      </button>
                    </div>

                    <div className={`flex justify-between items-end ${sel.suspended ? 'opacity-40' : ''}`}>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                          {translateMarketName(sel.marketName)}
                        </p>
                        <p className="text-xs font-black text-blue-400 uppercase tracking-tight">
                          {translateOptionValue(sel.handicap ? `${sel.selectionLabel} ${sel.handicap}` : sel.selectionLabel)} <span className="text-blue-500/50 ml-1">@ {sel.odds.toFixed(2)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {sel.prevOdds && (
                          <p className="text-[10px] text-gray-700 line-through font-black mb-0.5">{sel.prevOdds.toFixed(2)}</p>
                        )}
                        <div className={`flex items-center space-x-1 text-xl font-black tabular-nums ${sel.oddsChangeType === 'up' ? 'text-green-400' : sel.oddsChangeType === 'down' ? 'text-red-400' : 'text-white'}`}>
                          {sel.oddsChangeType === 'up' ? <TrendingUp size={14} /> : sel.oddsChangeType === 'down' ? <TrendingDown size={14} /> : null}
                          <span>{sel.odds.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {}
            {!betPlaced && (
              <div className="p-8 border-t border-white/5 bg-black/40 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 flex flex-col justify-center">
                     <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Cotes Totales</p>
                     <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{totalOdds.toFixed(2)}</p>
                  </div>
                  <div className="p-4 flex flex-col justify-center">
                     <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Gain Potentiel</p>
                     <p className="text-2xl font-black gold-text tabular-nums tracking-tighter">{potentialReturn}</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-blue-500 transition-colors">
                    <Wallet size={18} />
                  </div>
                  <input
                    type="number"
                    placeholder="ENTRER LA MISE"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl py-5 px-16 text-center text-2xl font-black text-white placeholder:text-gray-900 focus:border-blue-500/50 transition-all focus:outline-none tracking-tighter"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-800 uppercase tracking-widest">
                    TND
                  </div>
                </div>

                <button
                  disabled={isPlacing || stakeNum <= 0 || !token || insufficientBalance || selections.some(s => s.suspended)}
                  onClick={() => placeBet(stakeNum)}
                  className={`
                    group w-full py-5 rounded-full font-black text-[12px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] flex items-center justify-between pl-12 pr-4
                    ${isPlacing || stakeNum <= 0 || !token || insufficientBalance || selections.some(s => s.suspended)
                      ? 'bg-gray-900 text-gray-700 cursor-not-allowed opacity-50' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)]'}
                  `}
                >
                  {isPlacing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <span>{insufficientBalance ? 'Solde Insuffisant' : selections.some(s => s.suspended) ? 'Sélection Suspendue' : 'Confirmer la Commande'}</span>
                      <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <ChevronRight size={24} />
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
