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
//juat an test
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[#58CC02] text-white font-bold
    border-0
    shadow-[0_4px_0_#46A302]
    hover:brightness-110
    active:shadow-none active:translate-y-[4px]
    relative
  `,
  secondary: `
    bg-[#1CB0F6] text-white font-bold
    border-0
    shadow-[0_4px_0_#1899D6]
    hover:brightness-110
    active:shadow-none active:translate-y-[4px]
    relative
  `,
  outline: `
    bg-white text-[#1CB0F6] font-bold
    border-2 border-[#E5E5E5]
    shadow-[0_4px_0_#E5E5E5]
    hover:bg-[#F7F7F7] hover:border-[#1899D6]
    active:shadow-none active:translate-y-[4px]
    relative
  `,
  ghost: `
    bg-transparent text-[#1CB0F6] font-bold
    border-0 shadow-none
    hover:bg-[#DDF4FF]
    active:bg-[#DDF4FF]
  `,
  danger: `
    bg-[#FF4B4B] text-white font-bold
    border-0
    shadow-[0_4px_0_#EA2B2B]
    hover:brightness-110
    active:shadow-none active:translate-y-[4px]
    relative
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-5 py-0 text-[15px] rounded-[16px] h-[44px]', // Duolingo exact: 44px height, 15px text
  md: 'px-5 py-0 text-[15px] rounded-[16px] h-[48px]', // Duolingo exact: 48px height, 15px text
  lg: 'px-5 py-0 text-[17px] rounded-[16px] h-[58px]', // Duolingo exact: 58px height, 17px text
  xl: 'px-6 py-0 text-[19px] rounded-[16px] h-[64px]', // Extended size
};

const disabledStyles = `
  bg-[#E5E5E5] text-[#AFAFAF]
  shadow-none cursor-not-allowed
  hover:bg-[#E5E5E5]
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
        whileTap={disabled ? {} : { scale: 0.98, y: 1 }} // Duolingo: subtle scale + tiny translate
        transition={{ duration: 0.1, ease: 'easeOut' }} // Duolingo: very fast 100ms
        disabled={disabled}
        className={cn(
          // Base styles - Duolingo exact
          'inline-flex items-center justify-center gap-3', // Duolingo uses 12px (gap-3) for button icons
          'font-bold uppercase tracking-[0.04em]', // Duolingo uses uppercase with letter-spacing
          'transition-all duration-100 ease-out', // 100ms transitions
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84D8FF] focus-visible:ring-offset-2',
          
          // Size
          sizeStyles[size],
          
          // Variant (or disabled)
          disabled ? disabledStyles : variantStyles[variant],
          
          // Full width
          fullWidth && 'w-full',
          
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-current" />
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

