/**
 * FinLit API Client - TypeScript Reference
 *
 * Use this as a reference when building your React frontend.
 * Copy this file to your frontend project's src/services/ directory.
 *
 * Installation in your React project:
 *   npm install axios (optional, or use fetch)
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================================================
// TYPES
// ============================================================================

export interface LearnerProfile {
  learner_id: string;
  email: string;
  display_name: string;
  profile_picture_url?: string;
  native_language: string;
  english_proficiency: string;
  country_of_origin: string;
  immigration_status: string;
  visa_type: string;
  has_ssn: boolean;
  sends_remittances: boolean;
  financial_goals: string[];
  financial_experience_level: string;
  total_xp: number;
  streak_count: number;
  daily_goal_minutes: number;
  timezone: string;
  onboarding_completed: boolean;
  placement_test_completed?: boolean;
  placement_test_score?: number;
  performance_level?: string;
}

export interface LearningItem {
  item_id: string;
  item_type: 'multiple_choice';
  content: {
    stem: string;
    choices: string[];
    correct_answer: number;
    explanation: string;
    visa_variants?: any;
  };
  kc_id: string;
  kc_name: string;
  kc_domain: string;
  predicted_p_correct: number;
  difficulty: number;
  position: number;
}

export interface SkillState {
  kc_id: string;
  p_mastery: number;
  p_mastery_before?: number;
  mastery_change?: number;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  next_review_at: string;
}

export interface Achievement {
  achievement_id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  xp_reward: number;
  earned_at?: string;
  progress?: number;
  threshold?: number;
}

export interface InteractionData {
  learner_id: string;
  item_id: string;
  kc_id: string;
  session_id: string;
  is_correct: boolean;
  response_value: any;
  response_time_ms: number;
  hint_used?: boolean;
}

export interface InteractionResult {
  success: boolean;
  interaction_id: string;
  skill_state: SkillState;
  xp_earned: number;
  achievements: Achievement[];
}

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/../auth/me`, {
      credentials: 'include',
    });
    return res.json();
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await fetch(`${API_BASE}/../auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};

// ============================================================================
// LEARNER API
// ============================================================================

export const learnerApi = {
  /**
   * Complete onboarding
   */
  completeOnboarding: async (data: {
    learner_id: string;
    native_language: string;
    english_proficiency: string;
    country_of_origin: string;
    immigration_status: string;
    visa_type: string;
    has_ssn: boolean;
    sends_remittances: boolean;
    financial_goals: string[];
    financial_experience_level: string;
    daily_goal_minutes: number;
    timezone: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/learners/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Get learner profile
   */
  getProfile: async (learnerId: string): Promise<LearnerProfile> => {
    const res = await fetch(`${API_BASE}/learners/${learnerId}`);
    return res.json();
  },

  /**
   * Update learner profile
   */
  updateProfile: async (learnerId: string, data: Partial<LearnerProfile>): Promise<any> => {
    const res = await fetch(`${API_BASE}/learners/${learnerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Get learner's skills
   */
  getSkills: async (learnerId: string, filters?: {
    status?: string;
    domain?: string;
  }): Promise<any> => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_BASE}/learners/${learnerId}/skills?${params}`);
    return res.json();
  },

  /**
   * Get learner's achievements
   */
  getAchievements: async (learnerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/learners/${learnerId}/achievements`);
    return res.json();
  },

  /**
   * Get daily progress history
   */
  getDailyProgress: async (learnerId: string, days = 7): Promise<any> => {
    const res = await fetch(`${API_BASE}/learners/${learnerId}/daily-progress?days=${days}`);
    return res.json();
  },
};

// ============================================================================
// ADAPTIVE LEARNING API
// ============================================================================

export const adaptiveApi = {
  /**
   * Start a learning session
   */
  startSession: async (learnerId: string, sessionLength = 10): Promise<{
    session_id: string;
    items: LearningItem[];
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId, session_length: sessionLength }),
    });
    return res.json();
  },

  /**
   * Get next recommended item
   */
  getNextItem: async (learnerId: string, kcId?: string): Promise<LearningItem> => {
    const params = new URLSearchParams({ learner_id: learnerId });
    if (kcId) params.append('kc_id', kcId);

    const res = await fetch(`${API_BASE}/adaptive/next-item?${params}`);
    return res.json();
  },

  /**
   * Log an interaction (answer submission)
   */
  logInteraction: async (data: InteractionData): Promise<InteractionResult> => {
    const res = await fetch(`${API_BASE}/adaptive/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Get learner's overall progress
   */
  getProgress: async (learnerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/adaptive/progress/${learnerId}`);
    return res.json();
  },

  /**
   * Get learning path recommendations
   */
  getLearningPath: async (learnerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/adaptive/learning-path/${learnerId}`);
    return res.json();
  },

  /**
   * Get review schedule
   */
  getReviews: async (learnerId: string, daysAhead = 7): Promise<any> => {
    const res = await fetch(
      `${API_BASE}/adaptive/reviews/${learnerId}?days_ahead=${daysAhead}`
    );
    return res.json();
  },

  /**
   * Get detailed analytics
   */
  getAnalytics: async (learnerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/adaptive/analytics/${learnerId}`);
    return res.json();
  },

  /**
   * Get skill progress for specific KC
   */
  getKCProgress: async (kcId: string, learnerId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/adaptive/kcs/${kcId}/progress/${learnerId}`);
    return res.json();
  },
};

// ============================================================================
// PERSONALIZATION API
// ============================================================================

export const personalizationApi = {
  /**
   * Get personalized content for an item
   */
  personalizeContent: async (learnerId: string, itemId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/adaptive/personalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId, item_id: itemId }),
    });
    return res.json();
  },

  /**
   * Get explanation for wrong answer
   */
  explainWrongAnswer: async (
    learnerId: string,
    itemId: string,
    learnerAnswer: number
  ): Promise<{
    explanation: string;
    encouragement: string;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/explain-wrong`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learner_id: learnerId,
        item_id: itemId,
        learner_answer: learnerAnswer,
      }),
    });
    return res.json();
  },

  /**
   * Get hint for current question
   */
  getHint: async (learnerId: string, itemId: string): Promise<{ hint: string }> => {
    const res = await fetch(`${API_BASE}/adaptive/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId, item_id: itemId }),
    });
    return res.json();
  },

  /**
   * Generate cultural bridge for a skill
   */
  generateCulturalBridge: async (
    kcId: string,
    countryCode: string
  ): Promise<{ cultural_bridge: string; cached: boolean }> => {
    const res = await fetch(`${API_BASE}/adaptive/generate-cultural-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kc_id: kcId, country_code: countryCode }),
    });
    return res.json();
  },
};

// ============================================================================
// ACHIEVEMENT API
// ============================================================================

export const achievementApi = {
  /**
   * Get earned achievements
   */
  getEarnedAchievements: async (learnerId: string): Promise<{
    achievements: Achievement[];
    count: number;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/achievements/${learnerId}`);
    return res.json();
  },

  /**
   * Get available achievements with progress
   */
  getAvailableAchievements: async (learnerId: string): Promise<{
    achievements: Achievement[];
    count: number;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/achievements/${learnerId}/available`);
    return res.json();
  },

  /**
   * Check for newly earned achievements
   */
  checkAchievements: async (learnerId: string): Promise<{
    newly_earned: Achievement[];
    count: number;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/achievements/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId }),
    });
    return res.json();
  },
};

// ============================================================================
// PLACEMENT TEST API
// ============================================================================

export const placementTestApi = {
  /**
   * Start placement test
   */
  startPlacementTest: async (learnerId: string): Promise<{
    test_id: string;
    items: LearningItem[];
    total_items: number;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/placement-test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId }),
    });
    return res.json();
  },

  /**
   * Complete placement test
   */
  completePlacementTest: async (
    learnerId: string,
    testId: string,
    results: Array<{
      item_id: string;
      kc_id: string;
      is_correct: boolean;
      response_time_ms: number;
      response_value?: any;
    }>
  ): Promise<{
    success: boolean;
    score: number;
    correct_count: number;
    total_items: number;
    skills_initialized: number;
    performance_level: string;
    message: string;
  }> => {
    const res = await fetch(`${API_BASE}/adaptive/placement-test/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learner_id: learnerId,
        test_id: testId,
        results,
      }),
    });
    return res.json();
  },
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Complete learning flow in a React component
 */
export const exampleUsage = {
  /**
   * Start a learning session and handle questions
   */
  async startLearningSession(learnerId: string) {
    // 1. Start session
    const session = await adaptiveApi.startSession(learnerId, 10);
    console.log(`Session ${session.session_id} started with ${session.items.length} items`);

    let totalXP = 0;
    const questionStartTime = Date.now();

    // 2. Process each question
    for (const item of session.items) {
      // Display question to user
      console.log(`Question: ${item.content.stem}`);

      // User selects answer (simulated)
      const selectedAnswer = 0; // User's choice
      const isCorrect = selectedAnswer === item.content.correct_answer;

      // 3. Log interaction
      const result = await adaptiveApi.logInteraction({
        learner_id: learnerId,
        item_id: item.item_id,
        kc_id: item.kc_id,
        session_id: session.session_id,
        is_correct: isCorrect,
        response_value: { selected_choice: selectedAnswer },
        response_time_ms: Date.now() - questionStartTime,
      });

      totalXP += result.xp_earned;

      // 4. Show feedback
      if (isCorrect) {
        console.log('Correct! +' + result.xp_earned + ' XP');
      } else {
        // Get explanation for wrong answer
        const explanation = await personalizationApi.explainWrongAnswer(
          learnerId,
          item.item_id,
          selectedAnswer
        );
        console.log('Incorrect. ' + explanation.explanation);
      }

      // 5. Check for achievements
      if (result.achievements.length > 0) {
        console.log('Achievements unlocked:', result.achievements);
      }

      // 6. Update mastery display
      console.log(`Mastery: ${result.skill_state.p_mastery.toFixed(2)}`);
    }

    // 7. Get final progress
    const progress = await adaptiveApi.getProgress(learnerId);
    console.log(`Session complete! Total XP: ${totalXP}`);
    console.log(`Overall progress:`, progress);
  },

  /**
   * Complete placement test flow
   */
  async completePlacementTest(learnerId: string) {
    // 1. Start placement test
    const test = await placementTestApi.startPlacementTest(learnerId);
    console.log(`Placement test started: ${test.items.length} questions`);

    const results = [];
    const startTime = Date.now();

    // 2. Answer each question
    for (const item of test.items) {
      // User answers question (simulated)
      const selectedAnswer = Math.floor(Math.random() * 4);
      const isCorrect = selectedAnswer === item.content.correct_answer;

      results.push({
        item_id: item.item_id,
        kc_id: item.kc_id,
        is_correct: isCorrect,
        response_time_ms: Math.random() * 20000 + 5000,
        response_value: { selected_choice: selectedAnswer },
      });
    }

    // 3. Complete test
    const completion = await placementTestApi.completePlacementTest(
      learnerId,
      test.test_id,
      results
    );

    console.log(`Placement test complete!`);
    console.log(`Score: ${completion.score * 100}%`);
    console.log(`Level: ${completion.performance_level}`);
    console.log(`Skills initialized: ${completion.skills_initialized}`);
  },
};

// Export all APIs
export default {
  auth: authApi,
  learner: learnerApi,
  adaptive: adaptiveApi,
  personalization: personalizationApi,
  achievement: achievementApi,
  placementTest: placementTestApi,
  examples: exampleUsage,
};
