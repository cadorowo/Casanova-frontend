'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Gamepad2,
  Target,
  LogOut,
  Sparkles,
  ReceiptText,
  Trophy,
  Activity,
  Circle,
  Disc,
  ChevronDown,
  User
} from 'lucide-react';
import useSWR from 'swr';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const { user, isAuthenticated, logout, openLogin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSport = searchParams.get('sport');
  const activeCasinoCat = searchParams.get('category');
  
  const [isSportsExpanded, setIsSportsExpanded] = useState(pathname.startsWith('/sports'));
  const [isCasinoExpanded, setIsCasinoExpanded] = useState(pathname.startsWith('/games'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);
  
  const { data: sportsList } = useSWR('sports-list', () => api.games.getSports(), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 600000,
  });

  const menuItems = [
    { name: 'Sports', icon: Target, href: '/sports', isExpandable: true },
    { name: 'Casino', icon: Gamepad2, href: '/games', isExpandable: true },
    ...( (!mounted || user?.role !== 'admin') ? [{ name: 'Mes Paris', icon: ReceiptText, href: '/bets' }] : []),
  ];

  const casinoCategories = [
    { id: 'slots', name: 'Slots', icon: Sparkles },
    { id: 'live-casino', name: 'Casino Live', icon: Activity },
    { id: 'table-games', name: 'Jeux de Table', icon: Disc },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };

  const getSportIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return Trophy;
      case 'Activity': return Activity;
      case 'Circle': return Circle;
      case 'Disc': return Disc;
      default: return Target;
    }
  };

  return (
    <>
      {}
      {mounted && isOpen && (
        <div 
          className="fixed inset-0 bg-[#000000]/60 z-[70] md:hidden backdrop-blur-md animate-reveal"
          onClick={() => setIsOpen(false)}
        />
      )}

      {}
      <aside className={`
        hidden md:block fixed top-0 left-0 h-screen z-[80]
        w-72 min-w-72 max-w-72 bg-[#000000] border-r border-white/5 shrink-0
        ${mounted && isOpen ? 'translate-x-0' : ''}
      `}>
        <div className="flex flex-col h-full p-6 overflow-y-auto no-scrollbar">
          
          {}
          <div className="mb-12 px-2">
             <div className="inline-flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                <Sparkles size={12} />
                <span>Station Élite</span>
             </div>
             <Link href="/sports" className="flex items-center mt-2 cursor-pointer">
                <Image src="/logo-long.png" alt="Casanova" width={400} height={120} className="w-auto h-16 max-w-full object-contain" priority />
             </Link>
          </div>

          {}
          <nav className="flex-grow space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              if (item.isExpandable) {
                const isSports = item.name === 'Sports';
                const isCasino = item.name === 'Casino';
                const isExpanded = isSports ? isSportsExpanded : isCasinoExpanded;
                const isMainActive = isSports ? pathname.startsWith('/sports') : pathname.startsWith('/games');

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => {
                        if (isSports) {
                          setIsSportsExpanded(!isExpanded);
                          if (!isExpanded) setIsCasinoExpanded(false);
                        } else {
                          setIsCasinoExpanded(!isExpanded);
                          if (!isExpanded) setIsSportsExpanded(false);
                        }
                      }}
                      className={`
                        w-full group relative flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                        ${isMainActive 
                          ? 'bg-blue-600/10 text-blue-500 border border-blue-500/10' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <item.icon size={20} className={isMainActive ? 'animate-float-slow' : 'group-hover:scale-110 transition-transform'} />
                        <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {}
                    <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                       <div className="pl-6 space-y-1">
                          {isSports && sportsList?.map((sport: { id: string; name: string; icon: string }) => {
                             const SportIcon = getSportIcon(sport.icon);
                             const sportHref = `/sports?sport=${sport.id}`;
                             const isThisSportActive = activeSport === sport.id;
                             
                             return (
                                <Link
                                   key={sport.id}
                                   href={sportHref}
                                   onClick={() => setIsOpen(false)}
                                   className={`
                                      flex items-center space-x-4 px-6 py-3 rounded-[1rem] transition-all duration-500
                                      ${isThisSportActive ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'}
                                   `}
                                >
                                   <SportIcon size={14} className={isThisSportActive ? 'text-blue-500' : ''} />
                                   <span className="font-black text-[10px] uppercase tracking-widest">{sport.name}</span>
                                </Link>
                             );
                          })}

                          {isCasino && casinoCategories.map((cat) => {
                             const isThisCatActive = activeCasinoCat === cat.id;
                             const catHref = `/games?category=${cat.id}`;
                             
                             return (
                                <Link
                                   key={cat.id}
                                   href={catHref}
                                   onClick={() => setIsOpen(false)}
                                   className={`
                                      flex items-center space-x-4 px-6 py-3 rounded-[1rem] transition-all duration-500
                                      ${isThisCatActive ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'}
                                   `}
                                >
                                   <cat.icon size={14} className={isThisCatActive ? 'text-blue-500' : ''} />
                                   <span className="font-black text-[10px] uppercase tracking-widest">{cat.name}</span>
                                </Link>
                             );
                          })}
                       </div>
                    </div>
                  </div>
                );
              }

              const handleItemClick = (e: React.MouseEvent) => {
                if (item.href === '/bets' && !isAuthenticated) {
                  e.preventDefault();
                  openLogin();
                }
                setIsOpen(false);
              };

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleItemClick}
                    className={`
                      group relative flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                      ${isActive 
                        ? 'bg-blue-600/10 text-blue-500 border border-blue-500/10' 
                        : 'text-gray-500 hover:text-white hover:bg-white/5'}
                    `}
                >
                  <div className="flex items-center space-x-4">
                    <item.icon size={20} className={isActive ? 'animate-float-slow' : 'group-hover:scale-110 transition-transform'} />
                    <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {}
          {mounted && isAuthenticated && (
             <div className="mt-auto pt-8 border-t border-white/5 space-y-4 animate-reveal">
                <Link
                  href={user?.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-700
                    ${(user?.role === 'admin' ? pathname === '/admin' : pathname === '/dashboard') ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white'}
                  `}
                >
                  <User size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">
                     {user?.role === 'admin' ? 'Admin Station' : 'Utilisateur Station'}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center justify-between pl-6 pr-2 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <span className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] ml-2">Déconnexion Sécurisée</span>
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                     <LogOut size={16} className="text-white" />
                  </div>
                </button>
             </div>
          )}
        </div>
      </aside>
    </>
  );
}
