'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeft, 
  ArrowUpRight,
  Target,
  Gamepad2,
  Plus,
  ReceiptText,
  ArrowDown,
  History,
  Check,
  XCircle
} from 'lucide-react';

import { api } from '@/lib/api';
import { User } from '@/types';

interface FinancialLog {
  referenceId?: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

function AdminCreditsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  
  const { user, token, isAuthenticated, refreshBalance } = useAuth();
  const [searchPhone, setSearchPhone] = useState(phoneParam || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerLogs, setPlayerLogs] = useState<FinancialLog[]>([]);
  const [playerBets, setPlayerBets] = useState<Record<string, { _id?: string; status?: string; payout?: number }>>({});
  const [isLoadingPlayerLogs, setIsLoadingPlayerLogs] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [flowPage, setFlowPage] = useState(1);
  const [gamePage, setGamePage] = useState(1);
  const [timeRange, setTimeRange] = useState('7d');
  const targetPlayer = allUsers.find(u => u.phone === searchPhone);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const amountValue = Number.parseFloat(transferAmount);
  const requestedAmount = Number.isFinite(amountValue) ? Math.abs(amountValue) : 0;
  const hasValidAmount = requestedAmount > 0;
  const canDepositFromMaster = hasValidAmount && (user?.adminWallet || 0) >= requestedAmount;
  const canWithdrawFromPlayer = hasValidAmount && !!targetPlayer && targetPlayer.balance >= requestedAmount;

  const fetchPlayerLogs = useCallback(async (phone: string) => {
    if (!token || !phone) return;
    setIsLoadingPlayerLogs(true);
    const days = parseInt(timeRange.replace('d', '')) || 7;
    try {
      const [data, betsRes] = await Promise.all([
        api.admin.getUserActivity(token, phone, days),
        api.admin.getUserBets(token, phone, days)
      ]);
      setPlayerLogs(data);
      const betsArr = betsRes?.success && betsRes?.data ? betsRes.data : betsRes;
      if (Array.isArray(betsArr)) {
        const betsMap: Record<string, { _id?: string; status?: string; payout?: number }> = {};
        betsArr.forEach((b: { _id?: string; status?: string; payout?: number }) => {
          if (b._id) {
            betsMap[String(b._id)] = b;
          }
        });
        setPlayerBets(betsMap);
      }
    } catch (err) {
      console.error('Failed to fetch player logs', err);
    } finally {
      setIsLoadingPlayerLogs(false);
    }
  }, [token, timeRange]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.admin.getUsers(token, searchPhone);
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, [token, searchPhone]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (phoneParam) {
      t = setTimeout(() => {
        setSearchPhone(phoneParam);
        fetchPlayerLogs(phoneParam);
        setFlowPage(1);
        setGamePage(1);
      }, 0);
    }
    return () => { if (t) clearTimeout(t); };
  }, [phoneParam, fetchPlayerLogs]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
    const t = setTimeout(() => fetchUsers(), 0);
    return () => { if (t) clearTimeout(t); };
  }, [isAuthenticated, user, router, fetchUsers]);

  const handleTransfer = async (e: React.MouseEvent | React.FormEvent, isWithdraw: boolean = false) => {
    e.preventDefault();
    if (!token || !transferAmount || !searchPhone) return;
    if (!hasValidAmount) return;
    if (!isWithdraw && !canDepositFromMaster) return;
    if (isWithdraw && !canWithdrawFromPlayer) return;
    setIsProcessing(true);
    try {
      const amount = requestedAmount;
      const res = await api.admin.adminTransfer(token, {
        targetPhone: searchPhone,
        amount,
        isWithdraw
      });
      
      setFeedback({ message: isWithdraw ? 'Retrait réussi ✓' : 'Dépôt réussi ✓', type: 'success' });
      void res;
      setTransferAmount('');
      refreshBalance();
      fetchUsers();
      if (searchPhone) fetchPlayerLogs(searchPhone);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec du transfert';
      setFeedback({ message, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#000000] animate-reveal">
      <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-32">

        {}
        <Link href="/admin" className="inline-flex items-center space-x-2 text-gray-500 hover:text-white mb-10 group transition-colors">
          <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Retour au Centre de Commande</span>
        </Link>

        {}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <h1 className="text-xl font-black text-white uppercase tracking-widest">
              Gestion de la <span className="gold-text">Voûte</span>
            </h1>
          </div>
        </div>

        {}
        {feedback && (
          <div className={`mb-8 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-reveal ${
            feedback.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {feedback.message}
          </div>
        )}

        {}
        <div className="bezel-shell p-1 shadow-2xl mb-8">
          <div className="bezel-core bg-black rounded-[var(--cassanova-radius)] overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 items-stretch">
              <div className="xl:col-span-12 order-2 border-t border-white/5">

            {}
            <div className="p-6 md:p-10 border-b border-white/5">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] block mb-4">
                Montant (TND)
              </label>

              {}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[10, 20, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTransferAmount(val.toString())}
                    className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-150 border ${
                      transferAmount === val.toString()
                        ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                        : 'bg-white/[0.03] border-white/8 text-gray-500 hover:text-white hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl flex items-center px-6 py-4 focus-within:border-blue-600/40 transition-colors">
                <span className="text-gray-700 font-black text-2xl mr-3 select-none">TND</span>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  step="0.1"
                  min="0"
                  value={transferAmount}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .replace(',', '.')
                      .replace(/[^0-9.]/g, '')
                      .replace(/(\..*)\./g, '$1');
                    setTransferAmount(cleaned);
                  }}
                  placeholder="0.0"
                  className="bg-transparent border-none w-full text-4xl font-black text-white focus:outline-none placeholder:text-gray-800 tabular-nums"
                />
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-4">

              {}
              <button
                type="button"
                disabled={isProcessing || !hasValidAmount || !searchPhone || !canDepositFromMaster}
                onClick={(e) => handleTransfer(e, false)}
                className="group bg-purple-600 text-black pl-6 pr-1.5 py-1.5 flex items-center justify-between min-w-0 min-h-[44px] md:min-h-[60px] md:pl-8 md:pr-2 shadow-2xl shadow-purple-600/20 rounded-full transition-all duration-500 active:scale-[0.95] disabled:opacity-30 disabled:pointer-events-none border border-purple-500/20"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-black uppercase text-[10px] md:text-xs tracking-wider truncate">Déposer</span>
                  {transferAmount && parseFloat(transferAmount) > 0 && (
                    <span className="text-black/70 font-black text-xs tabular-nums shrink-0">
                      +{parseFloat(transferAmount).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0 ml-4">
                  {isProcessing
                    ? <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    : <Plus size={18} className="text-black" />
                  }
                </div>
              </button>

              {}
              <button
                type="button"
                disabled={isProcessing || !hasValidAmount || !searchPhone || !canWithdrawFromPlayer}
                onClick={(e) => handleTransfer(e, true)}
                className="group bg-gray-500 text-black pl-6 pr-1.5 py-1.5 flex items-center justify-between min-w-0 min-h-[44px] md:min-h-[60px] md:pl-8 md:pr-2 shadow-2xl shadow-gray-500/20 rounded-full transition-all duration-500 active:scale-[0.95] disabled:opacity-30 disabled:pointer-events-none border border-gray-400/20"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-black uppercase text-[10px] md:text-xs tracking-wider truncate">Retirer</span>
                  {transferAmount && parseFloat(transferAmount) > 0 && (
                    <span className="text-black/70 font-black text-xs tabular-nums shrink-0">
                      -{parseFloat(transferAmount).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0 ml-4">
                  {isProcessing
                    ? <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    : <ArrowDown size={18} className="text-black" />
                  }
                </div>
              </button>

            </div>
              </div>

              <div className="xl:col-span-12 order-1">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center space-x-3">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">
                    Joueur {searchPhone || ''}
                  </h2>
                </div>

                <div className="p-4 md:p-5 flex flex-col">
                  <div className="rounded-2xl border border-white/5 bg-transparent p-4">
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">
                      Crédit Joueur
                    </div>
                    {targetPlayer ? (
                      <div className="text-3xl font-black text-white tracking-tight leading-none">
                        {targetPlayer.balance.toFixed(1)} <span className="text-[11px] opacity-50 uppercase">TND</span>
                      </div>
                    ) : (
                      <div className="text-sm font-black text-gray-500 uppercase tracking-wider">
                        Aucun joueur sélectionné
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The shared Période filter has been moved into the container headers below */}

        {}
        {(() => {
          const flowLogs = playerLogs.filter(log =>
            ['deposit', 'withdrawal', 'admin_transfer', 'admin_transfer_receive', 'admin_transfer_withdraw'].includes(log.type)
          );
          const itemsPerPage = 10;
          const totalFlowPages = Math.ceil(flowLogs.length / itemsPerPage);
          const safeFlowPage = Math.min(flowPage, Math.max(totalFlowPages, 1));
          const startIndex = (safeFlowPage - 1) * itemsPerPage;
          const paginatedFlowLogs = flowLogs.slice(startIndex, startIndex + itemsPerPage);
          return (
            <div className="bezel-shell p-0.5 mb-6">
              <div className="bezel-core bg-black flex flex-col">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-sm font-black text-white uppercase tracking-tighter">Dépôts & Retraits</h2>
                    {flowLogs.length > 0 && (
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        {flowLogs.length} opérations
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <span className="hidden sm:inline text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                    <div className="flex gap-1.5">
                      {[
                        { value: '7d', label: '7 Jours' },
                        { value: '15d', label: '15 Jours' },
                        { value: '30d', label: '30 Jours' }
                      ].map((timeTab) => (
                        <button
                          key={timeTab.value}
                          onClick={() => {
                            setTimeRange(timeTab.value);
                            setFlowPage(1);
                            setGamePage(1);
                          }}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                            timeRange === timeTab.value
                              ? 'bg-blue-600/15 border border-blue-600/40 text-blue-500'
                              : 'bg-white/5 border border-white/5 text-gray-600 hover:text-white'
                          }`}
                        >
                          {timeTab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 flex flex-col">
                  {isLoadingPlayerLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : flowLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center opacity-20 py-12">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucun Flux</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 md:space-y-2 md:max-h-[520px] md:overflow-y-auto custom-scrollbar pr-1 md:pr-2">
                        {paginatedFlowLogs.map((log, i) => {
                        const isDeposit = log.type === 'deposit' || log.type === 'admin_transfer' || log.type === 'admin_transfer_receive';
                        const Icon = isDeposit ? Plus : ArrowDown;
                        const iconBg = isDeposit ? 'bg-purple-600' : 'bg-gray-500';
                        const iconColor = 'text-black';
                        const label = isDeposit ? 'Dépôt' : 'Retrait';
                        const amountSign = isDeposit ? '+' : '-';
                        const amountColor = 'text-white';
                        const statusColor =
                          log.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          log.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
                        const displayStatus =
                          log.status === 'completed' ? 'APPROUVÉ' :
                          log.status === 'failed' ? 'REJETÉ' :
                          log.status === 'pending' ? 'ATTENTE' :
                          String(log.status || '').toUpperCase();
                        return (
                          <div key={`${log.createdAt}-${i}`} className="cassanova-row-slim min-h-[60px] md:min-h-0 group mb-1 last:mb-0 py-2 md:py-1">
                             <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${iconBg} border border-white/5 ${iconColor}`}>
                                   <Icon size={12} />
                                </div>
                                
                                <div className="flex flex-1 min-w-0 items-center justify-between md:justify-start pr-2">
                                   <div className="flex flex-col md:flex-row md:items-center min-w-0 flex-1 gap-1 md:gap-0">
                                      <div className="md:w-[200px] flex items-center space-x-2 min-w-0 shrink-0">
                                         <span className="text-sm md:text-base font-black uppercase tracking-tighter truncate text-gray-500 md:text-white">
                                            {label}
                                         </span>
                                      </div>
                                      
                                      <div className={`md:hidden text-base font-black tracking-tighter ${amountColor}`}>
                                         {amountSign}{log.amount.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                      </div>
                                      
                                      <div className="hidden md:flex items-center flex-1">
                                         <div className="md:w-[150px] flex items-center space-x-2 shrink-0">
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                               {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                               {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                         </div>
                                         <div className={`flex-1 text-right text-base font-black tracking-tighter whitespace-nowrap pr-4 ${amountColor}`}>
                                            {amountSign}{log.amount.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                         </div>
                                      </div>
                                   </div>
                                   
                                   <div className="md:hidden flex flex-col items-end space-y-0.5 shrink-0 mr-3">
                                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                         {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                         {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                   </div>

                                   <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 shrink-0 ${statusColor}`}>
                                      <div className={`w-1 h-1 rounded-full animate-pulse ${
                                        log.status === 'completed' ? 'bg-green-500' :
                                        log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`} />
                                      {log.status === 'pending' && <History size={8} className="md:hidden" />}
                                      {(log.status === 'completed' || log.status === 'won') && <Check size={8} className="md:hidden" />}
                                      {(log.status === 'failed' || log.status === 'rejected') && <XCircle size={8} className="md:hidden" />}
                                      <span className="hidden md:inline">{displayStatus}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                        })}
                      </div>

                      {totalFlowPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 shrink-0">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                            Page {safeFlowPage} sur {totalFlowPages}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setFlowPage(prev => Math.max(prev - 1, 1))}
                              disabled={safeFlowPage === 1}
                              className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                            >
                              ← Précédent
                            </button>
                            <button
                              onClick={() => setFlowPage(prev => Math.min(prev + 1, totalFlowPages))}
                              disabled={safeFlowPage === totalFlowPages}
                              className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                            >
                              Suivant →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {}
        {(() => {
          const gameLogs = playerLogs.filter(log =>
            ['bet', 'win', 'casino_bet', 'casino_win'].includes(log.type)
          );
          type AggregatedPlay = {
            key: string;
            kind: 'sport' | 'casino';
            stake: number;
            win: number;
            createdAt: string;
          };

          const extractPlayKey = (log: FinancialLog, idx: number) => {
            if (log.referenceId) return log.referenceId;
            const betIdMatch = log.description?.match(/Bet\s+([a-f0-9]{24})/i);
            if (betIdMatch?.[1]) return betIdMatch[1];
            const roundIdMatch = log.description?.match(/round\s+([^\s\)]+)/i);
            if (roundIdMatch?.[1]) return `round:${roundIdMatch[1]}`;
            return `fallback:${log.createdAt}:${idx}`;
          };

          const byKey = new Map<string, AggregatedPlay>();
          gameLogs.forEach((log, idx) => {
            const key = extractPlayKey(log, idx);
            const isStake = log.type === 'bet' || log.type === 'casino_bet';
            const kind: 'sport' | 'casino' = (log.type === 'casino_bet' || log.type === 'casino_win') ? 'casino' : 'sport';
            const existing = byKey.get(key);
            if (!existing) {
              byKey.set(key, {
                key,
                kind,
                stake: isStake ? Number(log.amount || 0) : 0,
                win: isStake ? 0 : Number(log.amount || 0),
                createdAt: log.createdAt
              });
              return;
            }
            if (isStake) existing.stake += Number(log.amount || 0);
            else existing.win += Number(log.amount || 0);
            if (new Date(log.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
              existing.createdAt = log.createdAt;
            }
          });

          let plays = Array.from(byKey.values());

          const orphanWins = plays.filter(p => p.win > 0 && p.stake === 0);
          const unmatchedStakes = plays.filter(p => p.stake > 0 && p.win === 0);

          orphanWins.forEach(orphan => {
            const orphanTs = new Date(orphan.createdAt).getTime();
            let bestIdx = -1;
            let bestDelta = Number.POSITIVE_INFINITY;

            unmatchedStakes.forEach((candidate, idx) => {
              if (candidate.kind !== orphan.kind) return;
              const candidateTs = new Date(candidate.createdAt).getTime();
              if (candidateTs > orphanTs) return; 
              const delta = orphanTs - candidateTs;
              if (delta < bestDelta) {
                bestDelta = delta;
                bestIdx = idx;
              }
            });

            if (bestIdx >= 0 && bestDelta <= 24 * 60 * 60 * 1000) {
              const picked = unmatchedStakes[bestIdx];
              orphan.stake = picked.stake;
              picked.stake = 0;
              picked.win = 0;
            }
          });

          plays = plays
            .filter(p => !(p.stake === 0 && p.win === 0))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const itemsPerPage = 5;
          const totalGamePages = Math.ceil(plays.length / itemsPerPage);
          const safeGamePage = Math.min(gamePage, Math.max(totalGamePages, 1));
          const startIndex = (safeGamePage - 1) * itemsPerPage;
          const paginatedGameLogs = plays.slice(startIndex, startIndex + itemsPerPage).map(play => {
            const betObj = playerBets[play.key];
            const realStatus = betObj?.status?.toLowerCase();
            const derivedStatus = realStatus ||
              (play.win > 0 ? 'won' : play.stake > 0 ? 'pending' : 'lost');
            return {
              type: play.kind === 'casino' ? (play.win > 0 ? 'casino_win' : 'casino_bet') : (play.win > 0 ? 'win' : 'bet'),
              status: derivedStatus,
              amount: play.win > 0 ? play.win : play.stake,
              createdAt: play.createdAt,
              stake: play.stake,
              win: play.win,
              payout: betObj?.payout,
            };
          });

          return (
            <div className="bezel-shell p-0.5">
              <div className="bezel-core bg-black flex flex-col">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-sm font-black text-white uppercase tracking-tighter">Historique des Paris</h2>
                    {plays.length > 0 && (
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        {plays.length} paris
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <span className="hidden sm:inline text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                    <div className="flex gap-1.5">
                      {[
                        { value: '7d', label: '7 Jours' },
                        { value: '15d', label: '15 Jours' },
                        { value: '30d', label: '30 Jours' }
                      ].map((timeTab) => (
                        <button
                          key={timeTab.value}
                          onClick={() => {
                            setTimeRange(timeTab.value);
                            setFlowPage(1);
                            setGamePage(1);
                          }}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                            timeRange === timeTab.value
                              ? 'bg-blue-600/15 border border-blue-600/40 text-blue-500'
                              : 'bg-white/5 border border-white/5 text-gray-600 hover:text-white'
                          }`}
                        >
                          {timeTab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 flex flex-col">
                  {isLoadingPlayerLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : plays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center opacity-20 py-12">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucune Giocata</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 md:max-h-[520px] md:overflow-y-auto custom-scrollbar pr-2">
                        {paginatedGameLogs.map((log, i) => {
                        const isCasino = log.type === 'casino_bet' || log.type === 'casino_win';
                        const Icon = isCasino ? Gamepad2 : ReceiptText;
                        const iconBg = isCasino ? 'bg-[#d3a936]' : 'bg-white/5';
                        const iconColor = isCasino ? 'text-black' : 'text-gray-400';
                        const amountColor = 'text-white';
                        const label = isCasino ? 'PARI CASINO' : 'PARI SPORTIF';
                        const stake = Number((log as Record<string, unknown>).stake ?? ((log.type === 'bet' || log.type === 'casino_bet') ? log.amount : 0));
                        const gain = Number((log as Record<string, unknown>).payout ?? ((log as Record<string, unknown>).win ?? ((log.type === 'win' || log.type === 'casino_win') ? log.amount : 0)));
                        const hasStake = stake > 0;
                        const valueLabel = 'GAIN';
                        const displayStatus =
                          log.status === 'won' ? 'GAGNE' :
                          log.status === 'lost' ? 'PERDU' :
                          log.status === 'failed' ? 'ANNULE' :
                          log.status === 'completed' ? ((log.type === 'bet' || log.type === 'casino_bet') ? 'PLACE' : 'PAYE') :
                          log.status === 'pending' ? 'ATTENTE' :
                          String(log.status || '').toUpperCase();
                        const statusColor =
                          (displayStatus === 'GAGNE' || displayStatus === 'PLACE' || displayStatus === 'PAYE')
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : (displayStatus === 'PERDU' || displayStatus === 'ANNULE')
                              ? 'bg-red-500/10 border-red-500/20 text-red-500'
                              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';

                        return (
                          <div key={`${log.createdAt}-${i}`} className="cassanova-row-slim min-h-[60px] md:min-h-0 group mb-1 last:mb-0 py-2 md:py-1">
                             <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded flex items-center justify-center shrink-0 ${iconBg} border border-white/5 ${iconColor}`}>
                                   <Icon size={12} className="md:w-4 md:h-4" />
                                </div>
                                
                                <div className="flex flex-1 min-w-0 items-center justify-between md:justify-start pr-2">
                                   <div className="flex flex-col md:flex-row md:items-center min-w-0 flex-1 gap-1 md:gap-0">
                                      
                                      {/* LABEL (Left on Desktop, Top on Mobile) */}
                                      <div className="md:w-[200px] flex items-center min-w-0 shrink-0">
                                         <span className="text-sm md:text-base font-black uppercase tracking-tighter truncate text-white">
                                            {label}
                                         </span>
                                      </div>

                                      {/* MISE AND DATE (Middle on Desktop, Bottom on Mobile) */}
                                      <div className="md:w-[280px] flex items-center space-x-2 min-w-0 shrink-0">
                                         <div className="hidden md:block text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            MISE: <span className="text-gray-300">{hasStake ? `${stake.toFixed(1)} TND` : 'N/D'}</span>
                                         </div>
                                         <div className="flex items-center space-x-2">
                                            <div className="hidden md:block w-px h-3 bg-white/10" />
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                               {new Date(log.createdAt).toLocaleDateString('fr-FR')} • {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                         </div>
                                      </div>
                                      
                                      {/* GAIN (Right on Desktop) */}
                                      <div className="hidden md:flex flex-col items-end flex-1 pr-4">
                                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{valueLabel}</span>
                                         <div className="text-right text-base md:text-xl font-black tracking-tighter whitespace-nowrap text-white leading-none">
                                            {gain > 0 ? '+' : ''}{gain.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                         </div>
                                      </div>
                                      
                                   </div>
                                   
                                   <div className="md:hidden flex flex-col items-end justify-center shrink-0 mr-3 gap-1">
                                      <div className="text-right text-[10px] font-black tracking-tighter whitespace-nowrap text-gray-400 leading-none">
                                         {hasStake ? `${stake.toFixed(1)} TND` : 'N/D'}
                                      </div>
                                      <div className="text-right text-[10px] font-black tracking-tighter whitespace-nowrap text-white leading-none">
                                         {gain > 0 ? '+' : ''}{gain.toFixed(1)} <span className="text-[8px] opacity-40 text-white uppercase">TND</span>
                                      </div>
                                   </div>

                                   <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 shrink-0 ${statusColor}`}>
                                      <div className={`w-1 h-1 rounded-full animate-pulse ${
                                        (displayStatus === 'GAGNE' || displayStatus === 'PLACE' || displayStatus === 'PAYE') ? 'bg-green-500' :
                                        (displayStatus === 'PERDU' || displayStatus === 'ANNULE') ? 'bg-red-500' : 'bg-yellow-500'
                                      }`} />
                                      {displayStatus === 'ATTENTE' && <History size={8} className="md:hidden" />}
                                      {(displayStatus === 'GAGNE' || displayStatus === 'PLACE' || displayStatus === 'PAYE') && <Check size={8} className="md:hidden" />}
                                      {(displayStatus === 'PERDU' || displayStatus === 'ANNULE') && <XCircle size={8} className="md:hidden" />}
                                      <span className="hidden md:inline">{displayStatus}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                        })}
                      </div>

                      {totalGamePages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 shrink-0">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                            Page {safeGamePage} sur {totalGamePages}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setGamePage(prev => Math.max(prev - 1, 1))}
                              disabled={safeGamePage === 1}
                              className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                            >
                              ← Précédent
                            </button>
                            <button
                              onClick={() => setGamePage(prev => Math.min(prev + 1, totalGamePages))}
                              disabled={safeGamePage === totalGamePages}
                              className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                            >
                              Suivant →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      <style jsx global>{`
        .gold-text { color: #f2d335; }
        @keyframes reveal {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

export default function AdminCreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminCreditsContent />
    </Suspense>
  );
}





