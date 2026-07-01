'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LogOut, RefreshCw, Wallet, Shield } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const { user, isAuthenticated, logout, refreshBalance, openLogin, openRegister } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(amount) + ' TND';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:left-72 z-[60] py-6 md:py-8 px-4 md:px-8 pointer-events-none transition-all duration-700">

      {}
      <div className="flex md:hidden justify-center pointer-events-auto">
        <div className="w-full max-w-[400px]">
          {mounted && isAuthenticated ? (
            <div className="bezel-shell p-1 rounded-full animate-reveal">
              <div className="bezel-core bg-black/80 backdrop-blur-xl rounded-full px-1.5 py-1.5 flex items-center justify-between gap-1 h-[52px] overflow-hidden">
                
                {}
                <Link href="/sports" className="flex items-center space-x-2 px-3 min-w-0 shrink">
                  <Image src="/logo-short.png" alt="Casanova" width={32} height={32} className="w-8 h-8 object-contain" priority />
                </Link>

                {}
                <button 
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors shrink-0"
                >
                  <LogOut size={16} />
                </button>

                <div className="flex items-center gap-1 min-w-0 shrink">
                  {}
                  <div className="text-right px-1 min-w-0">
                    <div className="font-black text-[9px] text-white tracking-tighter truncate">
                      {user?.role === 'admin' 
                        ? formatBalance(user.adminWallet || 0)
                        : (user?.balance !== undefined ? formatBalance(user.balance) : '...')}
                    </div>
                  </div>

                  {user?.role === 'admin' ? (
                    <Link href="/admin" className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      <Shield size={12} />
                    </Link>
                  ) : (
                    <Link href="/deposit" className="gold-button w-8 h-8 flex items-center justify-center shrink-0">
                      <Wallet size={12} className="text-black" />
                    </Link>
                  )}
                </div>

              </div>
            </div>
          ) : mounted ? (
            <div className="bezel-shell p-1 rounded-full animate-reveal">
              <div className="bezel-core bg-black/80 backdrop-blur-xl rounded-full px-2 py-1.5 flex items-center justify-between h-[52px]">
                {}
                <Link href="/sports" className="flex items-center space-x-2 px-4 shrink-0">
                  <Image src="/logo-short.png" alt="Casanova" width={32} height={32} className="w-8 h-8 object-contain" priority />
                </Link>
                
                <div className="flex items-center space-x-1">
                  <button onClick={openLogin} className="px-4 py-2 font-black text-[10px] text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all">Login</button>
                  <button onClick={openRegister} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-black text-[10px] text-white uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95">Register</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[52px] bg-white/5 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {}
      <div className="hidden md:flex max-w-[1800px] mx-auto items-center justify-between pointer-events-none relative">
        
        {/* Left Space for alignment */}
        <div />

        {/* Center Space for alignment */}
        <div />

        {/* Right side - Wallet & Actions */}
        <div className="flex items-center shrink-0 pointer-events-auto">
          {mounted && isAuthenticated ? (
            <div className="bezel-shell p-1 rounded-full animate-reveal">
              <div className="bezel-core bg-black/90 backdrop-blur-2xl rounded-full px-2 py-1.5 flex items-center justify-between w-[340px] h-[52px] overflow-hidden">
                
                {}
                <div className="flex items-center space-x-4 pl-4">
                    <div className="flex flex-col items-start justify-center">
                      <div className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">
                        {user?.role === 'admin' ? 'Portefeuille Master' : 'Solde de la Station'}
                      </div>
                      <div className="flex items-center space-x-3 leading-none">
                         <span className="font-black text-xs md:text-sm text-white tracking-tighter whitespace-nowrap tabular-nums">
                           {user?.role === 'admin'
                             ? formatBalance(user.adminWallet || 0)
                             : (user?.balance !== undefined ? formatBalance(user.balance) : '0,000 TND')}
                         </span>
                         <button
                           onClick={handleRefresh}
                           className={`p-1 hover:bg-white/5 rounded-full transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                         >
                           <RefreshCw size={10} className="text-gray-500" />
                         </button>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-white/10 self-center" />
                </div>

                {}
                <div className="flex items-center space-x-3 pr-1">
                    {user?.role === 'admin' ? (
                      <Link href="/admin" className="bg-blue-600 hover:bg-blue-500 text-white h-10 pl-5 pr-1.5 flex items-center space-x-4 group rounded-full transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                        <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          <Shield size={12} className="text-white" />
                        </div>
                      </Link>
                    ) : (
                      <Link href="/deposit" className="gold-button h-10 pl-5 pr-1.5 flex items-center space-x-4 group">
                        <span className="text-[10px] font-black uppercase tracking-widest">Dépôt</span>
                        <div className="w-7 h-7 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          <Wallet size={12} className="text-black" />
                        </div>
                      </Link>
                    )}
                </div>
              </div>
            </div>
          ) : mounted ? (
            <div className="bezel-shell p-1 rounded-full animate-reveal">
              <div className="bezel-core bg-black/80 backdrop-blur-xl rounded-full px-2 py-1.5 flex items-center justify-between w-[340px] h-[52px] space-x-1">
                <button onClick={openLogin} className="px-6 py-2 font-black text-[10px] text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all">
                  Login
                </button>
                <button onClick={openRegister} className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-full font-black text-[10px] text-white uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="w-[340px] h-[52px] bg-white/5 rounded-full animate-pulse" />
          )}
        </div>

      </div>
    </header>
  );
}
