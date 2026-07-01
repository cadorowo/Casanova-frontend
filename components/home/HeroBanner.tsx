'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Trophy, ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';

export default function HeroBanner() {
  const { isAuthenticated, openRegister } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);

  return (
    <section className="relative min-h-[70dvh] md:min-h-[90dvh] flex items-center pt-12 md:pt-24 pb-24 overflow-hidden">
      {}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#000000]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-transparent to-[#000000] opacity-80" />
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-16">
          
          {}
          <div className="w-full lg:w-3/5 text-center lg:text-left animate-reveal">
            {}
            <div className="inline-flex items-center space-x-3 rounded-full px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.4em] font-black text-[#d3a936] mb-8 animate-float-slow">
              <Sparkles size={12} />
              <span>Le Standard d&apos;Or du Jeu</span>
            </div>

            <h1 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
              Jouez <br />
              <span className="gold-text">Sans</span> <br />
              Limites.
            </h1>

            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl mb-12 leading-relaxed">
              Découvrez la plateforme iGaming la plus immersive de l&apos;univers. 
              Localisée pour la Tunisie avec des paiements TND instantanés.
            </p>

            {}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              {mounted && (
                !isAuthenticated ? (
                  <button 
                    onClick={openRegister}
                    className="group relative inline-flex items-center space-x-6 px-10 py-6 bg-[#2563eb] rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(37,99,235,0.3)]"
                  >
                    <span className="text-white font-black uppercase text-xs tracking-[0.3em]">Commencer à Gagner</span>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center transform group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                       <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </button>
                ) : (
                  <Link 
                    href="/games"
                    className="group relative inline-flex items-center space-x-6 px-10 py-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-95 shadow-2xl"
                  >
                    <span className="text-white font-black uppercase text-xs tracking-[0.3em]">Aller au Lobby</span>
                    <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center transform group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                       <Trophy size={18} className="text-white" />
                    </div>
                  </Link>
                )
              )}

              <div className="flex items-center -space-x-3">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#000000] bg-gray-800 flex items-center justify-center overflow-hidden relative">
                       <Image src={`https://i.pravatar.cc/100?img=${i+10}`} alt="winner" fill className="object-cover" />
                    </div>
                 ))}
                 <div className="pl-6">
                    <div className="flex items-center space-x-1 mb-0.5">
                       <TrendingUp size={12} className="text-green-500" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Actif Maintenant</span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">1,402 joueurs en ligne</p>
                 </div>
              </div>
            </div>
          </div>

          {}
          <div className="w-full lg:w-2/5 relative animate-reveal delay-200">
             <div className="relative aspect-square">
                {}
                <div className="absolute top-0 right-0 w-4/5 aspect-[4/5] bezel-shell p-2 rotate-[3deg] z-10 transition-transform hover:rotate-0 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
                   <div className="bezel-core bg-black rounded-[calc(2.5rem-0.5rem)] overflow-hidden relative">
                      <Image src="/casino_game_olympus.png" alt="Featured" fill className="object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] to-transparent" />
                      <div className="absolute bottom-8 left-8">
                         <div className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest mb-2">Slot en Vedette</div>
                         <div className="text-3xl font-black text-white uppercase tracking-tighter">Olympus Elite</div>
                      </div>
                   </div>
                </div>

                {}
                <div className="absolute bottom-0 left-0 w-3/5 aspect-square bezel-shell p-2 -rotate-[6deg] z-20 transition-transform hover:rotate-0 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
                   <div className="bezel-core bg-black rounded-[calc(2.5rem-0.5rem)] flex items-center justify-center p-8 text-center">
                      <div>
                         <Trophy size={48} className="text-yellow-500 mx-auto mb-4 animate-bounce-subtle" />
                         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cagnotte Hebdomadaire</div>
                         <div className="text-2xl font-black text-white uppercase tracking-tighter">50,000 TND</div>
                      </div>
                   </div>
                </div>

                {}
                <div className="absolute top-1/4 -left-8 w-24 h-24 bg-blue-600 rounded-3xl shadow-2xl flex items-center justify-center rotate-[15deg] animate-float-slow z-30">
                   <Sparkles size={32} className="text-white" />
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

