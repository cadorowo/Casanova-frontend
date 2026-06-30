'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { api } from './api';
import { useSocketSync } from './use-socket-sync';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (phone: string, pass: string) => Promise<boolean>;
  register: (phone: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshBalance: () => Promise<void>;
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setToken('authenticated');
    }

    api.user.getMe()
      .then(profile => {
        if (profile) {
          setUser(profile as User);
          setToken('authenticated');
          localStorage.setItem('user', JSON.stringify(profile));
        }
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('user');
      });
  }, []);

  const login = async (phone: string, pass: string) => {
    const response = await api.auth.login({ phone, password: pass });
    if (response?.user) {
      localStorage.setItem('user', JSON.stringify(response.user));

      const freshProfile = await api.user.getMe();
      const finalUser = { ...response.user, ...freshProfile };
      setUser(finalUser);
      setToken('authenticated');
      localStorage.setItem('user', JSON.stringify(finalUser));

      return true;
    }
    throw new Error(response?.message || 'Login failed');
  };

  const register = async (phone: string, pass: string) => {
    await api.auth.register({ phone, password: pass });
    return await login(phone, pass);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await api.user.getMe();
      if (profile) {
        updateUser({
          balance: profile.balance,
          bonusBalance: profile.bonusBalance,
          adminWallet: profile.adminWallet
        });
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [user, updateUser]);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeAuth = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  useSocketSync(
    refreshBalance,
    useCallback((data: { userId: string; balance: number; isSubAdmin?: boolean }) => {
      if (user && (user.id === data.userId || user._id === data.userId)) {
        updateUser(data.isSubAdmin ? { adminWallet: data.balance } : { balance: data.balance });
      }
    }, [user, updateUser])
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        refreshBalance,
        isAuthenticated: !!user,
        openLogin,
        openRegister,
        closeAuth,
        isLoginOpen,
        isRegisterOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
