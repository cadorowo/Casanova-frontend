'use client';

import Link from 'next/link';
import { 
  Send, 
  Globe, 
  Share2, 
  Mail, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#000000] pt-12 pb-24 md:pb-12 px-4 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        
        {}
         <div className="bezel-shell p-1.5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="bezel-core bg-black p-6 sm:p-8 md:p-12">
               
               <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                  
                  {}
                  <div className="text-center lg:text-left flex flex-col items-center lg:items-start w-full">
                     <div className="inline-flex items-center space-x-2 text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">
                        <Sparkles size={10} />
                        <span>Station Élite</span>
                     </div>
                     <div className="flex justify-center lg:justify-start mb-4 max-w-full">
                        <Image 
                          src="/logo-long.png" 
                          alt="Casanova" 
                          width={400} 
                          height={120} 
                          className="hidden sm:block w-auto h-24 lg:h-36 object-contain max-w-full" 
                        />
                        <Image 
                          src="/logo-short.png" 
                          alt="Casanova" 
                          width={120} 
                          height={120} 
                          className="block sm:hidden w-auto h-20 object-contain max-w-full" 
                        />
                     </div>
                     <p className="text-gray-500 font-medium text-xs uppercase tracking-widest opacity-60">
                        La station de jeu la plus prestigieuse de l&apos;univers.
                     </p>
                  </div>

                 {}
                 <div className="flex items-center space-x-3">
                    {[Send, Globe, Share2, Mail].map((Icon, i) => (
                       <a 
                         key={i} 
                         href="#" 
                         className="w-12 h-12 bg-white/5 hover:bg-blue-600 rounded-full flex items-center justify-center border border-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group hover:scale-110 active:scale-95"
                       >
                          <Icon size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                       </a>
                    ))}
                 </div>

                 {}
                 <div className="flex items-center space-x-8 opacity-40">
                    <div className="flex items-center space-x-3">
                       <ShieldCheck size={20} className="text-blue-500" />
                       <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Jeu Équitable <br /> Vérifié</span>
                    </div>
                    <div className="px-3 py-1.5 border border-white/10 rounded-md text-[8px] font-black text-gray-500 tracking-[0.2em]">
                       18+ RESPONSABLE
                    </div>
                 </div>
              </div>

              {}
              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                 <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">
                    &copy; 2024 PLATEFORME CASANOVA. TOUS DROITS RÉSERVÉS.
                 </p>
                 <div className="flex items-center space-x-6">
                    {['Conditions', 'Confidentialité', 'Assistance'].map(link => (
                       <Link key={link} href="#" className="text-[8px] font-black text-gray-700 hover:text-blue-500 transition-colors uppercase tracking-[0.3em]">
                          {link}
                       </Link>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </footer>
  );
}
