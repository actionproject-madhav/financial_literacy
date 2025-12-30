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
    // For 401 (Unauthorized), return null instead of throwing
    // This is expected when user is not logged in
    if (response.status === 401) {
      return null as T;
    }
    
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

  getStats: (learnerId: string) =>
    fetchApi<{
      learner_id: string;
      display_name: string;
      email: string;
      country_of_origin: string;
      visa_type: string;
      total_xp: number;
      streak_count: number;
      lessons_completed: number;
      skills_mastered: number;
      level: number;
      level_progress: number;
      xp_for_current_level: number;
      xp_for_next_level: number;
      xp_in_current_level: number;
      xp_needed_for_level: number;
    }>(`/api/learners/${learnerId}/stats`),

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

// Voice API - Uses backend ElevenLabs integration
export const voiceApi = {
  // Get TTS audio for a learning item (uses cached audio)
  getTTS: async (itemId: string, language = 'en', slow = false, choiceIndex?: number) => {
    const params = new URLSearchParams({ language, slow: slow.toString() });
    if (choiceIndex !== undefined) {
      params.append('choice_index', choiceIndex.toString());
    }
    try {
      return await fetchApi<{ audio_base64: string; cached: boolean }>(`/api/adaptive/voice/tts/${itemId}?${params}`);
    } catch (error) {
      console.warn('Voice TTS not available:', error);
      return null;
    }
  },

  // Generate TTS for arbitrary text
  generateTTS: async (text: string, language = 'en', voice?: string) => {
    try {
      return await fetchApi<{ audio_base64: string }>('/api/adaptive/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text, language, voice }),
      });
    } catch (error) {
      console.warn('Voice TTS generation not available:', error);
      return null;
    }
  },

  // Transcribe audio to text using ElevenLabs
  transcribe: async (audioBase64: string, languageHint?: string) => {
    try {
      return await fetchApi<{
        transcription: string;
        confidence: number;
        detected_language: string;
        duration_ms: number;
      }>('/api/adaptive/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audio_base64: audioBase64, language_hint: languageHint }),
      });
    } catch (error) {
      console.warn('Voice transcription not available:', error);
      return null;
    }
  },

  // Submit voice answer with semantic matching
  submitVoiceAnswer: async (data: {
    learner_id: string;
    item_id: string;
    kc_id: string;
    session_id: string;
    audio_base64: string;
    language_hint?: string;
  }) => {
    try {
      return await fetchApi<{
        success: boolean;
        is_correct: boolean;
        transcription: string;
        matched_choice: number | null;
        similarity_scores: Record<string, number>;
        confidence: {
          transcription: number;
          semantic_match: number;
          voice: number;
        };
        skill_state: {
          kc_id: string;
          p_mastery: number;
          status: string;
        };
        xp_earned: number;
      }>('/api/adaptive/interactions/voice', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Voice interaction not available:', error);
      return null;
    }
  },
};

// Diagnostic Test API
export interface DiagnosticItem {
  item_id: string;
  item_type: string;
  content: {
    stem: string;
    choices: string[];
    correct_answer: number;
    explanation?: string;
  };
  kc_id: string;
  kc_name: string;
  kc_domain: string;
  difficulty_tier: number;
  position: number;
}

export interface DiagnosticResult {
  item_id: string;
  kc_id: string;
  kc_domain: string;
  is_correct: boolean;
  response_time_ms: number;
  selected_choice?: number;
}

export interface DiagnosticResponse {
  success: boolean;
  overall_score: number;
  correct_count: number;
  total_items: number;
  domain_scores: Record<string, number>;
  domain_priority: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    domain: string;
    score: number;
    urgency: string;
    message: string;
  }>;
  skills_initialized: number;
  message: string;
}

export const diagnosticApi = {
  startTest: (learnerId: string) =>
    fetchApi<{
      test_id: string;
      items: DiagnosticItem[];
      total_items: number;
      domains_tested: string[];
    }>('/api/adaptive/diagnostic-test/start', {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId }),
    }),

  completeTest: (data: {
    learner_id: string;
    test_id: string;
    results: DiagnosticResult[];
  }) =>
    fetchApi<DiagnosticResponse>('/api/adaptive/diagnostic-test/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getResults: (learnerId: string) =>
    fetchApi<{
      completed: boolean;
      domain_mastery: Record<string, number>;
      domain_priority: string[];
      diagnostic_score: number | null;
      completed_at: string | null;
    }>(`/api/adaptive/diagnostic-results/${learnerId}`),
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
  item_type: 'multiple_choice' | 'content' | string;
  content: {
    // For multiple_choice items
    stem?: string;
    choices?: string[];
    correct_answer?: number;
    explanation?: string;
    visa_variants?: Record<string, { additional_context: string }>;
    // For content items
    text?: string;
    content?: string;
  } | string; // Can also be a string for simple content items
  difficulty: number;
  discrimination: number;
  media_type: string | null;
  media_url: string | null;
  allows_personalization: boolean;
  position?: number; // Order in the lesson
}

export const curriculumApi = {
  completeLesson: async (kcId: string, data: {
    learner_id: string;
    xp_earned?: number;
    accuracy?: number;
    time_spent_minutes?: number;
  }) => {
    return await fetchApi<{
      success: boolean;
      lesson: {
        id: string;
        status: string;
        p_mastery: number;
      };
      next_lesson_unlocked: boolean;
      xp_earned: number;
      total_xp: number;
    }>(`/api/curriculum/lessons/${kcId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
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

// Chat API - FinAI Coach
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  suggestions: string[];
}

export interface Conversation {
  id: string;
  preview: string;
  updated_at: string;
}

export const chatApi = {
  sendMessage: (data: {
    message: string;
    learner_id?: string;
    conversation_id?: string;
    language?: string;  // Add language parameter
    context?: {
      current_lesson?: string;
      visa_type?: string;
    };
  }) =>
    fetchApi<ChatResponse>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getConversations: (learnerId: string, limit = 10) =>
    fetchApi<{ conversations: Conversation[] }>(
      `/api/chat/conversations?learner_id=${learnerId}&limit=${limit}`
    ),

  getConversation: (conversationId: string) =>
    fetchApi<{
      id: string;
      messages: ChatMessage[];
      created_at: string;
    }>(`/api/chat/conversations/${conversationId}`),

  getQuickQuestions: (language = 'en') =>
    fetchApi<{ questions: string[] }>(`/api/chat/quick-questions?language=${language}`),

  healthCheck: () =>
    fetchApi<{ status: string; llm_available: boolean }>('/api/chat/health').catch(() => null),
};

// Quests API
export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xp_reward: number;
  icon: string;
  completed: boolean;
  can_claim: boolean;
}

export interface QuestsResponse {
  daily: Quest[];
  weekly: Quest[];
  special: Quest[];
  daily_reset_hours: number;
  weekly_reset_hours: number;
}

export const questsApi = {
  getQuests: (learnerId: string) =>
    fetchApi<QuestsResponse>(`/api/quests/${learnerId}`),

  claimQuest: (learnerId: string, questId: string) =>
    fetchApi<{
      success: boolean;
      xp_earned: number;
      total_xp: number;
    }>(`/api/quests/${learnerId}/claim/${questId}`, {
      method: 'POST',
    }),

  healthCheck: () =>
    fetchApi<{ status: string }>('/api/quests/health').catch(() => null),
};

// Leaderboard API
export interface League {
  id: string;
  name: string;
  min_xp: number;
  color: string;
  icon: string;
}

export interface LeaderboardEntry {
  rank: number;
  learner_id: string;
  display_name: string;
  initials?: string;
  weekly_xp: number;
  total_xp: number;
  league: League;
  streak?: number;
  is_current_user?: boolean;
}

export interface LeaderboardResponse {
  rankings: LeaderboardEntry[];
  week_start: string;
  week_end: string;
  total_participants: number;
}

export interface LearnerRanking {
  rank: number;
  weekly_xp: number;
  total_xp: number;
  league: League;
  next_league: League | null;
  xp_to_next_league: number;
  promotion_zone: boolean;
  demotion_zone: boolean;
  streak: number;
  display_name: string;
}

export interface MyLeagueResponse {
  league: League;
  rankings: LeaderboardEntry[];
  my_rank: number;
  my_ranking: LeaderboardEntry;
  promotion_zone: boolean;
  time_remaining: {
    days: number;
    hours: number;
    total_seconds: number;
  };
  week_start: string;
  week_end: string;
  total_participants: number;
}

export const leaderboardApi = {
  getLeaderboard: (limit = 50, league?: string, learnerId?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (league) params.append('league', league);
    if (learnerId) params.append('learner_id', learnerId);
    return fetchApi<LeaderboardResponse>(`/api/leaderboard?${params}`);
  },

  getMyLeague: (learnerId: string) =>
    fetchApi<MyLeagueResponse>(`/api/leaderboard/my-league/${learnerId}`),

  getLearnerRanking: (learnerId: string) =>
    fetchApi<LearnerRanking>(`/api/leaderboard/${learnerId}`),

  getRankingsAroundLearner: (learnerId: string) =>
    fetchApi<{
      rankings: LeaderboardEntry[];
      learner_rank: number;
    }>(`/api/leaderboard/around/${learnerId}`),

  getLeagues: () =>
    fetchApi<{ leagues: League[] }>('/api/leaderboard/leagues'),

  healthCheck: () =>
    fetchApi<{ status: string }>('/api/leaderboard/health').catch(() => null),
};

// Streaks API
export interface StreakCalendarDay {
  date: string;
  completed: boolean;
  xp_earned: number;
  lessons_completed: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  streak_alive: boolean;
  hours_until_deadline: number;
  today_completed: boolean;
  streak_freezes: number;
  calendar: StreakCalendarDay[];
}

export const streaksApi = {
  getStreak: (learnerId: string) =>
    fetchApi<StreakInfo>(`/api/streaks/${learnerId}`),

  checkAndUpdateStreak: (learnerId: string) =>
    fetchApi<{
      streak_updated: boolean;
      new_streak: number;
      streak_extended: boolean;
      milestone_reached: number | null;
      longest_streak?: number;
      message?: string;
    }>(`/api/streaks/${learnerId}/check`, {
      method: 'POST',
    }),

  useStreakFreeze: (learnerId: string) =>
    fetchApi<{
      success: boolean;
      remaining_freezes: number;
    }>(`/api/streaks/${learnerId}/freeze`, {
      method: 'POST',
    }),

  repairStreak: (learnerId: string, gemsCost = 50) =>
    fetchApi<{
      success: boolean;
      restored_streak: number;
      gems_spent: number;
    }>(`/api/streaks/${learnerId}/repair`, {
      method: 'POST',
      body: JSON.stringify({ gems_cost: gemsCost }),
    }),

  healthCheck: () =>
    fetchApi<{ status: string }>('/api/streaks/health').catch(() => null),
};
