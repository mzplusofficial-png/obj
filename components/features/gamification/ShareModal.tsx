import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, X, Gift } from 'lucide-react';
import { GoldBorderCard, PrimaryButton, GoldText } from '../../UI.tsx';

export const ShareModal = ({ isVisible, onClose }: { isVisible: boolean, onClose: () => void }) => {
  const handleShare = async () => {
    const shareData = {
      title: 'Rejoins Millionaire Zone Plus !',
      text: "Viens découvrir cette plateforme incroyable avec moi ! 🚀💰",
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`, '_blank');
      }
    } catch (e) {
      console.error('Error sharing:', e);
    }
    // Close the modal after clicking share
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto max-w-[340px] w-full mx-4"
          >
            <GoldBorderCard className="relative overflow-hidden !p-8 shadow-[0_30px_100px_rgba(0,0,0,1)] bg-black/95 backdrop-blur-2xl">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors" aria-label="Fermer">
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold-main)] to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.4)] mb-6"
                >
                  <Gift className="text-black" size={32} />
                </motion.div>
                
                <GoldText className="text-2xl font-black mb-3">Partage MZ+</GoldText>
                
                <p className="text-[#a19d93] text-sm font-medium mb-8 leading-relaxed">
                  Partage MZ+ avec tes amis et gagne encore plus de points ! 🎁
                </p>
                
                <div className="w-full">
                  <PrimaryButton onClick={handleShare} className="w-full flex items-center justify-center gap-3 py-4 text-sm tracking-wide shadow-[0_0_20px_rgba(201,168,76,0.2)]">
                    <Share2 size={18} />
                    Partager & Gagner
                  </PrimaryButton>
                </div>
              </div>
            </GoldBorderCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
