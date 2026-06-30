'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Send, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDistributePage() {
  const { token, user, refreshBalance } = useAuth();
  const [targetPhone, setTargetPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !targetPhone) return;

    setLoading(true);
    try {
      const res = await api.admin.adminTransfer(token!, {
        targetPhone,
        amount: parseFloat(amount)
      });
      if (res.message) {
        setSuccess(true);
        await refreshBalance();
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Échec de la distribution des crédits.';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-full bg-[#000000]" />;
  }

  return (
    <div className="min-h-full bg-[#000000] pt-2 md:pt-4 px-4 md:px-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center space-x-2 text-gray-500 hover:text-white mb-3 group transition-colors">
          <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Retour au Centre de Commande</span>
        </Link>

        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-yellow-500" />
            <h1 className="text-lg font-black text-white uppercase tracking-widest">
              Distribution de <span className="gold-text">Crédits</span>
            </h1>
          </div>
          <p className="text-gray-500 text-xs font-medium tracking-tight">Transférer des fonds du Portefeuille Master vers le compte de pari d&apos;un joueur.</p>
        </div>

        <div className="cassanova-card p-4 relative overflow-hidden">
          {success ? (
            <div className="text-center pt-2 pb-4 animate-reveal">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send size={24} className="text-green-500" />
              </div>
              <h2 className="text-lg font-black text-white uppercase mb-1">Transfert Terminé</h2>
              <p className="text-gray-500 font-medium text-xs">Crédits distribués avec succès à {targetPhone}.</p>
            </div>
          ) : (
            <form onSubmit={handleDistribute} className="space-y-3">
              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                {}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] block">
                    Joueur Cible (Numéro de Téléphone)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="88888888"
                      maxLength={8}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-lg font-black text-white focus:outline-none focus:border-blue-600/50 transition-all"
                      required
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-black">
                      <Search size={16} />
                    </div>
                  </div>
                </div>

                {}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] block">
                    Montant à Distribuer
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xl font-black text-white focus:outline-none focus:border-blue-600/50 transition-all"
                      required
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">TND</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-600/5 border border-blue-600/10 rounded-xl">
                <div className="flex justify-between items-center">
                   <div>
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-tight mb-0.5">Portefeuille Master Actuel</div>
                      <div className="text-base font-black text-white tracking-tighter">
                        {(user?.adminWallet || 0).toFixed(1)} TND
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-tight mb-0.5">Reste Après</div>
                      <div className={`text-base font-black tracking-tighter ${(user?.adminWallet || 0) < (parseFloat(amount) || 0) ? 'text-red-500' : 'text-green-500'}`}>
                        {((user?.adminWallet || 0) - (parseFloat(amount) || 0)).toFixed(1)} TND
                      </div>
                   </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || !targetPhone || (user?.adminWallet || 0) < (parseFloat(amount) || 0)}
                className="w-full gold-button py-3 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:grayscale transition-all"
              >
                <span className="font-black uppercase tracking-[0.3em] text-xs">Confirmer la Distribution</span>
                {loading && <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              </button>
            </form>
          )}

          {}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>

      <style jsx global>{`
        .gold-text {
          background: linear-gradient(to bottom, #fff 0%, #a5a5a5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes reveal {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal {
          animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
