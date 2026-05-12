import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Check,
} from "lucide-react";
import { supabase } from "../../../services/supabase.ts";
import { QuestionAnswerSection } from "./QuestionAnswerSection.tsx";
import ReactMarkdown from "react-markdown";

interface TextFormationReaderProps {
  title: string;
  content: string;
  onClose: () => void;
  onComplete: () => void;
  formationId?: string;
  isAdmin?: boolean;
  previewUrl?: string;
  onUpgrade?: () => void;
  type?: "formation" | "bonus";
}

export const TextFormationReader: React.FC<TextFormationReaderProps> = ({
  title,
  content,
  onClose,
  onComplete,
  formationId,
  isAdmin,
  previewUrl,
  type = "formation",
}) => {
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
      qaSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || !textContainerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    
    const scrollHeight = containerRef.current.scrollHeight;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight <= 0) {
      setProgress(100);
      return;
    }

    const currentProgress = Math.round((scrollTop / scrollableHeight) * 100);
    setProgress(Math.min(100, Math.max(0, currentProgress)));
  };

  useEffect(() => {
    // Lock body scroll
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Force scroll to top on mount and when content changes
    const resetScroll = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
        containerRef.current.scrollTo(0, 0); // extra safety
      }
    };

    resetScroll();
    requestAnimationFrame(() => {
      resetScroll();
      handleScroll();
    });

    // Double check after a small delay for smooth layout transitions
    const timer = setTimeout(() => {
      resetScroll();
      handleScroll();
    }, 150);

    return () => {
      document.body.style.overflow = originalStyle;
      clearTimeout(timer);
    };
  }, [content]);

  const triggerXPIfNeeded = () => {
    if (progress >= 95 && formationId) {
      const storageKey = `mz_formation_xp_${currentUserId}_${formationId}`;
      const hasGottenXP = localStorage.getItem(storageKey);

      if (!hasGottenXP || isAdmin) {
        localStorage.setItem(storageKey, "true");
        window.dispatchEvent(
          new CustomEvent("mz-xp-reward", {
            detail: {
              amount: 10,
              title: "🎉 Bien joué.",
              description:
                type === "bonus"
                  ? "Tu as reçu 10 points pour avoir consulté ce bonus."
                  : "Tu as reçu 10 points pour avoir terminé la formation MZ+.",
              source:
                formationId === "default-free-video"
                  ? "formation_day2_complete"
                  : type === "bonus"
                    ? "bonus_complete"
                    : "formation_complete",
            },
          }),
        );
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
    onClose();
  };

  const readerContent = (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col overflow-hidden animate-fade-in">
      {/* Top Bar */}
      <div className="flex-shrink-0 sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
              Quitter
            </span>
          </button>
          <div className="flex-1 flex justify-center px-4">
             <div className="max-w-[200px] md:max-w-sm w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500">
                {progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-6 right-6 z-[10000] flex items-center justify-center transition-all duration-300 ${progress === 100 ? 'scale-110' : ''}`}
      >
        <button 
          onClick={handleScrollToQA}
          className="w-14 h-14 relative flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl group"
        >
          <svg
            viewBox="0 0 36 36"
            className="absolute inset-0 w-full h-full -rotate-90 stroke-emerald-500"
            strokeWidth="3"
            fill="none"
          >
            <circle cx="18" cy="18" r="16" className="stroke-white/5" />
            <path
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-white">
               {progress}%
             </span>
             <MessageCircle size={10} className="text-emerald-500 mt-0.5" />
          </div>
        </button>
      </motion.div>

      {/* Content Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-40 scroll-smooth"
      >
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-24">
          <div ref={textContainerRef}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-12 tracking-tight"
            >
              {title}
            </motion.h1>

            {previewUrl && (
              <div className="mb-20">
                <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative bg-[#050505]">
                  {previewUrl.includes("youtube.com") ||
                  previewUrl.includes("youtu.be") ? (
                    (() => {
                      const regExp =
                        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                      const match = previewUrl.match(regExp);
                      const youtubeId =
                        match && match[2].length === 11 ? match[2] : null;

                      if (youtubeId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            className="w-full h-full absolute inset-0 z-10 border-0"
                          />
                        );
                      }

                      return (
                        <div
                          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                          dangerouslySetInnerHTML={{ __html: previewUrl }}
                        />
                      );
                    })()
                  ) : previewUrl
                      .split("?")[0]
                      .match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ? (
                    <img
                      src={previewUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      autoPlay
                    />
                  )}
                </div>
              </div>
            )}

            <div className="prose prose-invert prose-emerald max-w-none 
              prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
              prose-h1:text-emerald-400 prose-h1:mb-16
              prose-h2:text-emerald-500 prose-h2:text-3xl prose-h2:mt-32 prose-h2:mb-12 prose-h2:border-b prose-h2:border-emerald-500/10 prose-h2:pb-6
              prose-h3:text-2xl prose-h3:mt-20 prose-h3:mb-8 prose-h3:text-white/90
              prose-p:text-neutral-300 prose-p:text-xl prose-p:leading-[1.9] prose-p:mb-12
              prose-strong:text-emerald-400 prose-strong:font-black
              prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-500/10 prose-blockquote:p-12 prose-blockquote:rounded-r-[2.5rem] prose-blockquote:not-italic prose-blockquote:text-white prose-blockquote:text-2xl prose-blockquote:font-black prose-blockquote:my-20 prose-blockquote:shadow-2xl
              prose-li:text-neutral-300 prose-li:text-xl prose-li:mb-6 prose-li:leading-[1.8]
              prose-img:rounded-[2.5rem] prose-img:border prose-img:border-emerald-500/20 prose-img:my-20 prose-img:shadow-[0_0_50px_rgba(16,185,129,0.1)]
              selection:bg-emerald-500/30 selection:text-white
            ">
              <ReactMarkdown>{content || ""}</ReactMarkdown>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-40 border-t border-white/5 pt-20 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 border border-emerald-500/20">
               <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            <h3 className="text-2xl font-black text-white mb-4 text-center uppercase tracking-widest">
              L'Aventure Continue !
            </h3>
            <p className="text-neutral-500 text-center mb-12 max-w-md">
               {type === "bonus"
                ? "Félicitations pour avoir consulté ce bonus exclusif. Ton ascension ne fait que commencer."
                : "Tu as terminé cette leçon avec succès. Es-tu prêt pour la suite ?"}
            </p>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button
                onClick={handleComplete}
                disabled={markedAsDone}
                className={`
                  relative py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-xl overflow-hidden
                  ${
                    markedAsDone
                      ? "bg-emerald-500 text-black translate-y-1"
                      : "bg-white text-black hover:scale-105 active:scale-95"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-3 relative z-10 w-full">
                  {markedAsDone ? (
                    <>
                      <Check size={20} />
                      <span>Progression Validée (+10 XP)</span>
                    </>
                  ) : (
                    <span>
                      {type === "bonus"
                        ? "J'ai tout lu !"
                        : "Marquer comme terminé"}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={handleScrollToQA}
                className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <MessageCircle size={18} />
                Une question ?
              </button>
            </div>
          </motion.div>

          {/* Section Q&A */}
          {formationId && currentUserId && type !== "bonus" && (
            <div ref={qaSectionRef} className="mt-32">
              <QuestionAnswerSection
                formationId={formationId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </article>
      </div>
    </div>
  );

  return createPortal(readerContent, document.body);
};
