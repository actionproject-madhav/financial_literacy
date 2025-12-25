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
    sm: { icon: 16, text: 'text-sm', padding: 'px-2 py-0.5' },
    md: { icon: 18, text: 'text-base', padding: 'px-2.5 py-1' },
    lg: { icon: 22, text: 'text-lg', padding: 'px-3 py-1.5' },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'bg-duo-blue-tint',
        config.padding,
        className
      )}
    >
      <Gem
        size={config.icon}
        className="text-duo-blue"
      />
      <span className={cn('font-bold text-duo-blue', config.text)}>
        {amount.toLocaleString()}
      </span>
    </div>
  );
};

