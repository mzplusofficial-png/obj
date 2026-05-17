import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Gift,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BonusContentReaderProps {
  title: string;
  content: string;
  previewUrl?: string;
  bonusId?: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const BonusContentReader: React.FC<BonusContentReaderProps> = ({
  title,
  content,
  previewUrl,
  bonusId,
  onClose,
  onComplete,
}) => {
  const [markedAsDone, setMarkedAsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    if (scrollHeight <= clientHeight) {
      setProgress(100);
      return;
    }

    const currentProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setProgress(Math.min(100, Math.max(0, currentProgress)));
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleComplete = () => {
    setMarkedAsDone(true);
    
    // Dispatch reward event specifically for bonus
    if (bonusId) {
      const storageKey = `mz_bonus_viewed_${bonusId}`;
      const alreadyViewed = localStorage.getItem(storageKey);

      if (!alreadyViewed) {
        localStorage.setItem(storageKey, "true");
        window.dispatchEvent(
          new CustomEvent("mz-xp-reward", {
            detail: {
              amount: 10,
              title: "🎁 Bonus Débloqué",
              description: "Tu as reçu 10 points XP pour avoir exploré ce bonus exclusif.",
              source: "bonus_complete",
            },
          }),
        );
      }
    }

    setTimeout(() => {
      if (onComplete) onComplete();
      onClose();
    }, 1200);
  };

  const readerContent = (
    <motion.div 
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-[#020202] text-white"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Bar */}
      <div className="relative z-50 flex-shrink-0 backdrop-blur-xl border-b border-white/5 bg-black/40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="group flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95"
          >
            <ArrowLeft size={18} className="text-neutral-400 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white">Retour</span>
          </button>

          <div className="flex flex-col items-center gap-2 flex-1 px-8 overflow-hidden">
            <div className="flex items-center gap-2 text-amber-500">
               <Sparkles size={14} className="animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exclusivité MZ+ Elite</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Lecture</span>
                <div className="flex items-center gap-2">
                   <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                      />
                   </div>
                   <span className="text-[10px] font-bold text-amber-500 w-8 text-right font-mono">{progress}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <header className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <Gift className="text-amber-500" size={24} />
              </div>
              <span className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8"
            >
              {title}
            </motion.h1>

            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.2 }}
               className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
            >
               <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                  <Info className="text-amber-500" size={20} />
               </div>
               <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                  Ce contenu est réservé exclusivement aux membres <span className="text-amber-500 font-black">ELITE</span>. 
                  Il contient des stratégies et outils avancés.
               </p>
            </motion.div>
          </header>

          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-20 group"
            >
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl group-hover:border-amber-500/20 transition-all duration-700">
                {previewUrl.includes("youtube.com") || previewUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${previewUrl.includes("v=") ? previewUrl.split("v=")[1].split("&")[0] : previewUrl.split("/").pop()}?autoplay=0&rel=0`}
                    className="w-full h-full absolute inset-0 rounded-[2.5rem]"
                    allowFullScreen
                  />
                ) : previewUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ? (
                  <img src={previewUrl} alt={title} className="w-full h-full object-cover rounded-[2.5rem]" referrerPolicy="no-referrer" />
                ) : (
                  <video src={previewUrl} className="w-full h-full object-cover rounded-[2.5rem]" controls playsInline />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-invert prose-indigo max-w-none 
            prose-p:text-neutral-400 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-10
            prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-3xl prose-h2:mt-24 prose-h2:mb-10 prose-h2:text-amber-500/90
            prose-h3:text-xl prose-h3:mt-16 prose-h3:mb-6
            prose-strong:text-white prose-strong:font-black
            prose-blockquote:bg-white/5 prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:p-10 prose-blockquote:rounded-r-3xl prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:font-black
            prose-li:text-neutral-400 prose-li:text-lg prose-li:mb-4
            prose-img:rounded-3xl prose-img:border prose-img:border-white/10
            selection:bg-amber-500/30 selection:text-white"
          >
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div className="py-24 text-center">
                <Sparkles size={48} className="text-white/5 mx-auto mb-6" />
                <p className="text-neutral-600 italic">Chargement du contenu stratégique...</p>
              </div>
            )}
          </motion.div>

          <footer className="mt-32 pt-20 border-t border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className={`p-5 rounded-full mb-8 transition-all duration-700 ${markedAsDone ? 'bg-emerald-500 border-none scale-110 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10'}`}>
                 <CheckCircle2 size={32} className={markedAsDone ? 'text-black' : 'text-neutral-500'} />
              </div>
              
              <h3 className="text-2xl font-black mb-4 uppercase tracking-widest">Contenu Assimilé ?</h3>
              <p className="text-neutral-500 mb-12 max-w-md">Chaque bonus Elite est une brique supplémentaire dans la construction de ton empire digital.</p>
              
              <button
                onClick={handleComplete}
                disabled={markedAsDone}
                className={`
                  group w-full max-w-sm py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl relative overflow-hidden
                  ${markedAsDone 
                    ? 'bg-emerald-500 text-black translate-y-1' 
                    : 'bg-white text-black hover:scale-[1.02] active:scale-95'
                  }
                `}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {markedAsDone ? (
                    <>
                      <Check size={20} strokeWidth={3} />
                      <span>Progression Validée (+10 XP)</span>
                    </>
                  ) : (
                    <>
                      <span>J'ai tout assimilé</span>
                      <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </div>
                {!markedAsDone && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(
    readerContent,
    document.body
  );
};
