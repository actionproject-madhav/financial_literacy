import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface IconButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  'aria-label': string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isDisabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-[34px] h-[34px]', // Duolingo exact: 34px
      md: 'w-[48px] h-[48px]', // Duolingo exact: 48px
      lg: 'w-[58px] h-[58px]', // Duolingo exact: 58px
    };

    const variantClasses = {
      default: 'bg-white border-2 border-[#E5E5E5] hover:bg-[#F7F7F7] text-[#4B4B4B] rounded-[12px]', // Duolingo exact
      ghost: 'bg-transparent hover:bg-[#F7F7F7] text-[#737373] rounded-[12px]',
      danger: 'bg-[#FFDFE0] hover:bg-[#FF4B4B] text-[#FF4B4B] hover:text-white rounded-[12px]',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.9 }} // Duolingo: more pronounced scale for icon buttons
        transition={{ duration: 0.1, ease: 'easeOut' }} // Fast 100ms
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center',
          'transition-colors duration-150', // Color transitions are slightly slower
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84D8FF] focus-visible:ring-offset-1',
          sizeClasses[size],
          isDisabled ? 'opacity-50 cursor-not-allowed' : variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

