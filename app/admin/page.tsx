'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Transaction, User } from '@/types';
import { 
  History, 
  CheckCircle2,
  Plus,
  ShieldCheck,
  Wallet,
  Zap,
  Search,
  Check,
  XCircle,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocketSync } from '@/lib/use-socket-sync';

export default function AdminPage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueSearchTerm, setQueueSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [clientPage, setClientPage] = useState(1);
  const [masterPage, setMasterPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [clientTimeFilter, setClientTimeFilter] = useState('all');
  const [masterTimeFilter, setMasterTimeFilter] = useState('all');

  const queueItemsPerPage = 10;
  const filteredPendingRequests = pendingRequests.filter(req => {
    if (!queueSearchTerm) return true;
    const userObj = typeof req.userId !== 'string' ? req.userId : null;
    const search = queueSearchTerm.toLowerCase();
    return (
      userObj?.username?.toLowerCase().includes(search) ||
      userObj?.phone?.includes(search)
    );
  });
  const totalQueuePages = Math.ceil(filteredPendingRequests.length / queueItemsPerPage);
  const safeQueuePage = Math.min(queuePage, Math.max(totalQueuePages, 1));
  const paginatedPendingRequests = filteredPendingRequests.slice((safeQueuePage - 1) * queueItemsPerPage, safeQueuePage * queueItemsPerPage);

  const usersItemsPerPage = 10;
  const filteredUsers = usersList.filter(player => player.phone?.includes(searchTerm));
  const totalUsersPages = Math.ceil(filteredUsers.length / usersItemsPerPage);
  const safeUsersPage = Math.min(usersPage, Math.max(totalUsersPages, 1));
  const paginatedUsers = filteredUsers.slice((safeUsersPage - 1) * usersItemsPerPage, safeUsersPage * usersItemsPerPage);

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    try {
      const [logs, users, pending] = await Promise.all([
        api.admin.getFinancialLogs(token),
        api.admin.getUsers(token),
        api.admin.getPendingRequests(token)
      ]);
      setTransactions(logs);
      setUsersList(users);
      setPendingRequests(pending);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  }, [token]);

  useSocketSync(useCallback(() => {
    fetchAdminData();
  }, [fetchAdminData]));

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!token) return;
    setProcessingId(requestId);
    try {
       if (action === 'approve') await api.admin.approveTransaction(token, requestId);
       else await api.admin.rejectTransaction(token, requestId);
       
       setAdminFeedback({ message: action === 'approve' ? 'Transaction Approuvée' : 'Transaction Rejetée', type: 'success' });
       fetchAdminData();
       
       document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
       
       setTimeout(() => setAdminFeedback(null), 3000);
    } catch {
       setAdminFeedback({ message: "Échec de l'Opération", type: 'error' });
    } finally {
       setProcessingId(null);
    }
  };

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchAdminData();
      }
    }
  }, [isAuthenticated, user, router, mounted, fetchAdminData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(amount) + ' TND';
  };

  const getPlayerPhone = (description?: string) => {
    if (!description) return '';
    const match = description.match(/(?:user|for)\s+(\d+)/i);
    return match ? match[1] : '';
  };

  const getTxConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return { icon: ArrowDownLeft, label: 'Dépôt', color: 'text-white', bg: 'bg-purple-500/10' };
      case 'withdrawal': return { icon: ArrowUpRight, label: 'Retrait', color: 'text-white', bg: 'bg-blue-400/10' };
      case 'bet': return { icon: TrendingUp, label: 'Pari Placé', color: 'text-white', bg: 'bg-red-500/10' };
      case 'win': return { icon: CheckCircle2, label: 'Gagné', color: 'text-white', bg: 'bg-yellow-500/10' };
      case 'admin_transfer': return { icon: Zap, label: 'Distribué', color: 'text-white', bg: 'bg-purple-500/10' };
      case 'admin_buy_in': return { icon: Plus, label: 'Master Buy-In', color: 'text-white', bg: 'bg-yellow-500/10' };
      default: return { icon: History, label: type, color: 'text-white', bg: 'bg-gray-500/10' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Attente' };
      case 'completed': 
      case 'won': return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Approuvé' };
      case 'failed':
      case 'lost':
      case 'cancelled': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Rejeté' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: status };
    }
  };

  if (!mounted || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-full bg-[#000000] animate-reveal">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 pt-12 md:pt-20 pb-24">
        
        {}
        <div className="mb-10 lg:mb-16">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <h1 className="text-xl font-black text-white uppercase tracking-widest">
                 Admin <span className="gold-text">Centre de Commande</span>
              </h1>
           </div>
           <p className="text-gray-500 font-medium tracking-tight">
             Contrôle opérationnel actif. Système sécurisé.
           </p>
        </div>

         {}
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10 lg:mb-16 items-stretch">
           
            {}
            <div className="xl:col-span-4 flex">
              <div className="bezel-shell p-1 w-full h-full">
              <div className="bezel-core cassanova-glass p-6 md:p-8 flex flex-col justify-between rounded-[2rem] border border-yellow-500/20 h-full">
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20 shadow-xl shrink-0">
                          <ShieldCheck size={28} className="text-blue-500" />
                       </div>
                        <div className="min-w-0">
                           <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                             Distribution Master
                           </div>
                           <div className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tighter leading-none truncate">
                              {formatBalance(user?.adminWallet || 0)}
                           </div>
                        </div>
                    </div>
                 </div>
                 
                  <div className="flex flex-col gap-3 mt-auto">
                     <Link href="/dashboard/admin/buy-in" className="group gold-button pl-6 pr-1.5 py-1.5 flex items-center justify-between min-w-0 min-h-[44px] md:min-h-[60px] md:pl-8 md:pr-2 shadow-2xl shadow-[#f2d335]/20">
                       <span className="font-black uppercase text-[10px] md:text-xs tracking-wider truncate">Acquérir des Crédits</span>
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-black/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0">
                          <Plus size={18} className="text-black" />
                       </div>
                     </Link>
                  </div>
              </div>
              </div>
            </div>

            {}
            <div className="xl:col-span-8 animate-reveal flex">
               <div className="bezel-shell p-0.5 w-full h-full">
                  <div className="bezel-core bg-black flex flex-col h-full min-h-[320px]">
                     <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center space-x-4 shrink-0">
                           <div className="w-1 h-4 bg-blue-600 rounded-full" />
                           <h2 className="text-sm font-black text-white uppercase tracking-tighter">Gestion de la File d&apos;Attente</h2>
                           {pendingRequests.length > 0 && (
                             <div className="flex items-center space-x-2">
                               <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                               <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">
                                 {pendingRequests.length} Attente
                               </span>
                             </div>
                           )}
                        </div>
                        
                        <div className="w-full md:w-64">
                           <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center space-x-3 transition-all focus-within:border-blue-600/50">
                              <Search size={12} className="text-gray-500" />
                              <input 
                                type="text" 
                                placeholder="RECHERCHER UN COMPTE..." 
                                value={queueSearchTerm}
                                onChange={(e) => {
                                  setQueueSearchTerm(e.target.value);
                                  setQueuePage(1);
                                }}
                                className="bg-transparent border-none w-full text-white font-black tracking-widest text-[8px] focus:outline-none placeholder:text-gray-800"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="p-6 flex-1 flex flex-col md:overflow-y-auto no-scrollbar md:max-h-[500px]">
                        {adminFeedback && (
                          <div className={`mb-6 p-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center animate-reveal ${
                            adminFeedback.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'
                          }`}>
                            {adminFeedback.message}
                          </div>
                        )}

                        {pendingRequests.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center opacity-30 pt-4 pb-12">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">
                                Voûte en Attente
                             </p>
                          </div>
                        ) : (
                          <>
                          <div className="space-y-2 md:max-h-[450px] md:overflow-y-auto pr-2 custom-scrollbar">
                             {paginatedPendingRequests.map((req) => (
                                 <div key={req._id} className="cassanova-row-slim min-h-[60px] md:min-h-0 group mb-1 last:mb-0 py-2 md:py-1">
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                       <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                         req.type === 'deposit' ? 'bg-purple-500 text-white' : 'bg-[#c2b280] text-white'
                                       }`}>
                                          {req.type === 'deposit' ? <Plus size={12} /> : <Banknote size={12} />}
                                       </div>
                                       
                                       <div className="flex flex-1 min-w-0 items-center justify-between md:justify-start md:space-x-8 pr-2">
                                          {}
                                          <div className="flex flex-col md:flex-row md:items-center min-w-0 md:space-x-8 flex-1">
                                             <Link 
                                                 href={`/admin/credits?phone=${typeof req.userId !== 'string' ? req.userId?.phone || req.userId?.username : ''}`}
                                                 className="text-sm md:text-base font-black text-blue-600 hover:text-blue-500 tracking-tighter truncate transition-colors"
                                              >
                                                {typeof req.userId !== 'string' ? req.userId?.phone || req.userId?.username : 'Unknown'}
                                              </Link>
                                             
                                             <div className="md:hidden text-base font-black text-white tracking-tighter">
                                                {req.type === 'withdrawal' ? '-' : '+'}{req.amount.toFixed(1)} <span className="text-[10px] opacity-40 uppercase">TND</span>
                                             </div>
                                             
                                             {}
                                             <div className="hidden md:flex items-center space-x-8">
                                                <div className="flex items-center space-x-2">
                                                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                                   </span>
                                                   <div className="w-1 h-1 rounded-full bg-white/10" />
                                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                      {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                   </span>
                                                </div>
                                                <div className="text-base font-black text-white tracking-tighter whitespace-nowrap">
                                                   {req.type === 'withdrawal' ? '-' : '+'}{req.amount.toFixed(1)} <span className="text-[10px] opacity-40 uppercase">TND</span>
                                                </div>
                                             </div>
                                          </div>
                                          
                                          {}
                                          <div className="md:hidden flex flex-col items-end space-y-0.5 shrink-0">
                                             <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                                {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                             </span>
                                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                             </span>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0 ml-auto">
                                       <button 
                                         onClick={() => handleAction(req._id, 'approve')}
                                         disabled={!!processingId}
                                         className="w-8 h-8 md:w-7 md:h-7 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center text-white transition-all disabled:opacity-50"
                                       >
                                          {processingId === req._id ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={16} className="md:size-[14px]" />}
                                       </button>
                                       <button 
                                         onClick={() => handleAction(req._id, 'reject')}
                                         disabled={!!processingId}
                                         className="w-8 h-8 md:w-7 md:h-7 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded flex items-center justify-center text-gray-500 transition-all disabled:opacity-50"
                                       >
                                          {processingId === req._id ? <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /> : <XCircle size={16} className="md:size-[14px]" />}
                                       </button>
                                    </div>
                                 </div>
                              ))}
                          </div>
                          {totalQueuePages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 shrink-0">
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                Page {safeQueuePage} sur {totalQueuePages}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setQueuePage(prev => Math.max(prev - 1, 1))}
                                  disabled={safeQueuePage === 1}
                                  className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                >
                                  ← Précédent
                                </button>
                                <button
                                  onClick={() => setQueuePage(prev => Math.min(prev + 1, totalQueuePages))}
                                  disabled={safeQueuePage === totalQueuePages}
                                  className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                >
                                  Suivant →
                                </button>
                              </div>
                            </div>
                          )}
                          </>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {}
         <div className="mb-10 lg:mb-16">
            <div className="bezel-shell p-1 w-full shadow-2xl">
               <div className="bezel-core bg-black rounded-[var(--cassanova-radius)] overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-6 bg-white/[0.02]">
                     <div className="flex items-center space-x-6">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        <div className="flex items-center space-x-4">
                           <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Annuaire des Joueurs</h2>
                           <div className="flex items-center space-x-2 bg-blue-600/10 px-3 py-1 rounded-full border border-blue-600/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                 {usersList.length} Joueurs Actifs
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="w-full lg:w-96 bg-white/5 rounded-full px-5 py-2.5 flex items-center space-x-3 border border-white/5 hover:border-blue-600/30 transition-all group">
                        <Search size={16} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                        <input 
                           type="text" 
                           placeholder="RECHERCHER UN JOUEUR..." 
                           value={searchTerm}
                           onChange={(e) => {
                             setSearchTerm(e.target.value);
                             setUsersPage(1);
                           }}
                           className="bg-transparent border-none w-full text-white font-black tracking-widest text-[10px] focus:outline-none placeholder:text-gray-800"
                        />
                     </div>
                  </div>
                   <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-2 md:max-h-[600px] md:overflow-y-auto custom-scrollbar">
                     {paginatedUsers.map((player) => (
                        <div key={player.id || player._id} className="cassanova-row-slim min-h-[50px] md:min-h-0 group">
                           <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-600/20 group-hover:text-blue-600 transition-colors shrink-0">
                                 <ShieldCheck size={12} />
                              </div>
                              <div className="flex items-center space-x-6 min-w-0">
                                 <Link 
                                    href={`/admin/credits?phone=${player.phone}`}
                                    className="text-base font-black text-blue-600 hover:text-blue-500 tracking-tighter truncate shrink-0 transition-colors"
                                 >
                                    {player.phone}
                                 </Link>
                                 <div className="w-px h-3 bg-white/10" />
                                 <span className="text-base font-black text-white tracking-tighter shrink-0">
                                    {formatBalance(player.balance)}
                                 </span>
                              </div>
                           </div>
                           <div className="flex items-center">
                               <Link 
                                 href={`/admin/credits?phone=${player.phone}`} 
                                 className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                               >
                                  <Wallet size={14} className="text-white" />
                               </Link>
                           </div>
                        </div>
                     ))}
                     {filteredUsers.length === 0 && (
                       <div className="py-24 text-center opacity-20">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucun Personnel Trouvé</p>
                       </div>
                     )}
                     {totalUsersPages > 1 && (
                       <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 shrink-0">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                             Page {safeUsersPage} sur {totalUsersPages}
                          </span>
                          <div className="flex space-x-2">
                             <button
                                onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                                disabled={safeUsersPage === 1}
                                className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                             >
                                ← Précédent
                             </button>
                             <button
                                onClick={() => setUsersPage(prev => Math.min(prev + 1, totalUsersPages))}
                                disabled={safeUsersPage === totalUsersPages}
                                className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                             >
                                Suivant →
                             </button>
                          </div>
                       </div>
                     )}
                   </div>
                </div>
             </div>
          </div>

          {}
          <div className="flex flex-col gap-8 mb-10 lg:mb-16">
             
             {}
             <div className="bezel-shell p-1 w-full shadow-2xl">
                <div className="bezel-core bg-black rounded-[var(--cassanova-radius)] overflow-hidden flex flex-col">
                   
                   {}
                   <div className="p-5 md:p-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                         <div className="w-1 h-6 bg-purple-500 rounded-full" />
                         <h2 className="text-xl font-black text-white uppercase tracking-tighter">Flux Clients</h2>
                      </div>
                      
                      {}
                      <div className="flex items-center space-x-2 self-start sm:self-center">
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                         <div className="flex gap-1.5">
                            {[
                               { value: 'all', label: 'Tous' },
                               { value: '7d', label: '7 Jours' },
                               { value: '15d', label: '15 Jours' },
                               { value: '30d', label: '30 Jours' }
                            ].map((timeTab) => (
                               <button
                                  key={timeTab.value}
                                  onClick={() => {
                                     setClientTimeFilter(timeTab.value);
                                     setClientPage(1);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                                     clientTimeFilter === timeTab.value
                                        ? 'bg-blue-600/15 border border-blue-600/40 text-blue-500'
                                        : 'bg-white/5 border border-white/5 text-gray-600 hover:text-white'
                                  }`}
                               >
                                  {timeTab.label}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                    {}
                    <div className="p-3 md:p-6 flex flex-col h-[600px]">
                       {(() => {
                          const filteredClientTxs = transactions.filter(tx => {
                             const matchType = tx.type.toLowerCase() === 'admin_transfer';
                             if (!matchType) return false;

                             if (clientTimeFilter !== 'all') {
                                const now = new Date();
                                const txDate = new Date(tx.createdAt);
                                const diffTime = Math.abs(now.getTime() - txDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (clientTimeFilter === '7d' && diffDays > 7) return false;
                                if (clientTimeFilter === '15d' && diffDays > 15) return false;
                                if (clientTimeFilter === '30d' && diffDays > 30) return false;
                             }

                             return true;
                          });

                         const itemsPerPage = 10;
                         const totalClientPages = Math.ceil(filteredClientTxs.length / itemsPerPage);
                         const safePage = Math.min(clientPage, Math.max(totalClientPages, 1));
                         const startIndex = (safePage - 1) * itemsPerPage;
                         const paginatedTxs = filteredClientTxs.slice(startIndex, startIndex + itemsPerPage);

                         if (filteredClientTxs.length === 0) {
                            return (
                               <div className="py-24 text-center opacity-20">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucune Activité Client Enregistrée</p>
                               </div>
                            );
                         }

                         return (
                            <>
                               <div className="space-y-2 flex-1 md:overflow-y-auto custom-scrollbar pr-2">
                                  {paginatedTxs.map((tx) => {
                                     const config = getTxConfig(tx.type);
                                     
                                     const displayColor = 'text-white';
                                     let displayBg = config.bg;
                                     let DisplayIcon = config.icon;
                                     const iconColor = '';

                                     if (tx.type.toLowerCase() === 'deposit' || tx.type.toLowerCase() === 'admin_transfer') {
                                        displayBg = 'bg-purple-600';
                                        DisplayIcon = ArrowDownLeft;
                                     } else if (tx.type.toLowerCase() === 'withdrawal' || tx.type.toLowerCase() === 'admin_transfer_receive') {
                                        displayBg = 'bg-[#c2b280]';
                                        DisplayIcon = ArrowUpRight;
                                     }

                                     return (
                                        <div key={tx._id} className="cassanova-row-slim min-h-[50px] md:min-h-0 group mb-1 last:mb-0">
                                           <div className="flex items-center space-x-4 flex-1 min-w-0">
                                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${displayBg} border border-white/5 ${iconColor || displayColor}`}>
                                                 <DisplayIcon size={12} />
                                              </div>
                                               <div className="flex flex-col min-w-0 py-1">
                                                  <div className="flex items-center space-x-2 min-w-0">
                                                     <span className={`text-sm font-black uppercase tracking-tighter truncate ${displayColor}`}>
                                                        {config.label === 'Master Buy-In' || config.label === 'Distributed' ? <span className="hidden md:inline">{config.label}</span> : config.label}
                                                     </span>
                                                     {tx.type === 'admin_transfer' && (
                                                        <Link 
                                                           href={`/admin/credits?phone=${getPlayerPhone(tx.description)}`}
                                                           className="text-[11px] font-black uppercase tracking-tighter text-blue-500 hover:text-blue-400 transition-colors "
                                                        >
                                                           {getPlayerPhone(tx.description) || 'PLAYER'}
                                                        </Link>
                                                     )}
                                                  </div>
                                                  
                                                  <div className="md:hidden flex items-center space-x-2">
                                                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                                                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} • {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                     </span>
                                                  </div>

                                                  <div className="hidden md:flex items-center space-x-4">
                                                     <div className="w-px h-3 bg-white/10" />
                                                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                                                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')} • {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                     </span>
                                                  </div>
                                               </div>
                                               <div className="flex items-center space-x-3 shrink-0 ml-auto">
                                                  <div className="text-base font-black tracking-tighter text-white whitespace-nowrap">
                                                     {(tx.type === 'withdrawal' || tx.type === 'admin_transfer') ? '-' : '+'}{tx.amount.toFixed(1)} <span className="text-[8px] md:text-[10px] opacity-40 uppercase">TND</span>
                                                  </div>
                                               </div>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>

                               {}
                               {totalClientPages > 1 && (
                                  <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4 shrink-0">
                                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        Page {safePage} sur {totalClientPages}
                                     </span>
                                     <div className="flex space-x-2">
                                        <button
                                           onClick={() => setClientPage(prev => Math.max(prev - 1, 1))}
                                           disabled={safePage === 1}
                                           className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                        >
                                           ← Précédent
                                        </button>
                                        <button
                                           onClick={() => setClientPage(prev => Math.min(prev + 1, totalClientPages))}
                                           disabled={safePage === totalClientPages}
                                           className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                        >
                                           Suivant →
                                        </button>
                                     </div>
                                  </div>
                               )}
                            </>
                         );
                      })()}
                   </div>
                </div>
             </div>

             {}
             <div className="bezel-shell p-1 w-full shadow-2xl">
                <div className="bezel-core bg-black rounded-[var(--cassanova-radius)] overflow-hidden flex flex-col">
                   
                   {}
                   <div className="p-5 md:p-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                         <div className="w-1 h-6 bg-[#f2d335] rounded-full" />
                         <h2 className="text-xl font-black text-white uppercase tracking-tighter">Provisionnement Master</h2>
                      </div>
                      
                      {}
                      <div className="flex items-center space-x-2 self-start sm:self-center">
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Période:</span>
                         <div className="flex gap-1.5">
                            {[
                               { value: 'all', label: 'Tous' },
                               { value: '7d', label: '7 Jours' },
                               { value: '15d', label: '15 Jours' },
                               { value: '30d', label: '30 Jours' }
                            ].map((timeTab) => (
                               <button
                                  key={timeTab.value}
                                  onClick={() => {
                                     setMasterTimeFilter(timeTab.value);
                                     setMasterPage(1);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                                     masterTimeFilter === timeTab.value
                                        ? 'bg-blue-600/15 border border-blue-600/40 text-blue-500'
                                        : 'bg-white/5 border border-white/5 text-gray-600 hover:text-white'
                                  }`}
                               >
                                  {timeTab.label}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                    {}
                    <div className="p-3 md:p-6 flex flex-col md:max-h-[600px]">
                       {(() => {
                          const filteredMasterTxs = transactions.filter(tx => {
                             const matchType = tx.type.toLowerCase() === 'admin_buy_in';
                             if (!matchType) return false;

                             if (masterTimeFilter !== 'all') {
                                const now = new Date();
                                const txDate = new Date(tx.createdAt);
                                const diffTime = Math.abs(now.getTime() - txDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (masterTimeFilter === '7d' && diffDays > 7) return false;
                                if (masterTimeFilter === '15d' && diffDays > 15) return false;
                                if (masterTimeFilter === '30d' && diffDays > 30) return false;
                             }

                             return true;
                          });

                         const itemsPerPage = 10;
                         const totalMasterPages = Math.ceil(filteredMasterTxs.length / itemsPerPage);
                         const safePage = Math.min(masterPage, Math.max(totalMasterPages, 1));
                         const startIndex = (safePage - 1) * itemsPerPage;
                         const paginatedTxs = filteredMasterTxs.slice(startIndex, startIndex + itemsPerPage);

                         if (filteredMasterTxs.length === 0) {
                            return (
                               <div className="py-24 text-center opacity-20">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Aucun Provisionnement Master Trouvé</p>
                               </div>
                            );
                         }

                         return (
                            <>
                               <div className="space-y-2 flex-1 md:overflow-y-auto custom-scrollbar pr-2">
                                  {paginatedTxs.map((tx) => {
                                     const config = getTxConfig(tx.type);
                                     const statusCfg = getStatusConfig(tx.status);
                                     
                                     const displayColor = 'text-white';
                                     const displayBg = 'bg-[#f2d335]';
                                     const DisplayIcon = Banknote;
                                     const iconColor = 'text-black';

                                     return (
                                        <div key={tx._id} className="cassanova-row-slim min-h-[50px] md:min-h-0 group mb-1 last:mb-0">
                                           <div className="flex items-center space-x-4 flex-1 min-w-0">
                                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${displayBg} border border-white/5 ${iconColor || displayColor}`}>
                                                 <DisplayIcon size={12} />
                                              </div>
                                               <div className="flex flex-col min-w-0 py-1">
                                                  <div className="flex items-center space-x-2 min-w-0">
                                                     <span className={`text-sm font-black uppercase tracking-tighter truncate ${displayColor}`}>
                                                        {config.label === 'Master Buy-In' || config.label === 'Distributed' ? <span className="hidden md:inline">{config.label}</span> : config.label}
                                                     </span>
                                                  </div>
                                                  
                                                  <div className="md:hidden flex items-center space-x-2">
                                                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                                                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} • {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                     </span>
                                                  </div>

                                                  <div className="hidden md:flex items-center space-x-4">
                                                     <div className="w-px h-3 bg-white/10" />
                                                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                                                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')} • {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                     </span>
                                                  </div>
                                               </div>
                                               <div className="flex items-center space-x-3 shrink-0 ml-auto">
                                                  <div className="text-base font-black tracking-tighter text-white whitespace-nowrap">
                                                     +{tx.amount.toFixed(1)} <span className="text-[8px] md:text-[10px] opacity-40 uppercase">TND</span>
                                                  </div>
                                                  
                                                  <div className={`w-8 h-6 md:w-auto px-2 py-0.5 rounded-full ${statusCfg.bg} border ${statusCfg.border} ${statusCfg.color} text-[7px] font-black uppercase tracking-widest flex items-center justify-center space-x-1`}>
                                                     <div className={`w-1 h-1 rounded-full ${statusCfg.color.replace('text', 'bg')} animate-pulse`} />
                                                     {tx.status.toLowerCase() === 'pending' && <History size={8} className="md:hidden" />}
                                                     {(tx.status.toLowerCase() === 'completed' || tx.status.toLowerCase() === 'won') && <Check size={8} className="md:hidden" />}
                                                     {(tx.status.toLowerCase() === 'failed' || tx.status.toLowerCase() === 'rejected') && <XCircle size={8} className="md:hidden" />}
                                                     <span className="hidden md:inline">{statusCfg.label}</span>
                                                  </div>
                                               </div>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>

                               {}
                               {totalMasterPages > 1 && (
                                  <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4 shrink-0">
                                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        Page {safePage} sur {totalMasterPages}
                                     </span>
                                     <div className="flex space-x-2">
                                        <button
                                           onClick={() => setMasterPage(prev => Math.max(prev - 1, 1))}
                                           disabled={safePage === 1}
                                           className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                        >
                                           ← Précédent
                                        </button>
                                        <button
                                           onClick={() => setMasterPage(prev => Math.min(prev + 1, totalMasterPages))}
                                           disabled={safePage === totalMasterPages}
                                           className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
                                        >
                                           Suivant →
                                        </button>
                                     </div>
                                  </div>
                               )}
                            </>
                         );
                      })()}
                   </div>
                </div>
             </div>

          </div>
         </div>

      <style jsx global>{`
        .gold-text {
          color: #f2d335;
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



