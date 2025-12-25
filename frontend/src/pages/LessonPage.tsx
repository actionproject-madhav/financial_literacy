import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonShell } from '../components/layout/LessonShell';
import { QuestionCard } from '../components/lesson/QuestionCard';
import { LessonComplete } from '../components/lesson/LessonComplete';
import { FloatingXP } from '../components/effects/FloatingXP';
import { useLesson } from '../hooks/useLesson';
import { useUserStore } from '../stores/userStore';
import { mockQuestions } from '../data/mockData';

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
  const [useMockData, setUseMockData] = useState(false);
  const [mockItems, setMockItems] = useState<any[]>([]);
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockScore, setMockScore] = useState({ correct: 0, incorrect: 0 });

  // Initialize lesson on mount
  useEffect(() => {
    // Always try mock data first for now (until backend is fully connected)
    const questions = mockQuestions[lessonId || ''] || mockQuestions['default'];
    const mockItemsData = questions.map((q, idx) => ({
      id: `mock-${idx}`,
      item_id: `mock-item-${idx}`,
      kc_id: lessonId || 'default',
      content: {
        question: q.question,
        choices: q.choices.map(c => ({ text: c.text })),
        correct_answer_id: q.correctAnswerId,
        explanation: q.explanation,
        cultural_bridge: q.culturalBridge,
      },
    }));
    setMockItems(mockItemsData);
    setUseMockData(true);

    // Optionally try backend if learnerId exists
    if (learnerId && !sessionId && !isLoading) {
      startNewLesson(lessonId).catch((error) => {
        console.error('Failed to start lesson, using mock data:', error);
        // Mock data already set above
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

  // Use mock data if available
  const effectiveItems = useMockData ? mockItems : items;
  const effectiveCurrentIndex = useMockData ? mockCurrentIndex : currentIndex;
  const effectiveCurrentItem = useMockData 
    ? mockItems[mockCurrentIndex] 
    : currentItem;
  const effectiveScore = useMockData ? mockScore : score;

  const currentQuestion = effectiveCurrentItem ? convertItemToQuestion(effectiveCurrentItem) : null;

  const handleAnswer = async (isCorrect: boolean, selectedId: string) => {
    if (!effectiveCurrentItem) return;

    const responseTime = Date.now() - responseStartTime;

    // Update hearts
    if (!isCorrect) {
      setHearts((prev) => Math.max(0, prev - 1));
    } else {
      setShowXP(true);
    }

    // Update score
    if (useMockData) {
      if (isCorrect) {
        setMockScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setMockScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }
    } else {
      // Submit to backend
      await submitAnswer(
        isCorrect,
        responseTime,
        { selected_choice: selectedId },
        'choice'
      );
    }
  };

  const handleContinue = () => {
    setShowXP(false);
    
    if (useMockData) {
      if (mockCurrentIndex < mockItems.length - 1) {
        setMockCurrentIndex(prev => prev + 1);
      }
    } else {
      if (currentIndex < items.length - 1) {
        goToNextQuestion();
      }
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

  const isLessonComplete = useMockData 
    ? mockCurrentIndex >= mockItems.length 
    : (isComplete || (items.length > 0 && currentIndex >= items.length));

  if (isLessonComplete) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const totalQuestions = effectiveItems.length || 1;
    const accuracy = Math.round((effectiveScore.correct / totalQuestions) * 100);
    
    return (
      <LessonComplete
        stats={{
          xpEarned: effectiveScore.correct * 10,
          accuracy,
          timeSpent,
          streak: 0, // Get from user store
          isNewBest: accuracy === 100,
        }}
        onContinue={() => {
          if (!useMockData) endLesson();
          navigate('/learn');
        }}
        onReview={() => {
          // Reset to start
          if (useMockData) {
            setMockCurrentIndex(0);
            setMockScore({ correct: 0, incorrect: 0 });
          } else {
            navigate(`/lesson/${lessonId}`);
          }
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
      currentStep={effectiveCurrentIndex + 1}
      totalSteps={effectiveItems.length || 1}
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
