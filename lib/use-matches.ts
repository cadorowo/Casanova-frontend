import useSWR from 'swr';
import { api } from './api';
import { useEffect } from 'react';
import { socket } from './socket';

export const normalizeValue = (val: string): string => {
  const v = String(val || '').trim();
  const vLower = v.toLowerCase();
  if (vLower === 'home') return '1';
  if (vLower === 'draw') return 'X';
  if (vLower === 'away') return '2';
  if (vLower === 'home/draw' || vLower === 'home or draw') return '1X';
  if (vLower === 'draw/away' || vLower === 'draw or away') return 'X2';
  return v;
};
export const translateMarketName = (name: string): string => {
  const n = String(name || '').trim();
  const nLower = n.toLowerCase();

  if (nLower.includes('correct score - first half') || nLower.includes('exact score - first half') || nLower.includes('correct score first half') || nLower.includes('exact score first half')) {
    return 'Score Exact Mi-temps';
  }
  if (nLower.includes('match winner') || nLower.includes('fulltime result') || nLower.includes('full time result')) {
    return 'Résultat Final';
  }
  if (nLower.includes('double chance')) {
    return 'Double Chance';
  }
  if (nLower.includes('draw no bet') || nLower === 'home/away' || nLower === 'home or away') {
    return 'Remboursé si Nul';
  }
  if (nLower.includes('result') && (nLower.includes('both teams to score') || nLower.includes('both teams score') || nLower.includes('btts'))) {
    return 'Résultat & Les deux équipes marquent';
  }
  if (nLower.includes('both teams to score') || nLower.includes('both teams score') || nLower === 'btts') {
    return 'Les deux équipes marquent';
  }
  if (nLower.includes('exact score') || nLower.includes('correct score') || nLower.includes('final score')) {
    return 'Score Exact';
  }
  if (nLower.includes('asian handicap (1st half)') || nLower.includes('asian handicap first half')) {
    return 'Handicap Asiatique - 1ère Mi-temps';
  }
  if (nLower.includes('asian handicap')) {
    return 'Handicap Asiatique';
  }
  if (nLower.includes('3-way handicap') || nLower.includes('handicap result') || nLower.includes('handicap')) {
    return 'Handicap';
  }
  if (nLower.includes('home team goals') || nLower === 'total - home') {
    return 'Total Buts - Domicile';
  }
  if (nLower.includes('away team goals') || nLower === 'total - away') {
    return 'Total Buts - Extérieur';
  }
  if (nLower.includes('corners 1x2') || nLower.includes('corners result')) {
    return 'Résultat Corners (1X2)';
  }
  if (nLower.includes('total corners') || nLower.includes('match corners') || nLower.includes('corners over under') || nLower.includes('corners over/under') || nLower.includes('corners')) {
    return 'Total Corners';
  }
  if (nLower.includes('goals odd/even') || nLower.includes('odd/even goals') || nLower.includes('goals odd even')) {
    return 'Buts Pair/Impair';
  }
  if (nLower.includes('over/under (1st half)') || nLower.includes('over/under - 1st half') || nLower.includes('over/under first half')) {
    return 'Total de Buts - 1ère Mi-temps';
  }
  if (nLower.includes('first half goals') || nLower.includes('1st half goals') || nLower.includes('goals over/under - first half') || nLower.includes('goals over/under first half')) {
    return 'Buts en 1ère Mi-temps';
  }
  if (nLower.includes('goals over/under') || nLower.includes('match goals') || nLower.includes('total goals') || nLower.includes('over/under')) {
    return 'Total de Buts';
  }
  if (nLower.includes('to win 2nd half') || nLower.includes('winner 2nd half') || nLower.includes('2nd half winner')) {
    return 'Résultat 2ème Mi-temps';
  }
  if (nLower.includes('home team score a goal (2nd half)') || nLower.includes('home team score a goal 2nd half')) {
    return 'Équipe Domicile Marque (2ème Mi-temps)';
  }
  if (nLower.includes('away team score a goal (2nd half)') || nLower.includes('away team score a goal 2nd half')) {
    return 'Équipe Extérieur Marque (2ème Mi-temps)';
  }
  if (nLower === '1x2 (1st half)' || nLower.includes('1x2 (1st half)')) {
    return 'Résultat Mi-temps (1X2)';
  }
  if (nLower.includes('half time result') || nLower.includes('halftime result') || nLower.includes('1st half result') || nLower.includes('first half winner') || nLower.includes('1st half winner')) {
    return 'Résultat Mi-temps';
  }
  if (nLower.includes('half time / full time') || nLower.includes('ht/ft') || nLower.includes('halftime/fulltime') || nLower.includes('ht/ft double')) {
    return 'Mi-temps / Fin de match';
  }
  if (nLower.includes('result/total goals') || nLower.includes('result & total goals') || nLower.includes('result & goals') || nLower.includes('result/goals')) {
    return 'Résultat & Total Buts';
  }
  if (nLower.includes('clean sheet')) {
    return 'Clean Sheet';
  }
  if (nLower.includes('first goal') || nLower.includes('1st goal') || nLower.includes('first team to score') || nLower.includes('team to score the 1st')) {
    return 'Premier But';
  }
  if (nLower.includes('last team to score') || nLower.includes('last goal')) {
    return 'Dernier But';
  }
  if (nLower.includes('possession')) {
    return 'Possession';
  }
  if (nLower.includes('shots')) {
    return 'Total Tirs';
  }
  if (nLower.includes('fouls') || nLower.includes('foul')) {
    return 'Total Fautes';
  }
  if (nLower.includes('offsides') || nLower.includes('offside')) {
    return 'Hors-jeu';
  }
  if (nLower.includes('card')) {
    return 'Cartons';
  }
  if (nLower.includes('player')) {
    return 'Performance Joueur';
  }

  return n;
};

export const translateOptionValue = (val: string): string => {
  const v = String(val || '').trim();
  const vLower = v.toLowerCase();

  if (vLower === 'yes' || vLower === 'oui') return 'Oui';
  if (vLower === 'no' || vLower === 'non') return 'Non';
  if (vLower === 'no goal' || vLower === 'no goals' || vLower === 'none') return 'Aucun But';

  // Odd/Even (Goals Odd/Even market)
  if (vLower === 'odd') return 'Impair';
  if (vLower === 'even') return 'Pair';

  // Double Chance combos
  if (vLower === 'home or draw' || vLower === 'home/draw' || vLower === '1x') return '1X';
  if (vLower === 'draw or away' || vLower === 'draw/away' || vLower === 'x2' || vLower === 'away or draw') return 'X2';
  if (vLower === 'home or away' || vLower === 'home/away' || vLower === '12') return '1 ou 2';

  // HT/FT combos (e.g. "1/2", "X/1")
  if (/^[1x2]\/[1x2]$/i.test(vLower)) return v.toUpperCase();

  let translated = v;
  if (vLower.includes('exactly')) {
    translated = translated.replace(/exactly/i, 'Exactement');
  }
  if (vLower.includes('over')) {
    translated = translated.replace(/over/i, 'Plus de');
  } else if (vLower.includes('under')) {
    translated = translated.replace(/under/i, 'Moins de');
  }

  if (vLower.includes('home')) {
    translated = translated.replace(/home/i, '1');
  }
  if (vLower.includes('draw')) {
    translated = translated.replace(/draw/i, 'X');
  }
  if (vLower.includes('away')) {
    translated = translated.replace(/away/i, '2');
  }

  return translated;
};


export interface SportMatch {

  fixture_id: number;
  fixture: {
    id: number;
    status: {
      long: string;
      short: string;
      elapsed: number;
    };
    timestamp: number;
    date: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number; away: number };
  score: {
    fulltime: { home: number; away: number };
    extratime?: { home: number; away: number };
    penalty?: { home: number; away: number };
  };
  bookmaker_name: string;
  suspended: boolean;
  markets: Array<{
    name: string;
    values: Array<{ value: string; odd: string; handicap?: string }>;
  }>;
}

export const mapUltraToUI = (m: SportMatch) => {
  if (!m || !m.teams) return null; 
  
  return {
    _id: m.fixture_id?.toString() || '0',
    id: m.fixture_id?.toString() || '0',
    home: m.teams?.home?.name || 'Unknown',
    away: m.teams?.away?.name || 'Unknown',
    homeLogo: m.teams?.home?.logo,
    awayLogo: m.teams?.away?.logo,
    league: m.league?.name || 'Unknown',
    nation: m.league?.country || 'Unknown',
    live: ['1H', 'HT', '2H', 'ET', 'P'].includes(m.fixture?.status?.short || ''),
    finished: ['FT', 'AET', 'PEN'].includes(m.fixture?.status?.short || ''),
    score: m.goals ? `${m.goals.home} - ${m.goals.away}` : '0 - 0',
    elapsed: m.fixture?.status?.elapsed || 0,
    statusShort: m.fixture?.status?.short || '',
    timestamp: m.fixture?.timestamp || 0,
    time: m.fixture?.date ? new Date(m.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Tunis' }) : '--:--',
    matchDate: m.fixture?.date ? new Date(m.fixture.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Tunis' }) : '',
    matchTime: m.fixture?.date ? new Date(m.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Tunis' }) : '--:--',
    suspended: m.suspended || false,
    odds: {
      home: parseFloat(m.markets?.find(mk => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find(v => ['Home', '1'].includes(v.value))?.odd || '0'),
      draw: parseFloat(m.markets?.find(mk => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find(v => ['Draw', 'X'].includes(v.value))?.odd || '0'),
      away: parseFloat(m.markets?.find(mk => mk.name?.includes('Match Winner') || mk.name?.includes('Fulltime Result'))?.values?.find(v => ['Away', '2'].includes(v.value))?.odd || '0'),
    },
    markets: m.markets?.map(mk => ({
      ...mk,
      values: mk.values?.map(v => ({
        ...v,
        value: normalizeValue(v.value)
      }))
    }))
  };
};

export default function useMatches(sport?: string | null, fallbackData?: SportMatch[]) {
  const { data, error, isLoading, mutate } = useSWR<SportMatch[]>(
    'live-matches',
    () => api.games.getMatches(sport || undefined),
    { 
      fallbackData,
      revalidateOnFocus: false, 
      revalidateOnMount: true 
    } 
  );

  useEffect(() => {
    if (!socket || !socket.emit) return;

    socket.emit('subscribe_fixtures_list');

    const handleOddsUpdate = (updatedMatch: SportMatch) => {
      console.log(`[WebSocket] Odds update received for fixture ${updatedMatch.fixture_id}`);
      mutate((currentData?: SportMatch[]) => {
        if (!currentData || !Array.isArray(currentData)) return currentData;
        
        const exists = currentData.some(m => m.fixture_id === updatedMatch.fixture_id);
        
        if (exists) {
          return currentData.map(m => {
            if (m.fixture_id === updatedMatch.fixture_id) {
              return { ...m, ...updatedMatch };
            }
            return m;
          });
        } else {
          return [...currentData, updatedMatch];
        }
      }, false);
    };

    socket.on('odds_update', handleOddsUpdate);

    return () => {
      socket.emit('unsubscribe_fixtures_list');
      socket.off('odds_update', handleOddsUpdate);
    };
  }, [socket, mutate]);

  const matches = data ? data.map(mapUltraToUI).filter((m): m is NonNullable<ReturnType<typeof mapUltraToUI>> => m !== null) : [];

  return {
    matches,
    isLoading,
    isError: error,
    mutate
  };
}
