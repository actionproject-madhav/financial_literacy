import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide',
  {
    variants: {
      variant: {
        default:
          'bg-white text-black border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500',

        // Duolingo-style variants
        locked:
          'bg-neutral-200 text-primary-foreground hover:bg-neutral-200/90 border-neutral-400 border-b-4 active:border-b-0',

        primary:
          'bg-sky-400 text-primary-foreground hover:bg-sky-400/90 border-sky-500 border-b-4 active:border-b-0',
        primaryOutline: 'bg-white text-sky-500 hover:bg-slate-100',

        secondary:
          'bg-green-500 text-primary-foreground hover:bg-green-500/90 border-green-600 border-b-4 active:border-b-0',
        secondaryOutline: 'bg-white text-green-500 hover:bg-slate-100',

        danger:
          'bg-rose-500 text-primary-foreground hover:bg-rose-500/90 border-rose-600 border-b-4 active:border-b-0',
        dangerOutline: 'bg-white text-rose-500 hover:bg-slate-100',

        super:
          'bg-indigo-500 text-primary-foreground hover:bg-indigo-500/90 border-indigo-600 border-b-4 active:border-b-0',
        superOutline: 'bg-white text-indigo-500 hover:bg-slate-100',

        ghost:
          'bg-transparent text-slate-500 border-transparent border-0 hover:bg-slate-100',

        sidebar:
          'bg-transparent text-slate-500 border-2 border-transparent hover:bg-slate-100 transition-none',
        sidebarOutline:
          'bg-sky-500/15 text-sky-500 border-sky-300 border-2 hover:bg-sky-500/20 transition-none',

        // Legacy variant for backward compatibility
        outline:
          'bg-white text-sky-500 hover:bg-slate-100 border-2 border-slate-200',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3',
        md: 'h-11 px-4 py-2', // Alias for default
        lg: 'h-12 px-8',
        xl: 'h-14 px-10', // Extra large size
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
