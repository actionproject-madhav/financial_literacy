import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { HeartsDisplay } from '../gamification/HeartsDisplay';
import { cn } from '../../utils/cn';

interface LessonProgressBarProps {
  current: number;
  total: number;
  hearts?: number;
  onExit?: () => void;
  className?: string;
}

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  current,
  total,
  hearts,
  onExit,
  className,
}) => {
  const progress = (current / total) * 100;

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-5 py-3 bg-white border-b-2 border-[#E5E5E5]', // Duolingo exact
        className
      )}
    >
      {/* Exit Button */}
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Exit lesson"
        onClick={onExit}
      >
        <X className="w-5 h-5" />
      </IconButton>

      {/* Progress Bar */}
      <div className="flex-1 h-4 bg-[#E5E5E5] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#58CC02] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Hearts */}
      {hearts !== undefined && (
        <HeartsDisplay hearts={hearts} size="sm" />
      )}
    </div>
  );
};

