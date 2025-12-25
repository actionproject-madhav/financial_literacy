import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'xp' | 'streak';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    default: 'bg-[#E5E5E5] text-[#4B4B4B]', // Duolingo exact
    success: 'bg-[#D7FFB8] text-[#58CC02]',
    danger: 'bg-[#FFDFE0] text-[#FF4B4B]',
    warning: 'bg-[#FFF4CC] text-[#FF9600]',
    info: 'bg-[#DDF4FF] text-[#1CB0F6]',
    xp: 'bg-[#F3E5FF] text-[#8549BA]',
    streak: 'bg-[#FFF0D5] text-[#FF9600]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

