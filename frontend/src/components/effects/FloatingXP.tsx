import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface FloatingXPProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export const FloatingXP: React.FC<FloatingXPProps> = ({
  amount,
  show,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -50, scale: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={onComplete}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-duo-purple text-white px-4 py-2 rounded-full shadow-lg">
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-xl font-extrabold">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

