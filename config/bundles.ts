export interface CreditBundle {
  id: string;
  pay: number;
  receive: number;
  bonus: number;
  label: string;
  popular?: boolean;
}

export const PLAYER_BUNDLES: CreditBundle[] = [
  { id: 'starter', pay: 10, receive: 10, bonus: 0, label: 'Starter' },
  { id: 'pro', pay: 20, receive: 22, bonus: 10, label: 'Standard', popular: true },
  { id: 'elite', pay: 50, receive: 60, bonus: 20, label: 'Premium' },
  { id: 'legend', pay: 100, receive: 130, bonus: 30, label: 'Elite' },
];

export const ADMIN_BUNDLES: CreditBundle[] = [
  { id: 'admin-1k', pay: 500, receive: 1000, bonus: 50, label: 'Master 1K' },
  { id: 'admin-5k', pay: 2000, receive: 5000, bonus: 60, label: 'Master 5K', popular: true },
  { id: 'admin-10k', pay: 4000, receive: 10000, bonus: 60, label: 'Master 10K' },
  { id: 'admin-25k', pay: 8750, receive: 25000, bonus: 65, label: 'Master 25K' },
];
