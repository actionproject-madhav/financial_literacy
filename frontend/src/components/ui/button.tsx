import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[16px] text-sm font-bold ring-offset-background transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide',
  {
    variants: {
      variant: {
        default:
          'bg-duo-surface text-duo-text border-duo-border border-2 border-b-4 shadow-duo-gray hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] active:shadow-none',

        // Duolingo-style variants with 3D effects
        locked:
          'bg-neutral-200 text-duo-text-subtle border-neutral-400 border-2 border-b-4 cursor-not-allowed opacity-60',

        primary:
          'bg-duo-blue text-white border-2 border-b-4 border-duo-blue-shadow shadow-duo-blue hover:bg-duo-blue-hover active:border-b-2 active:translate-y-[2px] active:shadow-none',
        primaryOutline:
          'bg-duo-surface text-duo-blue border-2 border-duo-blue hover:bg-duo-blue-tint',

        secondary:
          'bg-duo-green text-white border-2 border-b-4 border-duo-green-shadow shadow-duo-green hover:bg-duo-green-hover active:border-b-2 active:translate-y-[2px] active:shadow-none',
        secondaryOutline:
          'bg-duo-surface text-duo-green border-2 border-duo-green hover:bg-[#D7FFB8]',

        danger:
          'bg-duo-red text-white border-2 border-b-4 border-duo-red-dark shadow-duo-red hover:brightness-110 active:border-b-2 active:translate-y-[2px] active:shadow-none',
        dangerOutline:
          'bg-duo-surface text-duo-red border-2 border-duo-red hover:bg-duo-red-tint',

        super:
          'bg-duo-purple text-white border-2 border-b-4 border-duo-purple-light shadow-[0_4px_0_#CE82FF] hover:brightness-110 active:border-b-2 active:translate-y-[2px] active:shadow-none',
        superOutline:
          'bg-duo-surface text-duo-purple border-2 border-duo-purple hover:bg-duo-purple-tint',

        ghost:
          'bg-transparent text-duo-text-muted border-transparent border-0 hover:bg-[#F7F7F7]',

        sidebar:
          'bg-transparent text-duo-text-muted border-2 border-transparent hover:bg-[#F7F7F7] transition-none',
        sidebarOutline:
          'bg-duo-blue-tint text-duo-blue border-duo-blue border-2 hover:bg-[#C4E9FF] transition-none',

        // Legacy variant for backward compatibility
        outline:
          'bg-duo-surface text-duo-blue border-2 border-duo-border hover:bg-[#F7F7F7]',
      },
      size: {
        default: 'h-[48px] px-5 text-[15px]',
        sm: 'h-[44px] px-4 text-[15px]',
        md: 'h-[48px] px-5 text-[15px]', // Alias for default
        lg: 'h-[50px] px-6 text-[17px]',
        xl: 'h-[58px] px-8 text-[17px]', // Extra large size
        icon: 'h-10 w-10',

        // Duolingo custom size
        rounded: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, fullWidth, leftIcon, rightIcon, isDisabled, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isButtonDisabled = disabled || isDisabled || isLoading;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && 'w-full',
        )}
        ref={ref}
        disabled={isButtonDisabled}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
