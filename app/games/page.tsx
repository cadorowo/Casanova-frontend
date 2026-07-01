'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Play,
  Search,
  X,
  Heart
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Game {
  _id: string;
  title: string;
  slug: string;
  provider: string;
  thumbnail: string;
  category: string;
  isPopular?: boolean;
  isHot?: boolean;
  launchUrl?: string;
  launchType?: string;
}

export default function CasinoLobbyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  
  const { isAuthenticated, token } = useAuth();
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'popular');
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  
  useEffect(() => {
    const t = setTimeout(() => {
      setActiveCategory(categoryParam || 'popular');
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(t);
  }, [categoryParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchParam || '');
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParam]);

  useEffect(() => {
    if (isAuthenticated && token) {
      api.user.getProfile(token)
        .then(profile => {
          setFavoriteIds(profile.favoriteGames || []);
        })
        .catch(err => console.log('Failed to load favorites', err));
    } else {
      setTimeout(() => setFavoriteIds([]), 0);
    }
  }, [isAuthenticated, token]);

  const handleToggleFavorite = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    try {
      const updated = await api.user.toggleFavorite(token, gameId);
      setFavoriteIds(updated || []);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

  const getApiUrl = () => {
    const params = new URLSearchParams();
    if (activeCategory !== 'popular' && activeCategory !== 'favorites') {
      params.append('category', activeCategory);
    }
    if (searchTerm) params.append('search', searchTerm);
    
    return `${API_BASE_URL}/games${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const { data: games, isLoading } = useSWR<Game[]>(getApiUrl(), (url: string) => 
    fetch(url).then(res => res.json()).then(res => {
      const extracted = (res && res.success && 'data' in res) ? res.data : res;
      return Array.isArray(extracted) ? extracted : [];
    }),
    { revalidateOnFocus: false, revalidateOnMount: true, dedupingInterval: 600000 }
  );

  const filteredGames = useMemo(() => {
    if (!games) return [];
    
    const nonLegacyGames = games.filter(g => g.provider !== 'oroplay');
    
    if (activeCategory === 'popular') {
      return nonLegacyGames.filter(g => g.isPopular || g.isHot);
    }
    if (activeCategory === 'favorites') {
      return nonLegacyGames.filter(g => favoriteIds.includes(g._id));
    }
    return nonLegacyGames;
  }, [games, activeCategory, favoriteIds]);

  const ITEMS_PER_PAGE = 30;
  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / ITEMS_PER_PAGE);
  const paginatedGames = filteredGames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-full bg-[#000000] overflow-hidden selection:bg-blue-600/30">
      <div className="animate-reveal pt-12 pb-8 md:pt-20 md:pb-16 px-4 md:px-12 max-w-[1400px] mx-auto">
        
        {}
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
           <div className="flex items-center space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <h2 className="text-xl font-black text-white uppercase tracking-widest">
                <span className="gold-text">{activeCategory.replace('-', ' ')}</span> <span className="opacity-40">Univers</span>
              </h2>
           </div>

           {}
           <div className="relative w-full md:w-80 group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                 <Search size={16} />
              </span>
              <input
                 type="text"
                 placeholder="Rechercher un jeu..."
                 value={searchTerm}
                 onChange={(e) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    const params = new URLSearchParams(window.location.search);
                    if (val) {
                       params.set('search', val);
                    } else {
                       params.delete('search');
                    }
                    router.push(`/games?${params.toString()}`);
                 }}
                 className="w-full pl-11 pr-10 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-blue-600/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300"
              />
              {searchTerm && (
                 <button
                    onClick={() => {
                       setSearchTerm('');
                       const params = new URLSearchParams(window.location.search);
                       params.delete('search');
                       router.push(`/games?${params.toString()}`);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-white transition-colors"
                 >
                    <X size={14} />
                  </button>
              )}
           </div>
        </div>


        {}
        <div className="mb-12 space-y-6">
           
           {}
           <div className="hidden md:flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth border-b border-white/5 pb-6">
             {[
               { id: 'popular', name: 'Populaires', icon: '★' },
               { id: 'favorites', name: 'Favoris', icon: '♥' },
               { id: 'slots', name: 'Slots', icon: '🎰' },
               { id: 'live-casino', name: 'Casino Live', icon: '🎥' },
               { id: 'table-games', name: 'Jeux de Table', icon: '🃏' }
             ].map(cat => {
               const isActive = activeCategory === cat.id;
               return (
                 <button
                   key={cat.id}
                   onClick={() => {
                     setActiveCategory(cat.id);
                     const params = new URLSearchParams(window.location.search);
                     params.set('category', cat.id);
                     router.push(`/games?${params.toString()}`);
                   }}
                   className={`
                     shrink-0 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border flex items-center
                     ${isActive 
                       ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                       : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                     }
                   `}
                 >
                   {cat.icon && (
                      <span className={`mr-2 text-xs transition-transform duration-300 ${
                        cat.id === 'popular' 
                          ? 'animate-pulse text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                          : cat.id === 'favorites' 
                          ? 'text-red-500' 
                          : ''
                      }`}>
                        {cat.icon}
                      </span>
                   )}
                   {cat.name}
                 </button>
               );
             })}
           </div>

           {}
           <div className="flex md:hidden flex-col gap-4">
             {}
             <div className="grid grid-cols-2 gap-3">
               {[
                  { id: 'popular', name: 'Populaires', icon: '★' },
                  { id: 'favorites', name: 'Favoris', icon: '♥' }
                ].map(cat => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        const params = new URLSearchParams(window.location.search);
                        params.set('category', cat.id);
                        router.push(`/games?${params.toString()}`);
                      }}
                      className={`
                        py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all duration-300 border flex items-center justify-center
                        ${isActive 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                        }
                      `}
                    >
                      {cat.icon && (
                        <span className={`mr-2 text-xs ${
                          cat.id === 'popular' 
                            ? 'animate-pulse text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                            : cat.id === 'favorites' 
                            ? 'text-red-500' 
                            : ''
                        }`}>
                          {cat.icon}
                        </span>
                      )}
                      {cat.name}
                    </button>
                  );
                })}
             </div>

             {}
             <div className="grid grid-cols-3 gap-2">
               {[
                 { id: 'slots', name: 'Slots', icon: '🎰' },
                 { id: 'live-casino', name: 'Casino Live', icon: '🎥' },
                 { id: 'table-games', name: 'Jeux de Table', icon: '🃏' }
               ].map(cat => {
                 const isActive = activeCategory === cat.id;
                 return (
                   <button
                     key={cat.id}
                     onClick={() => {
                       setActiveCategory(cat.id);
                       const params = new URLSearchParams(window.location.search);
                       params.set('category', cat.id);
                       router.push(`/games?${params.toString()}`);
                     }}
                     className={`
                       min-h-12 rounded-2xl px-2 py-3 text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-all duration-300 border flex items-center justify-center
                       ${isActive
                         ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                         : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                       }
                   `}
                 >
                     <span className="mr-1.5 text-xs">{cat.icon}</span>
                     {cat.name}
                   </button>
                 );
               })}
             </div>
           </div>
        </div>

         {}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {isLoading ? (
               Array(12).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
               ))
            ) : paginatedGames?.length === 0 ? (
               <div className="col-span-full py-24 text-center">
                  <p className="text-gray-600 font-black text-xs uppercase tracking-[0.5em]">Aucun jeu trouvé dans ce quadrant</p>
               </div>
            ) : paginatedGames?.map((game: Game, i: number) => (
               <div 
                  key={game._id} 
                  className="group relative p-1 bg-white/5 rounded-2xl border border-white/5 transition-all duration-700 hover:scale-[1.02] animate-reveal block"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                   <div className="relative aspect-[3/4] bg-[#000000] rounded-[calc(1rem-0.125rem)] overflow-hidden">
                      <Link href={`/games/${game.slug}`} className="absolute inset-0 z-10 block">
                         <Image 
                            src={game.slug === 'gates-of-olympus' ? '/images/gatesofolympus.jpg' : game.thumbnail} 
                            alt={game.title}
                            fill
                            unoptimized
                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                         {}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 z-20">
                            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] transform scale-50 group-hover:scale-100 transition-transform duration-700">
                               <Play size={24} fill="white" className="text-white ml-1" />
                            </div>
                         </div>

                         {}
                         <div className="absolute bottom-0 left-0 w-full p-4 z-20">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1 truncate">{game.title}</h3>
                            <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest opacity-80">{game.provider === 'local' || game.provider === 'slot-pragmatic' ? 'Pragmatic Play' : game.provider}</p>
                         </div>
                      </Link>

                      {}
                      <button
                         onClick={(e) => handleToggleFavorite(e, game._id)}
                         className="absolute top-3 right-3 z-30 p-2 bg-black/40 hover:bg-black/70 rounded-full transition-all duration-300 group/fav"
                      >
                         <Heart 
                            size={14} 
                            fill={favoriteIds.includes(game._id) ? "#ef4444" : "none"} 
                            className={favoriteIds.includes(game._id) ? "text-red-500 scale-110" : "text-gray-400 group-hover/fav:text-red-400 transition-colors"} 
                         />
                      </button>
                   </div>
                </div>
            ))}
         </div>

        {}
        {totalPages > 1 && (
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalGames)} sur {totalGames} jeux
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border border-white/5 bg-transparent text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                Précédent
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isAdjacent = Math.abs(currentPage - pageNum) <= 1;
                  const isFirstOrLast = pageNum === 1 || pageNum === totalPages;
                  
                  if (isFirstOrLast || isAdjacent) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`
                          w-9 h-9 rounded-xl text-[9px] font-black transition-all duration-300 border
                          ${currentPage === pageNum 
                            ? 'bg-blue-600 border-blue-600/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                            : 'bg-transparent border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'}
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" className="text-gray-600 text-[10px] px-1">...</span>;
                  } else if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" className="text-gray-600 text-[10px] px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border border-white/5 bg-transparent text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes reveal {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal {
          animation: reveal 0.8s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
