import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonShell } from '../components/layout/LessonShell';
import { QuestionCard } from '../components/lesson/QuestionCard';
import { LessonComplete } from '../components/lesson/LessonComplete';
import { FloatingXP } from '../components/effects/FloatingXP';
import { Confetti } from '../components/effects/Confetti';
import { useSound } from '../hooks/useSound';

// Mock lesson data
const mockLesson = {
  id: 'checking-1',
  title: 'Checking Accounts',
  questions: [
    {
      id: 'q1',
      question: 'What is the main purpose of a checking account?',
      choices: [
        { id: 'a', text: 'To earn high interest on savings' },
        { id: 'b', text: 'To handle everyday transactions like paying bills' },
        { id: 'c', text: 'To invest in stocks' },
        { id: 'd', text: 'To get a loan from the bank' },
      ],
      correctAnswerId: 'b',
      explanation: 'Checking accounts are designed for frequent transactions like depositing paychecks and paying bills.',
      culturalBridge: 'In India, this is similar to a Savings Account used for daily transactions.',
    },
    {
      id: 'q2',
      question: 'What happens if you spend more money than you have in your checking account?',
      choices: [
        { id: 'a', text: 'Nothing, the bank covers it for free' },
        { id: 'b', text: 'Your account gets closed immediately' },
        { id: 'c', text: 'You may be charged an overdraft fee' },
        { id: 'd', text: 'You automatically get a loan' },
      ],
      correctAnswerId: 'c',
      explanation: 'Overdraft fees can be $35 or more per transaction. It\'s important to track your balance!',
    },
  ],
};

export const LessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { play } = useSound();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showXP, setShowXP] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = mockLesson.questions[currentIndex];
  const totalQuestions = mockLesson.questions.length;

  const handleAnswer = (isCorrect: boolean, selectedId: string) => {
    if (isCorrect) {
      play('correct');
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      setShowXP(true);
    } else {
      play('incorrect');
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };

  const handleContinue = () => {
    setShowXP(false);
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Lesson complete
      play('levelUp');
      setIsComplete(true);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
      navigate('/learn');
    }
  };

  if (isComplete) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = Math.round((score.correct / totalQuestions) * 100);
    
    return (
      <LessonComplete
        stats={{
          xpEarned: score.correct * 10,
          accuracy,
          timeSpent,
          streak: 5, // From user state
          isNewBest: accuracy === 100,
        }}
        onContinue={() => navigate('/learn')}
        onReview={() => setCurrentIndex(0)}
      />
    );
  }

  return (
    <LessonShell
      currentStep={currentIndex + 1}
      totalSteps={totalQuestions}
      hearts={hearts}
      onExit={handleExit}
    >
      <QuestionCard
        question={currentQuestion.question}
        choices={currentQuestion.choices}
        correctAnswerId={currentQuestion.correctAnswerId}
        explanation={currentQuestion.explanation}
        culturalBridge={currentQuestion.culturalBridge}
        onAnswer={handleAnswer}
        onContinue={handleContinue}
        showTTS
        onPlayAudio={() => console.log('Play TTS')}
      />

      <FloatingXP amount={10} show={showXP} onComplete={() => setShowXP(false)} />
    </LessonShell>
  );
};

