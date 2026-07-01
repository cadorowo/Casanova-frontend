'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Phone, Lock, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterModal() {
  const { isRegisterOpen, closeAuth, register, openLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isRegisterOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^\d{8}$/.test(phone)) {
      setError('Le numéro de téléphone doit comporter exactement 8 chiffres.');
      setLoading(false);
      return;
    }

    try {
      const success = await register(phone, password);
      if (success) {
         setIsSuccess(true);
         setTimeout(() => {
            closeAuth();
            setIsSuccess(false); 
         }, 3000);
      } else {
         setError('Échec de l&apos;inscription. Le téléphone est peut-être déjà utilisé.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto no-scrollbar pb-32 md:pb-0">
      <div 
        className="fixed inset-0 bg-[#000000]/80 backdrop-blur-3xl animate-reveal"
        onClick={closeAuth}
      />
      
      <div className="relative w-full max-w-[500px] bezel-shell p-2 animate-reveal shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
        <div className="bezel-core bg-black p-8 md:p-12 min-h-[450px] flex flex-col justify-center relative">
          
          <button 
            onClick={() => closeAuth()}
            className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/5 transition-all active:scale-90 z-[110]"
          >
            <X size={18} className="text-gray-500 hover:text-white transition-colors" />
          </button>

          {!isSuccess ? (
             <div className="animate-reveal">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                     <UserPlus size={14} />
                     <span>Nouveau Compte Univers</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Rejoindre <span className="gold-text">Casanova</span>
                  </h2>
                  <p className="text-gray-500 font-medium tracking-tight">Créez votre profil de joueur élite en quelques secondes.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                     <div className="group relative animate-reveal [animation-delay:100ms]">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors">
                           <Phone size={18} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Numéro de Téléphone" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-bold focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white/10 transition-all placeholder:text-gray-700"
                          required
                        />
                     </div>

                     <div className="group relative animate-reveal [animation-delay:200ms]">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors">
                           <Lock size={18} />
                        </div>
                        <input 
                          type="password" 
                          placeholder="Mot de Passe Sécurisé" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-bold focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white/10 transition-all placeholder:text-gray-700"
                          required
                        />
                     </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="group w-full relative inline-flex items-center justify-between pl-10 pr-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-600/30 disabled:opacity-50 animate-reveal [animation-delay:300ms]"
                  >
                    <span className="text-white font-black uppercase text-xs tracking-[0.4em]">
                      {loading ? 'Inscription...' : 'Commencer l&apos;Aventure'}
                    </span>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                       <ArrowRight size={22} className="text-white" />
                    </div>
                  </button>
                </form>

                <div className="mt-10 text-center animate-reveal [animation-delay:400ms]">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    Déjà joueur ? 
                    <button 
                      onClick={() => { closeAuth(); openLogin(); }}
                      className="ml-2 text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Login
                    </button>
                  </p>
                </div>
             </div>
          ) : (
             <div className="text-center animate-reveal">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/40 animate-float-slow">
                   <CheckCircle2 size={40} className="text-white" />
                </div>
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3">Bienvenue dans l&apos;Élite</div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                   Inscription <br /> <span className="gold-text">Réussie</span>
                </h2>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-[150px] mx-auto">
                   <div className="h-full bg-blue-600 animate-progress origin-left" />
                </div>
             </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
