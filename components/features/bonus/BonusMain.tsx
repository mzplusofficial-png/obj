import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Gift, 
  Sparkles, 
  Trophy, 
  Rocket, 
  Zap, 
  Lock, 
  TrendingUp,
  Star,
  LucideIcon
} from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile, UserRankReward, TabId, RankReward } from '../../../types.ts';
import { BonusCard } from './BonusCard.tsx';
import { BonusReader } from './BonusReader.tsx';
import { getBonusContent } from './bonusContentData.ts';

interface BonusMainProps {
  profile: UserProfile | null;
  onSwitchTab: (id: TabId) => void;
}

export const BonusMain: React.FC<BonusMainProps> = ({ profile, onSwitchTab }) => {
  const [rewards, setRewards] = useState<UserRankReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBonus, setActiveBonus] = useState<{
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
  } | null>(null);

  const [lastViewedRewards, setLastViewedRewards] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mz_read_rewards') || '[]');
    } catch { return []; }
  });

  const fetchRewards = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_rank_rewards')
        .select('*, reward:rank_rewards(*)')
        .eq('user_id', profile.id)
        .order('claimed_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        reward: item.reward as RankReward
      })) as UserRankReward[];
      
      setRewards(mappedData);
    } catch (err: unknown) {
      console.error('Error fetching rewards:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleOpenBonus = (userReward: UserRankReward) => {
    const rw = userReward.reward;
    if (!rw) return;

    const isUrl = rw.file_url?.startsWith('http') && !rw.file_url.includes(' ');
    
    // Mark as read
    const newRead = Array.from(new Set([...lastViewedRewards, userReward.id]));
    setLastViewedRewards(newRead);
    localStorage.setItem('mz_read_rewards', JSON.stringify(newRead));

    if (isUrl) {
      window.open(rw.file_url, '_blank');
      return;
    }

    const bonusFallback = getBonusContent(rw.id, rw.title);
    const content = bonusFallback || 
                    (rw.file_url && rw.file_url.length > 50 ? rw.file_url : null) || 
                    rw.description || 
                    "Contenu en cours de déploiement...";

    setActiveBonus({
      id: rw.id,
      title: rw.title,
      content,
      imageUrl: rw.image_url
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 border-[2px] border-purple-500/20 rounded-full animate-ping absolute" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-t-2 border-purple-500 rounded-full" 
          />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.6em] text-neutral-600 animate-pulse">Extraction des privilèges...</p>
      </div>
    );
  }

  const unreadCount = rewards.filter(r => !lastViewedRewards.includes(r.id)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-40 space-y-20 animate-fade-in font-sans">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-8 relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl backdrop-blur-md"
          >
            <Gift className="text-purple-400" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300">Coffre-fort Élite</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85]">
            VOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-400 to-amber-600">BONUS</span> <br/>
            EXCLUSIFS
          </h1>
          
          <p className="text-neutral-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] max-w-xl mx-auto leading-relaxed">
            Récompenses et stratégies débloquées au fil de votre ascension dans la MJ+ Corporation.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <StatBox 
            label="Total débloqués" 
            value={rewards.length} 
            icon={Trophy} 
            color="text-amber-500" 
          />
          <StatBox 
            label="Nouveaux" 
            value={unreadCount} 
            icon={Sparkles} 
            color="text-purple-500" 
            highlight={unreadCount > 0}
          />
          <StatBox 
            label="Statut" 
            value={profile?.user_level === 'niveau_mz_plus' ? 'PREMIUM' : 'ELITE'} 
            icon={Zap} 
            color="text-emerald-500" 
          />
          <StatBox 
            label="Points XP" 
            value={profile?.xp || 0} 
            icon={TrendingUp} 
            color="text-blue-500" 
          />
        </div>
      </div>

      {/* 2. Rewards List */}
      <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Rocket className="text-purple-500" size={24} />
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Votre Arsenal</h3>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
            {rewards.length} Items
          </div>
        </div>

        {rewards.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
            <div className="w-24 h-24 bg-neutral-900 rounded-[2.5rem] flex items-center justify-center text-neutral-700 border border-white/5 relative group">
               <Lock size={40} className="group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-purple-500/5 blur-2xl rounded-full" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Aucun bonus débloqué</h4>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                Franchissez les paliers d'expérience (XP) pour déverrouiller des ressources ultra-secrètes.
              </p>
            </div>
            <button 
              onClick={() => onSwitchTab('dashboard')}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-2xl active:scale-95"
            >
              Faire du profit maintenant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {rewards.map((userReward, idx) => (
              <BonusCard 
                key={userReward.id}
                index={idx}
                title={userReward.reward?.title || 'Bonus Inconnu'}
                description={userReward.reward?.description}
                imageUrl={userReward.reward?.image_url}
                isUrl={userReward.reward?.file_url?.startsWith('http')}
                isRead={lastViewedRewards.includes(userReward.id)}
                onClick={() => handleOpenBonus(userReward)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Empty State / Tips */}
      <div className="bg-[#111] border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group">
        <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[150%] bg-purple-600/5 blur-[80px] -rotate-45 pointer-events-none" />
        
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500/20 to-purple-800/10 rounded-[2rem] flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 shadow-2xl group-hover:scale-110 transition-transform duration-700">
          <Star size={40} className="drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h5 className="text-2xl font-black text-white uppercase tracking-tighter italic">L'ascension ne s'arrête jamais</h5>
          <p className="text-neutral-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
            Chaque vente, chaque interaction et chaque nouveau membre parrainé vous rapproche du prochain palier Élite. Plus vous progressez, plus les bonus deviennent puissants.
          </p>
        </div>
        
        <button 
          onClick={() => onSwitchTab('leaderboard')}
          className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] border border-white/10 font-bold uppercase text-[9px] tracking-[0.3em] transition-all shrink-0 hover:border-purple-500/30 active:scale-95"
        >
          Voir mon classement
        </button>
      </div>

      {/* Bonus Reader Modal */}
      {activeBonus && (
        <BonusReader 
          title={activeBonus.title}
          content={activeBonus.content}
          imageUrl={activeBonus.imageUrl}
          onClose={() => setActiveBonus(null)}
          onShare={() => {
            if (navigator.share) {
              navigator.share({
                title: activeBonus.title,
                text: "Regarde ce bonus exclusif que j'ai débloqué sur MZ+ !",
                url: window.location.origin
              });
            }
          }}
        />
      )}
    </div>
  );
};

const StatBox: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: LucideIcon; 
  color: string;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, color, highlight }) => (
  <div className={`p-4 md:p-6 bg-white/[0.02] border ${highlight ? 'border-purple-500/30 bg-purple-500/[0.05]' : 'border-white/5'} rounded-3xl space-y-2 relative overflow-hidden group hover:bg-white/[0.04] transition-all`}>
    <div className={`w-8 h-8 rounded-xl bg-black border border-white/5 flex items-center justify-center ${color} mb-1 group-hover:scale-110 transition-transform`}>
      <Icon size={16} />
    </div>
    <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors">{label}</div>
    <div className="text-xl font-black text-white uppercase tracking-tighter">{value}</div>
    {highlight && (
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
    )}
  </div>
);
