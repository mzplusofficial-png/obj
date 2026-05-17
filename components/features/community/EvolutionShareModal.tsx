import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  X, 
  Trophy, 
  Award, 
  Target, 
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { shareEvolution, getEvolutionMessages, generateWhatsAppLink } from '../../../services/evolutionService';

interface EvolutionShareModalProps {
  isVisible: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
  type: 'formation_completed' | 'achievement_unlocked' | 'generic';
  data?: Record<string, unknown>;
}

export const EvolutionShareModal: React.FC<EvolutionShareModalProps> = ({
  isVisible,
  onClose,
  userName,
  userId,
  type,
  data
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'formation_completed': return 'Formation Maîtrisée';
      case 'achievement_unlocked': return 'Défi Remporté';
      default: return 'Nouvelle Évolution';
    }
  };

  const getSubTitle = () => {
    switch (type) {
      case 'formation_completed': return data?.title || 'Expertise MZ+';
      case 'achievement_unlocked': return data?.title || 'Succès Débloqué';
      default: return 'Progression Elite';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'formation_completed': return <Award size={32} className="text-emerald-500" />;
      case 'achievement_unlocked': return <Target size={32} className="text-purple-500" />;
      default: return <Rocket size={32} className="text-blue-500" />;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const messages = getEvolutionMessages(userName, getSubTitle());
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      await shareEvolution({
        user_id: userId,
        user_name: userName,
        type: (type === 'generic' ? 'achievement_unlocked' : type) as 'level_up' | 'formation_completed' | 'achievement_unlocked',
        message: message,
        achievement_title: getSubTitle()
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

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#111] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-neutral-500"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                {getIcon()}
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-2">
                {getTitle()}
              </h2>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {getSubTitle()}
              </h3>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 mb-8">
               <p className="text-sm text-neutral-400 leading-relaxed italic">
                 "Inspirer les autres, c'est renforcer sa propre réussite. Partage ton évolution avec la communauté."
               </p>
            </div>

            <div className="space-y-4">
              <button
                disabled={isSharing || hasShared}
                onClick={handleShare}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                  hasShared 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-white text-black hover:scale-[1.02]'
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
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white"
              >
                Passer cette étape
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
