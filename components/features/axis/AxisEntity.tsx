import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAxis, AxisState } from './AxisProvider';

// Configuration as per MZ+ Identity
const AXIS_CONFIG: Record<AxisState, {
  color: string;
  glow: string;
  scale: number[];
  speed: number;
}> = {
  idle: {
    color: "#64748b", // Muted Slate
    glow: "rgba(100, 116, 139, 0.4)",
    scale: [1, 1.05, 1],
    speed: 4,
  },
  guiding: {
    color: "#a855f7", // Royal Purple
    glow: "rgba(168, 85, 247, 0.6)",
    scale: [1, 1.1, 1],
    speed: 3,
  },
  action: {
    color: "#eab308", // Gold Premium
    glow: "rgba(234, 179, 8, 0.6)",
    scale: [1, 1.15, 1],
    speed: 2.5,
  },
  progression: {
    color: "#d946ef", // Purple-Magenta
    glow: "rgba(217, 70, 239, 0.6)",
    scale: [1, 1.2, 1],
    speed: 2,
  },
  success: {
    color: "#fef08a", // Bright Gold
    glow: "rgba(253, 224, 71, 0.8)",
    scale: [1, 1.25, 1],
    speed: 1.5,
  },
  inactive: {
    color: "#1e293b",
    glow: "rgba(30, 41, 59, 0.2)",
    scale: [0.95, 1, 0.95],
    speed: 6,
  }
};

const AxisLogo = ({ state }: { state: AxisState }) => {
  const config = AXIS_CONFIG[state];

  return (
    <motion.div 
      className="relative w-12 h-12 rounded-[14px] bg-[#0A0908] border border-white/10 shadow-xl flex items-center justify-center overflow-hidden"
      animate={{ 
        boxShadow: [`0 0 0px ${config.glow}`, `0 0 20px ${config.glow}`, `0 0 0px ${config.glow}`],
        borderColor: state !== 'inactive' ? config.color : 'rgba(255,255,255,0.1)'
      }}
      transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Background ambient glow inside the box */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(circle at 50% 50%, ${config.color}, transparent 70%)` }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Abstract geometric AI shape (4-pointed sharp star / diamond) */}
      <motion.svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-5 h-5 relative z-10"
        animate={{ scale: config.scale }}
        transition={{ duration: config.speed / 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.path 
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" 
          stroke={config.color} 
          strokeWidth="1.5" 
          strokeLinejoin="round"
          animate={{ 
            rotate: state === 'progression' ? 90 : 0
          }}
          transition={{ 
            duration: state === 'progression' ? 2 : config.speed, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.circle 
          cx="12" cy="12" r="2" 
          fill={config.color}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </motion.div>
  );
};

export const AxisEntity = () => {
  const { axisState, axisMessage, axisAction, isVisible, hideAxis } = useAxis();

  const showMessage = isVisible && axisMessage !== null;

  // The orb is always there as an ambient companion, unless it's explicitly 'inactive' without being visible.
  const showOrb = isVisible || axisState !== 'inactive';

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[999] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9, x: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="pointer-events-auto bg-[#0a0908]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[280px] sm:max-w-[320px] relative origin-bottom-right"
          >
             {/* Small triangle pointing to the orb */}
             <div className="absolute -bottom-2 right-5 w-4 h-4 bg-[#0a0908]/90 border-r border-b border-white/10 transform rotate-45 backdrop-blur-xl z-[-1]"></div>
             
             <div className="text-white/95 text-[13px] font-medium tracking-wide leading-relaxed whitespace-pre-wrap">
               {axisMessage}
             </div>

             {axisAction && (
               <motion.button
                  onClick={() => {
                    axisAction.action();
                    hideAxis();
                  }}
                  className="mt-4 w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-extrabold text-[12px] rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:from-yellow-300 hover:to-yellow-400 transition-all border border-yellow-300/50"
                  animate={{ 
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0 0 20px rgba(250,204,21,0.4)",
                      "0 0 35px rgba(250,204,21,0.7)",
                      "0 0 20px rgba(250,204,21,0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
               >
                 {axisAction.label} <span className="text-[15px]">⚡</span>
               </motion.button>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrb && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="pointer-events-auto cursor-pointer"
            onClick={() => {
              if (showMessage) hideAxis();
            }}
          >
            <AxisLogo state={axisState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
