import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CrownDisplayProps {
  level: number;
  maxLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CrownDisplay: React.FC<CrownDisplayProps> = ({
  level,
  maxLevel = 5,
  size = 'md',
  className,
}) => {
  const sizeConfig = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const iconSize = sizeConfig[size];
  const isMaxed = level >= maxLevel;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full',
        isMaxed ? 'bg-yellow-100' : 'bg-gray-100',
        className
      )}
    >
      <Crown
        size={iconSize}
        className={cn(
          isMaxed ? 'text-duo-yellow fill-duo-yellow' : 'text-gray-400'
        )}
      />
      <span
        className={cn(
          'font-bold',
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
          isMaxed ? 'text-duo-yellow' : 'text-gray-500'
        )}
      >
        {level}
      </span>
    </div>
  );
};

