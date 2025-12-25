import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import { Trophy, Star, Zap, Clock, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface LessonStats {
  xpEarned: number;
  accuracy: number;
  timeSpent: number; // seconds
  streak: number;
  isNewBest?: boolean;
}

interface LessonCompleteProps {
  stats: LessonStats;
  onContinue: () => void;
  onReview?: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
  stats,
  onContinue,
  onReview,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = (accuracy: number) => {
    if (accuracy >= 100) return { label: 'Perfect!', color: 'text-duo-yellow', stars: 3 };
    if (accuracy >= 80) return { label: 'Great!', color: 'text-duo-green', stars: 2 };
    if (accuracy >= 60) return { label: 'Good', color: 'text-duo-blue', stars: 1 };
    return { label: 'Keep practicing', color: 'text-duo-text-muted', stars: 0 };
  };

  const grade = getGrade(stats.accuracy);

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col items-center justify-center p-6">
      {showConfetti && (
        <ConfettiExplosion
          force={0.8}
          duration={3000}
          particleCount={200}
          colors={['#58CC02', '#1CB0F6', '#FFC800', '#CE82FF', '#FF9600']}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full max-w-md"
      >
        {/* Trophy */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-duo-yellow to-duo-orange rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Grade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className={cn('text-3xl font-extrabold mb-2', grade.color)}>
            {grade.label}
          </h1>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-8 h-8',
                  star <= grade.stars
                    ? 'text-duo-yellow fill-duo-yellow'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        </motion.div>

        {/* Stats Card */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            {/* XP */}
            <div className="flex items-center gap-3 p-3 bg-duo-purple-tint rounded-duo-lg">
              <Zap className="w-6 h-6 text-duo-purple" />
              <div>
                <p className="text-sm text-duo-text-muted">XP Earned</p>
                <p className="text-xl font-extrabold text-duo-purple">
                  +{stats.xpEarned}
                </p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="flex items-center gap-3 p-3 bg-[#D7FFB8] rounded-duo-lg">
              <Target className="w-6 h-6 text-duo-green" />
              <div>
                <p className="text-sm text-duo-text-muted">Accuracy</p>
                <p className="text-xl font-extrabold text-duo-green">
                  {stats.accuracy}%
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 p-3 bg-duo-blue-tint rounded-duo-lg">
              <Clock className="w-6 h-6 text-duo-blue" />
              <div>
                <p className="text-sm text-duo-text-muted">Time</p>
                <p className="text-xl font-extrabold text-duo-blue">
                  {formatTime(stats.timeSpent)}
                </p>
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-duo-lg">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm text-duo-text-muted">Streak</p>
                <p className="text-xl font-extrabold text-duo-orange">
                  {stats.streak} days
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
            Continue
          </Button>
          
          {stats.accuracy < 100 && onReview && (
            <Button variant="outline" size="lg" fullWidth onClick={onReview}>
              Review Mistakes
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

