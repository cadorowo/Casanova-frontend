'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronRight,
  Globe
} from 'lucide-react';
import MatchTimer from '@/components/sports/MatchTimer';
import useMatches from '@/lib/use-matches';
import { useBet } from '@/lib/bet-context';
import { useAuth } from '@/lib/auth-context';

interface SportMatch {
  _id?: string;
  id: string;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  nation: string;
  live: boolean;
  finished: boolean;
  score?: string;
  elapsed?: number;
  statusShort?: string;
  timestamp?: number;
  time?: string;
  suspended?: boolean;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

const MatchSkeleton = () => (
  <div className="h-16 bg-white/5 rounded-lg animate-pulse border border-white/5" />
);

const SportsSkeleton = () => (
  <div className="space-y-3 px-4 md:px-8 max-w-[1800px] mx-auto pt-4 pb-12">
    <div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse mb-12" />
    <div className="h-14 w-full bg-white/5 rounded-2xl animate-pulse mb-8" />
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => <MatchSkeleton key={i} />)}
    </div>
  </div>
);

export default function SportsPage({ initialMatches }: { initialMatches?: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sportParam = searchParams.get('sport');
  const searchParam = searchParams.get('search')?.toLowerCase() || '';
  
  const { user: authUser, openLogin, openRegister } = useAuth();
  const { matches, isLoading } = useMatches(sportParam);
  const { toggleSelection, isInSlip } = useBet();

  const [showOnlyLive, setShowOnlyLive] = useState(false);
  const [selectedNation, setSelectedNation] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    const authAction = searchParams.get('auth');
    if (authAction === 'login') openLogin();
    else if (authAction === 'register') openRegister();
  }, [searchParams, openLogin, openRegister]);

  const nations = matches 
    ? Array.from(new Set(
        (matches as SportMatch[])
          .filter((m) => !m.finished) 
          .map((m) => m.nation)
          .filter(Boolean)
      )).sort() 
    : [];

  const filtered = matches ? (matches as SportMatch[]).filter((m) => {
    const matchesSearch = !searchParam || 
      m.home.toLowerCase().includes(searchParam) || 
      m.away.toLowerCase().includes(searchParam) || 
      m.league.toLowerCase().includes(searchParam);

    const matchesLive = !showOnlyLive || m.live;
    const matchesNation = !selectedNation || m.nation === selectedNation;
    const isNotFinished = !m.finished;
    
    return matchesSearch && matchesLive && matchesNation && isNotFinished;
  }) : [];

  const groupedMatches = filtered.reduce((groups: Record<string, SportMatch[]>, match) => {
    const key = `${match.nation} - ${match.league}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
    return groups;
  }, {});

  Object.keys(groupedMatches).forEach(key => {
    groupedMatches[key].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  });

  const sortedGroupKeys = Object.keys(groupedMatches).sort();

  useEffect(() => {
    if (alertError) {
      const timer = setTimeout(() => setAlertError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertError]);

  if (isLoading) return <SportsSkeleton />;

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {}
      {alertError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px] animate-reveal">
           <div className="bezel-shell p-0.5 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.2)]">
              <div className="bezel-core bg-red-600/10 backdrop-blur-3xl border border-red-500/20 p-4 rounded-2xl flex items-center space-x-4 animate-shake">
                 <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Image src="/logo-short.png" alt="Casanova" width={20} height={20} className="opacity-50 grayscale contrast-200" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Casanova Arena</p>
                    <p className="text-[11px] font-black text-white uppercase tracking-tighter">{alertError}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="animate-reveal pt-12 pb-8 md:pt-20 md:pb-16 px-4 md:px-12 max-w-[1400px] mx-auto">
        
        {}
        <div className="mb-12">
           <div className="flex items-center space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <h1 className="text-xl font-black text-white uppercase tracking-widest">
                {sportParam ? <span className="gold-text">{sportParam}</span> : 'Sports'} <span className="opacity-40">Univers</span>
              </h1>
           </div>
        </div>

        {}
        <div className="mb-8 space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="bezel-shell p-0.5 rounded-full inline-flex w-fit">
                 <div className="bezel-core bg-black/80 rounded-full flex p-0.5">
                    <button 
                      onClick={() => setShowOnlyLive(false)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors duration-150 ${!showOnlyLive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Tous
                    </button>
                    <button 
                      onClick={() => setShowOnlyLive(true)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors duration-150 flex items-center space-x-2 ${showOnlyLive ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {matches?.some(m => m.live) && (
                        <div className={`w-1.5 h-1.5 rounded-full animate-live-breath ${showOnlyLive ? 'bg-black' : 'bg-red-500'}`} />
                      )}
                      <span>Live</span>
                    </button>
                 </div>
              </div>
           </div>

           <div className="mb-12 flex flex-wrap gap-2 pb-2">
              <button 
                onClick={() => setSelectedNation(null)}
                className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 border ${!selectedNation ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black border-white/10 text-gray-500 hover:border-white/30 hover:text-white'}`}
              >
                Toutes les Régions
              </button>
              {nations.map((nation: string) => (
                <button 
                  key={nation}
                  onClick={() => setSelectedNation(nation === selectedNation ? null : nation)}
                  className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 border ${selectedNation === nation ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black border-white/10 text-gray-500 hover:border-white/30 hover:text-white'}`}
                >
                  {nation}
                </button>
              ))}
           </div>
        </div>

        {}
        <div className="space-y-12">
          {sortedGroupKeys.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-gray-600 font-black text-xs uppercase tracking-[0.5em]">Aucun événement trouvé</p>
            </div>
          ) : (
            sortedGroupKeys.map((key) => {
              const matches = groupedMatches[key];
              const [nation, league] = key.split(' - ');
              
              return (
              <div key={key} className="animate-reveal">
                <div className="flex items-center justify-between mb-4 px-3 py-3 border-b border-white/5 rounded-t-2xl">
                   <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-blue-500 border border-white/10">
                         <Globe size={18} />
                      </div>
                      <div>
                         <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1.5">{league}</h3>
                         <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-black text-blue-600/80 uppercase tracking-widest">{nation}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{matches.length} matchs</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-2 p-1">
                  {matches.map((match, i: number) => {
                    
                    return (
                    <div key={match._id || match.id || i} className="group relative flex flex-col cassanova-card overflow-hidden gpu-layer">
                      <div className="flex flex-col md:flex-row md:items-center">
                        <div onClick={() => router.push(`/sports/${match._id || match.id}`)} className="flex-1 flex items-center p-4 cursor-pointer border-b md:border-b-0 md:border-r border-white/[0.05]">
                           <div className="w-16 flex flex-col items-center justify-center shrink-0">
                             {match.live ? (
                                <div className="flex flex-col items-center">
                                   <div className="flex items-center space-x-1.5 mb-0.5">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-live-breath" />
                                      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                                        <MatchTimer elapsed={match.elapsed} statusShort={match.statusShort || ''} isLive={match.live} isFinished={match.finished} isSuspended={match.suspended} fallbackTime={match.time} />
                                      </span>
                                   </div>
                                   <span className="text-sm font-black text-white tracking-tighter leading-tight">{match.score}</span>
                                </div>
                              ) : (
                                 <div className="flex flex-col items-center text-gray-500">
                                    <span className="text-[10px] font-black uppercase opacity-60 mb-0.5">
                                      {match.timestamp ? new Date(match.timestamp * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Tunis' }) : ''}
                                    </span>
                                    <span className="text-[12px] font-black">{match.time}</span>
                                 </div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0 px-4">
                              <div className="flex flex-col space-y-2">
                                 <div className="flex items-center space-x-3">
                                    {match.homeLogo && (
                                      <div className="w-5 h-5 rounded-md bg-white/5 p-0.5 shrink-0">
                                         <Image src={match.homeLogo} alt={`${match.home} logo`} width={20} height={20} className="w-full h-full object-contain" />
                                      </div>
                                    )}
                                    <span className="text-xs font-black text-white uppercase truncate">{match.home}</span>
                                 </div>
                                 <div className="flex items-center space-x-3">
                                    {match.awayLogo && (
                                      <div className="w-5 h-5 rounded-md bg-white/5 p-0.5 shrink-0">
                                         <Image src={match.awayLogo} alt={`${match.away} logo`} width={20} height={20} className="w-full h-full object-contain" />
                                      </div>
                                    )}
                                    <span className="text-xs font-black text-white uppercase truncate">{match.away}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="px-2 text-gray-700 group-hover:text-blue-600 transition-colors">
                             <ChevronRight size={16} />
                          </div>
                        </div>

                        {}
                        <div className="relative z-30 p-2 md:p-3 md:w-[240px] shrink-0">
                          <div className="grid grid-cols-3 gap-1.5">
                            {['1', 'X', '2'].map((pick) => {
                              const oddValue = pick === '1' ? match.odds?.home : pick === 'X' ? match.odds?.draw : match.odds?.away;
                              const isSelected = isInSlip(match.id, 'Match Winner', pick);
                              return (
                                <button
                                  key={pick}
                                  disabled={match.suspended || !oddValue}
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    
                                    if (authUser?.role === 'admin') {
                                      setAlertError('Vous ne pouvez pas jouer en tant qu\'administrateur');
                                      return;
                                    }

                                    if (!oddValue) return;
                                    toggleSelection({
                                      id: `${match.id}-1x2-${pick}`,
                                      matchId: match.id,
                                      home: match.home,
                                      away: match.away,
                                      league: match.league,
                                      marketName: 'Match Winner',
                                      selectionLabel: pick,
                                      odds: oddValue,
                                      nation: match.nation,
                                      date: match.timestamp ? new Date(match.timestamp * 1000).toLocaleDateString('en-GB', { timeZone: 'Africa/Tunis' }) : '',
                                      time: match.time
                                    });
                                  }}
                                  className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : match.suspended || !oddValue ? 'bg-black/40 border-white/5 text-gray-800 cursor-not-allowed' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'}`}
                                >
                                  <span className="text-[7px] font-black uppercase tracking-widest opacity-40 mb-0.5">{pick}</span>
                                  <span className="text-[11px] font-black tabular-nums">{oddValue ? oddValue.toFixed(2) : '-'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>



      <style jsx global>{`
        @keyframes reveal {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal { animation: reveal 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
