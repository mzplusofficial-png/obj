import React, { useState } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { GoldBorderCard, SectionTitle } from '../../UI.tsx';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface Challenge3JAdminProps {
  users: any[];
  onRefresh: () => void;
}

export const Challenge3JAdmin: React.FC<Challenge3JAdminProps> = ({ users, onRefresh }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCommand = async (userId: string, commands: Record<string, any>) => {
    setLoadingId(userId);
    try {
      const user = users.find(u => u.id === userId);
      const newPrefs = { ...(user?.store_preferences || {}) };
      newPrefs.challenge_command = commands.command;
      
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId);
      
      // Optimistic update for admin visibility
      if (commands.command === 'reset') {
         if (newPrefs.challenge_3j) {
            newPrefs.challenge_3j = { presented: false, j1Completed: false, startedAt: null };
            await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId);
         }
      } else if (commands.command === 'complete') {
         if (!newPrefs.challenge_3j) newPrefs.challenge_3j = {};
         newPrefs.challenge_3j.presented = true;
         newPrefs.challenge_3j.j1Completed = true;
         if (!newPrefs.challenge_3j.startedAt) newPrefs.challenge_3j.startedAt = new Date().toISOString();
         await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId);
      }
      
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la modification");
    } finally {
      setLoadingId(null);
    }
  };

  const activeUsers = users.filter((u: any) => u.store_preferences?.challenge_3j?.presented || u.store_preferences?.challenge_3j?.j1Completed);

  return (
    <div className="space-y-6">
      <SectionTitle title="Administration des Défis 3 Jours" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeUsers.length === 0 && (
          <div className="col-span-full py-8 text-center text-neutral-400 bg-neutral-900/40 rounded-3xl border border-neutral-800">
            Aucun utilisateur n'a déclenché le défi.
          </div>
        )}
        {activeUsers.map((u: any) => {
          const c = u.store_preferences?.challenge_3j || {};
          const isCompleted = !!c.j1Completed;
          
          return (
            <GoldBorderCard key={u.id}>
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-bold text-white text-lg">{u.full_name}</h4>
                  <p className="text-sm text-neutral-400 truncate">{u.email}</p>
                </div>
                
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">
                      {isCompleted ? 'Défi Complété (J1)' : 'Défi en Cours (J1)'}
                    </div>
                    {c.startedAt && (
                      <div className="text-[10px] text-neutral-500">
                        Début: {new Date(c.startedAt).toLocaleDateString()} à {new Date(c.startedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                   <button 
                     onClick={() => handleCommand(u.id, { command: 'complete' })}
                     disabled={loadingId === u.id || isCompleted}
                     className="flex-1 px-3 py-2 text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                   >
                     {loadingId === u.id ? '...' : 'Marquer Gagné'}
                   </button>
                   <button 
                     onClick={() => handleCommand(u.id, { command: 'reset' })}
                     disabled={loadingId === u.id}
                     className="flex-1 px-3 py-2 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                   >
                     {loadingId === u.id ? '...' : 'Réinitialiser'}
                   </button>
                </div>
              </div>
            </GoldBorderCard>
          );
        })}
      </div>
    </div>
  );
};
