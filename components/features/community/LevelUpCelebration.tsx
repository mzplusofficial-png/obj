import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Rocket, 
  Share2, 
  ArrowRight, 
  Crown,
  Sparkles,
  X
} from 'lucide-react';
import { shareEvolution, getEvolutionMessages, generateWhatsAppLink } from '../../../services/evolutionService';

interface LevelUpCelebrationProps {
  rankData: {
    rankId: number;
    rankName: string;
    oldXp: number;
    newXp: number;
  } | null;
  userName: string;
  userId: string;
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ 
  rankData, 
  userName, 
  userId,
  onClose 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (rankData) {
      // Fire confetti!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [rankData]);

  if (!rankData) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const messages = getEvolutionMessages(userName, rankData.rankName);
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      await shareEvolution({
        user_id: userId,
        user_name: userName,
        type: 'level_up',
        old_level: getRankNameFromId(rankData.rankId - 1),
        new_level: rankData.rankName,
        message: message
      });

      setHasShared(true);
      
      // Also open WhatsApp
      const link = generateWhatsAppLink(message);
      window.open(link, '_blank');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error sharing evolution:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const getRankNameFromId = (id: number) => {
    const ranks = ['Débutant', 'Expert', 'Légende', 'Pro', 'Élite'];
    return ranks[id - 1] || 'Débutant';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-[#1A1814] to-[#0A0908] rounded-[3rem] p-10 border border-yellow-500/30 shadow-[0_0_100px_rgba(201,168,76,0.2)] text-center overflow-hidden"
        >
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.15),transparent)] pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="relative mb-8 pt-6">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(201,168,76,0.4)] relative border-4 border-black"
            >
              <Trophy size={60} className="text-black drop-shadow-lg" />
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-black border-2 border-yellow-500 flex items-center justify-center">
                <Sparkles size={20} className="text-yellow-500" />
              </div>
            </motion.div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500/60 font-sans">
                Nouveau Palier Atteint
              </h2>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">
                Félicitations <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 italic">
                  {userName} !
                </span>
              </h3>
            </div>
            
            <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Ton ambition t'a propulsé au rang de <span className="text-white font-black">{rankData.rankName}</span>. 
              C'est une étape majeure dans ton évolution MZ+.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              disabled={isSharing || hasShared}
              onClick={handleShare}
              className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl transition-all ${
                hasShared 
                ? 'bg-emerald-500 text-black scale-95 opacity-50' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:scale-[1.02] hover:shadow-yellow-500/20'
              }`}
            >
              {isSharing ? (
                <>Partage en cours...</>
              ) : hasShared ? (
                <>✓ Partagé avec succès</>
              ) : (
                <>
                  Partager mon évolution <Share2 size={18} />
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white transition-colors"
            >
              Continuer vers le dashboard
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-2 opacity-30">
            <Crown size={12} className="text-yellow-500" />
            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-neutral-400">
              Millionaire Zone Plus Elite System
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
