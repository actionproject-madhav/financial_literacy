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
      track: 'bg-duo-border',
      fill: 'bg-duo-green',
    },
    xp: {
      track: 'bg-duo-purple-tint',
      fill: 'bg-gradient-to-r from-[#8549BA] to-[#CE82FF]',
    },
    streak: {
      track: 'bg-orange-100',
      fill: 'bg-gradient-to-r from-[#FF9600] to-[#FFC800]',
    },
    skill: {
      track: 'bg-duo-border',
      fill: 'bg-duo-blue',
    },
  };

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
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

