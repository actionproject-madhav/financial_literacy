import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

interface XPDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  amount,
  size = 'md',
  animate = false,
  className,
}) => {
  const sizeConfig = {
    sm: { icon: 16, text: 'text-sm', padding: 'px-2 py-0.5' },
    md: { icon: 18, text: 'text-base', padding: 'px-2.5 py-1' },
    lg: { icon: 22, text: 'text-lg', padding: 'px-3 py-1.5' },
  };

  const config = sizeConfig[size];

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'bg-duo-purple-tint',
        config.padding,
        className
      )}
      animate={animate ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Zap
        size={config.icon}
        className="text-duo-purple fill-duo-purple"
      />
      <span className={cn('font-bold text-duo-purple', config.text)}>
        {amount.toLocaleString()} XP
      </span>
    </motion.div>
  );
};

// XP Gain Animation Component
interface XPGainProps {
  amount: number;
  onComplete?: () => void;
}

export const XPGain: React.FC<XPGainProps> = ({ amount, onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30 }}
      onAnimationComplete={onComplete}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <div className="flex items-center gap-2 bg-duo-purple text-white px-6 py-3 rounded-duo-xl shadow-lg">
        <Zap size={28} className="fill-white" />
        <span className="text-2xl font-extrabold">+{amount} XP</span>
      </div>
    </motion.div>
  );
};

