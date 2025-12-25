import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ChoiceState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';

interface ChoiceButtonProps {
  children: React.ReactNode;
  state?: ChoiceState;
  index?: number;
  onClick?: () => void;
  disabled?: boolean;
  showIndex?: boolean;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  children,
  state = 'default',
  index,
  onClick,
  disabled = false,
  showIndex = true,
}) => {
  const stateStyles: Record<ChoiceState, string> = {
    default: `
      bg-white border-[#E5E5E5] border-b-[6px]
      hover:bg-[#DDF4FF] hover:border-[#1CB0F6]
      active:border-b-2 active:translate-y-1
    `,
    selected: `
      bg-[#DDF4FF] border-[#1CB0F6] border-b-[6px]
    `,
    correct: `
      bg-[#D7FFB8] border-[#58CC02] border-b-[6px]
    `,
    incorrect: `
      bg-[#FFDFE0] border-[#FF4B4B] border-b-2
      animate-shake
    `,
    disabled: `
      bg-[#F7F7F7] border-[#E5E5E5] border-b-2
      opacity-60 cursor-not-allowed
    `,
  };

  const indexColors: Record<ChoiceState, string> = {
    default: 'bg-[#E5E5E5] text-[#737373]',
    selected: 'bg-[#1CB0F6] text-white',
    correct: 'bg-[#58CC02] text-white',
    incorrect: 'bg-[#FF4B4B] text-white',
    disabled: 'bg-[#E5E5E5] text-[#AFAFAF]',
  };

  const isDisabled = disabled || state === 'disabled';
  const showIcon = state === 'correct' || state === 'incorrect';

  return (
    <motion.button
      onClick={isDisabled ? undefined : onClick}
      whileTap={isDisabled ? {} : { scale: 0.98, y: 1 }} // Duolingo: subtle press with translateY
      transition={{ duration: 0.1, ease: 'easeOut' }} // Fast 100ms
      disabled={isDisabled}
      className={cn(
        'w-full p-4 rounded-[16px] border-2', // Duolingo exact
        'text-left font-bold text-[#4B4B4B] text-[15px]', // Duolingo exact
        'transition-all duration-100',
        'flex items-center gap-3',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84D8FF] focus-visible:ring-offset-2',
        stateStyles[state]
      )}
    >
      {showIndex && index !== undefined && (
        <span
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-[8px]', // Duolingo uses 8px for index badges
            'flex items-center justify-center',
            'text-[13px] font-bold uppercase', // Duolingo exact
            'transition-colors duration-150',
            indexColors[state]
          )}
        >
          {showIcon ? (
            state === 'correct' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )
          ) : (
            String.fromCharCode(65 + index) // A, B, C, D
          )}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </motion.button>
  );
};

