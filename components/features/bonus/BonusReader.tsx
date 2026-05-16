import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Crown, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BonusReaderProps {
  title: string;
  content: string;
  imageUrl?: string;
  onClose: () => void;
  onShare?: () => void;
}

export const BonusReader: React.FC<BonusReaderProps> = ({ 
  title, 
  content, 
  imageUrl, 
  onClose, 
  onShare 
}) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full animate-pulse-slow" />
        </div>

        <motion.div 
          initial={{ y: 50, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 50, scale: 0.95, opacity: 0 }}
          className="relative w-full h-full md:h-[92vh] md:max-w-4xl bg-[#0a0a09]/50 border-x border-t border-white/5 md:rounded-t-[3rem] shadow-[0_-20px_100px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 md:px-10 md:py-8 flex items-center justify-between border-b border-white/5 z-20 sticky top-0 bg-[#0a0a09]/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-500">Exclusivité MZ+</span>
                  <Crown size={10} className="text-amber-500" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight line-clamp-1">{title}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onShare && (
                <button 
                  onClick={onShare}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Share2 size={18} />
                </button>
              )}
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-20 md:py-16 custom-scrollbar scroll-smooth">
            <div className="max-w-2xl mx-auto space-y-12 pb-24">
              
              {/* Hero Header */}
              <div className="space-y-6 text-center">
                {imageUrl && (
                  <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mb-10 group">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                  <BookOpen size={14} className="text-purple-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Guide Stratégique</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.95]">
                  {title}
                </h1>
                
                <div className="flex items-center justify-center gap-8 pt-4">
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Temps de lecture</span>
                      <span className="text-white font-bold text-sm tracking-tight text-purple-200">5-8 min</span>
                   </div>
                   <div className="w-[1px] h-8 bg-white/10" />
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Valeur Elite</span>
                      <span className="text-emerald-400 font-bold text-sm tracking-tight">Gratuit</span>
                   </div>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="markdown-body text-neutral-300">
                <ReactMarkdown
                  components={{
                    h1: ({...props}) => <h2 className="text-2xl md:text-3xl font-black text-white mt-12 mb-6 uppercase tracking-tight border-l-4 border-purple-500 pl-4" {...props} />,
                    h2: ({...props}) => <h3 className="text-xl md:text-2xl font-black text-white mt-10 mb-5 uppercase tracking-tight" {...props} />,
                    h3: ({...props}) => <h4 className="text-lg font-bold text-purple-400 mt-8 mb-4 uppercase tracking-widest" {...props} />,
                    p: ({...props}) => <p className="text-neutral-400 leading-relaxed mb-6 text-sm md:text-base font-medium" {...props} />,
                    ul: ({...props}) => <ul className="space-y-4 mb-8 list-none" {...props} />,
                    li: ({node: _node, ...props}) => (
                      <li className="flex items-start gap-3 text-neutral-400 text-sm md:text-base font-medium" {...props}>
                        <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-1" />
                        <span>{props.children}</span>
                      </li>
                    ),
                    blockquote: ({...props}) => (
                      <div className="my-10 p-6 bg-purple-500/5 border border-purple-500/20 rounded-3xl italic text-purple-200/80 text-sm italic" {...props} />
                    ),
                    hr: () => <hr className="my-12 border-white/5" />,
                    strong: ({...props}) => <strong className="text-white font-black" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Footer CTA */}
              <div className="pt-20 border-t border-white/5 text-center space-y-8">
                 <div className="inline-flex items-center gap-3 px-5 py-2 bg-neutral-900 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Système elite mz+ activé</span>
                 </div>
                 
                 <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                       <h4 className="text-xl font-black text-white uppercase tracking-tighter">Prêt pour le niveau supérieur ?</h4>
                       <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed max-w-sm mx-auto">
                          Les bonus sont juste le début. L'empire se construit en MZ+ Premium.
                       </p>
                       <button className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-xl active:scale-95">
                          Évoluer en Premium
                       </button>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-purple-600/10 blur-[50px] rounded-full" />
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
