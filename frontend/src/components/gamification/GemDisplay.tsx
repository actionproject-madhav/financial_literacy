import React from 'react';
import { motion } from 'framer-motion';
import { Gem } from 'lucide-react';
import { cn } from '../../utils/cn';

interface GemDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GemDisplay: React.FC<GemDisplayProps> = ({
  amount,
  size = 'md',
  className,
}) => {
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-0.5' },
    md: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-2.5 py-1' },
    lg: { icon: 'w-6 h-6', text: 'text-lg', padding: 'px-3 py-1.5' },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-amber-100/50 border border-amber-200/50', // Gold/Amber tint
        config.padding,
        className
      )}
    >
      <img
        src="/coin.svg"
        alt="Gems"
        className={cn("object-contain drop-shadow-sm", config.icon)}
      />
      <span className={cn('font-bold text-amber-500', config.text)}>
        {amount.toLocaleString()}
      </span>
    </div>
  );
};

