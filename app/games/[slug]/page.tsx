'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Play, 
  Heart, 
  ArrowLeft, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Gamepad2
} from 'lucide-react';



export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, token, user, openLogin, updateUser } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState('');
  const [iframeLogs, setIframeLogs] = useState<{ level: string; message: string; timestamp: Date }[]>([]);
  const [showLogs] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'iframe-log') {
        const { level, message } = event.data;
        setIframeLogs(prev => [...prev.slice(-99), { level, message, timestamp: new Date() }]);
      } else if (event.data?.type === 'error' || event.data?.error) {
        console.error('[Game Client Error]', event.data);
        setPlayError(`Erreur du jeu: ${event.data?.message || event.data?.error || 'Erreur inconnue'}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlaying]);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const slug = params.slug as string;
        const gameData = await api.games.getBySlug(slug);
        
        if (gameData._id) {
          setGame(gameData);
          
          if (isAuthenticated && token && user) {
            try {
              const profileData = await api.user.getProfile(token);
              setIsFavorite(profileData.favoriteGames?.includes(gameData._id) || false);
            } catch {
            }
          }
          
          const allGames = await api.games.getAll({ category: gameData.category });
          const similar = allGames.filter((g: Game) => g._id !== gameData._id).slice(0, 4);
          setSimilarGames(similar);
        } else {
          setError('Jeu non trouvé');
        }
      } catch {
        setError('Échec du chargement des détails du jeu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [params.slug, isAuthenticated, token, user]);

  const handlePlayInPlace = async () => {
    setPlayError('');
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (user?.role === 'admin') {
      setPlayError("Les administrateurs ne sont pas autorisés à lancer les jeux.");
      return;
    }

    if (!game) return;
    setPlayLoading(true);

    try {
      if (game.provider === 'pragmatic' || game.provider === 'local' || game.launchType === 'internal-slot' || game.provider === 'slot-pragmatic') {
        const sessionData = await api.slots.createSession(token || '', game.slug);
        if (sessionData && sessionData.redirectUrl) {
          setLaunchUrl(sessionData.redirectUrl);
          setIsPlaying(true);
        } else {
          setPlayError('Impossible de charger le jeu. Réessayez plus tard.');
        }
        setPlayLoading(false);
        return;
      }

      let vendorCode = '';
      let gameCode = '';
      try {
        const urlObj = new URL(game.launchUrl, window.location.origin);
        vendorCode = urlObj.searchParams.get('vendorCode') || '';
        gameCode = urlObj.searchParams.get('gameCode') || '';
      } catch {
      }

      if (!vendorCode || !gameCode) {
        if (game.launchUrl) {
          setLaunchUrl(game.launchUrl);
          setIsPlaying(true);
        } else {
          setPlayError('Impossible de charger le jeu. Paramètres manquants.');
        }
        return;
      }

      if (!token) {
        openLogin();
        return;
      }

      const launchData = await api.games.launch(token, {
        vendorCode,
        gameCode,
        language: 'fr'
      });

      if (launchData && launchData.launchUrl) {
        setLaunchUrl(launchData.launchUrl);
        setIsPlaying(true);
      } else {
        setPlayError('Impossible de charger le jeu. Réessayez plus tard.');
      }
    } catch (err) {
      console.error('Error launching game:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setPlayError(errorMsg || 'Erreur lors del lancio del gioco.');
    } finally {
      setPlayLoading(false);
    }
  };

  const handleQuitGame = async () => {
    if (token) {
      try {
        const profile = await api.user.getProfile(token);
        updateUser({ balance: profile.balance });
        await api.slots.closeSession(token);
      } catch (err) {
        console.error('Failed to update balance or close session on quit', err);
      }
    }

    setIsPlaying(false);
    setLaunchUrl(null);
  };

  useEffect(() => {
    return () => {
      if (isPlaying && token) {
        api.slots.closeSession(token).catch(console.error);
      }
    };
  }, [isPlaying, token]);


  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !token) {
      openLogin();
      return;
    }

    if (!game) return;

    setFavoriteLoading(true);
    try {
      await api.user.toggleFavorite(token, game._id);
      setIsFavorite(!isFavorite);
    } catch {
      alert('Échec de la mise à jour des favoris.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">Chargement Station Élite...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white/5 border border-white/5 rounded-3xl max-w-md w-full backdrop-blur-xl">
          <p className="text-red-400 font-black text-xs uppercase tracking-widest mb-6">{error || 'Jeu non trouvé'}</p>
          <Link href="/games" className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest transition-all">
            <ArrowLeft size={12} />
            <span>Retour aux Jeux</span>
          </Link>
        </div>
      </div>
    );
  }


  const volatilityGlows = {
    low: 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    high: 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
  };
  const volatilityLabels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
  };
  const formatPercent = (value?: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
    return `${new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value)}%`;
  };
  const formatTnd = (value?: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
    return `${new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value)} TND`;
  };

  if (isPlaying && launchUrl) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#000] flex flex-col">
        {}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#0a0a0f] border-b border-white/5 h-14 shrink-0">
          <div className="flex items-center space-x-4">
            <Image src="/logo-long.png" alt="Casanova" width={100} height={25} className="w-auto h-4 md:h-5 object-contain" priority />
            <div className="w-px h-4 bg-white/10" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-400">{game.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleQuitGame}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all duration-300"
            >
              Quitter
            </button>
          </div>
        </div>
        {}
        <div className="flex-grow w-full relative bg-[#000]">
          <iframe 
            ref={iframeRef}
            src={launchUrl} 
            className="absolute inset-0 w-full h-full border-0"
            onError={() => setPlayError('Le client du jeu a échoué à se charger. Vérifiez la connexion.')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden relative selection:bg-blue-600/30 selection:text-white pb-24">

      <div className={`relative ${isPlaying ? 'z-[120]' : 'z-10'} pt-8 px-4 md:px-12 mx-auto space-y-8 ${isPlaying ? 'max-w-[1800px]' : 'max-w-[1400px]'}`}>
        {}
        <div className="flex items-center justify-start">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-white group transition-colors"
          >
            <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
          </button>
        </div>

        {}
        <div className={`grid grid-cols-1 gap-8 items-start ${isPlaying ? 'lg:grid-cols-1' : 'lg:grid-cols-4'}`}>
          {}
          <div className={`${isPlaying ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6`}>
            {}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider">{game.title}</h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                  {game.provider === 'pragmatic' || game.provider === 'local' || game.provider === 'slot-pragmatic' ? 'Pragmatic Play' : game.provider}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/5 rounded-lg capitalize">
                  {game.category.replace('-', ' ')}
                </span>
              </div>
              {playError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-reveal">
                  {playError}
                </div>
              )}
            </div>

            {}
            <div className="relative aspect-video rounded-3xl border border-white/5 bg-[#000]/60 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
              {isPlaying && launchUrl ? (
                <div className="w-full h-full flex flex-col">
                  {}
                  <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0f] border-b border-white/5">
                    <div className="flex items-center space-x-4">
                      <Image src="/logo-long.png" alt="Casanova" width={120} height={30} className="w-auto h-5 object-contain" priority />
                      <div className="w-px h-4 bg-white/10" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{game.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                         onClick={handleQuitGame}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all duration-300"
                      >
                        Quitter
                      </button>
                    </div>
                  </div>
                  {}
                  <div className="w-full flex-grow relative overflow-hidden">
                    <iframe 
                      ref={iframeRef}
                      src={launchUrl} 
                      className="absolute inset-0 w-full h-full border-0"
                      onError={() => setPlayError('Le client du jeu a échoué à se charger. Vérifiez la connexion.')}
                    />

                    {}
                    {showLogs && (
                      <div className="absolute inset-y-0 right-0 w-80 bg-[#050508]/95 border-l border-white/10 z-20 flex flex-col backdrop-blur-md">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0f] border-b border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Iframe Console Logs</span>
                          <button onClick={() => setIframeLogs([])} className="text-[9px] hover:text-white text-gray-500 uppercase tracking-widest font-bold">Clear</button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-2 font-mono text-[9px] text-gray-300 select-text">
                          {iframeLogs.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">Aucun log reçu. Lancer le jeu pour capturer...</div>
                          ) : (
                            iframeLogs.map((log, i) => (
                              <div key={i} className={`p-1.5 rounded border ${
                                log.level === 'error' || log.level === 'crash'
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : log.level === 'warn'
                                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                  : 'bg-white/5 border-transparent text-gray-300'
                              }`}>
                                <span className="opacity-40 mr-1.5">[{log.level.toUpperCase()}]</span>
                                {log.message}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <Image 
                    src={game.slug === 'gates-of-olympus' ? '/images/gatesofolympus.jpg' : game.thumbnail} 
                    alt={game.title}
                    fill
                    unoptimized
                    priority
                    className="object-cover opacity-85 scale-100 group-hover:scale-102 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  
                  {game.isNew && (
                    <span className="absolute top-6 left-6 px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20">
                      Nouveau
                    </span>
                  )}

                  {}
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`
                      absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all duration-300 disabled:opacity-50 z-20
                      ${isFavorite 
                        ? 'bg-red-500/20 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-black/40 border-white/10 text-gray-300 hover:text-white hover:bg-black/60'}
                    `}
                  >
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "animate-pulse" : ""} />
                  </button>

                  {}
                  <div className="hidden lg:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center z-10">
                    <button
                      onClick={handlePlayInPlace}
                      disabled={playLoading}
                      className="py-4.5 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-[0.98] transition-all duration-300 disabled:pointer-events-none flex items-center justify-center space-x-2 border border-blue-500/20"
                    >
                      {playLoading ? (
                        <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play size={14} fill="white" />
                          <span>Lancer le Jeu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {}
            {!isPlaying && (
              <button
                onClick={handlePlayInPlace}
                disabled={playLoading}
                className="lg:hidden w-full py-4.5 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:pointer-events-none flex items-center justify-center space-x-2 border border-blue-500/20"
              >
                {playLoading ? (
                  <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Play size={14} fill="white" />
                    <span>Lancer le Jeu</span>
                  </>
                )}
              </button>
            )}
          </div>

          {}
          {!isPlaying && (
          <div className="space-y-6">
            {}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center space-x-2">
                <Gamepad2 size={14} />
                <span>Statistiques Jeu</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-white/5 gap-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center sm:text-left">RTP Réel</span>
                  <span className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg text-center">
                    98.5%
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-white/5 gap-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center sm:text-left">Volatilité</span>
                  <span className={`px-3 py-1 border text-[10px] font-black rounded-lg capitalize text-center ${volatilityGlows[game.volatility] || volatilityGlows.medium}`}>
                    {volatilityLabels[game.volatility] || 'Moyenne'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-white/5 gap-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center sm:text-left">Mise Minimale</span>
                  <span className="text-[10px] font-black text-white text-center">{formatTnd(game.minBet)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center sm:text-left">Mise Maximale</span>
                  <span className="text-[10px] font-black text-white text-center">{formatTnd(game.maxBet)}</span>
                </div>
              </div>
            </div>


            {}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center space-x-2">
                <ShieldCheck size={14} />
                <span>Sécurité & Garanties</span>
              </h3>
              
              <ul className="space-y-3.5 text-[9px] font-black uppercase tracking-wider text-gray-400">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <span>{"Garantie d'équité certifiée"}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Smartphone size={14} />
                  </div>
                  <span>Optimisé pour Mobile et Tablettes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Zap size={14} />
                  </div>
                  <span>Retraits instantanés</span>
                </li>
              </ul>
            </div>
          </div>
          )}
        </div>

        {}
        {similarGames.length > 0 && (
          <div className="pt-8 border-t border-white/5 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-white">Jeux Similaires</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarGames.map((similarGame) => (
                <Link
                  key={similarGame._id}
                  href={`/games/${similarGame.slug}`}
                  className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:scale-[1.02] hover:border-blue-500/50 shadow-lg transition-all duration-500 backdrop-blur-md"
                >
                  <div className="relative aspect-square bg-[#000] overflow-hidden">
                    <Image
                      src={similarGame.slug === 'gates-of-olympus' ? '/images/gatesofolympus.jpg' : similarGame.thumbnail}
                      alt={similarGame.title}
                      fill
                      unoptimized
                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    
                    {}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-500">
                        <Play size={16} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-1">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                      {similarGame.title}
                    </h3>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">
                      {similarGame.provider}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
