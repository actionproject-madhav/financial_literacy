import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'default' | 'xp' | 'streak' | 'skill';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantStyles = {
    default: {
      track: 'bg-[#E5E5E5]', // Duolingo exact gray
      fill: 'bg-[#58CC02]', // Duolingo exact green
    },
    xp: {
      track: 'bg-[#F3E5FF]', // Duolingo purple tint
      fill: 'bg-gradient-to-r from-[#8549BA] to-[#CE82FF]',
    },
    streak: {
      track: 'bg-[#FFF0D5]', // Orange tint
      fill: 'bg-gradient-to-r from-[#FF9600] to-[#FFC800]',
    },
    skill: {
      track: 'bg-[#E5E5E5]',
      fill: 'bg-[#1CB0F6]', // Duolingo exact blue
    },
  };

  const sizeStyles = {
    sm: 'h-2 rounded-full', // Duolingo rounded-full
    md: 'h-3 rounded-full',
    lg: 'h-4 rounded-full',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-duo-text-muted">
            {label || `${Math.round(percentage)}%`}
          </span>
          <span className="text-sm font-bold text-duo-text">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          variantStyles[variant].track,
          sizeStyles[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            variantStyles[variant].fill
          )}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.7 : 0,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        />
      </div>
    </div>
  );
};

