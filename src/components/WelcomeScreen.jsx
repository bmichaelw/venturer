import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeScreen({ onComplete }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fffbf6]"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(34, 57, 71, 0.2)',
                    '0 0 0 20px rgba(34, 57, 71, 0)',
                    '0 0 0 0 rgba(34, 57, 71, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-24 h-24 bg-[#223947] rounded-3xl flex items-center justify-center"
              >
                <span 
                  className="text-[#fffbf6] font-bold text-4xl" 
                  style={{fontFamily: 'Acherus Grotesque, sans-serif'}}
                >
                  V
                </span>
              </motion.div>
            </motion.div>

            {/* Animated Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h1 
                className="text-3xl font-bold tracking-tight text-[#323232] mb-1"
                style={{fontFamily: 'Acherus Grotesque, sans-serif'}}
              >
                Venturer
              </h1>
              <p 
                className="text-xs text-[#805c5c] uppercase tracking-widest"
                style={{fontFamily: 'Acherus Grotesque, sans-serif', letterSpacing: '0.1em'}}
              >
                Multi-Venture OS
              </p>
            </motion.div>

            {/* Loading Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 rounded-full bg-[#223947]"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}