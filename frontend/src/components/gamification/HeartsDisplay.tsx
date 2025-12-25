import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeartsDisplayProps {
  hearts: number;
  maxHearts?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  className?: string;
}

export const HeartsDisplay: React.FC<HeartsDisplayProps> = ({
  hearts,
  maxHearts = 5,
  size = 'md',
  showEmpty = true,
  className,
}) => {
  const sizeConfig = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
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
                  ? 'text-duo-red fill-duo-red'
                  : 'text-gray-300 fill-gray-200'
              )}
            />
          </motion.div>
        );
      })}
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

