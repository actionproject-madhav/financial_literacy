import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StreakCounterProps {
  days: number;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  days,
  isActive = true,
  size = 'md',
  showLabel = false,
  className,
}) => {
  const sizeConfig = {
    sm: { icon: 20, text: 'text-lg', padding: 'px-2 py-1' },
    md: { icon: 24, text: 'text-xl', padding: 'px-3 py-1.5' },
    lg: { icon: 32, text: 'text-2xl', padding: 'px-4 py-2' },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-duo-lg',
        isActive ? 'bg-orange-50' : 'bg-gray-100',
        config.padding,
        className
      )}
    >
      <motion.div
        animate={
          isActive
            ? {
                scale: [1, 1.15, 1],
                rotate: [0, -8, 8, 0],
              }
            : {}
        }
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 2.5,
        }}
      >
        <Flame
          size={config.icon}
          className={cn(
            'transition-colors',
            isActive ? 'text-duo-orange fill-duo-orange' : 'text-gray-400'
          )}
        />
      </motion.div>
      <span
        className={cn(
          'font-extrabold',
          config.text,
          isActive ? 'text-duo-orange' : 'text-gray-400'
        )}
      >
        {days}
      </span>
      {showLabel && (
        <span className="text-sm font-semibold text-duo-text-muted ml-1">
          day streak
        </span>
      )}
    </div>
  );
};

