import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Confetti } from './Confetti';

interface StreakCelebrationProps {
  show: boolean;
  streakDays: number;
  onClose: () => void;
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  show,
  streakDays,
  onClose,
}) => {
  const getMilestoneMessage = (days: number) => {
    if (days >= 365) return "Incredible! A whole year!";
    if (days >= 100) return "100 days! You're unstoppable!";
    if (days >= 30) return "A month of dedication!";
    if (days >= 7) return "One week down!";
    return "Keep it going!";
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti show={show} colors={['#FF9600', '#FFC800', '#FF6B00']} />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-duo-2xl p-8 max-w-sm w-full text-center relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-duo-text-muted" />
              </button>

              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0],
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                className="inline-block mb-4"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-duo-orange to-duo-yellow rounded-full flex items-center justify-center">
                  <Flame className="w-14 h-14 text-white fill-white" />
                </div>
              </motion.div>

              <h2 className="text-4xl font-extrabold text-duo-orange mb-2">
                {streakDays} Day Streak!
              </h2>
              
              <p className="text-lg text-duo-text mb-6">
                {getMilestoneMessage(streakDays)}
              </p>

              <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

