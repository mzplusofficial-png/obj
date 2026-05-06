import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';
import { QuestionAnswerSection } from './QuestionAnswerSection.tsx';

interface TextFormationReaderProps {
  title: string;
  content: string;
  onClose: () => void;
  onComplete: () => void;
  formationId?: string;
  isAdmin?: boolean;
}

export const TextFormationReader: React.FC<TextFormationReaderProps> = ({ title, content, onClose, onComplete, formationId, isAdmin }) => {
  const [markedAsDone, setMarkedAsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const qaSectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleScrollToQA = () => {
    if (qaSectionRef.current) {
      qaSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || !textContainerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    
    // offsetTop of text container relative to scroll container
    // We add article padding to get the exact start position but offsetTop relative to container is reliable if container has position relative.
    const textHeight = textContainerRef.current.offsetHeight;
    
    // Si le texte est plus petit que l'écran, on est direct à 100%
    if (textHeight <= clientHeight) {
      setProgress(100);
      return;
    }

    // Le containerRef n'est pas position: relative, donc scrollHeight/scrollTop est plus simple. 
    // On veut 100% quand on a scrollé toute la hauteur du texte.
    const maxScroll = textHeight - clientHeight + 80; // 80px pour le padding top estimé
    
    if (maxScroll <= 0) {
      setProgress(100);
      return;
    }

    const currentProgress = Math.round((scrollTop / maxScroll) * 100);
    setProgress(Math.min(100, Math.max(0, currentProgress)));
  };

  useEffect(() => {
    // Calculer le contenu après le chargement pour ajuster le pourcentage si pas de scroll possible
    setTimeout(handleScroll, 100);
  }, [content]);

  const triggerXPIfNeeded = () => {
    if (progress === 100 && formationId) {
      const storageKey = `mz_formation_xp_${currentUserId}_${formationId}`;
      const hasGottenXP = localStorage.getItem(storageKey);
      
      if (!hasGottenXP || isAdmin) {
        localStorage.setItem(storageKey, 'true');
        window.dispatchEvent(new CustomEvent('mz-xp-reward', {
          detail: { amount: 10, title: "🎉 Bien joué.", description: "Tu as reçu 10 points pour avoir terminé la formation MZ+.", source: 'formation_complete' }
        }));
      }
    }
  };

  const handleComplete = () => {
    setMarkedAsDone(true);
    triggerXPIfNeeded();
    setTimeout(() => {
      onComplete();
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    triggerXPIfNeeded();
    onClose();
  };

  const readerContent = (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col overflow-hidden animate-fade-in">
      {/* Top Bar - TOUJOURS VISIBLE */}
      <div className="flex-shrink-0 sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Retour</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500">{progress}%</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 hidden sm:inline">Lu</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar Header */}
        <div className="h-1.5 bg-white/5 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
        </div>
      </div>

      {/* Floating Progress Indicator (Visible on Mobile) */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="fixed bottom-6 right-6 z-50 flex items-center justify-center md:hidden"
      >
         <div className="w-14 h-14 relative flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
            <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90 stroke-emerald-500" strokeWidth="3" fill="none">
              <path strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-black text-white pointer-events-none">{progress}%</span>
         </div>
      </motion.div>

      {/* Content Area - SEULE CETTE ZONE DEFILE */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-32 scroll-smooth"
      >
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-neutral-300 leading-relaxed text-lg font-sans">
          <div ref={textContainerRef}>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-16 tracking-tight">
              {title}
            </h1>

            <div className="space-y-8">
              {content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('👉')) {
                return (
                  <div key={idx} className="bg-emerald-500/5 border-l-4 border-emerald-500 p-6 rounded-r-2xl my-8">
                    <p className="font-bold text-emerald-500 text-xl leading-snug">
                      {paragraph.replace('👉 ', '')}
                    </p>
                  </div>
                );
              }
              
              if (paragraph.startsWith('“') || paragraph.startsWith('"')) {
                return (
                   <blockquote key={idx} className="text-2xl font-medium italic text-white/90 border-l-[3px] border-white/20 pl-6 my-10">
                     {paragraph}
                   </blockquote>
                )
              }

              return (
                <p key={idx} className="tracking-wide">
                  {paragraph.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < paragraph.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mt-32 pt-16 flex flex-col items-center"
          >
            <h3 className="text-xl font-black text-white mb-8 text-center uppercase tracking-widest">
              Tu as terminé cette leçon
            </h3>
            
            <div className="flex flex-col items-center gap-4 w-full justify-center max-w-lg mb-8">
               <button 
                  onClick={handleScrollToQA}
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-colors backdrop-blur-sm shadow-xl"
               >
                  <MessageCircle size={18} />
                  Poser une question
               </button>
            </div>

            <button
               onClick={handleComplete}
               disabled={markedAsDone}
               className={`
                 relative px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 shadow-2xl overflow-hidden group w-full max-w-sm
                 ${markedAsDone 
                    ? 'bg-emerald-500 text-black scale-[0.98]' 
                    : 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]'}
               `}
            >
               <div className="flex items-center justify-center gap-3 relative z-10 w-full">
                 {markedAsDone ? (
                   <>
                     <CheckCircle2 className="animate-ping absolute opacity-50" size={24} />
                     <CheckCircle2 className="relative" size={24} />
                     <span>Terminé !</span>
                   </>
                 ) : (
                   <span>Marquer comme terminé</span>
                 )}
               </div>
               
               {!markedAsDone && (
                 <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
               )}
            </button>
          </motion.div>

          {/* Section Q&A */}
          {formationId && currentUserId && (
             <div ref={qaSectionRef}>
               <QuestionAnswerSection formationId={formationId} currentUserId={currentUserId} />
             </div>
          )}

        </article>
      </div>
    </div>
  );

  return createPortal(readerContent, document.body);
};
