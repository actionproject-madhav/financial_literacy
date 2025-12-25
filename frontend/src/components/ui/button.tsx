import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-duo-green text-white font-extrabold
    shadow-duo-green
    hover:bg-duo-green-hover
    active:shadow-none active:translate-y-1
  `,
  secondary: `
    bg-duo-blue text-white font-extrabold
    shadow-duo-blue
    hover:bg-duo-blue-hover
    active:shadow-none active:translate-y-1
  `,
  outline: `
    bg-white text-duo-blue font-bold
    border-2 border-duo-border
    shadow-duo-gray
    hover:bg-duo-blue-tint hover:border-duo-border-focus
    active:shadow-none active:translate-y-1
  `,
  ghost: `
    bg-transparent text-duo-blue font-bold
    hover:bg-duo-blue-tint
    active:bg-duo-blue-tint
  `,
  danger: `
    bg-duo-red text-white font-extrabold
    shadow-duo-red
    hover:bg-[#FF3B3B]
    active:shadow-none active:translate-y-1
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-duo-md min-h-[36px]',
  md: 'px-5 py-3 text-base rounded-duo-lg min-h-[44px]',
  lg: 'px-6 py-3.5 text-lg rounded-duo-lg min-h-[52px]',
  xl: 'px-8 py-4 text-xl rounded-duo-xl min-h-[60px]',
};

const disabledStyles = `
  bg-duo-border text-duo-text-subtle
  shadow-none cursor-not-allowed
  hover:bg-duo-border
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? {} : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-duo uppercase tracking-wide',
          'transition-all duration-100 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-border-focus focus-visible:ring-offset-2',
          sizeStyles[size],
          disabled ? disabledStyles : variantStyles[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
