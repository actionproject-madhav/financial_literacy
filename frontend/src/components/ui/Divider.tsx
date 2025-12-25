import React from 'react';
import { cn } from '../../utils/cn';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className,
}) => (
  <div
    className={cn(
      'bg-duo-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
      className
    )}
  />
);

