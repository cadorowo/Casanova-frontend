'use client';

import { } from 'react';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  Play,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function GameLobbyPreview() {
  return (
    <section className="py-24 md:py-40 bg-[#000000]">
      <div className="container mx-auto px-4 md:px-12">
        
        {}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 animate-reveal">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               <span>Curated Collections</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
              Explore the <br /> <span className="gold-text">Lobby universe</span>
            </h2>
          </div>
          
          {}
          <Link href="/games" className="group relative inline-flex items-center space-x-4 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
             <span className="text-white font-black uppercase text-[10px] tracking-widest">View All Games</span>
             <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
                <ArrowRight size={14} className="text-white" />
             </div>
          </Link>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          
          {}
          <div 
             className="md:col-span-8 group relative bezel-shell p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01]"
          >
             <div className="bezel-core relative aspect-[16/9] md:aspect-auto md:h-[500px] overflow-hidden rounded-[calc(2.5rem-0.375rem)]">
                <Image 
                  src="/casino_game_olympus.png" 
                  alt="Gates of Olympus" 
                  fill
                  className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                {}
                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                   <div className="flex items-end justify-between">
                      <div>
                         <div className="flex items-center space-x-2 bg-red-600/90 px-3 py-1 rounded-full w-max mb-4 animate-float-slow">
                            <Flame size={12} fill="white" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Hot & trending</span>
                         </div>
                         <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-2">Gates of Olympus</h3>
                         <p className="text-sm font-black text-blue-500 uppercase tracking-widest opacity-80">Pragmatic Play • Win up to 5,000x</p>
                      </div>
                      
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                         <Play size={32} fill="white" className="text-white ml-1" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {}
          <div 
             className="md:col-span-4 group relative bezel-shell p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]"
          >
             <div className="bezel-core relative aspect-square md:h-full overflow-hidden rounded-[calc(2.5rem-0.375rem)]">
                <Image 
                  src="/casino_game_roulette.png" 
                  alt="Live Roulette" 
                  fill
                  className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-60" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                   <div className="mb-4 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors duration-500">
                      <Sparkles size={20} className="text-white" />
                   </div>
                   <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Live Lobby</h3>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Evolution Gaming</p>
                </div>
             </div>
          </div>

          {}
          <div className="md:col-span-4 group relative bezel-shell p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]">
             <div className="bezel-core bg-gradient-to-br from-blue-600 to-purple-600 rounded-[calc(2.5rem-0.375rem)] p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <Trophy size={32} className="text-white opacity-40" />
                   <ArrowRight size={20} className="text-white" />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 leading-none">VIP Club</h3>
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Exclusive Rewards</p>
                </div>
             </div>
          </div>

          <div className="md:col-span-4 group relative bezel-shell p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]">
             <div className="bezel-core relative aspect-video md:aspect-auto md:h-full overflow-hidden rounded-[calc(2.5rem-0.375rem)]">
                <Image 
                  src="/casino_game_blackjack.png" 
                  alt="Blackjack" 
                  fill
                  className="object-cover opacity-50 group-hover:scale-105 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Table Classics</h3>
                </div>
             </div>
          </div>

          <div className="md:col-span-4 group relative bezel-shell p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]">
             <div className="bezel-core relative aspect-video md:aspect-auto md:h-full overflow-hidden rounded-[calc(2.5rem-0.375rem)]">
                <Image 
                  src="/casino_game_bonanza_sweets.png" 
                  alt="Sweet Bonanza" 
                  fill
                  className="object-cover opacity-50 group-hover:scale-105 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Fruit Bonanza</h3>
                </div>
             </div>
          </div>

        </div>

        {}
        <div className="mt-24 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           {['PRAGMATIC PLAY', 'EVOLUTION', 'HACKSAW', 'NETENT', 'PLAY\'N GO'].map(p => (
              <span key={p} className="text-xs font-black text-white tracking-[0.4em]">{p}</span>
           ))}
        </div>
      </div>
    </section>
  );
}
