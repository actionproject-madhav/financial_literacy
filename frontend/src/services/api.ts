// Use Vite proxy for development (relative URLs), or full URL for production
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  getCurrentUser: () =>
    fetchApi<any>('/auth/me'),

  logout: () =>
    fetchApi<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),
};

// Learner API
export const learnerApi = {
  getProfile: (learnerId: string) =>
    fetchApi<any>(`/api/learners/${learnerId}`),

  updateProfile: (learnerId: string, data: any) =>
    fetchApi<any>(`/api/learners/${learnerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  completeOnboarding: (data: {
    learner_id: string;
    native_language?: string;
    english_proficiency?: string;
    country_of_origin?: string;
    immigration_status?: string;
    visa_type?: string;
    has_ssn?: boolean;
    sends_remittances?: boolean;
    financial_goals?: string[];
    financial_experience_level?: string;
    daily_goal_minutes?: number;
    timezone?: string;
  }) =>
    fetchApi<{ success: boolean; learner_id: string }>('/api/learners/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  initializeSkills: (learnerId: string) =>
    fetchApi<any>(`/api/learners/${learnerId}/skills/init`, {
      method: 'POST',
    }),

  getSkills: (learnerId: string) =>
    fetchApi<any[]>(`/api/learners/${learnerId}/skills`),

  getAchievements: (learnerId: string) =>
    fetchApi<any[]>(`/api/learners/${learnerId}/achievements`),

  getDailyProgress: (learnerId: string) =>
    fetchApi<any>(`/api/learners/${learnerId}/daily-prog`),
};

// Adaptive Learning API
export const adaptiveApi = {
  startSession: (learnerId: string, sessionLength = 10) =>
    fetchApi<{ session_id: string; items: any[] }>('/api/adaptive/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId, session_length: sessionLength }),
    }),

  getNextItem: (learnerId: string, kcId?: string) => {
    const params = new URLSearchParams({ learner_id: learnerId });
    if (kcId) params.append('kc_id', kcId);
    return fetchApi<any>(`/api/adaptive/next-item?${params}`);
  },

  logInteraction: (data: {
    learner_id: string;
    item_id: string;
    kc_id: string;
    session_id?: string;
    is_correct: boolean;
    response_value: any;
    response_time_ms: number;
    hint_used?: boolean;
    input_mode?: string;
  }) =>
    fetchApi<any>('/api/adaptive/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProgress: (learnerId: string) =>
    fetchApi<any>(`/api/adaptive/progress/${learnerId}`),

  getLearningPath: (learnerId: string) =>
    fetchApi<any>(`/api/adaptive/learning-path/${learnerId}`),

  getReviews: (learnerId: string, daysAhead = 7) =>
    fetchApi<any>(`/api/adaptive/reviews/${learnerId}?days_ahead=${daysAhead}`),

  getAnalytics: (learnerId: string) =>
    fetchApi<any>(`/api/adaptive/analytics/${learnerId}`),

  getAllKCs: () =>
    fetchApi<any[]>('/api/adaptive/kcs'),

  getKCProgress: (kcId: string, learnerId: string) =>
    fetchApi<any>(`/api/adaptive/kcs/${kcId}/prog/${learnerId}`),

  getAchievements: (learnerId: string) =>
    fetchApi<any[]>(`/api/adaptive/achievements/${learnerId}`),

  getAvailableAchievements: (learnerId: string) =>
    fetchApi<any[]>(`/api/adaptive/achievements/${learnerId}/avail`),

  checkAchievements: (learnerId: string) =>
    fetchApi<any[]>('/api/adaptive/achievements/check', {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId }),
    }),
};

// Voice API (if implemented)
export const voiceApi = {
  getTTS: async (itemId: string, language = 'en', slow = false) => {
    const params = new URLSearchParams({ lang: language, slow: slow.toString() });
    try {
      return await fetchApi<{ audio_url: string }>(`/api/voice/tts/${itemId}?${params}`);
    } catch (error) {
      console.warn('Voice TTS not available:', error);
      return null;
    }
  },

  transcribe: async (audioBase64: string, languageHint?: string) => {
    try {
      return await fetchApi<{
        transcription: string;
        confidence: number;
        detected_language: string;
      }>('/api/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audio_base64: audioBase64, language_hint: languageHint }),
      });
    } catch (error) {
      console.warn('Voice transcription not available:', error);
      return null;
    }
  },

  submitVoiceAnswer: async (data: {
    learner_id: string;
    item_id: string;
    session_id: string;
    audio_base64: string;
    language_hint?: string;
  }) => {
    try {
      return await fetchApi<any>('/api/voice/interaction', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Voice interaction not available:', error);
      return null;
    }
  },
};

// Health check
export const healthApi = {
  checkBackend: () =>
    fetchApi<{ status: string }>('/api/health').catch(() => null),

  checkLearners: () =>
    fetchApi<{ status: string }>('/api/learners/health').catch(() => null),

  checkAdaptive: () =>
    fetchApi<{ status: string }>('/api/adaptive/health').catch(() => null),
};

// Curriculum API
export interface Course {
  id: string;
  title: string;
  emoji: string;
  description: string;
  level: string;
  order: number;
  lessons_count: number;
  questions_count: number;
  unlocked: boolean;
  progress: number;
  mastered_count: number;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty_tier: number;
  bloom_level: string;
  estimated_minutes: number;
  icon_url: string | null;
  questions_count: number;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  p_mastery: number;
  total_attempts: number;
  correct_count: number;
  order: number;
}

export interface Question {
  id: string;
  item_type: string;
  content: {
    stem: string;
    choices: string[];
    correct_answer: number;
    explanation: string;
    visa_variants?: Record<string, { additional_context: string }>;
  };
  difficulty: number;
  discrimination: number;
  media_type: string | null;
  media_url: string | null;
  allows_personalization: boolean;
}

export const curriculumApi = {
  getCourses: (learnerId?: string) => {
    const params = learnerId ? `?learner_id=${learnerId}` : '';
    return fetchApi<{ courses: Course[] }>(`/api/curriculum/courses${params}`);
  },

  getCourseLessons: (domain: string, learnerId?: string) => {
    const params = learnerId ? `?learner_id=${learnerId}` : '';
    return fetchApi<{
      course: {
        id: string;
        title: string;
        emoji: string;
        description: string;
        level: string;
      };
      lessons: Lesson[];
    }>(`/api/curriculum/courses/${domain}/lessons${params}`);
  },

  getLessonQuestions: (kcId: string, learnerId?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (learnerId) params.append('learner_id', learnerId);
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{
      lesson: {
        id: string;
        slug: string;
        title: string;
        description: string;
        domain: string;
        difficulty_tier: number;
        estimated_minutes: number;
      };
      questions: Question[];
      total_count: number;
    }>(`/api/curriculum/lessons/${kcId}/questions${queryString}`);
  },
};
