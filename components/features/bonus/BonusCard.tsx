import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, BookOpen, Download, Sparkles } from 'lucide-react';

interface BonusCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  isUrl?: boolean;
  isRead?: boolean;
  onClick: () => void;
  index: number;
}

export const BonusCard: React.FC<BonusCardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  isUrl, 
  isRead,
  onClick,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group relative w-full p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden shadow-2xl active:scale-[0.98]"
    >
      <div className="relative bg-[#0d0d0c] rounded-[2.3rem] overflow-hidden p-4 sm:p-6 h-full flex flex-col md:flex-row items-center gap-6">
        
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[40px] rounded-full pointer-events-none" />

        {/* Image/Icon Container */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group-hover:scale-105 transition-transform duration-700">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#111] to-[#222] flex items-center justify-center text-purple-400">
                {isUrl ? <Download size={32} strokeWidth={1.5} /> : <BookOpen size={32} strokeWidth={1.5} />}
              </div>
            )}
            
            {/* Status Badge on Image */}
            {isRead && (
              <div className="absolute top-1 right-1">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <span className="text-[10px]">✓</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Index floating */}
          <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[10px] font-black text-neutral-500 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left space-y-2 z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600 group-hover:text-purple-500 transition-colors">
              {isUrl ? "Pack de Ressources" : "Module de Savoir"}
            </span>
            {index < 2 && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                <Sparkles size={8} /> Indispensable
              </div>
            )}
          </div>
          
          <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2">
            {title}
          </h4>
          
          {description && (
            <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed max-w-lg">
              {description}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-500 group-hover:text-white group-hover:bg-purple-600 group-hover:border-purple-400 transition-all duration-500 shadow-xl group-hover:shadow-purple-500/20 relative">
              {isUrl ? <Download size={22} /> : <ChevronRight size={24} />}
              
              {/* Pulse effect */}
              {!isRead && (
                 <div className="absolute inset-0 rounded-full bg-purple-500/0 group-hover:bg-purple-500/20 animate-ping" />
              )}
            </div>
        </div>

      </div>
    </motion.div>
  );
};
