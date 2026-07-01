import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] as string;

declare global {
  var __cassanova_socket: Socket | undefined;
}

function getTokenFromCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function createSocket(): Socket {
  const s = io(WEBSOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 3000,
    timeout: 5000,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: (cb) => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || getTokenFromCookie('auth_token');
      cb({ token: token || undefined });
    }
  });

  s.on('connect', () => {
    console.log(`[Socket] ✅ Connected to Casanova Arena (id: ${s.id})`);
  });

  s.on('disconnect', (reason) => {
    console.warn(`[Socket] ⚠️  Disconnected: ${reason}`);
  });

  s.on('connect_error', (err) => {
    if (err.message === 'Authentication required' || err.message === 'Invalid token') {
      console.warn(`[Socket] 🔒 Auth failed: ${err.message}`);
    } else {
      console.error(`[Socket] ❌ Connection error: ${err.message}`);
    }
  });

  s.on('reconnect', (attempt) => {
    console.log(`[Socket] 🔄 Reconnected after ${attempt} attempt(s)`);
  });

  return s;
}

export const socket: Socket = (() => {
  if (typeof window === 'undefined') return {} as Socket; 
  return (globalThis.__cassanova_socket ??= createSocket());
})();
