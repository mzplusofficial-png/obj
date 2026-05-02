import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAxis, AxisState } from './AxisProvider';

// Configuration as per MZ+ Identity
const AXIS_CONFIG: Record<AxisState, {
  color: string;
  glow: string;
}> = {
  idle: {
    color: "#64748b", // Muted Slate
    glow: "rgba(100, 116, 139, 0.15)",
  },
  guiding: {
    color: "#a855f7", // Royal Purple
    glow: "rgba(168, 85, 247, 0.35)",
  },
  action: {
    color: "#eab308", // Gold Premium
    glow: "rgba(234, 179, 8, 0.35)",
  },
  progression: {
    color: "#d946ef", // Purple-Magenta
    glow: "rgba(217, 70, 239, 0.35)",
  },
  success: {
    color: "#fef08a", // Bright Gold
    glow: "rgba(253, 224, 71, 0.45)",
  },
  inactive: {
    color: "#1e293b",
    glow: "transparent",
  }
};

const AxisVoiceWave = ({ color, isSpeaking }: { color: string, isSpeaking: boolean }) => {
  return (
    <div className="flex items-center gap-[3px] h-5 mx-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          animate={{
            height: isSpeaking ? [4, 14, 6, 18, 4] : 4,
            opacity: isSpeaking ? [0.7, 1, 0.8, 1, 0.7] : 0.4
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8 + (i * 0.15),
            ease: "easeInOut",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
};

export const AxisEntity = () => {
  const { axisState, axisMessage, isVisible, hideAxis } = useAxis();

  const config = AXIS_CONFIG[axisState];
  const showAxis = isVisible && axisMessage !== null;

  return (
    <>
      {/* Ambient Floor Glow */}
      <AnimatePresence>
        {showAxis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 w-full h-[35vh] pointer-events-none z-[998]"
            style={{
              background: `radial-gradient(circle at 50% 120%, ${config.glow} 0%, transparent 60%)`
            }}
          />
        )}
      </AnimatePresence>

      {/* The Axis Interface (Dynamic Pill) */}
      <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-[999] pointer-events-none flex flex-col items-center w-full px-4">
        <AnimatePresence>
          {showAxis && (
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pointer-events-auto cursor-pointer max-w-full"
              onClick={() => hideAxis()}
            >
              <div className="relative group">
                {/* Glow de la pilule */}
                <motion.div 
                  className="absolute -inset-1 rounded-full blur-md opacity-40 transition-opacity duration-700 group-hover:opacity-60"
                  style={{ backgroundColor: config.color }}
                  animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Conteneur principal Glassmorphism */}
                <div className="relative flex items-center gap-4 bg-[#0a0908]/90 backdrop-blur-2xl border border-white/10 pl-5 pr-6 py-3.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[280px] sm:min-w-[320px] max-w-md">
                  {/* Axis Voice Signature */}
                  <AxisVoiceWave color={config.color} isSpeaking={showAxis} />
                  
                  {/* Message */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white/95 text-xs sm:text-[13px] font-medium tracking-wide leading-relaxed">
                      {axisMessage}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
