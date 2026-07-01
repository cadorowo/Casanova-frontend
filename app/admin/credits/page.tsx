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
  ReceiptText
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
  const [playerBets, setPlayerBets] = useState<Record<string, string>>({});
  const [isLoadingPlayerLogs, setIsLoadingPlayerLogs] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [flowPage, setFlowPage] = useState(1);
  const [gamePage, setGamePage] = useState(1);
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
    try {
      const [data, betsRes] = await Promise.all([
        api.admin.getUserActivity(token, phone),
        api.admin.getUserBets(token, phone)
      ]);
      setPlayerLogs(data);
      const betsArr = betsRes?.success && betsRes?.data ? betsRes.data : betsRes;
      if (Array.isArray(betsArr)) {
        const statusMap: Record<string, string> = {};
        betsArr.forEach((b: { _id: string; status: string }) => {
          statusMap[String(b._id)] = String(b.status || '').toLowerCase();
        });
        setPlayerBets(statusMap);
      }
    } catch (err) {
      console.error('Failed to fetch player logs', err);
    } finally {
      setIsLoadingPlayerLogs(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.admin.getUsers(token);
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, [token]);

  useEffect(() => {
    if (phoneParam) {
      setSearchPhone(phoneParam);
      fetchPlayerLogs(phoneParam);
      setFlowPage(1);
      setGamePage(1);
    }
  }, [phoneParam, fetchPlayerLogs]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchUsers();
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
                className="group flex items-center justify-between px-6 py-4 md:py-5 rounded-full border border-purple-500/35 bg-transparent hover:bg-white/[0.03] hover:border-purple-500/60 active:scale-[0.99] shadow-md shadow-purple-500/20 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    {isProcessing
                      ? <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      : <Plus size={20} className="text-black" />
                    }
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-white uppercase tracking-tight">Déposer</div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Ajouter des crédits au joueur</div>
                  </div>
                </div>
                {transferAmount && parseFloat(transferAmount) > 0 && (
                  <span className="text-purple-400 font-black text-base tabular-nums shrink-0 ml-3">
                    +{parseFloat(transferAmount).toFixed(1)}
                  </span>
                )}
              </button>

              {}
              <button
                type="button"
                disabled={isProcessing || !hasValidAmount || !searchPhone || !canWithdrawFromPlayer}
                onClick={(e) => handleTransfer(e, true)}
                className="group flex items-center justify-between px-6 py-4 md:py-5 rounded-full border border-gray-500/45 bg-transparent hover:bg-white/[0.03] hover:border-gray-500/70 active:scale-[0.99] shadow-md shadow-gray-500/25 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    {isProcessing
                      ? <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      : <ArrowUpRight size={20} className="text-black" />
                    }
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-white uppercase tracking-tight">Retirer</div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Récupérer des crédits du joueur</div>
                  </div>
                </div>
                {transferAmount && parseFloat(transferAmount) > 0 && (
                  <span className="text-gray-400 font-black text-base tabular-nums shrink-0 ml-3">
                    -{parseFloat(transferAmount).toFixed(1)}
                  </span>
                )}
              </button>

            </div>
              </div>

              <div className="xl:col-span-12 order-1">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center space-x-3">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Soldes</h2>
                </div>

                <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#f2d335]/35 bg-[#f2d335]/10 p-4">
                    <div className="text-[9px] font-black text-[#f2d335] uppercase tracking-[0.2em] mb-2">
                      Crédit Master
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight leading-none">
                      {(user?.adminWallet || 0).toFixed(1)} <span className="text-[11px] opacity-50 uppercase">TND</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4">
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-between gap-2">
                      <span>Crédit Joueur</span>
                      {targetPlayer && (
                        <span className="text-[10px] text-gray-400 tracking-widest normal-case">
                          {targetPlayer.phone}
                        </span>
                      )}
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

        {}
        {(() => {
          const flowLogs = playerLogs.filter(log =>
            ['deposit', 'withdrawal', 'admin_transfer', 'admin_transfer_receive'].includes(log.type)
          );
          const itemsPerPage = 10;
          const totalFlowPages = Math.ceil(flowLogs.length / itemsPerPage);
          const safeFlowPage = Math.min(flowPage, Math.max(totalFlowPages, 1));
          const startIndex = (safeFlowPage - 1) * itemsPerPage;
          const paginatedFlowLogs = flowLogs.slice(startIndex, startIndex + itemsPerPage);
          return (
            <div className="bezel-shell p-0.5 mb-6">
              <div className="bezel-core bg-black flex flex-col">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center space-x-3">
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Dépôts & Retraits</h2>
                  {flowLogs.length > 0 && (
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-auto">
                      {flowLogs.length} opérations
                    </span>
                  )}
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
                        const isDeposit = log.type === 'deposit' || log.type === 'admin_transfer';
                        const Icon = isDeposit ? Plus : ArrowUpRight;
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
                          log.status.toUpperCase();
                        return (
                          <div key={`${log.createdAt}-${i}`} className="cassanova-row-slim min-h-[50px] md:min-h-0 group mb-1 last:mb-0">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${iconBg} border border-white/5 ${iconColor}`}>
                                <Icon size={12} />
                              </div>
                              <div className="flex flex-col min-w-0 py-1">
                                <span className="text-sm font-black text-white uppercase tracking-tighter">{label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-px h-3 bg-white/10" />
                                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                    {new Date(log.createdAt).toLocaleDateString('fr-FR')} • {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0 ml-auto">
                              <div className={`text-base font-black tracking-tighter whitespace-nowrap ${amountColor}`}>
                                {amountSign}{log.amount.toFixed(1)} <span className="text-[8px] md:text-[10px] opacity-40 text-white uppercase">TND</span>
                              </div>
                              <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 ${statusColor}`}>
                                <div className={`w-1 h-1 rounded-full animate-pulse ${
                                  log.status === 'completed' ? 'bg-green-500' :
                                  log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                                <span className="hidden md:inline">{displayStatus}</span>
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
            const realStatus = playerBets[play.key];
            const derivedStatus = realStatus ||
              (play.win > 0 ? 'won' : play.stake > 0 ? 'pending' : 'lost');
            return {
              type: play.kind === 'casino' ? (play.win > 0 ? 'casino_win' : 'casino_bet') : (play.win > 0 ? 'win' : 'bet'),
              status: derivedStatus,
              amount: play.win > 0 ? play.win : play.stake,
              createdAt: play.createdAt,
              stake: play.stake,
              win: play.win,
            };
          });

          return (
            <div className="bezel-shell p-0.5">
              <div className="bezel-core bg-black flex flex-col">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center space-x-3">
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Historique des Paris</h2>
                  {plays.length > 0 && (
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-auto">
                      {plays.length} paris
                    </span>
                  )}
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
                        const iconBg = isCasino ? 'bg-white/5' : 'bg-gray-500/10';
                        const iconColor = isCasino ? 'text-gray-500' : 'text-gray-400';
                        const amountColor = 'text-white';
                        const label = isCasino ? 'PARI CASINO' : 'PARI SPORTIF';
                        const stake = (log as FinancialLog & { stake?: number; win?: number }).stake ?? ((log.type === 'bet' || log.type === 'casino_bet') ? log.amount : 0);
                        const gain = (log as FinancialLog & { stake?: number; win?: number }).win ?? ((log.type === 'win' || log.type === 'casino_win') ? log.amount : 0);
                        const hasStake = stake > 0;
                        const valueLabel = 'GAIN';
                        const displayStatus =
                          log.status === 'won' ? 'GAGNE' :
                          log.status === 'lost' ? 'PERDU' :
                          log.status === 'failed' ? 'ANNULE' :
                          log.status === 'completed' ? ((log.type === 'bet' || log.type === 'casino_bet') ? 'PLACE' : 'PAYE') :
                          log.status === 'pending' ? 'ATTENTE' :
                          log.status.toUpperCase();
                        const statusColor =
                          (displayStatus === 'GAGNE' || displayStatus === 'PLACE' || displayStatus === 'PAYE')
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : (displayStatus === 'PERDU' || displayStatus === 'ANNULE')
                              ? 'bg-red-500/10 border-red-500/20 text-red-500'
                              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
                        return (
                           <div key={`${log.createdAt}-${i}`} className="cassanova-row-slim group mb-1 last:mb-0 flex items-center justify-between min-h-[92px] md:min-h-[86px] px-2.5 md:px-3 py-3">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className={`w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                                <Icon size={12} />
                              </div>
                              <div className="flex flex-col min-w-0 py-1 space-y-1">
                                <span className="text-sm font-black text-white uppercase tracking-tighter">{label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-px h-3 bg-white/10" />
                                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                    {new Date(log.createdAt).toLocaleDateString('fr-FR')} • {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                  MISE: <span className="text-gray-300">{hasStake ? `${stake.toFixed(1)} TND` : 'N/D'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0 ml-auto">
                              <div className="text-right">
                                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{valueLabel}</div>
                                <span className={`text-2xl font-black tracking-tight whitespace-nowrap leading-none ${amountColor}`}>
                                  {gain > 0 ? '+' : ''}{gain.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                </span>
                              </div>
                              <div className={`px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center space-x-1 ${statusColor}`}>
                                <div className={`w-1 h-1 rounded-full animate-pulse ${
                                  (displayStatus === 'GAGNE' || displayStatus === 'PLACE' || displayStatus === 'PAYE')
                                    ? 'bg-green-500'
                                    : (displayStatus === 'PERDU' || displayStatus === 'ANNULE')
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                }`} />
                                <span>{displayStatus}</span>
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





