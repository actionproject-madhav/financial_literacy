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
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    const variantClasses = {
      default: 'bg-white border-2 border-duo-border hover:bg-gray-50 text-duo-text',
      ghost: 'bg-transparent hover:bg-gray-100 text-duo-text-muted',
      danger: 'bg-duo-red-tint hover:bg-duo-red text-duo-red hover:text-white',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-border-focus',
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

