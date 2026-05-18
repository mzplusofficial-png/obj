import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Zap, Rocket, Gem } from 'lucide-react';

interface PremiumOfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onUpgrade: () => void;
}

export const PremiumOfferPopup: React.FC<PremiumOfferPopupProps> = ({ isOpen, onClose, message, onUpgrade }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-purple-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            {/* Header / Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-[100px] pointer-events-none" />
            
            <div className="p-8 md:p-12 flex flex-col items-center text-center relative z-10">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-8 animate-bounce-slow">
                <Gem size={32} />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                <Zap size={14} className="text-purple-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Opportunité Élite</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
                Accélère tes <span className="text-purple-500">Résultats</span>
              </h2>

              <p className="text-lg text-neutral-300 font-medium leading-relaxed mb-10">
                {message}
              </p>

              <div className="grid grid-cols-1 w-full gap-4">
                <button
                  onClick={onUpgrade}
                  className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 group"
                >
                  <Rocket size={18} className="group-hover:translate-x-1 transition-transform" />
                  Passer Premium maintenant
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-4 text-neutral-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                  Continuer en mode standard
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 w-full">
                <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                  <ShieldCheck size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Paiement 100% Sécurisé</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
