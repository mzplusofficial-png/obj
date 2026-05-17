import React from 'react';
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

export const EvolutionCard: React.FC<EvolutionCardProps> = ({ evolution, profile }) => {
  const handleReact = (type: string) => {
    if (!profile) return;
    reactToEvolution(evolution.id, profile.id, type);
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
      className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent opacity-10 pointer-events-none" />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-white font-black text-xl shadow-inner">
              {evolution.user_name[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-lg border border-white/10">
              {getTypeIcon()}
            </div>
          </div>
          <div>
            <h4 className="font-black text-white text-base tracking-tight uppercase italic">
              {evolution.user_name}
            </h4>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
              {getTypeLabel()} • {new Date(evolution.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleShareWhatsApp}
          className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all group/share"
          title="Partager sur WhatsApp"
        >
          <Share2 size={16} className="group-hover/share:scale-110 transition-transform" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {evolution.type === 'level_up' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">Nouveau Rang Atteint</p>
              <h5 className="text-lg font-black text-white uppercase italic leading-tight">
                {evolution.old_level} <span className="text-neutral-500 text-sm mx-2">→</span> {evolution.new_level}
              </h5>
            </div>
          </div>
        )}

        <p className="text-sm text-neutral-300 leading-relaxed font-medium">
          {evolution.message}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
        <button 
          onClick={() => handleReact('rocket')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${userReactions['rocket'] ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-500' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-base">🚀</span>
          <span className="text-[10px] font-black uppercase tracking-tight">Super</span>
          <span className="text-[10px] font-black opacity-60 ml-1">{evolution.reactions?.rocket || 0}</span>
        </button>
 
        <button 
          onClick={() => handleReact('cool')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${userReactions['cool'] ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-500' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-base">😎</span>
          <span className="text-[10px] font-black uppercase tracking-tight">Cool</span>
          <span className="text-[10px] font-black opacity-60 ml-1">{evolution.reactions?.cool || 0}</span>
        </button>
 
        <button 
          onClick={() => handleReact('clap')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${userReactions['clap'] ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-white/5 border border-white/5 text-neutral-500 hover:bg-white/10'}`}
        >
          <span className="text-base">👏</span>
          <span className="text-[10px] font-black uppercase tracking-tight">Félicitations</span>
          <span className="text-[10px] font-black opacity-60 ml-1">{evolution.reactions?.clap || 0}</span>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-neutral-500 px-2">
          <MessageCircle size={16} />
          <span className="text-[10px] font-black">{evolution.comment_count || 0}</span>
        </div>
      </div>
    </motion.div>
  );
};
