import React, { useEffect, useState } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';

interface ConfettiProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({
  show,
  duration = 3000,
  particleCount = 200,
  colors = ['#58CC02', '#1CB0F6', '#FFC800', '#CE82FF', '#FF9600'],
  onComplete,
}) => {
  const [isExploding, setIsExploding] = useState(false);

  useEffect(() => {
    if (show) {
      setIsExploding(true);
      const timer = setTimeout(() => {
        setIsExploding(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isExploding) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[324] flex items-center justify-center"> {/* Duolingo exact z-index */}
      <ConfettiExplosion
        force={0.8}
        duration={duration}
        particleCount={particleCount}
        colors={colors}
        width={window.innerWidth}
      />
    </div>
  );
};

