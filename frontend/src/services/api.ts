const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
  register: (data: { email: string; name: string; country: string; visaType: string }) =>
    fetchApi<{ learner_id: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string) =>
    fetchApi<{ learner_id: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getProfile: (learnerId: string) =>
    fetchApi<any>(`/api/auth/profile/${learnerId}`),
};

// Adaptive Learning API
export const adaptiveApi = {
  startSession: (learnerId: string, sessionLength = 10) =>
    fetchApi<{ session_id: string; items: any[] }>('/api/adaptive/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId, session_length: sessionLength }),
    }),

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

  getAchievements: (learnerId: string) =>
    fetchApi<any>(`/api/adaptive/achievements/${learnerId}`),
};

// Voice API
export const voiceApi = {
  getTTS: async (itemId: string, language = 'en', slow = false) => {
    const params = new URLSearchParams({ lang: language, slow: slow.toString() });
    return fetchApi<{ audio_url: string }>(`/api/voice/tts/${itemId}?${params}`);
  },

  transcribe: (audioBase64: string, languageHint?: string) =>
    fetchApi<{
      transcription: string;
      confidence: number;
      detected_language: string;
    }>('/api/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio_base64: audioBase64, language_hint: languageHint }),
    }),

  submitVoiceAnswer: (data: {
    learner_id: string;
    item_id: string;
    session_id: string;
    audio_base64: string;
    language_hint?: string;
  }) =>
    fetchApi<any>('/api/voice/interaction', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

