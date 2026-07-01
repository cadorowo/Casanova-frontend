'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { Wallet, ArrowUpRight, ArrowDown, Plus, Target, TrendingUp, CheckCircle2, History, Banknote, ReceiptText, Check, XCircle, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocketSync } from '@/lib/use-socket-sync';


interface Bet {
  _id: string;
  status: string;
  stake: number;
  totalOdds: number;
  createdAt: string;
  type: string;
  payout?: number;
  recordType?: string;
  initialBalance?: number;
  finalBalance?: number;
  gameName?: string;
}

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [mounted, setMounted] = useState(false);
  const [flowPage, setFlowPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [flowTimeRange, setFlowTimeRange] = useState('7d');
  const [betsTimeRange, setBetsTimeRange] = useState('7d');

  const fetchDashboardData = useCallback(async () => {
    const flowDays = parseInt(flowTimeRange.replace('d', '')) || 7;
    const betsDays = parseInt(betsTimeRange.replace('d', '')) || 7;
    try {
      const [txData, betData] = await Promise.all([
        api.transactions.getAll(token!, flowDays),
        api.transactions.getBets(token!, undefined, betsDays)
      ]);
      setTransactions(txData);
      setBets(betData?.bets || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  }, [token, flowTimeRange, betsTimeRange]);

  useSocketSync(useCallback(() => {
    const t = setTimeout(() => fetchDashboardData(), 0); return () => clearTimeout(t);
  }, [fetchDashboardData]));

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    if (isAuthenticated && token) {
      const t = setTimeout(() => fetchDashboardData(), 0); return () => clearTimeout(t);
    }
  }, [isAuthenticated, token, fetchDashboardData, mounted, user, router]);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount) + ' TND';
  };

  if (!mounted || !isAuthenticated) return null;

  const flowLogs = transactions.filter((tx) =>
    ['deposit', 'withdrawal', 'admin_transfer', 'admin_transfer_receive'].includes(tx.type)
  );

  const flowPerPage = 10;
  const totalFlowPages = Math.ceil(flowLogs.length / flowPerPage);
  const safeFlowPage = Math.min(flowPage, Math.max(totalFlowPages, 1));
  const paginatedFlowLogs = flowLogs.slice((safeFlowPage - 1) * flowPerPage, safeFlowPage * flowPerPage);

  const historyItems = [
    ...bets.map(b => {
      if (b.recordType === 'casino') {
        const netResult = (b.finalBalance || 0) - (b.initialBalance || 0);
        return {
          _id: b._id,
          type: 'casino_session',
          amount: Math.abs(netResult),
          status: 'completed',
          createdAt: b.createdAt,
          desc: 'CASINO',
          originalType: 'casino',
          netResult
        };
      }
      return {
        _id: b._id,
        type: b.status === 'won' ? 'win' : b.status === 'lost' ? 'loss' : 'sports_bet',
        amount: b.status === 'won' ? (b.payout !== undefined ? b.payout : b.stake * (b.totalOdds || 1)) : b.stake,
        status: b.status.toLowerCase(), 
        createdAt: b.createdAt,
        desc: b.type === 'SINGLE' ? 'Pari Simple' : 'Pari Combiné',
        originalType: 'sports'
      };
    })
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const historyPerPage = 10;
  const totalHistoryPages = Math.ceil(historyItems.length / historyPerPage);
  const safeHistoryPage = Math.min(historyPage, Math.max(totalHistoryPages, 1));
  const paginatedHistoryItems = historyItems.slice((safeHistoryPage - 1) * historyPerPage, safeHistoryPage * historyPerPage);

  return (
    <div className="min-h-full bg-[#000000] animate-reveal">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 pt-12 md:pt-20">
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">
              Station <span className="gold-text">Utilisateur</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-tight">
            Bon retour, {user?.phone || 'Joueur'}. Votre univers est pret.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-16">
          <div className="bezel-shell p-2">
            <div className="bezel-core cassanova-glass p-8 md:p-12 min-h-[320px] flex flex-col justify-between rounded-[2rem] border border-white/5">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                    <Wallet size={32} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">
                      Solde Disponible
                    </div>
                    <div className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none truncate">
                      {formatBalance(user?.balance || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <Link href="/deposit" className="group flex-1 bg-[#d3a936] pl-8 pr-2 py-2 flex items-center justify-between min-w-0 min-h-[60px] rounded-[2rem] transition-all hover:bg-[#e1c22d] hover:scale-[1.02]">
                  <span className="text-black font-black uppercase text-[11px] tracking-[0.3em] truncate">Déposer (+)</span>
                  <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0">
                    <Plus size={20} className="text-black" />
                  </div>
                </Link>
                <Link href="/withdraw" className="group flex-1 bg-blue-600 pl-8 pr-2 py-2 flex items-center justify-between min-w-0 min-h-[60px] rounded-[2rem] transition-all hover:bg-blue-500 hover:scale-[1.02]">
                  <span className="text-white font-black uppercase text-[11px] tracking-[0.3em] truncate">Retrait (-)</span>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0">
                    <ArrowDown size={20} className="text-white" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 gap-8 max-w-6xl">
          {}
          <div className="bezel-shell p-1">
            <div className="bezel-core bg-black rounded-[2rem] overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Dépôts & Retraits</h2>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-center">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                  <div className="flex gap-1.5">
                    {[
                      { value: '7d', label: '7 Jours' },
                      { value: '15d', label: '15 Jours' },
                      { value: '30d', label: '30 Jours' }
                    ].map((timeTab) => (
                      <button
                        key={timeTab.value}
                        onClick={() => {
                          setFlowTimeRange(timeTab.value);
                          setFlowPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                          flowTimeRange === timeTab.value
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
              <div className="p-4 md:p-6 flex flex-col flex-1">
                {flowLogs.length === 0 ? (
                  <div className="py-24 text-center opacity-20 my-auto">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucun Flux</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 md:space-y-2 md:max-h-[360px] md:overflow-y-auto custom-scrollbar pr-1 md:pr-2 flex-1">
                      {paginatedFlowLogs.map((tx, i) => {
                        const isDeposit = tx.type === 'deposit' || tx.type === 'admin_transfer';
                        const Icon = isDeposit ? Plus : ArrowDown;
                        const iconBg = isDeposit ? 'bg-[#d3a936]' : 'bg-blue-600';
                        const iconColor = isDeposit ? 'text-black' : 'text-white';
                        const label = isDeposit ? 'Dépôt' : 'Retrait';
                        const amountSign = isDeposit ? '+' : '-';
                        const statusColor =
                          tx.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          tx.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
                        const displayStatus =
                          tx.status === 'completed' ? 'APPROUVÉ' :
                          tx.status === 'failed' ? 'REJETÉ' :
                          tx.status === 'pending' ? 'ATTENTE' :
                          String(tx.status || '').toUpperCase();

                        return (
                          <div key={tx._id || `${tx.createdAt}-${i}`} className="cassanova-row-slim min-h-[60px] md:min-h-0 group mb-1 last:mb-0 py-2 md:py-1">
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
                                      
                                      <div className="md:hidden text-base font-black tracking-tighter text-white">
                                         {amountSign}{tx.amount.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                      </div>
                                      
                                      <div className="hidden md:flex items-center flex-1">
                                         <div className="md:w-[150px] flex items-center space-x-2 shrink-0">
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                               {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                               {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                         </div>
                                         <div className="flex-1 text-right text-base font-black tracking-tighter whitespace-nowrap pr-4 text-white">
                                            {amountSign}{tx.amount.toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                         </div>
                                      </div>
                                   </div>
                                   
                                   <div className="md:hidden flex flex-col items-end space-y-0.5 shrink-0 mr-3">
                                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                         {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                         {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                   </div>

                                   <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 shrink-0 ${statusColor}`}>
                                      <div className={`w-1 h-1 rounded-full animate-pulse ${
                                        tx.status === 'completed' ? 'bg-green-500' :
                                        tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`} />
                                      {tx.status === 'pending' && <History size={8} className="md:hidden" />}
                                      {tx.status === 'completed' && <Check size={8} className="md:hidden" />}
                                      {tx.status === 'failed' && <XCircle size={8} className="md:hidden" />}
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
                            onClick={() => setFlowPage((prev) => Math.max(prev - 1, 1))}
                            disabled={safeFlowPage === 1}
                            className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                          >
                            Précédent
                          </button>
                          <button
                            onClick={() => setFlowPage((prev) => Math.min(prev + 1, totalFlowPages))}
                            disabled={safeFlowPage === totalFlowPages}
                            className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                          >
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="bezel-shell p-1">
            <div className="bezel-core bg-black rounded-[2rem] overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Histoire de Paris</h2>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-center">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                  <div className="flex gap-1.5">
                    {[
                      { value: '7d', label: '7 Jours' },
                      { value: '15d', label: '15 Jours' },
                      { value: '30d', label: '30 Jours' }
                    ].map((timeTab) => (
                      <button
                        key={timeTab.value}
                        onClick={() => {
                          setBetsTimeRange(timeTab.value);
                          setHistoryPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                          betsTimeRange === timeTab.value
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
              <div className="p-4 md:p-6 flex flex-col flex-1">
                {historyItems.length === 0 ? (
                  <div className="py-24 text-center opacity-20 my-auto">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucun Historique</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 md:space-y-2 md:max-h-[360px] md:overflow-y-auto custom-scrollbar pr-1 md:pr-2 flex-1">
                      {paginatedHistoryItems.map((item, i) => {
                        const isWin = item.type.includes('win');
                        const isPending = item.status === 'pending';
                        
                        let Icon = History;
                        let iconBg = 'bg-gray-500/10';
                        let iconColor = 'text-gray-400';
                        const label = item.desc;
                        let amountSign = '';
                        let statusColor = 'bg-gray-500/10 border-gray-500/20 text-gray-500';
                        let displayStatus = String(item.status || '').toUpperCase();

                        if (item.type === 'casino_session') {
                          Icon = Gamepad2;
                          iconBg = 'bg-gray-500/10';
                          iconColor = 'text-gray-400';
                          amountSign = item.netResult > 0 ? '+' : item.netResult < 0 ? '-' : '';
                          statusColor = 'bg-gray-500/10 border-gray-500/20 text-gray-500';
                          displayStatus = 'TERMINÉ';
                        } else if (isWin) {
                          Icon = item.originalType === 'sports' ? ReceiptText : CheckCircle2;
                          iconBg = item.originalType === 'sports' ? 'bg-gray-500/10' : 'bg-yellow-500/10';
                          iconColor = item.originalType === 'sports' ? 'text-gray-400' : 'text-yellow-500';
                          amountSign = '+';
                          statusColor = 'bg-green-500/10 border-green-500/20 text-green-500';
                          displayStatus = 'GAGNÉ';
                        } else if (item.type.includes('loss') || (item.originalType === 'casino' && item.type === 'bet')) {
                          Icon = item.originalType === 'sports' ? ReceiptText : Target;
                          iconBg = 'bg-gray-500/10';
                          iconColor = 'text-gray-400';
                          amountSign = '-';
                          statusColor = 'bg-red-500/10 border-red-500/20 text-red-500';
                          displayStatus = item.type === 'bet' ? 'JOUÉ' : 'PERDU';
                        } else if (item.type === 'sports_bet') {
                          Icon = ReceiptText;
                          iconBg = 'bg-gray-500/10';
                          iconColor = 'text-gray-400';
                          amountSign = '-';
                          if (isPending) {
                            statusColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
                            displayStatus = 'ATTENTE';
                          } else {
                            statusColor = 'bg-red-500/10 border-red-500/20 text-red-500';
                            displayStatus = 'PERDU';
                          }
                        } else if (item.originalType === 'casino' && item.type === 'rollback') {
                          Icon = History;
                          iconBg = 'bg-gray-500/10';
                          iconColor = 'text-gray-400';
                          amountSign = '+';
                          statusColor = 'bg-gray-500/10 border-gray-500/20 text-gray-500';
                          displayStatus = 'ANNULÉ';
                        }

                        return (
                          <div key={item._id || `${item.createdAt}-${i}`} className="cassanova-row-slim min-h-[60px] md:min-h-0 group mb-1 last:mb-0 py-2 md:py-1">
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
                                      
                                      <div className="md:hidden text-base font-black tracking-tighter text-white">
                                         {amountSign}{Number(item.amount || 0).toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                      </div>
                                      
                                      <div className="hidden md:flex items-center flex-1">
                                         <div className="md:w-[150px] flex items-center space-x-2 shrink-0">
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                               {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                               {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                         </div>
                                         <div className="flex-1 text-right text-base font-black tracking-tighter whitespace-nowrap pr-4 text-white">
                                            {amountSign}{Number(item.amount || 0).toFixed(1)} <span className="text-[10px] opacity-40 text-white uppercase">TND</span>
                                         </div>
                                      </div>
                                   </div>
                                   
                                   <div className="md:hidden flex flex-col items-end space-y-0.5 shrink-0 mr-3">
                                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                         {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                         {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                   </div>

                                   <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 shrink-0 ${statusColor}`}>
                                      <div className={`w-1 h-1 rounded-full animate-pulse ${
                                        isWin ? 'bg-green-500' :
                                        (item.type.includes('loss') || (!isPending && item.type === 'sports_bet')) ? 'bg-red-500' :
                                        'bg-yellow-500'
                                      }`} />
                                      {isPending && <History size={8} className="md:hidden" />}
                                      {isWin && <Check size={8} className="md:hidden" />}
                                      {(item.type.includes('loss') || (!isPending && item.type === 'sports_bet')) && <XCircle size={8} className="md:hidden" />}
                                      <span className="hidden md:inline">{displayStatus}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 shrink-0">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                          Page {safeHistoryPage} sur {totalHistoryPages}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                            disabled={safeHistoryPage === 1}
                            className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                          >
                            Précédent
                          </button>
                          <button
                            onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                            disabled={safeHistoryPage === totalHistoryPages}
                            className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                          >
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
