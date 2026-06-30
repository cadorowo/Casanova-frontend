'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield } from 'lucide-react';

function SettingsPageContent() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000000] pt-4 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="text-center mb-16">
          <h1 className="text-xl font-black text-white uppercase tracking-widest mb-4">
            Paramètres de <span className="gold-text">Sécurité</span>
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Gérez la sécurité de votre compte et vos préférences
          </p>
        </div>

        <div className="bezel-shell p-2">
          <div className="bezel-core bg-black p-8 md:p-12">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Sécurité du Compte</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                <div>
                   <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">ID de Station</div>
                   <div className="text-xl font-black text-white tracking-tight">{user.phone}</div>
                </div>
                <div className="px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-600/20">
                   Actif
                </div>
              </div>
              
              
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full p-6 bg-blue-600/10 hover:bg-blue-600/20 rounded-2xl border border-blue-600/20 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center space-x-4 text-left">
                     <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Shield size={20} className="text-white" />
                     </div>
                     <div>
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Accès Élite</div>
                        <div className="text-xl font-black text-white tracking-tight uppercase">Panneau de Contrôle Administrateur</div>
                     </div>
                  </div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-600/10 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                     Entrer dans la Station ⚡
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-all"
          >
            ← Retourner à la Station
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-white text-xl font-black tracking-tighter uppercase italic">Synchronisation...</div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
