import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LessonProgressBar } from '../lesson/LessonProgressBar';
import { cn } from '../../utils/cn';

interface LessonShellProps {
  currentStep: number;
  totalSteps: number;
  hearts?: number;
  onExit: () => void;
  children: React.ReactNode;
}

export const LessonShell: React.FC<LessonShellProps> = ({
  currentStep,
  totalSteps,
  hearts,
  onExit,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(240, 240, 240)' }}>
      {/* Progress Bar */}
      <LessonProgressBar
        current={currentStep}
        total={totalSteps}
        hearts={hearts}
        onExit={onExit}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-5 py-6" style={{ background: 'rgb(240, 240, 240)' }}> {/* Duolingo uses 20px padding */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

