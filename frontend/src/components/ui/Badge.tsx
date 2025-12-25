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
    default: 'bg-duo-border text-duo-text',
    success: 'bg-[#D7FFB8] text-duo-green',
    danger: 'bg-duo-red-tint text-duo-red',
    warning: 'bg-yellow-100 text-duo-orange',
    info: 'bg-duo-blue-tint text-duo-blue',
    xp: 'bg-duo-purple-tint text-duo-purple',
    streak: 'bg-orange-100 text-duo-orange',
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

