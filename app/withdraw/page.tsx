'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Wallet, 
  History 
} from 'lucide-react';

export default function WithdrawPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, refreshBalance } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && mounted) {
      router.push('/');
    }
    setMounted(true);
  }, [isAuthenticated, router, mounted]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const withdrawAmount = parseFloat(amount);
    if (!user) return;

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (withdrawAmount > user.balance) {
      setError('Solde insuffisant');
      return;
    }

    if (!token) {
      setError('Vous devez être connecté pour effectuer un retrait');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.transactions.withdraw(token, {
        amount: withdrawAmount,
        paymentMethod: 'Manual Withdrawal',
      });

      if (response.newBalance !== undefined) {
        setSuccess(`Demande soumise ! Votre retrait attente est de ${withdrawAmount.toFixed(1)} TND.`);
        setAmount('');
        await refreshBalance();
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setError(response.message || 'Échec du retrait');
      }
    } catch {
      setError('Une erreur est survenue lors du retrait');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-full bg-[#000000] animate-reveal">
      <div className="max-w-[1200px] mx-auto px-4 md:px-12 pt-12 md:pt-20 pb-32">
        
        {}
        <Link href="/dashboard" className="inline-flex items-center space-x-2 text-gray-500 hover:text-white mb-12 group transition-colors">
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Retour au Tableau de Bord</span>
        </Link>

        {}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <h1 className="text-xl font-black text-white uppercase tracking-widest">
                Retrait du <span className="gold-text">Portefeuille</span>
              </h1>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Retirez vos gains en toute sicurezza vers votre méthode préférée.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {}
          <div className="lg:col-span-8 h-full">
            <div className="bezel-shell p-1 h-full">
               <div className="bezel-core bg-black rounded-[2.5rem] p-8 md:p-12 h-full flex flex-col justify-center">
                  
                  {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-4">
                       <AlertCircle size={20} className="text-red-500 shrink-0" />
                       <span className="text-xs font-black text-red-400 uppercase tracking-widest">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center space-x-4">
                       <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                       <span className="text-xs font-black text-green-400 uppercase tracking-widest">{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleWithdraw} className="space-y-10">
                    <div>
                      <div className="flex items-center justify-between mb-6 px-1">
                         <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Montant du Retrait (TND)</label>
                         <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest">Min 1.000</span>
                      </div>
                      
                      <div className="bg-white/5 border border-white/5 rounded-3xl flex items-center px-8 py-6 space-x-6">
                          <span className="text-lg font-black text-gray-700 shrink-0">TND</span>
                          <input
                            type="number"
                            step="0.001"
                            required
                            min={1}
                            max={user.balance}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-transparent text-white text-3xl md:text-5xl font-black placeholder-gray-800 focus:outline-none tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.000"
                          />
                      </div>
                    </div>

                    {}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[20, 50, 100, 500].map((quick) => {
                        const isDisabled = user.balance < quick;
                        return (
                          <button
                            key={quick}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setAmount(quick.toString())}
                            className={`rounded-2xl py-4 px-2 font-black text-xs uppercase tracking-widest transition-all border border-white/5 ${isDisabled ? 'bg-white/5 opacity-10 cursor-not-allowed' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                          >
                            {quick} TND
                          </button>
                        );
                      })}
                    </div>

                    {}
                    <button
                      type="submit"
                      disabled={isLoading || parseFloat(amount) > user.balance}
                      className="group w-full inline-flex items-center justify-between pl-10 pr-2 py-2 bg-blue-600 rounded-full disabled:opacity-50 mt-4 transition-all hover:scale-[1.01]"
                    >
                      <span className="font-black uppercase text-[12px] text-white tracking-[0.4em]">
                        {isLoading ? 'Traitement...' : `Retirer ${amount || '0.000'} TND`}
                      </span>
                      <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <ChevronRight size={24} className="text-white" />
                      </div>
                    </button>
                  </form>
               </div>
            </div>
          </div>

          {}
          <div className="lg:col-span-4 flex flex-col gap-8 h-full">
             {}
             <div className="bezel-shell p-1 flex-1">
                <div className="bezel-core bg-black rounded-[2rem] p-8 h-full flex flex-col justify-center">
                   <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                         <Wallet size={18} className="text-blue-600" />
                      </div>
                      <span className="text-gray-600 font-black uppercase text-[10px] tracking-widest">Fonds Retirables</span>
                   </div>
                   <div className="text-3xl font-black text-white tracking-tighter">
                      {mounted && user?.balance !== undefined ? user.balance.toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' TND' : '0.000 TND'}
                   </div>
                </div>
             </div>

             {}
             <div className="bezel-shell p-1 flex-1">
                <div className="bezel-core bg-black rounded-[2rem] p-8 h-full flex flex-col justify-center">
                   <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                         <History size={18} className="text-gray-500" />
                      </div>
                      <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Politique de Retrait</h3>
                   </div>
                   <ul className="space-y-6">
                      {[
                        'Les demandes sont traitées dans les 24 heures suivant l\'approbation.',
                        'Les fonds sont déduits de votre solde immédiatement après la demande.',
                        'En cas de rejet, le montant total sera automatiquement retourné dans votre portefeuille.'
                      ].map((text, i) => (
                        <li key={i} className="flex items-start space-x-4">
                           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                           <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">{text}</p>
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
