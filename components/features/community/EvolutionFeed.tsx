import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, Share2, Sparkles } from 'lucide-react';
import { MemberEvolution, subscribeToEvolutions, shareEvolution, checkIfLevelShared, generateWhatsAppLink, checkIfAchievementShared, getRandomMessage } from '../../../services/evolutionService';
import { EvolutionCard } from './EvolutionCard';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { UserProfile } from '../../../types';
import { supabase } from '../../../services/supabase';

export const EvolutionFeed: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [evolutions, setEvolutions] = useState<MemberEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'level_up' | 'formation'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [canShareLevel, setCanShareLevel] = useState(false);
  const [unsharedChallengeDays, setUnsharedChallengeDays] = useState<number[]>([]);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  useEffect(() => {
    const unsubscribe = subscribeToEvolutions((newEvolutions) => {
      setEvolutions(newEvolutions);
      setLoading(false);
    });

    const checkPendingShares = async () => {
      if (profile) {
        // Check Level
        const levelShared = await checkIfLevelShared(profile.id, profile.rank_name || 'Élite');
        setCanShareLevel(!levelShared);

        // Check Challenge Days
        const pendingDays: number[] = [];
        const challenge = profile.store_preferences?.challenge_3j;
        
        if (challenge) {
          if (challenge.j1Completed || challenge.j1_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J1');
            if (!shared) pendingDays.push(1);
          }
          if (challenge.j2Completed || challenge.j2_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J2');
            if (!shared) pendingDays.push(2);
          }
          if (challenge.j3Completed || challenge.j3_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J3');
            if (!shared) pendingDays.push(3);
          }
        }
        setUnsharedChallengeDays(pendingDays);
      }
    };
    
    checkPendingShares();

    return () => unsubscribe();
  }, [profile?.id, profile?.rank_name, JSON.stringify(profile?.store_preferences?.challenge_3j)]);

  const handleShareCurrentRank = async () => {
    if (!profile || isSharing || !canShareLevel) return;
    setIsSharing(true);
    try {
      const message = getRandomMessage('level_up', { levelName: profile.rank_name || 'Élite' });
      
      const shareData = {
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'level_up' as const,
        old_level: 'Membre',
        new_level: profile.rank_name || 'Élite',
        message: message
      };

      await shareEvolution(shareData);
      setCanShareLevel(false);

      setShareModal({ isOpen: true, message });
    } catch (err: any) {
      console.error(err);
      alert("Une erreur est survenue lors du partage.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareChallenge = async (day: number) => {
    if (!profile || isSharing) return;
    setIsSharing(true);
    try {
      const message = getRandomMessage('challenge', { day });
      
      const shareData = {
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked' as const,
        new_level: `Défi J${day}`,
        message: message
      };

      await shareEvolution(shareData);
      setUnsharedChallengeDays(prev => prev.filter(d => d !== day));

      setShareModal({ isOpen: true, message });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors du partage.");
    } finally {
      setIsSharing(false);
    }
  };

  const filteredEvolutions = evolutions.filter(ev => {
    if (filter === 'all') return true;
    if (filter === 'level_up') return ev.type === 'level_up';
    if (filter === 'formation') return ev.type === 'formation_completed';
    return true;
  });

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Évolutions
            </h2>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1 ring-1 ring-white/5 inline-block px-2 py-0.5 rounded">
              Activités de la communauté
            </p>
          </div>
        </div>

        {/* Share Achievement CTA */}
        {profile && (canShareLevel || unsharedChallengeDays.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Sparkles size={40} className="text-blue-400" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Partage tes victoires !</h3>
                <p className="text-[10px] text-neutral-400 font-medium">Inspirer la communauté te permet de marquer ton territoire.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {canShareLevel && (
                  <button
                    onClick={handleShareCurrentRank}
                    disabled={isSharing}
                    className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? 'Envoi...' : <><Share2 size={12} /> Partager mon Grade</>}
                  </button>
                )}

                {unsharedChallengeDays.map(day => (
                  <button
                    key={day}
                    onClick={() => handleShareChallenge(day)}
                    disabled={isSharing}
                    className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? 'Envoi...' : <><Share2 size={12} /> Défi J{day} Validé</>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredEvolutions.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-neutral-600">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Aucune évolution pour le moment</h3>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-2 font-medium">Soyez le premier à partager votre progression et inspirez les autres !</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredEvolutions.map((ev) => (
              <EvolutionCard 
                key={ev.id} 
                evolution={ev} 
                profile={profile} 
                onExternalShare={(msg) => setShareModal({ isOpen: true, message: msg })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {shareModal.isOpen && (
          <WhatsAppShareModal 
            isOpen={shareModal.isOpen}
            onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
            onShare={() => {
              console.log("Sharing to WhatsApp:", shareModal.message);
              window.open(generateWhatsAppLink(shareModal.message), '_blank');
              setShareModal(prev => ({ ...prev, isOpen: false }));
            }}
            title="Impacte la Communauté"
            description="Félicitations ! Partage maintenant ton succès dans le groupe WhatsApp pour inspirer tout le monde."
          />
        )}
      </AnimatePresence>
    </div>
  );
};
