import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 'md',
  className,
}) => {
  const sizeConfig = {
    sm: { svg: 40, stroke: 3 },
    md: { svg: 60, stroke: 4 },
    lg: { svg: 80, stroke: 5 },
  };

  const config = sizeConfig[size];
  const center = config.svg / 2;
  const radius = center - config.stroke;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={config.svg}
      height={config.svg}
      viewBox={`0 0 ${config.svg} ${config.svg}`}
      className={cn('overflow-visible', className)}
    >
      {/* Circle */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#58CC02"
        strokeWidth={config.stroke}
        strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Checkmark */}
      <motion.path
        d={`M ${center * 0.35} ${center} L ${center * 0.75} ${center * 1.3} L ${center * 1.65} ${center * 0.3}`}
        fill="none"
        stroke="#58CC02"
        strokeWidth={config.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
};

