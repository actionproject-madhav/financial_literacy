import React from 'react';
import { motion } from 'framer-motion';
import { Target, Check } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../utils/cn';

interface DailyGoalProgressProps {
  current: number;
  target: number;
  className?: string;
}

export const DailyGoalProgress: React.FC<DailyGoalProgressProps> = ({
  current,
  target,
  className,
}) => {
  const isComplete = current >= target;
  const percentage = Math.min(100, (current / target) * 100);

  return (
    <div className={cn('bg-white rounded-duo-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1.5 rounded-full',
              isComplete ? 'bg-[#58CC02]' : 'bg-[#DDF4FF]'
            )}
          >
            {isComplete ? (
              <Check size={18} className="text-white" />
            ) : (
              <Target size={18} className="text-[#1CB0F6]" />
            )}
          </div>
          <span className="font-bold text-[#4B4B4B] text-[15px]">Daily Goal</span>
        </div>
        <span
          className={cn(
            'font-bold text-[17px]',
            isComplete ? 'text-[#58CC02]' : 'text-[#1CB0F6]'
          )}
          style={{ lineHeight: '24px' }}
        >
          {current}/{target} XP
        </span>
      </div>

      <ProgressBar
        value={current}
        max={target}
        variant={isComplete ? 'default' : 'xp'}
        size="md"
      />

      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[15px] text-[#58CC02] font-bold mt-2 text-center"
          style={{ lineHeight: '24px' }}
        >
          Goal complete! Great work!
        </motion.p>
      )}
    </div>
  );
};

