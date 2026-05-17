import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, Share2, Sparkles } from 'lucide-react';
import { MemberEvolution, subscribeToEvolutions, shareEvolution, getEvolutionMessages } from '../../../services/evolutionService';
import { EvolutionCard } from './EvolutionCard';
import { UserProfile } from '../../../types';

export const EvolutionFeed: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [evolutions, setEvolutions] = useState<MemberEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'level_up' | 'formation'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedToday, setSharedToday] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEvolutions((data) => {
      setEvolutions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleShareCurrentRank = async () => {
    if (!profile || isSharing || sharedToday) return;
    setIsSharing(true);
    try {
      const messages = getEvolutionMessages(profile.full_name || profile.username, profile.rank_name || 'Élite');
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      await shareEvolution({
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        type: 'level_up',
        old_level: 'Membre',
        new_level: profile.rank_name || 'Élite',
        message: message
      });
      setSharedToday(true);
    } catch (err) {
      console.error(err);
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
              {evolutions.length} Évolutions partagées
            </p>
          </div>
        </div>

        {/* Share Achievement CTA */}
        {profile && !sharedToday && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Sparkles size={40} className="text-blue-400" />
            </div>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Partage ton ascension !</h3>
                <p className="text-[10px] text-neutral-400 font-medium">Inspirer la communauté te permet de marquer ton territoire.</p>
              </div>
              <button
                onClick={handleShareCurrentRank}
                disabled={isSharing}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
              >
                {isSharing ? 'Envoi...' : <><Share2 size={12} /> Partager</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
            <TrendingUp size={16} className="text-emerald-400 mb-2" />
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Tendance</p>
            <p className="text-sm font-black text-white uppercase italic">+12% de progression cette semaine</p>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
            <Users size={16} className="text-blue-400 mb-2" />
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Activité</p>
            <p className="text-sm font-black text-white uppercase italic">Communauté ultra-active</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-black border-white' : 'bg-white/5 text-neutral-400 border-white/10'}`}
          >
            Tout voir
          </button>
          <button 
            onClick={() => setFilter('level_up')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === 'level_up' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-yellow-500/5 text-yellow-500/60 border-yellow-500/20'}`}
          >
            Niveaux
          </button>
          <button 
            onClick={() => setFilter('formation')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === 'formation' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-emerald-500/5 text-emerald-500/60 border-emerald-500/20'}`}
          >
            Formations
          </button>
        </div>
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
              <EvolutionCard key={ev.id} evolution={ev} profile={profile} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
