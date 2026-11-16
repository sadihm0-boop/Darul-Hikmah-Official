import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  // We start in an 'idle' state waiting for the user to click
  const [phase, setPhase] = useState<'idle' | 'open' | 'glow' | 'exit'>('idle');

  // This function triggers when the user clicks anywhere on the screen
  const handleInteraction = () => {
    // If it's already opening, don't do anything if they click again
    if (phase !== 'idle') return;

    setPhase('open');

    // Start the sequence of events ONLY after the click
    setTimeout(() => setPhase('glow'), 3000);   // Glow appears as doors finish opening
    setTimeout(() => setPhase('exit'), 5000);   // Animation starts fading out
    setTimeout(() => onComplete(), 6000);       // Website fully loads
  };

  const showGlow = phase === 'glow';

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          // Premium deep black-green background with cursor and mobile-tap setup
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#020b04] text-white cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
          onClick={handleInteraction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          {/* Ambient Background - Deep Emerald & Gold Base */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(212, 175, 55, 0.12), transparent 55%), linear-gradient(180deg, #020b04 0%, #051708 100%)',
            }}
          />

          <motion.div
            className="relative flex items-center justify-center"
            style={{ perspective: '1400px' }} // Enhanced depth perspective
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Main Arch/Door Container */}
            <div className="relative w-72 h-[26rem] md:w-80 md:h-[28rem]">

              {/* Inner Glowing Light (The Gateway behind the doors bursting open) */}
              <motion.div
                className="absolute inset-0 rounded-t-[6rem] bg-gradient-to-t from-[#ffd700]/30 via-[#fff4b0] to-white shadow-[0_0_140px_rgba(255,215,0,0.5)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'idle' ? 0 : 1 }}
                transition={{ duration: 1.8, ease: 'easeOut', delay: 0.1 }}
              />

              {/* Left Door - Split string to "Darul" to avoid overflow cutoffs */}
              <motion.div
                className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-b from-[#020b04] to-[#041507] origin-left rounded-tl-[6rem] border-r border-[#d4af37]/30 flex flex-col items-center justify-center overflow-hidden shadow-[25px_0_50px_rgba(0,0,0,0.6)] z-10"
                animate={{ rotateY: phase === 'open' || phase === 'glow' ? -105 : 0 }}
                transition={{ duration: 3.8, ease: [0.25, 1, 0.5, 1] }}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Micro Gold Wireframe Insets */}
                <div className="absolute inset-2 rounded-tl-[5.5rem] border-2 border-[#d4af37]/20" />
                <div className="absolute inset-4 rounded-tl-[5.1rem] border border-[#d4af37]/10" />

                {/* Left Aligned Text Wrapper */}
                <div className="absolute top-1/2 right-3 w-[180px] text-right -translate-y-1/2 pr-1">
                  <span className="text-[#ffd700] font-serif text-3xl md:text-4xl font-black tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    Darul
                  </span>
                </div>
              </motion.div>

              {/* Right Door - Split string to "Hikmah" to align perfectly */}
              <motion.div
                className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-b from-[#020b04] to-[#041507] origin-right rounded-tr-[6rem] border-l border-[#d4af37]/30 flex flex-col items-center justify-center overflow-hidden shadow-[-25px_0_50px_rgba(0,0,0,0.6)] z-10"
                animate={{ rotateY: phase === 'open' || phase === 'glow' ? 105 : 0 }}
                transition={{ duration: 3.8, ease: [0.25, 1, 0.5, 1] }}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Micro Gold Wireframe Insets */}
                <div className="absolute inset-2 rounded-tr-[5.5rem] border-2 border-[#d4af37]/20" />
                <div className="absolute inset-4 rounded-tr-[5.1rem] border border-[#d4af37]/10" />

                {/* Right Aligned Text Wrapper */}
                <div className="absolute top-1/2 left-3 w-[180px] text-left -translate-y-1/2 pl-1">
                  <span className="text-[#ffd700] font-serif text-3xl md:text-4xl font-black tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    Hikmah
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Golden Burst Overlay Transition */}
          <AnimatePresence>
            {showGlow && (
              <motion.div
                className="pointer-events-none absolute inset-0 mix-blend-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.35), transparent 65%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Bottom Text Guidance Section */}
          <motion.div
            className="absolute bottom-16 text-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          >
            {/* Pulsing state notification */}
            <div
              className={`text-xs uppercase tracking-[0.4em] mb-4 font-bold transition-colors duration-1000 ${phase === 'idle' ? 'text-[#ffd700] animate-pulse' : 'text-[#d4af37]/70'
                }`}
            >
              {phase === 'idle' ? '— Click anywhere to enter —' : 'Opening the Gateway'}
            </div>

            <h2 className="text-xl md:text-2xl font-serif font-medium tracking-wide text-[#f5f5dc] max-w-sm mx-auto leading-relaxed">
              A luminous path to sacred knowledge
            </h2>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}