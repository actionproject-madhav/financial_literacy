import { create } from 'zustand';

interface LessonState {
  sessionId: string | null;
  items: any[];
  currentIndex: number;
  score: { correct: number; incorrect: number };
  startTime: number | null;
  
  startLesson: (sessionId: string, items: any[]) => void;
  answerQuestion: (isCorrect: boolean) => void;
  nextQuestion: () => void;
  resetLesson: () => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  sessionId: null,
  items: [],
  currentIndex: 0,
  score: { correct: 0, incorrect: 0 },
  startTime: null,

  startLesson: (sessionId, items) =>
    set({
      sessionId,
      items,
      currentIndex: 0,
      score: { correct: 0, incorrect: 0 },
      startTime: Date.now(),
    }),

  answerQuestion: (isCorrect) =>
    set((state) => ({
      score: {
        correct: state.score.correct + (isCorrect ? 1 : 0),
        incorrect: state.score.incorrect + (isCorrect ? 0 : 1),
      },
    })),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
    })),

  resetLesson: () =>
    set({
      sessionId: null,
      items: [],
      currentIndex: 0,
      score: { correct: 0, incorrect: 0 },
      startTime: null,
    }),
}));

