'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Timer, 
  Trophy, 
  Activity, 
  BarChart3, 
  Info,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import useSWR from 'swr';
import Image from 'next/image';
import MatchTimer from '@/components/sports/MatchTimer';
import { useState, useMemo, useEffect } from 'react';
import { useBet } from '@/lib/bet-context';
import { mapUltraToUI, normalizeValue, translateOptionValue } from '@/lib/use-matches';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';

interface MarketOption {
  label: string;
  odd: number;
}

interface Market {
  name: string;
  options: MarketOption[];
  values?: { value: string; odd: string; handicap?: string }[];
}

interface MatchDetail {
  _id?: string;
  id: string;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  live: boolean;
  score?: string;
  time?: string;
  elapsed?: number;
  statusShort?: string;
  finished?: boolean;
  suspended?: boolean;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  nation?: string;
  matchDate?: string;
  matchTime?: string;
  markets?: Market[];
}

interface OptionItem {
  value: string;
  odd: string;
  handicap?: string;
}

type OptionBucket = 'under' | 'exact' | 'over' | 'other';

const formatOptionLabel = (value: string, handicap?: string): string => {
  const translatedValue = translateOptionValue(value);
  const line = String(handicap || '').trim();

  return line ? `${translatedValue} ${line}` : translatedValue;
};

const MARKET_ORDER: Record<string, number> = {
  'Match Winner': 10,
  'Fulltime Result': 10,
  'Home/Away': 15,
  'Double Chance': 20,
  'Draw No Bet': 30,
  'Both Teams to Score': 40,
  'Both Teams Score': 40,
  'Match Goals': 50,
  'Goals Over/Under': 50,
  'Exact Score': 60,
  'Final Score': 60,
  'Correct Score': 60,
  'Correct Score - First Half': 62,
  'HT/FT Double': 65,
  'Result/Total Goals': 67,
  'Asian Handicap': 70,
  '3-Way Handicap': 80,
  'Handicap Result': 80,
  'First Half Winner': 85,
  'Home Team Goals': 90,
  'Away Team Goals': 90,
  'Total - Home': 90,
  'Total - Away': 90,
  'Match Corners': 100,
  'Total Corners': 100,
  'Corners 1x2': 105,
  'Corners Over Under': 110,
  'Asian Corners': 110,
  'Player to be Booked': 120,
  'Player to be Sent Off': 130
};

const getMarketWeight = (name: string): number => {
  if (MARKET_ORDER[name] !== undefined) return MARKET_ORDER[name];
  for (const key of Object.keys(MARKET_ORDER)) {
    if (name.includes(key)) return MARKET_ORDER[key];
  }
  return 1000;
};

/** Normalize option value for comparison */
const normVal = (v: string) => String(v || '').trim().toLowerCase();

const NOISY_LIVE_MARKET_PATTERNS = [
  /race to the .+ corner/i,
  /which team will score the .+ corner/i,
  /^last corner$/i,
  /^asian corners$/i
];

const shouldHideMarket = (marketName: string): boolean =>
  NOISY_LIVE_MARKET_PATTERNS.some(pattern => pattern.test(marketName));


const parseScorePair = (value?: string) => {
  const match = String(value || '').match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return null;

  return {
    home: parseInt(match[1], 10),
    away: parseInt(match[2], 10)
  };
};

const getCurrentScore = (match?: MatchDetail | null) => parseScorePair(match?.score);

const isSelectionStillPossible = (match: MatchDetail, marketName: string, value: string): boolean => {
  if (match.finished) return false;
  if (!match.live) return true;

  const currentScore = getCurrentScore(match);
  if (!currentScore) return true;

  const market = marketName.toLowerCase();
  const selection = value.toLowerCase();

  if (market.includes('exact score') || market.includes('correct score')) {
    const targetScore = parseScorePair(value);
    if (!targetScore) return true;

    return targetScore.home >= currentScore.home && targetScore.away >= currentScore.away;
  }

  if (selection.includes('under') || selection.includes('moins de')) {
    const threshold = parseFloat(value.match(/(\d+\.?\d*)/)?.[1] || '');
    if (!Number.isNaN(threshold)) {
      return currentScore.home + currentScore.away < threshold;
    }
  }

  return true;
};

const getOptionBucket = (option: OptionItem): OptionBucket => {
  const value = String(option.value || '').toLowerCase();
  const label = formatOptionLabel(option.value, option.handicap).toLowerCase();

  if (value.includes('exactly') || label.includes('exactement')) return 'exact';
  if (value.includes('over') || label.includes('plus de')) return 'over';
  if (value.includes('under') || label.includes('moins de')) return 'under';
  return 'other';
};

const getOptionLine = (option: OptionItem): number => {
  const raw = String(option.handicap || option.value.match(/[\d.,]+/)?.[0] || '');
  const normalized = raw.replace(',', '.');
  const line = parseFloat(normalized);
  return Number.isNaN(line) ? Number.POSITIVE_INFINITY : line;
};

const shouldUseThreeColumnBuckets = (marketName: string, options: OptionItem[]): boolean => {
  const market = marketName.toLowerCase();
  if (!(market.includes('corner') || market.includes('over/under') || market.includes('total'))) {
    return false;
  }

  const buckets = new Set(options.map(getOptionBucket));
  return buckets.has('under') && buckets.has('exact') && buckets.has('over') && !buckets.has('other');
};

/**
 * Sort market options in a sensible display order for each market type.
 */
const sortMarketOptions = (marketName: string, options: OptionItem[]): OptionItem[] => {
  const name = marketName.toLowerCase();

  if (name.includes('ht/ft') || name.includes('half time / full time') || name.includes('halftime/fulltime')) {
    const HTFT_ORDER: Record<string, number> = {
      '1/1': 1, '1/x': 2, '1/2': 3,
      'x/1': 4, 'x/x': 5, 'x/2': 6,
      '2/1': 7, '2/x': 8, '2/2': 9,
    };
    return [...options].sort((a, b) => {
      const keyA = normVal(a.value).replace('home', '1').replace('draw', 'x').replace('away', '2');
      const keyB = normVal(b.value).replace('home', '1').replace('draw', 'x').replace('away', '2');
      return (HTFT_ORDER[keyA] ?? 99) - (HTFT_ORDER[keyB] ?? 99);
    });
  }

  if (name.includes('result/total') || name.includes('result & total') || name.includes('result & goals')) {
    const resultOrder = (v: string) => {
      const vl = v.toLowerCase();
      if (vl.includes('home') || vl.startsWith('1')) return 0;
      if (vl.includes('draw') || vl.startsWith('x')) return 1;
      return 2; 
    };
    const goalOrder = (v: string) => (v.toLowerCase().includes('over') || v.toLowerCase().includes('plus') ? 0 : 1);
    const lineOrder = (v: string) => {
      const m = v.match(/(\d+\.?\d*)/);
      return m ? parseFloat(m[1]) : 0;
    };
    return [...options].sort((a, b) => {
      const rA = resultOrder(a.value), rB = resultOrder(b.value);
      if (rA !== rB) return rA - rB;
      const lA = lineOrder(a.value), lB = lineOrder(b.value);
      if (lA !== lB) return lA - lB;
      return goalOrder(a.value) - goalOrder(b.value);
    });
  }

  if (name.includes('result') && name.includes('both teams')) {
    const resultOrder = (v: string) => {
      const vl = v.toLowerCase();
      if (vl.includes('home') || vl.startsWith('1')) return 0;
      if (vl.includes('draw') || vl.startsWith('x')) return 1;
      return 2; 
    };
    const bttsOrder = (v: string) => (v.toLowerCase().includes('yes') || v.toLowerCase().includes('oui') ? 0 : 1);
    
    return [...options].sort((a, b) => {
      const bA = bttsOrder(a.value), bB = bttsOrder(b.value);
      if (bA !== bB) return bA - bB;
      return resultOrder(a.value) - resultOrder(b.value);
    });
  }

  if (
    name.includes('winner') || name.includes('result') ||
    name.includes('draw no bet') || name === 'home/away' || name === 'home or away' ||
    name.includes('first half winner') || name.includes('1st half winner') ||
    name.includes('corners 1x2')
  ) {
    const order: Record<string, number> = {
      'home': 1, '1': 1,
      'draw': 2, 'x': 2, 'n': 2,
      'away': 3, '2': 3,
    };
    return [...options].sort((a, b) =>
      (order[normVal(a.value)] ?? 9) - (order[normVal(b.value)] ?? 9)
    );
  }

  if (name.includes('handicap')) {
    const sideOrder = (v: string) => {
      const vl = normVal(v);
      if (vl.includes('home') || vl.match(/^1\b/)) return 0;
      if (vl.includes('draw') || vl.match(/^x\b/) || vl.includes('nul')) return 1;
      return 2;
    };
    const getLine = (opt: OptionItem) => {
      const raw = opt.handicap || opt.value.match(/[-+]?\d+\.?\d*/)?.[0] || '0';
      return parseFloat(String(raw).replace(',', '.'));
    };

    const hasDraw = options.some(o => sideOrder(o.value) === 1);

    if (!hasDraw) {
      const homeOpts = options.filter(o => sideOrder(o.value) === 0);
      const awayOpts = options.filter(o => sideOrder(o.value) === 2);
      
      homeOpts.sort((a, b) => getLine(a) - getLine(b));
      awayOpts.sort((a, b) => getLine(b) - getLine(a));

      const zipped: OptionItem[] = [];
      const maxLength = Math.max(homeOpts.length, awayOpts.length);
      for (let i = 0; i < maxLength; i++) {
        if (homeOpts[i]) zipped.push(homeOpts[i]);
        if (awayOpts[i]) zipped.push(awayOpts[i]);
      }
      return zipped;
    }

    return [...options].sort((a, b) => {
      const getCanonicalLine = (opt: OptionItem) => {
        const side = sideOrder(opt.value);
        const lineVal = getLine(opt);
        return side === 2 ? -lineVal : lineVal;
      };
      const lineA = getCanonicalLine(a);
      const lineB = getCanonicalLine(b);
      if (lineA !== lineB) return lineA - lineB;
      return sideOrder(a.value) - sideOrder(b.value);
    });
  }

  if (name.includes('double chance')) {
    const order: Record<string, number> = {
      'home/draw': 1, '1x': 1,
      'home/away': 2, '12': 2,
      'draw/away': 3, 'x2': 3,
    };
    return [...options].sort((a, b) =>
      (order[normVal(a.value)] ?? 9) - (order[normVal(b.value)] ?? 9)
    );
  }

  if (name.includes('both teams') && !name.includes('result')) {
    const order: Record<string, number> = { 'yes': 1, 'oui': 1, 'no': 2, 'non': 2 };
    return [...options].sort((a, b) =>
      (order[normVal(a.value)] ?? 9) - (order[normVal(b.value)] ?? 9)
    );
  }

  if (
    name.includes('total') || name.includes('over/under') || name.includes('over') ||
    name.includes('under') || name.includes('goals') || name.includes('corners') ||
    name.includes('cards') || name.includes('shots') || name.includes('fouls') ||
    name.includes('offsides')
  ) {
    return [...options].sort((a, b) => {
      const lineA = parseFloat(a.handicap || a.value.match(/[\d.]+/)?.[0] || '0');
      const lineB = parseFloat(b.handicap || b.value.match(/[\d.]+/)?.[0] || '0');
      if (lineA !== lineB) return lineA - lineB;
      const isOverA = normVal(a.value).includes('over') || normVal(a.value).includes('plus') ? 0 : 1;
      const isOverB = normVal(b.value).includes('over') || normVal(b.value).includes('plus') ? 0 : 1;
      return isOverA - isOverB;
    });
  }

  if (name.includes('score') || name.includes('exact')) {
    const parseScore = (str: string) => {
      const m = str.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (!m) return { home: 99, away: 99, total: 99, type: 3 };
      const home = parseInt(m[1], 10);
      const away = parseInt(m[2], 10);
      const type = home > away ? 0 : home === away ? 1 : 2;
      return { home, away, total: home + away, type };
    };
    return [...options].sort((a, b) => {
      const sA = parseScore(a.value);
      const sB = parseScore(b.value);
      if (sA.type !== sB.type) return sA.type - sB.type;
      if (sA.total !== sB.total) return sA.total - sB.total;
      if (sA.home !== sB.home) return sA.home - sB.home;
      return sA.away - sB.away;
    });
  }

  return options;
};


const getFrenchMarketName = (name: string): string => {
  const translations: Record<string, string> = {
    'Match Winner': 'Résultat Final',
    'Fulltime Result': 'Résultat Final',
    'Double Chance': 'Double Chance',
    'Draw No Bet': 'Remboursé si Match Nul',
    'Both Teams To Score': 'Les 2 Équipes Marquent',
    'Goals Over/Under': 'Plus/Moins de Buts',
    'Total Goals': 'Total des Buts',
    'Asian Handicap': 'Handicap Asiatique',
    'Correct Score': 'Score Exact',
    'Exact Score': 'Score Exact',
    'Half Time Result': 'Résultat Mi-Temps',
    'Half Time / Full Time': 'Mi-Temps / Fin de Match',
    'First Team To Score': 'Première Équipe à Marquer',
    'Clean Sheet - Home': 'Garder sa cage inviolée - Domicile',
    'Clean Sheet - Away': 'Garder sa cage inviolée - Extérieur',
    '3Way Handicap': 'Handicap 3 Voies',
    'Home Team Goals': 'Buts Équipe Domicile',
    'Away Team Goals': 'Buts Équipe Extérieur',
    'Result/Both Teams To Score': 'Résultat / Les 2 Équipes Marquent',
    'Result/Total Goals': 'Résultat / Total des Buts',
    'Corners Over Under': 'Plus/Moins de Corners',
    'Total Corners': 'Total Corners (Over/Under)',
    'Match Corners': 'Match Corners (3-Way)',
    'Cards Over/Under': 'Plus/Moins de Cartons',
    'Player Shots On Target': 'Tirs Cadrés du Joueur',
    'Player Passes': 'Passes du Joueur',
    'Player Tackles': 'Tacles du Joueur',
    'Win to Nil': 'Gagner sans encaisser',
    'Odd/Even Goals': 'Buts Pair/Impair',
  };

  if (translations[name]) return translations[name];
  
  for (const [key, value] of Object.entries(translations)) {
    if (name.toLowerCase() === key.toLowerCase()) return value;
  }
  
  return name;
};



const MarketSkeleton = () => (
  <div className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
);

const isMarketInCategory = (marketName: string, categoryId: string) => {
  const name = marketName.toLowerCase();
  if (categoryId === 'Tous') return true;
  if (categoryId === 'Principal') {
    return ['double chance', 'draw no bet', 'home/away', 'home or away', 'both teams to score', 'both teams score'].some(k => name.includes(k));
  }
  if (categoryId === 'Lignes Asiatiques') {
    return ['asian'].some(k => name.includes(k));
  }
  if (categoryId === 'Handicaps') {
    return ['handicap'].some(k => name.includes(k)) && !['asian', 'corner', 'card'].some(k => name.includes(k));
  }
  if (categoryId === 'Buts') {
    return ['goals', 'over/under', 'total'].some(k => name.includes(k)) 
      && !['corner', 'half', 'handicap', 'card', 'booking', 'team', 'home', 'away', 'asian'].some(k => name.includes(k));
  }
  if (categoryId === 'Équipes') {
    return ['clean sheet', 'team goals', 'total - home', 'total - away', 'team to score'].some(k => name.includes(k));
  }
  if (categoryId === 'Corners & Cartons') {
    return ['corner', 'card', 'booking', 'sent off', 'dismissal'].some(k => name.includes(k))
      && !['asian'].some(k => name.includes(k));
  }
  if (categoryId === 'Joueurs') {
    return ['player', 'goalscorer', 'scorer'].some(k => name.includes(k));
  }
  if (categoryId === 'Score Exact') {
    return ['correct score', 'exact score'].some(k => name.includes(k));
  }
  if (categoryId === 'Mi-temps') {
    return ['half', 'ht/ft', '1st half', 'halftime', 'interval'].some(k => name.includes(k))
      && !['corner', 'card', 'asian'].some(k => name.includes(k)); 
  }
  if (categoryId === 'Statistiques') {
    return ['possession', 'shots', 'fouls', 'offsides', 'statistics'].some(k => name.includes(k));
  }
  if (categoryId === 'Combo') {
    return ['result/total', 'result & total', 'win to nil', 'win &', 'double', 'ht/ft double'].some(k => name.includes(k));
  }
  return false;
};

const CATEGORIES = [
  { id: 'Tous', name: 'Tous' },
  { id: 'Principal', name: 'Principal' },
  { id: 'Combo', name: 'Bet Builder' },
  { id: 'Lignes Asiatiques', name: 'Lignes Asiatiques' },
  { id: 'Buts', name: 'Buts' },
  { id: 'Équipes', name: 'Équipes' },
  { id: 'Mi-temps', name: 'Mi-temps' },
  { id: 'Handicaps', name: 'Handicaps' },
  { id: 'Score Exact', name: 'Score Exact' },
  { id: 'Joueurs', name: 'Joueurs' },
  { id: 'Corners & Cartons', name: 'Corners & Cartons' },
  { id: 'Statistiques', name: 'Statistiques' }
];

export default function MatchDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({
    'Full Time Result': true,
    'Both Teams to Score': true,
    'Over/Under 2.5 Goals': true
  });
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toggleSelection, isInSlip } = useBet();

  const { data: rawMatch, isLoading, mutate } = useSWR(id ? `match-${id}` : null, () => api.games.getMatchById(id as string), { revalidateOnFocus: false, revalidateOnMount: true });

  useEffect(() => {
    if (!socket || !socket.emit) return;

    socket.emit('subscribe_fixture', { fixture_id: Number(id) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOddsUpdate = (updatedMatch: any) => {
      if (updatedMatch && updatedMatch.fixture_id === Number(id)) {
        console.log(`[WebSocket] MatchDetail Page: Odds update received for match ${id}`);
        mutate(updatedMatch, false);
      }
    };

    socket.on('odds_update', handleOddsUpdate);

    return () => {
      socket.emit('unsubscribe_fixture', { fixture_id: Number(id) });
      socket.off('odds_update', handleOddsUpdate);
    };
  }, [id, socket, mutate]);

  const match = useMemo(() => {
    if (!rawMatch) return null;
    let transformed: MatchDetail;

    if (rawMatch.fixture_id || rawMatch.fixture) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = mapUltraToUI(rawMatch as any);
      if (!mapped) return null;
      transformed = {
        ...mapped,
        markets: rawMatch.markets || [],
        league: rawMatch.league || mapped.league,
      } as unknown as MatchDetail;
    } else {
      transformed = rawMatch as MatchDetail;
    }

    if (transformed.markets) {
      transformed.markets = [...transformed.markets]
        .filter(market => !shouldHideMarket(market.name))
        .sort((a, b) => {
          const weightA = getMarketWeight(a.name);
          const weightB = getMarketWeight(b.name);
          if (weightA !== weightB) return weightA - weightB;
          return a.name.localeCompare(b.name);
        })
        .map(market => ({
          ...market,
          values: sortMarketOptions(market.name, (market.values || []).map((v: OptionItem) => ({
            ...v,
            value: normalizeValue(v.value)
          })) as OptionItem[])
        }));
    }

    return transformed;
  }, [rawMatch]);

  const filteredMarkets = useMemo(() => {
    if (!match?.markets) return [];
    
    const markets = match.markets.filter((m: { name: string }) => {
      if (m.name === 'Match Winner' || m.name === 'Fulltime Result') return false;
      return true;
    });

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      return markets.filter((m: { name: string; values?: { value: string; handicap?: string }[] }) => {
        const nameMatch = m.name.toLowerCase().includes(query);
        if (nameMatch) return true;
        
        const optionMatch = m.values?.some(opt => 
          formatOptionLabel(opt.value, opt.handicap).toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query)
        );
        return optionMatch;
      });
    }

    return markets.filter((m: { name: string }) => isMarketInCategory(m.name, activeCategory));
  }, [match?.markets, activeCategory, searchQuery]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#000000] p-6 space-y-6">
       <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
       <div className="space-y-4">
          <MarketSkeleton />
          <MarketSkeleton />
       </div>
    </div>
  );

  if (!match) return <div className="p-20 text-center text-gray-500 uppercase font-black text-xs">Match introuvable</div>;

  const toggleMarket = (name: string) => {
    setExpandedMarkets(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const mainOdds = {
    home: parseFloat(match.markets?.find((mk: { name?: string }) => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find((v: { value: string; odd?: string }) => ['Home', '1'].includes(v.value))?.odd || '0'),
    draw: parseFloat(match.markets?.find((mk: { name?: string }) => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find((v: { value: string; odd?: string }) => ['Draw', 'X'].includes(v.value))?.odd || '0'),
    away: parseFloat(match.markets?.find((mk: { name?: string }) => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find((v: { value: string; odd?: string }) => ['Away', '2'].includes(v.value))?.odd || '0'),
  };

  const homeLogo = match.homeLogo;
  const awayLogo = match.awayLogo;
  const homeTeam = { name: match.home };
  const awayTeam = { name: match.away };

  const leagueName = typeof match.league === 'string' ? match.league : (match.league as unknown as { name?: string })?.name || 'Unknown League';

  return (
    <div className="min-h-full bg-[#000000] pb-32">
      
      {}
      <div className={`relative h-[260px] sm:h-[340px] overflow-hidden ${match.live ? '' : ''}`}>
         {}
         <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full scale-150" />
         <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/50 via-[#000000] to-[#000000]" />
         
         <div className="relative h-full max-w-[1200px] mx-auto px-6 pt-6 sm:pt-10 pb-4 sm:pb-8 flex flex-col">
            {}
            <div className="flex items-center justify-between mb-4 sm:mb-8">
               <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-blue-600 transition-all">
                  <ChevronLeft size={20} />
               </button>
               <div className="px-4 py-1.5 rounded-full flex items-center space-x-2 bg-blue-600/10 border border-blue-600/20">
                   <div className={`w-1.5 h-1.5 rounded-full ${match.live ? 'bg-red-500 animate-live-breath' : 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]'}`} />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">
                      {match.nation && `${match.nation} \u2022 `}{leagueName}
                   </span>
                </div>
               <div className="w-10 h-10" />
            </div>

            {}
            <div className="flex-1 flex items-center justify-between px-2 sm:px-12 max-w-[800px] mx-auto w-full">
               {}
               <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-2.5 sm:p-4 mb-3 sm:mb-4 border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                     {homeLogo ? (
                        <Image 
                          src={homeLogo} 
                          alt={match.home} 
                          fill
                          className="object-contain p-2" 
                        />
                     ) : (
                        <Trophy className="text-white opacity-20" size={28} />
                     )}
                  </div>
                  <h1 className="text-[10px] sm:text-lg font-black text-white uppercase text-center tracking-tight leading-tight max-w-[90px] sm:max-w-[120px] truncate-two-lines">{match.home}</h1>
               </div>

               {}
               <div className="flex flex-col items-center px-4 shrink-0 justify-center">
                  {match.live ? (
                     <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1.5 mb-1 sm:mb-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-breath" />
                           <span className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
                        </div>
                        <span className="text-3xl sm:text-5xl font-black text-white tracking-tighter tabular-nums">{match.score || '0 - 0'}</span>
                        <div className="mt-2 sm:mt-3 px-3 py-1 sm:px-4 sm:py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center space-x-1.5">
                           <Timer size={11} className="text-blue-400 animate-pulse" />
                           <span className="text-[10px] sm:text-[11px] font-black text-blue-400 tabular-nums">
                              <MatchTimer 
                                elapsed={match.elapsed}
                                statusShort={match.statusShort || ''}
                                isLive={match.live}
                                isFinished={match.finished}
                                isSuspended={match.suspended}
                                fallbackTime={match.time}
                              />
                           </span>
                        </div>
                     </div>
                  ) : match.finished ? (
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] sm:text-[10px] font-black text-gray-500 mb-1 sm:mb-2 uppercase tracking-widest">TERMIN&Eacute;</span>
                        <span className="text-3xl sm:text-5xl font-black text-white/50 tracking-tighter tabular-nums">{match.score || '0 - 0'}</span>
                        <div className="mt-2 sm:mt-3 px-3 py-1 sm:px-4 sm:py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center space-x-1.5">
                           <span className="text-[10px] sm:text-[11px] font-black text-gray-400 tabular-nums">
                              <MatchTimer 
                                elapsed={match.elapsed}
                                statusShort={match.statusShort || ''}
                                isLive={match.live}
                                isFinished={match.finished}
                                isSuspended={match.suspended}
                                fallbackTime={match.time}
                              />
                           </span>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center">
                        <div className="text-[9px] sm:text-[10px] font-black text-gray-500 mb-1 sm:mb-2 uppercase tracking-[0.2em] text-center">
                           {match.matchDate}
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-white/20">VS</div>
                        <div className="mt-2 sm:mt-3 px-3 py-1 sm:px-4 sm:py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center space-x-1.5">
                           <Timer size={11} className="text-blue-400" />
                           <span className="text-[10px] sm:text-[11px] font-black text-blue-400 tabular-nums">
                              <MatchTimer 
                                elapsed={match.elapsed}
                                statusShort={match.statusShort || ''}
                                isLive={match.live}
                                isFinished={match.finished}
                                isSuspended={match.suspended}
                                fallbackTime={match.time}
                              />
                           </span>
                        </div>
                     </div>
                  )}
               </div>

               {}
               <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-2.5 sm:p-4 mb-3 sm:mb-4 border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                     {awayLogo ? (
                        <Image 
                          src={awayLogo} 
                          alt={match.away} 
                          fill
                          className="object-contain p-2" 
                        />
                     ) : (
                        <Activity className="text-white opacity-20" size={28} />
                     )}
                  </div>
                  <h1 className="text-[10px] sm:text-lg font-black text-white uppercase text-center tracking-tight leading-tight max-w-[90px] sm:max-w-[120px] truncate-two-lines">{match.away}</h1>
               </div>
            </div>
         </div>
      </div>

      {}
      <div className="max-w-[800px] mx-auto px-4 md:px-6 space-y-6">
         
         {}
         <div className="relative pt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-2">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un marché ou un joueur..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center mt-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
         </div>

         {}
         {!searchQuery && (
           <div className="flex flex-wrap items-center gap-2 py-2">
             {CATEGORIES.filter(cat => {
               if (cat.id === 'Tous') return true;
               if (!match?.markets) return false;
               return match.markets.some((m: { name: string }) => {
                 if (m.name === 'Match Winner' || m.name === 'Fulltime Result') return false;
                 return isMarketInCategory(m.name, cat.id);
               });
             }).map(cat => {
               const isActive = activeCategory === cat.id;
               return (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id)}
                   className={`
                     px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 border
                     ${isActive 
                       ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                       : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                     }
                   `}
                 >
                   {cat.name}
                 </button>
               );
             })}
           </div>
         )}

         {}
         {!searchQuery && (activeCategory === 'Tous' || activeCategory === 'Principal') && (
           <div className="bezel-shell p-1 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bezel-core bg-[#000000] rounded-[calc(1.5rem-0.125rem)] p-5">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                       <h3 className="text-xs font-black text-white uppercase tracking-widest">R&eacute;sultat final</h3>
                    </div>
                    <BarChart3 size={16} className="text-gray-700" />
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '1', name: '1', odd: mainOdds.home || 0 },
                      { label: 'X', name: 'X', odd: mainOdds.draw || 0 },
                      { label: '2', name: '2', odd: mainOdds.away || 0 }
                    ].map((o) => {
                      const hasRealOdd = o.odd > 1.01;
                      const isAvailable = hasRealOdd && !match.suspended && !match.finished;
                      const displayOdd = hasRealOdd ? o.odd.toFixed(2) : '--';
                      const isSelected = isInSlip(match.id, 'Match Winner', o.label);
                      return (
                         <button
                           key={o.label}
                           disabled={!isAvailable}
                           onClick={() => {
                             if (!isAvailable) return;
                             toggleSelection({
                               id: `${match.id}-1x2-${o.label}`,
                               matchId: match.id,
                               home: homeTeam.name,
                               away: awayTeam.name,
                               league: leagueName,
                               marketName: 'Match Winner',
                               selectionLabel: o.label,
                               odds: o.odd,
                               nation: match.nation,
                               date: match.matchDate,
                               time: match.matchTime
                             });
                           }}
                           className={`
                             group relative h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 border
                             ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : !isAvailable ? 'bg-black/40 border-white/5 text-gray-800 cursor-not-allowed opacity-20 grayscale' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-blue-600/30 hover:text-white'}
                           `}
                         >
                            <span className="text-[10px] font-black opacity-50 mb-1">{o.name}</span>
                            <span className="text-lg font-black tracking-tight">{displayOdd}</span>
                         </button>
                      )
                    })}
                 </div>
              </div>
           </div>
         )}
 
         {}
         {filteredMarkets.map((market: { name: string; values?: { value: string; odd: string; handicap?: string }[] }) => (
            <div key={market.name} className="bezel-shell p-0.5 rounded-2xl">
               <div className="bezel-core bg-[#000000] rounded-[calc(1rem-0.125rem)] overflow-hidden">
                  <button 
                    onClick={() => toggleMarket(market.name)}
                    className="w-full px-5 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
                  >
                     <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getFrenchMarketName(market.name)}</span>
                     </div>
                     <ChevronDown 
                        size={16} 
                        className={`text-gray-600 transition-transform duration-500 ${expandedMarkets[market.name] ? 'rotate-180 text-blue-600' : ''}`} 
                     />
                  </button>

                  <div className={`
                     transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden
                     ${expandedMarkets[market.name] || searchQuery ? 'max-h-[2000px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'}
                  `}>
                     {(() => {
                        const options = (market.values || []) as OptionItem[];
                        const renderOption = (opt: OptionItem, idx: number) => {
                          const oddValue = parseFloat(opt.odd);
                          const hasRealOdd = oddValue > 1.01;
                          const optionLabel = formatOptionLabel(opt.value, opt.handicap);
                          const isAvailable = hasRealOdd && !match.suspended && isSelectionStillPossible(match, market.name, optionLabel);
                          const isSelected = isInSlip(match.id, market.name, opt.value, opt.handicap);

                          return (
                            <button
                              key={`${opt.value}-${opt.handicap || 'no-line'}-${idx}`}
                              disabled={!isAvailable}
                              onClick={() => {
                                if (!isAvailable) return;
                                toggleSelection({
                                  id: `${match.id}-${market.name}-${opt.value}-${opt.handicap || 'no-line'}`,
                                  matchId: match.id,
                                  home: homeTeam.name,
                                  away: awayTeam.name,
                                  league: leagueName,
                                  marketName: market.name,
                                  selectionLabel: opt.value,
                                  handicap: opt.handicap,
                                  odds: oddValue,
                                  nation: match.nation,
                                  date: match.matchDate,
                                  time: match.matchTime
                                });
                              }}
                              className={`
                                group w-full min-h-[44px] flex flex-row items-center justify-between px-3 py-2 rounded-md transition-all duration-200
                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : !isAvailable ? 'bg-white/[0.01] text-gray-800 cursor-not-allowed opacity-40 grayscale' : 'bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white'}
                              `}
                            >
                              <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate mr-2 transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{optionLabel}</span>
                              <span className={`text-[11px] md:text-xs font-black transition-colors shrink-0 ${isSelected ? 'text-white' : 'text-[#d3a936]'}`}>{hasRealOdd ? oddValue.toFixed(2) : '--'}</span>
                            </button>
                          );
                        };

                        if (shouldUseThreeColumnBuckets(market.name, options)) {
                          const under = options.filter(opt => getOptionBucket(opt) === 'under').sort((a, b) => getOptionLine(a) - getOptionLine(b));
                          const exact = options.filter(opt => getOptionBucket(opt) === 'exact').sort((a, b) => getOptionLine(a) - getOptionLine(b));
                          const over = options.filter(opt => getOptionBucket(opt) === 'over').sort((a, b) => getOptionLine(a) - getOptionLine(b));
                          const maxRows = Math.max(under.length, exact.length, over.length);

                          return (
                            <div className="space-y-2">
                              {Array.from({ length: maxRows }).map((_, rowIdx) => (
                                <div key={`bucket-row-${rowIdx}`} className="grid grid-cols-3 gap-1">
                                  {under[rowIdx] ? renderOption(under[rowIdx], rowIdx) : <div className="w-full min-h-[44px]" />}
                                  {exact[rowIdx] ? renderOption(exact[rowIdx], rowIdx) : <div className="w-full min-h-[44px]" />}
                                  {over[rowIdx] ? renderOption(over[rowIdx], rowIdx) : <div className="w-full min-h-[44px]" />}
                                </div>
                              ))}
                            </div>
                          );
                        }

                        const mName = market.name.toLowerCase();

                        if (mName.includes('handicap') && options.some(o => normVal(o.value).includes('draw') || normVal(o.value).match(/^x\b/) || normVal(o.value).includes('nul'))) {
                          const lineGroups = new Map<number, { home?: OptionItem, draw?: OptionItem, away?: OptionItem }>();
                          
                          options.forEach(opt => {
                            const valLower = normVal(opt.value);
                            const side = (valLower.includes('home') || valLower.match(/^1\b/)) ? 0 :
                                         (valLower.includes('draw') || valLower.match(/^x\b/) || valLower.includes('nul')) ? 1 : 2;
                            const raw = opt.handicap || opt.value.match(/[-+]?\d+\.?\d*/)?.[0] || '0';
                            const lineVal = parseFloat(String(raw).replace(',', '.'));
                            const canonicalLine = side === 2 ? -lineVal : lineVal;
                            
                            if (!lineGroups.has(canonicalLine)) lineGroups.set(canonicalLine, {});
                            const group = lineGroups.get(canonicalLine)!;
                            if (side === 0) group.home = opt;
                            else if (side === 1) group.draw = opt;
                            else group.away = opt;
                          });

                          const sortedLines = Array.from(lineGroups.keys()).sort((a, b) => a - b);

                          return (
                            <div className="space-y-2">
                              {sortedLines.map((line, rowIdx) => {
                                const g = lineGroups.get(line)!;
                                return (
                                  <div key={`hc-line-${line}-${rowIdx}`} className="grid grid-cols-3 gap-1">
                                    {g.home ? renderOption(g.home, rowIdx * 3) : <div className="w-full min-h-[44px]" />}
                                    {g.draw ? renderOption(g.draw, rowIdx * 3 + 1) : <div className="w-full min-h-[44px]" />}
                                    {g.away ? renderOption(g.away, rowIdx * 3 + 2) : <div className="w-full min-h-[44px]" />}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        if (mName.includes('exact score') || mName.includes('correct score')) {
                           const homeScores: OptionItem[] = [];
                           const drawScores: OptionItem[] = [];
                           const awayScores: OptionItem[] = [];
                           const otherScores: OptionItem[] = [];

                           options.forEach(opt => {
                             const matchRe = opt.value.match(/^(\d+)\s*[-:]\s*(\d+)$/);
                             if (matchRe) {
                               const h = parseInt(matchRe[1]);
                               const a = parseInt(matchRe[2]);
                               if (h > a) homeScores.push(opt);
                               else if (h === a) drawScores.push(opt);
                               else awayScores.push(opt);
                             } else {
                               otherScores.push(opt);
                             }
                           });
                           
                           const sortByScore = (a: OptionItem, b: OptionItem) => {
                             const m1 = a.value.match(/^(\d+)\s*[-:]\s*(\d+)$/);
                             const m2 = b.value.match(/^(\d+)\s*[-:]\s*(\d+)$/);
                             if (!m1 || !m2) return 0;
                             const h1 = parseInt(m1[1]); const a1 = parseInt(m1[2]);
                             const h2 = parseInt(m2[1]); const a2 = parseInt(m2[2]);
                             if (h1 + a1 !== h2 + a2) return (h1 + a1) - (h2 + a2);
                             return h1 - h2;
                           };
                           homeScores.sort(sortByScore);
                           drawScores.sort(sortByScore);
                           awayScores.sort(sortByScore);

                           const maxRows = Math.max(homeScores.length, drawScores.length, awayScores.length);
                           
                           return (
                             <div className="space-y-1">
                               {Array.from({ length: maxRows }).map((_, rowIdx) => (
                                 <div key={`score-row-${rowIdx}`} className="grid grid-cols-3 gap-1">
                                   {homeScores[rowIdx] ? renderOption(homeScores[rowIdx], rowIdx * 3) : <div className="w-full min-h-[44px]" />}
                                   {drawScores[rowIdx] ? renderOption(drawScores[rowIdx], rowIdx * 3 + 1) : <div className="w-full min-h-[44px]" />}
                                   {awayScores[rowIdx] ? renderOption(awayScores[rowIdx], rowIdx * 3 + 2) : <div className="w-full min-h-[44px]" />}
                                 </div>
                               ))}
                               {otherScores.length > 0 && (
                                 <div className="grid grid-cols-2 gap-1 mt-1">
                                   {otherScores.map((opt, idx) => renderOption(opt, idx))}
                                 </div>
                               )}
                             </div>
                           );
                        }

                        let layoutClass = 'grid-cols-2';

                        const isPlayerMarket = mName.includes('player') || mName.includes('scorer') || mName.includes('booked') || mName.includes('sent off') || mName.includes('cards');
                        
                        if (isPlayerMarket) {
                          const playerRows = new Map<string, Record<string, OptionItem>>();
                          const allLines = new Set<string>();

                          options.forEach(opt => {
                             let player = opt.value.trim();
                             let line = 'Sì';

                             const matchOu = opt.value.match(/^(.*?)\s+(Over|Under|Plus de|Moins de)\s+([0-9.]+)$/i);
                             if (matchOu) {
                               player = matchOu[1].trim();
                               const isOver = matchOu[2].toLowerCase().includes('over') || matchOu[2].toLowerCase().includes('plus');
                               line = `${isOver ? 'Over' : 'Under'} ${matchOu[3]}`;
                             } else {
                               const matchYn = opt.value.match(/^(.*?)\s+(Yes|No|Oui|Non)$/i);
                               if (matchYn) {
                                 player = matchYn[1].trim();
                                 line = matchYn[2];
                               }
                             }

                             if (!playerRows.has(player)) playerRows.set(player, {});
                             playerRows.get(player)![line] = opt;
                             allLines.add(line);
                          });

                          if (allLines.size === 1 && allLines.has('Sì')) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                {options.map((opt, idx) => renderOption(opt, idx))}
                              </div>
                            );
                          }

                          const sortedPlayers = Array.from(playerRows.keys()).sort();
                          const sortedLines = Array.from(allLines).sort((a, b) => {
                             const getSortKey = (l: string) => {
                               if (l.toLowerCase().includes('over')) return `${l.split(' ')[1]}-1`;
                               if (l.toLowerCase().includes('under')) return `${l.split(' ')[1]}-2`;
                               return l;
                             };
                             return getSortKey(a).localeCompare(getSortKey(b));
                          });

                          return (
                            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                              <div className="min-w-[400px]">
                                <div className="flex flex-row items-center justify-between px-3 py-2 mb-1 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                   <div className="flex-1">Joueur</div>
                                   <div className="flex flex-row gap-1">
                                      {sortedLines.map(line => (
                                        <div key={line} className="w-[72px] text-center">{line}</div>
                                      ))}
                                   </div>
                                </div>
                                <div className="space-y-1">
                                   {sortedPlayers.map((player) => {
                                      const rowData = playerRows.get(player)!;
                                      return (
                                        <div key={player} className="flex flex-row items-center justify-between px-3 py-1.5 bg-white/[0.01] rounded-md hover:bg-white/[0.03] transition-colors">
                                           <div className="flex-1 text-[11px] font-bold text-gray-300 truncate pr-2">{player}</div>
                                           <div className="flex flex-row gap-1">
                                              {sortedLines.map(line => {
                                                const opt = rowData[line];
                                                if (!opt) return <div key={line} className="w-[72px] h-[36px]" />;
                                                
                                                const oddValue = parseFloat(opt.odd);
                                                const hasRealOdd = oddValue > 1.01;
                                                const isAvailable = hasRealOdd && !match.suspended && isSelectionStillPossible(match, market.name, opt.value);
                                                const isSelected = isInSlip(match.id, market.name, opt.value, opt.handicap);

                                                return (
                                                  <button
                                                    key={line}
                                                    disabled={!isAvailable}
                                                    onClick={() => {
                                                      if (!isAvailable) return;
                                                      toggleSelection({
                                                        id: `${match.id}-${market.name}-${opt.value}-${opt.handicap || 'no-line'}`,
                                                        matchId: match.id,
                                                        home: homeTeam.name,
                                                        away: awayTeam.name,
                                                        league: leagueName,
                                                        marketName: market.name,
                                                        selectionLabel: opt.value,
                                                        handicap: opt.handicap,
                                                        odds: oddValue,
                                                        nation: match.nation,
                                                        date: match.matchDate,
                                                        time: match.matchTime
                                                      });
                                                    }}
                                                    className={`
                                                      w-[72px] h-[36px] flex items-center justify-center rounded transition-all duration-200
                                                      ${isSelected ? 'bg-blue-600 text-white shadow-md' : !isAvailable ? 'bg-black/40 text-gray-800 cursor-not-allowed opacity-30 grayscale' : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#d3a936]'}
                                                    `}
                                                  >
                                                    <span className={`text-[11px] font-black ${isSelected ? 'text-white' : ''}`}>{hasRealOdd ? oddValue.toFixed(2) : '--'}</span>
                                                  </button>
                                                );
                                              })}
                                           </div>
                                        </div>
                                      );
                                   })}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (
                          mName.includes('1x2') || 
                          mName.includes('winner') || 
                          mName.includes('result') || 
                          mName.includes('score') || 
                          mName.includes('double chance') || 
                          mName.includes('3-way') || 
                          mName.includes('european handicap') ||
                          mName.includes('which team will score') ||
                          mName.includes('last team to score')
                        ) {
                          if (mName.includes('both teams to score') && !mName.includes('result')) {
                            layoutClass = 'grid-cols-2';
                          } else {
                            layoutClass = 'grid-cols-3';
                          }
                        } else if (
                          mName.includes('over/under') ||
                          mName.includes('asian handicap') ||
                          mName.includes('draw no bet') ||
                          mName.includes('interval')
                        ) {
                          layoutClass = 'grid-cols-2';
                        } else if (options.length === 3) {
                          layoutClass = 'grid-cols-3';
                        }

                        return (
                          <div className={`grid ${layoutClass} gap-1`}>
                            {options.map((opt, idx) => renderOption(opt, idx))}
                          </div>
                        );
                     })()}
                  </div>
               </div>
            </div>
         ))}
 
         {filteredMarkets.length === 0 && (!searchQuery && activeCategory !== 'Tous' && activeCategory !== 'Principal' || !mainOdds.home) && (
           <div className="py-16 text-center opacity-30">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aucun marché disponible pour cette catégorie</span>
           </div>
         )}
 
         <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-700 text-[9px] font-black uppercase tracking-[0.3em]">
               <Info size={12} />
               <span>Flux officiel v&eacute;rifi&eacute;</span>
            </div>
         </div>
      </div>
    </div>
  );
}

