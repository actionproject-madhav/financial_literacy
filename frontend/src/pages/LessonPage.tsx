import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonShell } from '../components/layout/LessonShell';
import { QuestionCard } from '../components/lesson/QuestionCard';
import { LessonComplete } from '../components/lesson/LessonComplete';
import { FloatingXP } from '../components/effects/FloatingXP';
import { useLesson } from '../hooks/useLesson';
import { useUserStore } from '../stores/userStore';

export const LessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { learnerId } = useUserStore();
  const {
    sessionId,
    items,
    currentIndex,
    currentItem,
    score,
    isComplete,
    isLoading,
    startNewLesson,
    submitAnswer,
    goToNextQuestion,
    endLesson,
  } = useLesson();

  const [hearts, setHearts] = useState(5);
  const [showXP, setShowXP] = useState(false);
  const [startTime] = useState(Date.now());
  const [responseStartTime] = useState(Date.now());

  // Initialize lesson on mount
  useEffect(() => {
    if (learnerId && !sessionId && !isLoading) {
      // Start lesson using the hook
      startNewLesson(lessonId).catch((error) => {
        console.error('Failed to start lesson:', error);
        alert('Failed to start lesson. Please try again.');
        navigate('/learn');
      });
    }
  }, [learnerId, lessonId, sessionId, isLoading, navigate, startNewLesson]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!learnerId) {
      navigate('/auth');
    }
  }, [learnerId, navigate]);

  // Convert backend item to question format
  const convertItemToQuestion = (item: any) => {
    if (!item || !item.content) return null;

    const content = item.content;
    const question = content.question || content.prompt || '';
    const choices = (content.choices || []).map((choice: any, index: number) => ({
      id: String.fromCharCode(65 + index), // A, B, C, D
      text: choice.text || choice.label || choice,
    }));

    return {
      question,
      choices,
      correctAnswerId: content.correct_answer_id || content.correct_choice || 'A',
      explanation: content.explanation || content.feedback || '',
      culturalBridge: content.cultural_bridge || '',
    };
  };

  const currentQuestion = currentItem ? convertItemToQuestion(currentItem) : null;

  const handleAnswer = async (isCorrect: boolean, selectedId: string) => {
    if (!currentItem) return;

    const responseTime = Date.now() - responseStartTime;

    // Update hearts
    if (!isCorrect) {
      setHearts((prev) => Math.max(0, prev - 1));
    } else {
      setShowXP(true);
    }

    // Submit to backend
    await submitAnswer(
      isCorrect,
      responseTime,
      { selected_choice: selectedId },
      'choice'
    );
  };

  const handleContinue = () => {
    setShowXP(false);
    
    if (currentIndex < items.length - 1) {
      goToNextQuestion();
      // Reset response timer
      useState(Date.now());
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
      endLesson();
      navigate('/learn');
    }
  };

  if (isLoading && !sessionId) {
    return (
      <div className="min-h-screen bg-duo-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-duo-green mx-auto mb-4"></div>
          <p className="text-duo-text-muted">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (isComplete || (items.length > 0 && currentIndex >= items.length)) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const totalQuestions = items.length || 1;
    const accuracy = Math.round((score.correct / totalQuestions) * 100);
    
    return (
      <LessonComplete
        stats={{
          xpEarned: score.correct * 10,
          accuracy,
          timeSpent,
          streak: 0, // Get from user store
          isNewBest: accuracy === 100,
        }}
        onContinue={() => {
          endLesson();
          navigate('/learn');
        }}
        onReview={() => {
          // Reset to start
          navigate(`/lesson/${lessonId}`);
        }}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-duo-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-duo-text-muted">No questions available</p>
          <button
            onClick={() => navigate('/learn')}
            className="mt-4 px-4 py-2 bg-duo-blue text-white rounded-lg"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  return (
    <LessonShell
      currentStep={currentIndex + 1}
      totalSteps={items.length || 1}
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
        showTTS={false} // Enable when TTS is ready
        onPlayAudio={() => console.log('Play TTS')}
      />

      <FloatingXP amount={10} show={showXP} onComplete={() => setShowXP(false)} />
    </LessonShell>
  );
};
