import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'bordered' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-white rounded-[16px]', // Duolingo uses 16px border-radius
      elevated: 'bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
      bordered: 'bg-white rounded-[16px] border-2 border-[#E5E5E5]',
      interactive: `
        bg-white rounded-[16px] border-2 border-[#E5E5E5]
        hover:border-[#1899D6] hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]
        cursor-pointer transition-all duration-200
      `,
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4', // 16px - Duolingo standard small padding
      md: 'p-5', // 20px - Duolingo standard medium padding
      lg: 'p-6', // 24px - Duolingo standard large padding
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

// Card Title
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={cn('text-[19px] font-bold text-[#4B4B4B]', className)} style={{ lineHeight: '25px' }}>
    {children}
  </h3>
);

// Card Content
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('text-[#4B4B4B] text-[15px]', className)} style={{ lineHeight: '24px' }}>{children}</div>
);

// Card Footer
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t-2 border-[#E5E5E5]', className)}>
    {children}
  </div>
);

