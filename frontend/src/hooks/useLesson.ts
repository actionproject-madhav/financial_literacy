import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adaptiveApi, voiceApi } from '../services/api';
import { useUserStore } from '../stores/userStore';
import { useLessonStore } from '../stores/lessonStore';
import { useSound } from './useSound';

export const useLesson = () => {
  const navigate = useNavigate();
  const { play } = useSound();
  const { learnerId, addXP, loseHeart } = useUserStore();
  const {
    sessionId,
    items,
    currentIndex,
    score,
    startLesson,
    answerQuestion,
    nextQuestion,
    resetLesson,
  } = useLessonStore();

  const [isLoading, setIsLoading] = useState(false);

  const startNewLesson = useCallback(async (skillId?: string) => {
    if (!learnerId) return;
    
    setIsLoading(true);
    try {
      const { session_id, items } = await adaptiveApi.startSession(learnerId, 10);
      startLesson(session_id, items);
      if (skillId) {
        navigate(`/lesson/${skillId}`);
      }
    } catch (error) {
      console.error('Failed to start lesson:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [learnerId, navigate, startLesson]);

  const submitAnswer = useCallback(async (
    isCorrect: boolean,
    responseTimeMs: number,
    responseValue: any,
    inputMode: 'choice' | 'voice' = 'choice'
  ) => {
    if (!learnerId || !sessionId || !items[currentIndex]) return;

    const currentItem = items[currentIndex];

    // Update local state
    answerQuestion(isCorrect);

    if (isCorrect) {
      play('correct');
      addXP(10);
    } else {
      play('incorrect');
      loseHeart();
    }

    // Log to backend
    try {
      await adaptiveApi.logInteraction({
        learner_id: learnerId,
        item_id: currentItem.item_id,
        kc_id: currentItem.kc_id || currentItem.kcId,
        session_id: sessionId,
        is_correct: isCorrect,
        response_value: responseValue,
        response_time_ms: responseTimeMs,
        input_mode: inputMode,
      });
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }, [learnerId, sessionId, items, currentIndex, answerQuestion, play, addXP, loseHeart]);

  const submitVoiceAnswer = useCallback(async (audioBase64: string) => {
    if (!learnerId || !sessionId || !items[currentIndex]) return null;

    const currentItem = items[currentIndex];

    try {
      const result = await voiceApi.submitVoiceAnswer({
        learner_id: learnerId,
        item_id: currentItem.item_id,
        session_id: sessionId,
        audio_base64: audioBase64,
      });

      // Update local state based on result
      answerQuestion(result.is_correct);

      if (result.is_correct) {
        play('correct');
        addXP(result.xp_earned);
      } else {
        play('incorrect');
        loseHeart();
      }

      return result;
    } catch (error) {
      console.error('Failed to submit voice answer:', error);
      return null;
    }
  }, [learnerId, sessionId, items, currentIndex, answerQuestion, play, addXP, loseHeart]);

  const goToNextQuestion = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const endLesson = useCallback(() => {
    const finalScore = score;
    resetLesson();
    return finalScore;
  }, [score, resetLesson]);

  return {
    // State
    sessionId,
    items,
    currentIndex,
    currentItem: items[currentIndex] || null,
    score,
    isComplete: currentIndex >= items.length && items.length > 0,
    isLoading,
    
    // Actions
    startNewLesson,
    submitAnswer,
    submitVoiceAnswer,
    goToNextQuestion,
    endLesson,
  };
};

