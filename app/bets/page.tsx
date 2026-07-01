'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  ReceiptText, Clock, CheckCircle2,
  XCircle, AlertTriangle, Target,
  ChevronRight, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSocketSync } from '@/lib/use-socket-sync';
import { api } from '@/lib/api';

type BetStatus = 'won' | 'lost' | 'pending' | 'void';

interface BetRecord {
  _id: string;
  createdAt: string;
  selections?: {
    matchId: number;
    homeTeam: string;
    awayTeam: string;
    league?: string;
    nation?: string;
    matchDate?: string;
    matchTime?: string;
    marketName: string;
    selection: string;
    odds: number;
    status: string;
  }[];
  type: string;
  amount?: number;
  stake: number;
  totalOdds?: number;
  payout?: number;
  potentialReturn?: number;
  actualReturn?: number;
  status: BetStatus;
}

import { LucideIcon } from 'lucide-react';

const STATUS_CONFIG: Record<BetStatus, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  won:     { label: 'Gagné',   icon: CheckCircle2,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  lost:    { label: 'Perdu',   icon: XCircle,        color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  pending: { label: 'Attente', icon: Clock,          color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  void:    { label: 'Annulé',  icon: AlertTriangle,  color: 'text-gray-400',   bg: 'bg-white/5 border-white/10' },
};

const FILTERS: { label: string; value: BetStatus | 'all' }[] = [
  { label: 'Tous les Paris', value: 'all' },
  { label: 'Attente',  value: 'pending' },
  { label: 'Gagné',      value: 'won' },
  { label: 'Perdu',     value: 'lost' },
  { label: 'Annulé',    value: 'void' },
];

export default function BetsPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<BetStatus | 'all'>('all');
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async (page = 1, statusFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await api.transactions.getBets(token, params);
      if (data && data.bets) {
        if (page === 1) {
          setBets(data.bets);
        } else {
          setBets(prev => [...prev, ...data.bets]);
        }
        setHasMore(data.hasMore);
        setTotal(data.total);
        setCurrentPage(page);
      } else {
        setBets([]);
        setTotal(0);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch bets', err);
      setError('Erreur de chargement des paris');
      if (page === 1) setBets([]);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useSocketSync(useCallback(() => {
    fetchBets();
  }, [fetchBets]));

  useEffect(() => {
    if (!isAuthenticated) {
      setBets([]);
      return;
    }
    setCurrentPage(1);
    fetchBets(1, filter);
  }, [filter, isAuthenticated, fetchBets]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = filter === 'all' ? bets : bets.filter(b => b.status.toLowerCase() === filter);


  const formatTND = (n: number | undefined | null) => {
    const val = n ?? 0;
    if (!mounted) return val.toFixed(1) + ' TND';
    return val.toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' TND';
  };

  return (
    <div className="min-h-full bg-[#000000] animate-reveal pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 pt-12 md:pt-20">
        
        {}
        <div className="mb-8">
           <div className="flex items-center space-x-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <h1 className="text-xl font-black text-white uppercase tracking-widest">Mes Paris</h1>
           </div>
        </div>

        {}
        <div className="flex items-center space-x-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map(f => {
            const cnt = filter === f.value ? total : (f.value === 'all' ? bets.length : bets.filter(b => b.status.toLowerCase() === f.value).length);
            return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-150
                ${filter === f.value
                  ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                  : 'bg-transparent border-white/5 text-gray-500 hover:border-white/10'}
              `}
            >
              {f.label}
              <span className="ml-2 opacity-60">
                {cnt}
              </span>
            </button>
            );
          })}
        </div>

        {}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bezel-shell p-1.5">
                <div className="bezel-core bg-black p-6 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-3">
                      <div className="h-2 w-32 bg-white/5 rounded-full" />
                      <div className="h-5 w-48 bg-white/5 rounded-full" />
                    </div>
                    <div className="h-8 w-20 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : error && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchBets(1, filter)}
                className="px-6 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bezel-shell p-2">
              <div className="bezel-core bg-black p-16 text-center">
                <ReceiptText size={40} className="text-gray-700 mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Aucun pari trouvé pour ce filtre.</p>
                <Link href="/sports" className="mt-6 inline-flex items-center space-x-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                  <span>Aller au Sportsbook</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ) : (
            filtered.map((bet, i) => {
              const cfg = STATUS_CONFIG[(bet.status.toLowerCase()) as BetStatus] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={bet._id}
                  className="cassanova-card p-6 md:p-8 cursor-pointer gpu-layer"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                    {}
                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                            {mounted ? new Date(bet.createdAt).toLocaleString('en-GB', { hour12: false }) : '...'}
                          </span>
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-600/10 px-2 py-0.5 rounded-full shrink-0">
                            {bet.type === 'MULTIPLE' ? `Combiné ×${bet.selections?.length || 0}` : bet.type}
                          </span>
                        </div>
                        <div className="text-sm md:text-base font-black text-white uppercase tracking-tight line-clamp-2 leading-tight">
                          {bet.selections ? bet.selections.map((s) => `${s.homeTeam} v ${s.awayTeam}`).join(' + ') : `Transaction Ref: ${bet._id.slice(-6).toUpperCase()}`}
                        </div>
                      </div>
                      {}
                      <div className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
                        {bet.status.toLowerCase() !== 'won' && <ReceiptText size={10} className="shrink-0 text-blue-500" />}
                        <span className="whitespace-nowrap">{cfg.label}</span>
                      </div>
                    </div>


                    {}
                    {bet.selections && bet.selections.length > 0 && (
                      <div className="space-y-4 mb-8">
                        {bet.selections.map((sel, j) => (
                          <div key={j} className="flex items-start justify-between py-3 border-t border-white/5 gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                 <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest truncate">{sel.league || 'Football'}</span>
                                 {sel.nation && (
                                   <>
                                     <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                     <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{sel.nation}</span>
                                   </>
                                 )}
                              </div>
                              <div className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight leading-tight">
                                 {sel.homeTeam} v {sel.awayTeam}
                              </div>
                              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1 truncate">
                                 Marché: {sel.marketName || 'Match Winner'}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                 <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center space-x-1.5">
                                    <span>Choix: {sel.selection}</span>
                                     {sel.status && sel.status.toUpperCase() !== 'PENDING' && (
                                       <span className={
                                         sel.status.toUpperCase() === 'WON' ? 'text-green-400' :
                                         sel.status.toUpperCase() === 'LOST' ? 'text-red-400' :
                                         'text-gray-400'
                                       }>
                                         {sel.status.toUpperCase() === 'WON' ? '(GAGNÉ)' : sel.status.toUpperCase() === 'LOST' ? '(PERDU)' : '(ANNULÉ)'}
                                       </span>
                                     )}
                                 </div>
                                 {(sel.matchDate || sel.matchTime) && (
                                   <>
                                      <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                      <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                                         {sel.matchDate} {sel.matchTime}
                                      </div>
                                   </>
                                 )}
                              </div>
                            </div>
                            <div className="shrink-0 text-sm font-black text-white pt-4">{sel.odds.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {}
                    <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5 gap-y-6">
                      <div className="flex items-center space-x-8 md:space-x-12">
                        <div className="shrink-0">
                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Mise</div>
                          <div className="text-xs md:text-sm font-black text-white whitespace-nowrap">{formatTND(bet.stake)}</div>
                        </div>
                        {bet.totalOdds && (
                          <div className="shrink-0">
                            <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Cotes Totales</div>
                            <div className="text-xs md:text-sm font-black text-white">{bet.totalOdds.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-left sm:text-right min-w-[120px]">
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">
                          {bet.status.toLowerCase() === 'won' ? 'Retourné' : 'Potentiel'}
                        </div>
                        <div className={`text-sm md:text-lg font-black truncate ${bet.status.toLowerCase() === 'won' ? 'text-green-400' : bet.status.toLowerCase() === 'lost' ? 'text-red-400' : 'gold-text'}`}>
                          {bet.status.toLowerCase() === 'won' && bet.payout !== undefined
                            ? formatTND(bet.payout)
                            : formatTND((bet.stake || 0) * (bet.totalOdds || 1))}
                        </div>
                      </div>
                    </div>
                </div>
              );
            })
          )}
        </div>

        {}
        {hasMore && !loading && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => fetchBets(currentPage + 1, filter)}
              className="px-6 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-gray-300 rounded-lg transition-colors"
            >
              Charger plus ({bets.length} / {total})
            </button>
          </div>
        )}

        {}
        {!loading && bets.length > 0 && (
          <div className="mt-16 text-center">
            <Link
              href="/sports"
              className="group inline-flex items-center justify-between pl-10 pr-2 py-2 gold-button"
            >
              <span className="font-black uppercase text-xs tracking-[0.4em]">Placer un Nouveau Pari</span>
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform ml-6">
                <Target size={20} className="text-black" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
