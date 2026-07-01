'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ArrowLeft, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_BUNDLES } from '@/config/bundles';

export default function AdminBuyInPage() {
  const { token, refreshBalance } = useAuth();
  const [amount, setAmount] = useState('');
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePackageSelect = async (amountToBuy: number, id: string | number) => {
    setProcessingId(id);
    try {
      const res = await api.admin.adminBuyIn(token!, amountToBuy);
      if (res.message) {
        setSuccess(true);
        await refreshBalance();
        setTimeout(() => router.push('/admin'), 5000);
      }
    } catch (err) {
      console.error('Buy-in failed', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCustomBuyIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    handlePackageSelect(parseFloat(amount) * 2, 'custom');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-full bg-[#000000] pt-12 md:pt-20 px-4 md:px-12 pb-32 relative animate-reveal">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <Link href="/admin" className="relative z-50 inline-flex items-center space-x-2 text-gray-500 hover:text-white mb-12 group transition-colors">
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Retour au Centre de Commande</span>
        </Link>

        <div className="mb-10 lg:mb-16">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <h1 className="text-xl font-black text-white uppercase tracking-widest">
                Acquisition de <span className="gold-text">Crédits</span>
            </h1>
          </div>
          <p className="text-gray-500 font-medium tracking-tight">Rapprovisionner le Portefeuille Master. Bonus de distribution stratégiques activés.</p>
        </div>

        {success ? (
          <div className="max-w-3xl mx-auto py-24">
             <div className="bezel-shell p-1">
                <div className="bezel-core cassanova-glass p-12 md:p-20 text-center relative overflow-hidden">
                   
                   <div className="relative z-10">
                      <div className="w-24 h-24 bg-[#d3a936]/10 border border-[#d3a936]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 animate-pulse">
                        <Zap size={48} className="text-[#d3a936]" />
                      </div>
                      
                      <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
                         AUTORISATION <span className="gold-text">ATTENTE</span>
                      </h2>
                      
                      <div className="inline-flex items-center space-x-3 px-6 py-2 bg-white/5 rounded-full border border-white/10 mb-10">
                         <div className="w-2 h-2 rounded-full bg-[#d3a936] animate-ping" />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attente de la signature Master</span>
                      </div>

                      <p className="max-w-md mx-auto text-gray-500 font-medium leading-relaxed mb-12">
                         Demande soumise. Attente de l&apos;autorisation Master.
                      </p>

                      <div className="flex items-center justify-center space-x-2">
                         <div className="w-1 h-1 bg-white/20 rounded-full" />
                         <div className="w-12 h-1 bg-gradient-to-r from-transparent via-[#d3a936] to-transparent rounded-full" />
                         <div className="w-1 h-1 bg-white/20 rounded-full" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
              {ADMIN_BUNDLES.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="relative group flex flex-col h-full"
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d3a936] text-black text-[9px] font-black uppercase px-6 py-1.5 rounded-full z-10 tracking-widest shadow-xl flex items-center space-x-2">
                      <Star size={10} />
                      <span>Choix Élite</span>
                    </div>
                  )}
                  <div className={`bezel-shell p-0.5 h-full flex flex-col ${pkg.popular ? 'bg-[#d3a936]/40 ring-1 ring-[#d3a936]/50' : 'bg-white/10'}`}>
                    <div className="bezel-core bg-white/5 backdrop-blur-md p-8 flex flex-col flex-1 border border-white/10 rounded-[1.5rem]">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 h-4 flex items-center">{pkg.label}</div>
                      
                      {}
                      <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/5 h-[110px] flex flex-col justify-center overflow-hidden">
                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 truncate">Coût Master (TND)</div>
                        <div className="flex items-end flex-wrap gap-1">
                           <span className="text-3xl font-black text-white tracking-tighter leading-none">{pkg.pay.toLocaleString('fr-FR')}</span>
                           <span className="text-[9px] font-black text-gray-600 uppercase mb-0.5 shrink-0">TND</span>
                        </div>
                      </div>

                      {}
                      <div className="flex justify-center mb-8">
                         <div className="w-12 h-px bg-white/10" />
                      </div>

                      {}
                      <div className="mb-8 h-20 flex flex-col justify-center">
                        <div className="text-[9px] font-black text-[#d3a936] uppercase tracking-widest mb-2">Injection de Crédits</div>
                        <div className="flex items-center justify-between">
                           <div className="text-4xl font-black text-white tracking-tighter">
                              {pkg.receive.toLocaleString('fr-FR')}
                           </div>
                           {pkg.bonus > 0 && (
                             <div className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-[10px] font-black tracking-widest">
                                +{pkg.bonus}%
                             </div>
                           )}
                        </div>
                      </div>

                      {}
                      <div className="mt-auto pt-8 border-t border-white/5">
                        <button 
                          onClick={() => !processingId && handlePackageSelect(pkg.receive, pkg.id)}
                          disabled={!!processingId}
                          className="w-full h-14 gold-button flex items-center justify-center font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-[#d3a936]/10 disabled:opacity-50"
                        >
                          {processingId === pkg.id ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              <span>Traitement...</span>
                            </div>
                          ) : 'Demander l\'injection'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto pb-20">
               <div className="text-center mb-10">
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8" />
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Injection Master Personnalisée</h3>
               </div>
                               <form onSubmit={handleCustomBuyIn} className="space-y-6 relative group">
                   {}
                   <div className="bezel-shell p-0.5">
                      <div className="bezel-core bg-white/5 backdrop-blur-md p-2 flex items-center border border-white/10 rounded-2xl">
                         <div className="px-8 text-xl font-black text-[#d3a936] shrink-0">TND</div>
                         <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="SAISIR LE MONTANT..."
                            className="w-full bg-transparent py-6 text-3xl font-black text-white focus:outline-none placeholder:text-gray-800 tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                         />
                                                   <button 
                             type="submit" 
                             disabled={!!processingId || !amount}
                             className="gold-button px-6 md:px-10 py-4 md:py-6 flex items-center space-x-2 md:space-x-3 disabled:opacity-50 shrink-0"
                          >
                             {processingId === 'custom' ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                             ) : (
                                <Zap size={14} className="text-black md:w-[18px] md:h-[18px]" />
                             )}
                             <span className="font-black uppercase text-[9px] md:text-[11px] tracking-widest">
                                {processingId === 'custom' ? 'Traitement...' : 'Demander'}
                             </span>
                          </button>
                      </div>
                   </div>

                   {}
                   <div className="bezel-shell p-0.5">
                      <div className="bezel-core bg-white/5 backdrop-blur-md px-10 py-10 border border-white/10 rounded-2xl animate-reveal">
                         <div className="flex items-baseline space-x-4">
                            <span className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                               {((parseFloat(amount) || 0) * 2).toLocaleString('fr-FR')}
                            </span>
                            <span className="text-base md:text-xl font-black gold-text uppercase tracking-widest">Credits</span>
                            <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-full flex items-center space-x-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">+100% Bonus</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </form>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

