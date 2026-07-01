'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { mutate } from 'swr';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import BetSlip from "@/components/sports/BetSlip";

import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import { AuthProvider } from "@/lib/auth-context";
import { useBet } from "@/lib/bet-context";
import { X } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);
  const { error, setError } = useBet();
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    // Lazy-load socket after mount so it doesn't block the initial render.
    // The socket.io-client is a heavy library and initializing it eagerly
    // was causing the 20-second black screen on iPhone.
    let cleanup: (() => void) | undefined;
    import('@/lib/socket').then(({ socket }) => {
      const handleForceRefresh = () => {
        const jitter = Math.random() * 15000;
        setTimeout(() => mutate(() => true), jitter);
      };
      const handleReconnect = () => {
        mutate(() => true);
      };

      socket.on('force_refresh', handleForceRefresh);
      socket.on('connect', handleReconnect);

      cleanup = () => {
        socket.off('force_refresh', handleForceRefresh);
        socket.off('connect', handleReconnect);
      };
    });
    return () => cleanup?.();
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#000000]">
      {}
      {!isAuthPage && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
      
      <div className="flex-grow flex flex-col min-w-0 relative h-full md:pl-72">
        {!isAuthPage && <Header />}
        
        {}
        <main 
          ref={mainRef}
          className={`flex-grow overflow-y-auto overflow-x-hidden no-scrollbar bg-[#000000] ${
            isAuthPage ? 'pb-0 pt-0' : 'pb-20 md:pb-8 pt-16 md:pt-20'
          }`}
        >
          <div className="min-h-full flex flex-col">
            <Suspense fallback={<div className="h-screen bg-[#000000] animate-pulse" />}>
              {children}
            </Suspense>
            {!isAuthPage && <Footer />}
          </div>
        </main>

        {}
        <LoginModal />
        <RegisterModal />

        {}
        {error && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-[400px] animate-reveal pointer-events-auto">
             <div className="bezel-shell p-0.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] shadow-red-500/20">
                <div className="bezel-core backdrop-blur-3xl border p-4 rounded-2xl flex items-center space-x-4 bg-red-600/10 border-red-500/20 animate-shake">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/20">
                      <X size={20} className="text-red-500" />
                   </div>
                   <div className="flex-grow">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Casanova Arena</p>
                      <p className="text-[11px] font-black text-white uppercase tracking-tighter">{error}</p>
                   </div>
                   <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <X size={16} className="text-gray-500" />
                   </button>
                </div>
             </div>
          </div>
        )}


        {}
        <BottomNav />

        {}
        <BetSlip />

        {}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/10 blur-[150px] rounded-full translate-x-1/2 translate-y-[-50%]" />
           <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-yellow-900/5 blur-[150px] rounded-full translate-x-[-50%] translate-y-[50%]" />
        </div>
      </div>
    </div>
  );
}

import { BetProvider } from "@/lib/bet-context";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BetProvider>
        <Suspense fallback={<div className="h-screen bg-[#000000] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>}>
          <LayoutContent>{children}</LayoutContent>
        </Suspense>
      </BetProvider>
    </AuthProvider>
  );
}
