'use client';

import { useState } from 'react';
import { useAuth } from './auth-context';
import { useBet } from './bet-context';
import { api } from './api';

interface UsePlaceBetCallbacks {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

interface UsePlaceBetReturn {
  placeBet: (stake: number) => Promise<boolean>;
  isPlacing: boolean;
  error: string | null;
  success: string | null;
  clearSuccess: () => void;
  clearError: () => void;
}

export function usePlaceBet(callbacks?: UsePlaceBetCallbacks): UsePlaceBetReturn {
  const { token, user, refreshBalance } = useAuth();
  const { selections } = useBet();

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearSuccess = () => setSuccess(null);
  const clearError = () => setError(null);

  const placeBet = async (stake: number): Promise<boolean> => {
    if (!token || !user) {
      setError('Vous devez être connecté.');
      callbacks?.onError?.('Vous devez être connecté.');
      return false;
    }
    if (stake <= 0) {
      setError('Insérez une mise valide');
      callbacks?.onError?.('Insérez une mise valide');
      return false;
    }
    if (stake > (user.balance ?? 0)) {
      setError('Solde insuffisant');
      callbacks?.onError?.('Solde insuffisant');
      return false;
    }
    if (selections.some(s => s.suspended)) {
      setError('Sélection suspendue');
      callbacks?.onError?.('Sélection suspendue');
      return false;
    }

    setIsPlacing(true);
    setError(null);
    setSuccess(null);

    try {
      await api.transactions.placeBet(token, {
        stake,
        selections: selections.map(s => ({
          matchId: Number(s.matchId),
          homeTeam: s.home,
          awayTeam: s.away,
          league: s.league,
          market: s.marketName,
          pick: s.selectionLabel,
          handicap: s.handicap,
          odd: s.odds,
          nation: s.nation,
          matchDate: s.date,
          matchTime: s.time
        }))
      });

      await refreshBalance();
      setSuccess('Pari placé avec succès !');
      callbacks?.onSuccess?.();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec du placement du pari';
      setError(message);
      callbacks?.onError?.(message);
      return false;
    } finally {
      setIsPlacing(false);
    }
  };

  return { placeBet, isPlacing, error, success, clearSuccess, clearError };
}
