import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeartsDisplayProps {
  hearts: number;
  maxHearts?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  countdown?: string | null;
  className?: string;
}

export const HeartsDisplay: React.FC<HeartsDisplayProps> = ({
  hearts,
  maxHearts = 5,
  size = 'md',
  showEmpty = true,
  countdown = null,
  className,
}) => {
  const sizeConfig = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizeConfig[size];
  const showTimer = countdown !== null && hearts < maxHearts;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxHearts }).map((_, index) => {
          const isFilled = index < hearts;

          return (
            <motion.div
              key={index}
              initial={false}
              animate={
                isFilled
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.85, opacity: 0.4 }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Heart
                size={iconSize}
                className={cn(
                  'transition-colors',
                  isFilled
                    ? 'text-[#FF4B4B] fill-[#FF4B4B]' // Duolingo exact red
                    : 'text-[#E5E5E5] fill-[#F7F7F7]' // Duolingo exact gray
                )}
              />
            </motion.div>
          );
        })}
      </div>

      {showTimer && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 text-xs text-gray-500"
        >
          <Clock size={12} />
          <span className="font-medium">{countdown}</span>
        </motion.div>
      )}
    </div>
  );
};

// Heart Loss Animation
interface HeartLossProps {
  onComplete?: () => void;
}

export const HeartLoss: React.FC<HeartLossProps> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 1.5, y: -50 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed top-20 right-8 z-50"
    >
      <Heart size={40} className="text-duo-red fill-duo-red" />
    </motion.div>
  );
};

