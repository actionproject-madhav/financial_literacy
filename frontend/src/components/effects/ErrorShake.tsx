import React from 'react';
import { motion } from 'framer-motion';

interface ErrorShakeProps {
  children: React.ReactNode;
  shake: boolean;
  onComplete?: () => void;
}

export const ErrorShake: React.FC<ErrorShakeProps> = ({
  children,
  shake,
  onComplete,
}) => {
  const shakeAnimation = {
    x: shake ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
  };

  return (
    <motion.div
      animate={shakeAnimation}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => shake && onComplete?.()}
    >
      {children}
    </motion.div>
  );
};

