'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { socket } from './socket';

export interface Selection {
  id: string;
  matchId: string;
  home: string;
  away: string;
  league: string;
  marketName: string;
  selectionLabel: string;
  handicap?: string;
  odds: number;
  nation?: string;
  date?: string;
  time?: string;
  prevOdds?: number;
  oddsChangeType?: 'up' | 'down' | null;
  suspended?: boolean;
}

interface MarketUpdate {
  name: string;
  values?: Array<{ value: string; odd: string; handicap?: string }>;
  bets?: Array<{ value: string; odd: string; handicap?: string }>;
}

interface OddsUpdateData {
  id?: string | number;
  fixture_id?: string | number;
  finished?: boolean;
  suspended?: boolean;
  markets?: MarketUpdate[];
}

interface BetContextType {
  selections: Selection[];
  isSlipOpen: boolean;
  totalOdds: number;
  toggleSelection: (selection: Selection) => void;
  removeSelection: (id: string) => void;
  clearSlip: () => void;
  openSlip: () => void;
  closeSlip: () => void;
  isInSlip: (matchId: string, marketName: string, selectionLabel: string, handicap?: string) => boolean;
  error: string | null;
  setError: (msg: string | null) => void;
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export function BetProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, openLogin, user } = useAuth();

  useEffect(() => {
    const handleOddsUpdate = (data: OddsUpdateData) => {
      setSelections(prev => prev.map(sel => {
        if (String(sel.matchId) === String(data.id || data.fixture_id)) {
          if (data.finished || data.suspended) {
            return { ...sel, suspended: true };
          }

          const updatedMarket = data.markets?.find((m: MarketUpdate) => 
            m.name === sel.marketName ||
            (sel.marketName === 'Match Winner' && m.name === 'Fulltime Result') ||
            (sel.marketName === 'Fulltime Result' && m.name === 'Match Winner')
          );

          if (!updatedMarket) {
            return { ...sel, suspended: true };
          }
          
          const isMatch = (val: string, label: string, valueHandicap?: string) => {
            const sameHandicap = String(valueHandicap || '') === String(sel.handicap || '');
            if (!sameHandicap) return false;
            if (val === label) return true;
            const vLower = val.toLowerCase();
            const lLower = label.toLowerCase();
            if (lLower === '1' && (vLower === 'home' || vLower === '1')) return true;
            if (lLower === 'x' && (vLower === 'draw' || vLower === 'x')) return true;
            if (lLower === '2' && (vLower === 'away' || vLower === '2')) return true;
            return false;
          };

          const updatedValue = updatedMarket?.values?.find((v: { value: string; odd: string; handicap?: string }) => isMatch(v.value, sel.selectionLabel, v.handicap)) || 
                               updatedMarket?.bets?.find((v: { value: string; odd: string; handicap?: string }) => isMatch(v.value, sel.selectionLabel, v.handicap)); 

          if (updatedValue) {
            const newOdd = parseFloat(updatedValue.odd);
            const isSuspended = newOdd <= 1.01;

            if (isSuspended) {
              return { ...sel, odds: newOdd, suspended: true };
            }

            if (newOdd !== sel.odds || sel.suspended) {
              console.log(`[BetSync] Odds changed for ${sel.home} v ${sel.away}: ${sel.odds} -> ${newOdd}`);
              setTimeout(() => {
                setSelections(current => current.map(c => 
                  c.id === sel.id ? { ...c, oddsChangeType: null } : c
                ));
              }, 3000);
              return {
                ...sel,
                prevOdds: sel.odds,
                odds: newOdd,
                oddsChangeType: newOdd > sel.odds ? 'up' : 'down',
                suspended: false
              };
            }
          } else {
            return { ...sel, suspended: true };
          }
        }
        return sel;
      }));
    };

    socket.on('odds_update', handleOddsUpdate);
    return () => {
      socket.off('odds_update', handleOddsUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearSlip();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selections.length === 0) {
      setIsSlipOpen(false);
    }
  }, [selections.length]);

  const toggleSelection = (selection: Selection) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (user?.role === 'admin') {
      setError('Admins cannot place bets in the Arena.');
      return;
    }

    setSelections(prev => {
      const exists = prev.find(s => s.id === selection.id);
      if (exists) {
        return prev.filter(s => s.id !== selection.id);
      }
      
      const filtered = prev.filter(s => s.matchId !== selection.matchId);
      
      setIsSlipOpen(true);
      
      return [...filtered, selection];
    });
  };

  const removeSelection = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const clearSlip = () => {
    setSelections([]);
    setIsSlipOpen(false);
  };

  const openSlip = () => setIsSlipOpen(true);
  const closeSlip = () => setIsSlipOpen(false);

  const isInSlip = (matchId: string, marketName: string, selectionLabel: string, handicap?: string) => 
    selections.some(s =>
      s.matchId === matchId &&
      s.marketName === marketName &&
      s.selectionLabel === selectionLabel &&
      String(s.handicap || '') === String(handicap || '')
    );

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);

  return (
    <BetContext.Provider value={{ 
      selections, 
      isSlipOpen, 
      totalOdds, 
      toggleSelection, 
      removeSelection,
      clearSlip, 
      openSlip,
      closeSlip,
      isInSlip,
      error,
      setError
    }}>
      {children}
    </BetContext.Provider>
  );
}

export const useBet = () => {
  const context = useContext(BetContext);
  if (!context) throw new Error('useBet must be used within a BetProvider');
  return context;
}
