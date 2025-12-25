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
    sm: { icon: 18, text: 'text-[15px]', padding: 'px-3 py-1', gap: 'gap-1' }, // Duolingo exact sizes
    md: { icon: 20, text: 'text-[17px]', padding: 'px-3 py-1.5', gap: 'gap-1.5' },
    lg: { icon: 24, text: 'text-[19px]', padding: 'px-4 py-2', gap: 'gap-2' },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[12px]', // Duolingo uses 12px
        isActive ? 'bg-[#FFF0D5]' : 'bg-[#F7F7F7]', // Duolingo exact colors
        config.padding,
        config.gap,
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
            isActive ? 'text-[#FF9600] fill-[#FF9600]' : 'text-[#737373]' // Duolingo exact orange
          )}
        />
      </motion.div>
      <span
        className={cn(
          'font-bold', // Duolingo uses bold, not extrabold
          config.text,
          isActive ? 'text-[#FF9600]' : 'text-[#737373]' // Duolingo exact colors
        )}
      >
        {days}
      </span>
      {showLabel && (
        <span className="text-[13px] font-bold text-[#737373] ml-1">
          day streak
        </span>
      )}
    </div>
  );
};

