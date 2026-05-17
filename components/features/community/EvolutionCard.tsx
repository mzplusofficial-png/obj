import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Rocket, 
  Target, 
  MessageCircle, 
  Share2, 
  TrendingUp,
  Award
} from 'lucide-react';
import { MemberEvolution, reactToEvolution, generateWhatsAppLink } from '../../../services/evolutionService';
import { UserProfile } from '../../../types';

interface EvolutionCardProps {
  evolution: MemberEvolution;
  profile: UserProfile | null;
}

export const EvolutionCard: React.FC<EvolutionCardProps> = ({ evolution: initialEvolution, profile }) => {
  const [evolution, setEvolution] = useState(initialEvolution);
  
  useEffect(() => {
    setEvolution(initialEvolution);
  }, [initialEvolution]);

  const handleReact = async (type: string) => {
    if (!profile) return;
    
    // Optimistic Update
    const currentReactions = { ...(evolution.reactions || {}) };
    const currentUserReactions = { ...(evolution.user_reactions?.[profile.id] || {}) };
    const hasThisReaction = currentUserReactions[type];

    const newUserReactionsForUser = { ...currentUserReactions };
    const newReactions = { ...currentReactions };

    if (hasThisReaction) {
      delete newUserReactionsForUser[type];
      newReactions[type] = Math.max(0, (newReactions[type] || 1) - 1);
    } else {
      newUserReactionsForUser[type] = true;
      newReactions[type] = (newReactions[type] || 0) + 1;
    }

    setEvolution(prev => ({
      ...prev,
      reactions: newReactions,
      user_reactions: {
        ...(prev.user_reactions || {}),
        [profile.id]: newUserReactionsForUser
      }
    }));

    await reactToEvolution(evolution.id, profile.id, type);
  };

  const userReactions = profile ? (evolution.user_reactions?.[profile.id] || {}) : {};

  const handleShareWhatsApp = () => {
    const link = generateWhatsAppLink(evolution.message);
    window.open(link, '_blank');
  };

  const getTypeIcon = () => {
    switch (evolution.type) {
      case 'level_up': return <Trophy className="text-yellow-500" size={20} />;
      case 'formation_completed': return <Award className="text-emerald-500" size={20} />;
      case 'achievement_unlocked': return <Target className="text-purple-500" size={20} />;
      default: return <Rocket className="text-blue-500" size={20} />;
    }
  };

  const getTypeLabel = () => {
    switch (evolution.type) {
      case 'level_up': return 'Progression de Niveau';
      case 'formation_completed': return 'Formation Terminée';
      case 'achievement_unlocked': return 'Défi Réussi';
      default: return 'Évolution';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/5 rounded-2xl p-4 shadow-xl relative overflow-hidden group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="shrink-0 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner">
              {evolution.user_name[0].toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-white text-xs tracking-tight uppercase italic truncate">
                {evolution.user_name}
              </h4>
              <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                {evolution.new_level || evolution.type}
              </span>
            </div>
            <p className="text-[12px] text-neutral-300 leading-snug mt-1.5 font-medium italic">
              "{evolution.message}"
            </p>
          </div>
        </div>
        
        {profile?.id === evolution.user_id && (
          <button 
            onClick={handleShareWhatsApp}
            className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all shrink-0"
            title="Partager mon évolution"
          >
            <Share2 size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-white/5">
        <button 
          onClick={() => handleReact('rocket')}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all ${userReactions['rocket'] ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-500' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-xs">🚀</span>
          <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">Super</span>
          <span className="text-[9px] font-black opacity-60">{evolution.reactions?.rocket || 0}</span>
        </button>
 
        <button 
          onClick={() => handleReact('cool')}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all ${userReactions['cool'] ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-500' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-xs">😎</span>
          <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">Cool</span>
          <span className="text-[9px] font-black opacity-60">{evolution.reactions?.cool || 0}</span>
        </button>
 
        <button 
          onClick={() => handleReact('clap')}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all ${userReactions['clap'] ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-xs">👏</span>
          <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">Bravo</span>
          <span className="text-[9px] font-black opacity-60">{evolution.reactions?.clap || 0}</span>
        </button>

        <div className="flex-1" />
        
        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest whitespace-nowrap">
          {new Date(evolution.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </motion.div>
  );
};
