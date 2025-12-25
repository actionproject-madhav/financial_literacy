import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

interface SkillBubbleProps {
  name: string;
  icon: React.ReactNode;
  status: SkillStatus;
  progress?: number; // 0-100
  level?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkillBubble: React.FC<SkillBubbleProps> = ({
  name,
  icon,
  status,
  progress = 0,
  level = 0,
  onClick,
  size = 'md',
  className,
}) => {
  const sizeConfig = {
    sm: { bubble: 'w-16 h-16', icon: 'text-2xl', ring: 56 },
    md: { bubble: 'w-20 h-20', icon: 'text-3xl', ring: 70 },
    lg: { bubble: 'w-24 h-24', icon: 'text-4xl', ring: 84 },
  };

  const config = sizeConfig[size];
  
  const statusStyles = {
    locked: {
      bg: 'bg-gray-200',
      border: 'border-gray-300',
      text: 'text-gray-400',
    },
    available: {
      bg: 'bg-white',
      border: 'border-duo-border',
      text: 'text-duo-text',
    },
    in_progress: {
      bg: 'bg-white',
      border: 'border-duo-blue',
      text: 'text-duo-blue',
    },
    mastered: {
      bg: 'bg-duo-yellow',
      border: 'border-duo-yellow',
      text: 'text-white',
    },
  };

  const styles = statusStyles[status];
  const circumference = 2 * Math.PI * (config.ring / 2 - 4);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.button
      onClick={status !== 'locked' ? onClick : undefined}
      whileHover={status !== 'locked' ? { scale: 1.05 } : {}}
      whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
      disabled={status === 'locked'}
      className={cn(
        'flex flex-col items-center gap-2',
        status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      {/* Bubble with progress ring */}
      <div className="relative">
        {/* Progress ring */}
        {status === 'in_progress' && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            width={config.ring}
            height={config.ring}
          >
            <circle
              cx={config.ring / 2}
              cy={config.ring / 2}
              r={config.ring / 2 - 4}
              fill="none"
              stroke="#E5E5E5"
              strokeWidth="4"
            />
            <motion.circle
              cx={config.ring / 2}
              cy={config.ring / 2}
              r={config.ring / 2 - 4}
              fill="none"
              stroke="#1CB0F6"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            'border-4 shadow-md',
            config.bubble,
            styles.bg,
            styles.border
          )}
        >
          {status === 'locked' ? (
            <Lock className="w-6 h-6 text-gray-400" />
          ) : status === 'mastered' ? (
            <Crown className="w-8 h-8 text-white fill-white" />
          ) : (
            <span className={cn(config.icon, styles.text)}>{icon}</span>
          )}
        </div>

        {/* Level badge */}
        {level > 0 && status !== 'locked' && status !== 'mastered' && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1',
              'w-6 h-6 rounded-full',
              'flex items-center justify-center',
              'text-xs font-bold',
              'bg-duo-green text-white',
              'border-2 border-white'
            )}
          >
            {level}
          </div>
        )}

        {/* Mastered checkmark */}
        {status === 'mastered' && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-duo-green flex items-center justify-center border-2 border-white">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          'text-sm font-bold text-center max-w-20',
          status === 'locked' ? 'text-gray-400' : 'text-duo-text'
        )}
      >
        {name}
      </span>
    </motion.button>
  );
};

