import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  
  const currentRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: currentRefreshToken }),
    credentials: 'include',
    signal: controller.signal
  }).then(async r => {
    clearTimeout(timeoutId);
    isRefreshing = false;
    if (r.ok) {
      const data = await r.json();
      if (data?.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
      if (data?.data?.refreshToken) {
        localStorage.setItem('refresh_token', data.data.refreshToken);
      }
      return true;
    }
    return false;
  }).catch(() => {
    clearTimeout(timeoutId);
    isRefreshing = false;
    return false;
  });
  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  _retry?: boolean;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url, { ...options, headers, credentials: 'include', signal: controller.signal });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré (10s). Veuillez vérifier votre connexion.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
  if (response.status === 401 && typeof window !== 'undefined' && !isAuthEndpoint) {
    if (!endpoint.includes('/auth/') && !options._retry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return request(endpoint, { ...options, _retry: true });
      }
    }

    localStorage.removeItem('user');
    Cookies.remove('user');
    
    const pathname = window.location.pathname;
    const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/bets');
    if (isProtected && pathname !== '/login' && pathname !== '/register') {
      window.location.href = '/login';
    }
    return null;
  }

  if (response.status === 404 || response.status === 501) {
    console.warn(`[API] Endpoint ${endpoint} is in reconstruction (Status: ${response.status}). Returning fallback.`);
    const isList = (endpoint.endsWith('matches') || endpoint.endsWith('promotions') || endpoint.endsWith('jackpots'));
    return isList ? [] : null;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error(`[API] JSON Parse Error on ${endpoint}:`, err);
    return null;
  }

  if (!response.ok) {
    const logoutMessages = ['User not found', 'Invalid or expired token', 'Invalid token', 'Token expired'];
    
    const errorMsg = data?.message || data?.error?.message || 'API request failed';
    
    if (data && logoutMessages.includes(errorMsg) && typeof window !== 'undefined' && !isAuthEndpoint) {
      localStorage.removeItem('user');
      Cookies.remove('user');
      
      const pathname = window.location.pathname;
      const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/bets');
      if (isProtected && pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login';
      }
      return null;
    }
    throw new Error(errorMsg);
  }

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data;
  }

  return data;
}

export const api = {
  auth: {
    register: (userData: { phone: string; password: string }) => 
      request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }),

    login: (credentials: { phone: string; password: string }) => 
      request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }),

    logout: () => 
      request('/auth/logout', {
        method: 'POST',
      }),

    verifyEmail: (token: string) => request(`/auth/verify/${token}`),
    
    resendVerification: (email: string) => 
      request('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, newPassword: string) => 
      request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      }),
  },

  games: {
    getAll: (params?: { category?: string; search?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/games${query ? `?${query}` : ''}`);
    },
    getBySlug: (slug: string) => request(`/games/${slug}`),
    getJackpots: () => request('/games/jackpots'),
    getSports: () => request('/games/sports'),
    getMatches: (sport?: string) => request(`/games/matches${sport ? `?sport=${sport}` : ''}`),
    getMatchById: (id: string) => request(`/games/matches/${id}`),
    launch: (token?: string, data?: { vendorCode: string; gameCode: string; language?: string }) => 
      request('/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      }),
  },

  slots: {
    createSession: (token?: string, gameSlug?: string) => 
      request('/slots/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ gameSlug }),
      }),
    closeSession: (token?: string) => 
      request('/slots/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
  },

  promotions: {
    getAll: (params?: { type?: string; isActive?: boolean }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/promotions${query ? `?${query}` : ''}`);
    },
    getBySlug: (slug: string) => request(`/promotions/${slug}`),
  },

  transactions: {
    getAll: (token?: string, days?: number) => 
      request(`/transactions${days ? `?days=${days}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    getBets: (token?: string | null, params?: URLSearchParams, days?: number) => {
      const p = params ? new URLSearchParams(params.toString()) : new URLSearchParams();
      if (days) p.append('days', days.toString());
      const q = p.toString();
      return request(`/transactions/bets${q ? `?${q}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },

    deposit: (token?: string, data?: { amount: number; paymentMethod: string }) => 
      request('/transactions/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      }),

    withdraw: (token?: string, data?: { amount: number; paymentMethod: string }) => 
      request('/transactions/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      }),

    placeBet: (token?: string, data?: { stake: number; selections: { matchId: number; homeTeam: string; awayTeam: string; league?: string; pick: string; handicap?: string; odd: number; nation?: string; matchDate?: string; matchTime?: string }[] }) => 
      request('/transactions/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      }),
  },

  user: {
    getMe: (token?: string) => 
      request('/users/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    getProfile: (token?: string) => 
      request('/users/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    toggleFavorite: (token?: string, gameId?: string) => 
      request('/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ gameId }),
      }),
  },

  admin: {
    getPendingRequests: (token?: string) => 
      request('/admin/pending', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    approveTransaction: (token?: string, transactionId?: string) => 
      request(`/admin/${transactionId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    rejectTransaction: (token?: string, transactionId?: string) => 
      request(`/admin/${transactionId}/reject`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    adminBuyIn: (token?: string, amount?: number) => 
      request('/admin/buy-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount }),
      }),
    adminTransfer: (token?: string, data?: { targetPhone: string; amount: number; isWithdraw?: boolean }) => 
      request('/admin/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      }),
    getFinancialLogs: (token?: string, days?: number) => 
      request(`/admin/financial-logs${days ? `?days=${days}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    getUsers: (token?: string, search?: string) => {
      const url = search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users';
      return request(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    getUserActivity: (token?: string, phone?: string, days?: number) => 
      request(`/admin/users/${phone}/transactions${days ? `?days=${days}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      }),
    getUserBets: (token: string, phone: string, days?: number) =>
      request(`/admin/users/${phone}/bets${days ? `?days=${days}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
