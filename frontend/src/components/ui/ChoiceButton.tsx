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
      bg-white border-duo-border border-b-[6px]
      hover:bg-duo-blue-tint hover:border-duo-border-focus
      active:border-b-2 active:translate-y-1
    `,
    selected: `
      bg-duo-blue-tint border-duo-blue border-b-[6px]
    `,
    correct: `
      bg-[#D7FFB8] border-duo-green border-b-[6px]
    `,
    incorrect: `
      bg-duo-red-tint border-duo-red border-b-2
      animate-shake
    `,
    disabled: `
      bg-gray-50 border-duo-border border-b-2
      opacity-60 cursor-not-allowed
    `,
  };

  const indexColors: Record<ChoiceState, string> = {
    default: 'bg-duo-border text-duo-text-muted',
    selected: 'bg-duo-blue text-white',
    correct: 'bg-duo-green text-white',
    incorrect: 'bg-duo-red text-white',
    disabled: 'bg-duo-border text-duo-text-subtle',
  };

  const isDisabled = disabled || state === 'disabled';
  const showIcon = state === 'correct' || state === 'incorrect';

  return (
    <motion.button
      onClick={isDisabled ? undefined : onClick}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={isDisabled}
      className={cn(
        'w-full p-4 rounded-duo-lg border-2',
        'text-left font-semibold text-duo-text',
        'transition-all duration-100',
        'flex items-center gap-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-border-focus',
        stateStyles[state]
      )}
    >
      {showIndex && index !== undefined && (
        <span
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg',
            'flex items-center justify-center',
            'text-sm font-bold uppercase',
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

