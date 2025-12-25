import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AchievementBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isUnlocked?: boolean;
  progress?: { current: number; total: number };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  title,
  description,
  isUnlocked = false,
  progress,
  size = 'md',
  onClick,
  className,
}) => {
  const sizeStyles = {
    sm: { badge: 'w-12 h-12', icon: 'text-xl' },
    md: { badge: 'w-16 h-16', icon: 'text-2xl' },
    lg: { badge: 'w-20 h-20', icon: 'text-3xl' },
  };

  const config = sizeStyles[size];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-duo-xl',
        'transition-colors',
        isUnlocked ? 'bg-duo-yellow/10' : 'bg-gray-50',
        onClick && 'cursor-pointer hover:bg-gray-100',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          config.badge,
          isUnlocked
            ? 'bg-gradient-to-br from-duo-yellow to-duo-orange'
            : 'bg-gray-200'
        )}
      >
        {isUnlocked ? (
          <span className={config.icon}>{icon}</span>
        ) : (
          <Lock size={24} className="text-gray-400" />
        )}
      </div>

      <div className="text-center">
        <p
          className={cn(
            'font-bold text-sm',
            isUnlocked ? 'text-duo-text' : 'text-gray-400'
          )}
        >
          {title}
        </p>
        <p className="text-xs text-duo-text-muted">{description}</p>
      </div>

      {progress && !isUnlocked && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className="bg-duo-blue h-full rounded-full transition-all"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}
    </motion.button>
  );
};

