'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginModal() {
  const { isLoginOpen, closeAuth, login, openRegister } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^\d{8}$/.test(phone)) {
      setError('L&apos;ID de la station (téléphone) doit comporter exactement 8 chiffres.');
      setLoading(false);
      return;
    }
    try {
      const success = await login(phone, password);
      if (success) {
         closeAuth();
      } else {
         setError('Numéro de téléphone ou mot de passe invalide.');
      }
    } catch (err: unknown) {
      let errMsg = err instanceof Error ? err.message : 'Échec de la connexion';
      if (errMsg === 'Invalid phone or password' || errMsg === 'Invalid credentials') {
        errMsg = 'Numéro de téléphone ou mot de passe incorrect.';
      } else if (errMsg === 'User not found') {
        errMsg = 'Utilisateur non trouvé.';
      }
      setError(errMsg);
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
        <div className="bezel-core bg-black p-8 md:p-12">
          
          <button 
            onClick={closeAuth}
            className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/5 transition-all active:scale-90 z-50"
          >
            <X size={18} className="text-gray-500" />
          </button>
 
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
               <ShieldCheck size={14} />
               <span>Accès Sécurisé</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
               Bon <span className="gold-text">Retour</span>
            </h2>
            <p className="text-gray-500 font-medium tracking-tight">Entrez vos identifiants pour accéder à l&apos;univers.</p>
          </div>
 
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
              {error}
            </div>
          )}
 
          <form onSubmit={handleSubmit} autoComplete="on" method="post" className="space-y-6">
            <div className="space-y-4">
               <div className="group relative animate-reveal [animation-delay:100ms]">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors">
                     <Mail size={18} />
                  </div>
                   <input 
                    id="phone-modal"
                    name="username"
                    type="text" 
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="numeric"
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
                    id="password-modal"
                    name="password"
                    type="password" 
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Mot de Passe" 
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
              className="group w-full min-h-[60px] relative inline-flex items-center justify-between pl-10 pr-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-600/30 disabled:opacity-50 animate-reveal [animation-delay:400ms]"
            >
              <span className="text-white font-black uppercase text-xs tracking-[0.4em]">
                {loading ? 'Attende' : "Accéder à l'Univers"}
              </span>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                 <ArrowRight size={22} className="text-white" />
              </div>
            </button>
          </form>
 
          <div className="mt-10 text-center animate-reveal [animation-delay:500ms]">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Vous n&apos;avez pas de compte ? 
              <button 
                onClick={() => { closeAuth(); openRegister(); }}
                className="ml-2 text-blue-500 hover:text-blue-400 transition-colors"
              >
                S&apos;inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
