export interface User {
  id: string;
  _id?: string;
  username: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  bonusBalance: number;
  totalSpent?: number;
  totalReceived?: number;
  role: 'user' | 'admin';
  adminWallet?: number;
}

export interface Game {
  _id: string;
  title: string;
  slug: string;
  provider: string;
  category: 'slots' | 'table-games' | 'live-casino' | 'video-poker' | 'specialty';
  subcategory?: string;
  thumbnail: string;
  description: string;
  rtp: number;
  volatility: 'low' | 'medium' | 'high';
  features: string[];
  minBet: number;
  maxBet: number;
  isPopular: boolean;
  isNew: boolean;
  isFeatured: boolean;
  hasJackpot: boolean;
  jackpotAmount?: number;
  demoAvailable: boolean;
  launchUrl: string;
  launchType?: string;
}

export interface Promotion {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: 'welcome-bonus' | 'reload-bonus' | 'free-spins' | 'cashback' | 'vip-bonus';
  bonusAmount?: number;
  bonusPercentage?: number;
  freeSpins?: number;
  minDeposit?: number;
  maxBonus?: number;
  wageringRequirement: number;
  validFrom: string;
  validUntil?: string;
  promoCode?: string;
  terms: string;
  image: string;
  isActive: boolean;
}

export interface Transaction {
  _id: string;
  userId: string | User;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'admin_transfer' | 'admin_transfer_receive' | 'admin_buy_in' | 'casino_bet' | 'casino_win';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface Bet {
  _id: string;
  userId: string;
  matchId: string;
  selection: string;
  selectionLabel: string;
  odds: number;
  amount: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  matchInfo: {
    home: string;
    away: string;
    league: string;
  };
  createdAt: string;
}
