import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Check, Flag, Volume2, Mic, MicOff, Loader2 } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { curriculumApi, adaptiveApi, voiceApi, learnerApi, Question } from '../services/api'
import confetti from 'canvas-confetti'
import { CelebrationOverlay } from '../components/CelebrationOverlay'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslateContent } from '../hooks/useTranslateContent'
import { useHeartRecharge } from '../hooks/useHeartRecharge'

interface StepBase {
  type: 'content' | 'quiz';
}

interface ContentStep extends StepBase {
  type: 'content';
  content: string | {
    // For rich content blocks
    text?: string;
    key_fact?: string;
    // For tables
    columns?: string[];
    rows?: string[][];
    note?: string;
    // For media (future)
    image_url?: string;
    video_url?: string;
    animation_url?: string;
  };
  block_type?: string; // 'concept', 'reference_table', 'example', 'tip', 'warning'
  title?: string;
}

interface QuizStep extends StepBase {
  type: 'quiz';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  itemId: string;
  kcId: string;
}

type Step = ContentStep | QuizStep;

interface LessonInfo {
  id: string;
  slug: string;
  title: string;
  description: string;
  domain: string;
}

export const LessonPage = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  // Store actions
  const { user, learnerId, setUser, addXP } = useUserStore()
  const { language: globalLanguage } = useLanguage()
  const { loseHeart } = useHeartRecharge()

  const [lesson, setLesson] = useState<LessonInfo | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [originalSteps, setOriginalSteps] = useState<Step[]>([]) // Store original English steps
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Voice states
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceAnswer, setVoiceAnswer] = useState('')
  const [voiceConfidence, setVoiceConfidence] = useState<number | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoadingTTS, setIsLoadingTTS] = useState(false)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)

  // Celebration and progress states
  const [showCelebration, setShowCelebration] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalQuizQuestions, setTotalQuizQuestions] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showStreakMilestone, setShowStreakMilestone] = useState(false)
  const [hasShownStreak, setHasShownStreak] = useState(false) // Track if streak was already shown
  const [gemsEarned, setGemsEarned] = useState(5) // Store actual gems earned from backend
  const [xpEarned, setXpEarned] = useState(20) // Store actual XP earned from backend

  // Audio recording refs
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Language configuration - use global language
  const languages = {
    en: { name: 'English', nativeName: 'English', flag: 'https://flagcdn.com/w40/us.png', apiCode: 'eng' },
    es: { name: 'Spanish', nativeName: 'Español', flag: 'https://flagcdn.com/w40/es.png', apiCode: 'spa' },
    ne: { name: 'Nepali', nativeName: 'नेपाली', flag: 'https://flagcdn.com/w40/np.png', apiCode: 'nep' }
  }

  const currentLang = languages[globalLanguage as keyof typeof languages] || languages.en

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!lessonId) {
        navigate('/learn')
        return
      }

      // Check if learner ID is valid (lesson ID can now be a string slug like "us-currency")
      const isValidLearnerId = learnerId && /^[0-9a-fA-F]{24}$/.test(learnerId)

      // For UI testing: use mock data when not logged in
      if (!isValidLearnerId) {
        // Mock lesson data for testing UI
        setLesson({
          id: lessonId,
          title: 'Understanding Financial Basics',
          domain: 'banking', // Default domain for mock data
          order: 1,
          status: 'available',
          xpReward: 20
        } as any)

        // Mock quiz steps for testing (8 quiz questions to trigger streak)
        const mockSteps: Step[] = [
          {
            type: 'content',
            content: 'Welcome to this lesson on financial basics! In this module, you will learn about budgeting, saving, and making smart financial decisions.'
          },
          {
            type: 'quiz',
            question: 'What is a budget?',
            options: [
              'A plan for how you will spend your money',
              'A type of bank account',
              'A credit card',
              'A loan from the bank'
            ],
            correct: 0,
            explanation: 'A budget is a financial plan that helps you track your income and expenses.',
            itemId: 'mock-1',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'What percentage of income do experts recommend saving?',
            options: ['5%', '10%', '20%', '50%'],
            correct: 2,
            explanation: 'The 50/30/20 rule suggests allocating 20% of income to savings.',
            itemId: 'mock-2',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'Which of these is NOT a good reason to have an emergency fund?',
            options: [
              'Unexpected medical bills',
              'Job loss',
              'Buying a luxury item on sale',
              'Car repairs'
            ],
            correct: 2,
            explanation: 'Emergency funds should be reserved for unexpected necessary expenses, not discretionary purchases.',
            itemId: 'mock-3',
            kcId: lessonId
          },
          {
            type: 'content',
            content: 'Great job so far! Now let\'s learn about credit scores and how they affect your financial life.'
          },
          {
            type: 'quiz',
            question: 'What is a good credit score range?',
            options: ['300-500', '500-600', '670-739', '200-300'],
            correct: 2,
            explanation: 'A credit score of 670-739 is considered "good" by most lenders.',
            itemId: 'mock-4',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'What is compound interest?',
            options: [
              'Interest only on the principal',
              'Interest on both principal and accumulated interest',
              'A type of bank fee',
              'Interest paid monthly'
            ],
            correct: 1,
            explanation: 'Compound interest is calculated on the initial principal and also on the accumulated interest from previous periods.',
            itemId: 'mock-5',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'What does APR stand for?',
            options: [
              'Annual Percentage Rate',
              'Applied Payment Ratio',
              'Average Prime Rate',
              'Automatic Payment Reminder'
            ],
            correct: 0,
            explanation: 'APR stands for Annual Percentage Rate, which represents the yearly cost of borrowing money.',
            itemId: 'mock-6',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'Which is the best strategy for paying off debt?',
            options: [
              'Pay minimum on all debts',
              'Ignore bills completely',
              'Pay off high-interest debt first',
              'Take out more loans'
            ],
            correct: 2,
            explanation: 'The avalanche method focuses on paying off high-interest debt first to minimize total interest paid.',
            itemId: 'mock-7',
            kcId: lessonId
          },
          {
            type: 'quiz',
            question: 'What is diversification in investing?',
            options: [
              'Putting all money in one stock',
              'Spreading investments across different assets',
              'Only investing in bonds',
              'Keeping all money in cash'
            ],
            correct: 1,
            explanation: 'Diversification means spreading your investments across different asset classes to reduce risk.',
            itemId: 'mock-8',
            kcId: lessonId
          }
        ]

        setOriginalSteps(mockSteps)
        setSteps(mockSteps)
        setSessionId(`session-${Date.now()}`)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await curriculumApi.getLessonSteps(lessonId, learnerId || undefined)

        setLesson({
          id: response.lesson.id,
          title: response.lesson.title,
          description: response.lesson.description,
          domain: response.lesson.domain, // Get domain from API response
          order: 1,
          status: 'available',
          xpReward: response.lesson.xp_reward
        } as any)

        // Convert API steps to component steps
        const steps: Step[] = response.steps.map((step: any) => {
          if (step.type === 'content') {
            return {
              type: 'content' as const,
              content: step.content,
              block_type: step.block_type,
              title: step.title
            }
          }

          // Quiz step
          return {
            type: 'quiz' as const,
            question: step.question,
            options: step.choices || [],
            correct: step.correct_answer,
            explanation: step.explanation || '',
            itemId: step.item_id,
            kcId: step.kc_id || lessonId
          }
        })

        if (steps.length === 0) {
          setError('No content available for this lesson')
          return
        }

        setOriginalSteps(steps) // Store original English
        setSteps(steps)
        setSessionId(`session-${Date.now()}`)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch questions:', err)
        console.error('Error details:', JSON.stringify(err, null, 2))
        console.error('Lesson ID that failed:', lessonId)
        // Fallback to mock data on error for UI testing
        setLesson({
          id: lessonId,
          title: 'Understanding Financial Basics',
          domain: 'banking', // Default domain for error fallback
          order: 1,
          status: 'available',
          xpReward: 20
        } as any)

        const mockSteps: Step[] = [
          {
            type: 'content',
            content: 'Welcome to this lesson! This is demo content for UI testing.'
          },
          {
            type: 'quiz',
            question: 'What is a budget?',
            options: [
              'A plan for how you will spend your money',
              'A type of bank account',
              'A credit card',
              'A loan from the bank'
            ],
            correct: 0, // Index 0 = first option
            explanation: 'A budget is a financial plan that helps you track your income and expenses.',
            itemId: 'mock-1',
            kcId: lessonId
          }
        ]
        setOriginalSteps(mockSteps)
        setSteps(mockSteps)
        setSessionId(`session-${Date.now()}`)
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [lessonId, learnerId, navigate])

  // Translate all steps when language changes
  useEffect(() => {
    const translateAllSteps = async () => {
      if (globalLanguage === 'en' || originalSteps.length === 0) {
        setSteps(originalSteps)
        return
      }

      console.log(`🌍 Translating ${originalSteps.length} questions to ${globalLanguage}...`)

      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')
      console.log(`📡 Using API base: ${API_BASE}`)

      try {
        const translatedSteps = await Promise.all(
          originalSteps.map(async (step, stepIdx) => {
            if (step.type !== 'quiz') return step

            try {
              // Translate question, options, and explanation in parallel
              // Pass itemId to use database cache
              const [questionRes, ...optionResults] = await Promise.all([
                fetch(`${API_BASE}/api/translate/content`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: step.question,
                    target_language: globalLanguage,
                    context: 'financial literacy question',
                    item_id: step.itemId  // Pass itemId for cache lookup
                  })
                }),
                ...step.options.map((option, idx) =>
                  fetch(`${API_BASE}/api/translate/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      text: option,
                      target_language: globalLanguage,
                      context: `answer choice ${idx + 1}`,
                      item_id: step.itemId  // Pass itemId for cache lookup
                    })
                  })
                )
              ])

              if (!questionRes.ok) {
                console.error(`❌ Question translation failed: ${questionRes.status}`)
                return step
              }

              const questionData = await questionRes.json()
              if (questionData.cached) {
                console.log(`✅ Question ${stepIdx + 1} translated (FROM CACHE):`, questionData.translated?.substring(0, 50))
              } else {
                console.log(`🌐 Question ${stepIdx + 1} translated (LIVE):`, questionData.translated?.substring(0, 50))
              }

              const translatedOptions = await Promise.all(
                optionResults.map(async (res, idx) => {
                  if (!res.ok) {
                    console.error(`❌ Option ${idx + 1} translation failed: ${res.status}`)
                    return step.options[idx]
                  }
                  const data = await res.json()
                  return data.translated || data.translated_text || data.text || step.options[idx]
                })
              )

              // Translate explanation
              const explanationRes = await fetch(`${API_BASE}/api/translate/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: step.explanation,
                  target_language: globalLanguage,
                  context: 'question explanation',
                  item_id: step.itemId  // Pass itemId for cache lookup
                })
              })

              if (!explanationRes.ok) {
                console.error(`❌ Explanation translation failed: ${explanationRes.status}`)
                return { ...step, question: questionData.translated || step.question, options: translatedOptions, explanation: step.explanation }
              }

              const explanationData = await explanationRes.json()

              return {
                ...step,
                question: questionData.translated || questionData.translated_text || questionData.text || step.question,
                options: translatedOptions,
                explanation: explanationData.translated || explanationData.translated_text || explanationData.text || step.explanation
              }
            } catch (stepError) {
              console.error(`❌ Error translating step ${stepIdx + 1}:`, stepError)
              return step
            }
          })
        )

        setSteps(translatedSteps)
        console.log(`✅ Translation complete! ${translatedSteps.length} questions translated.`)
      } catch (error) {
        console.error('❌ Translation error:', error)
        console.error('Error details:', error instanceof Error ? error.message : error)
        setSteps(originalSteps) // Fallback to English
      }
    }

    translateAllSteps()
  }, [globalLanguage, originalSteps])

  // Text-to-Speech using backend ElevenLabs API (with caching)
  const speakQuestion = async (text: string, itemId?: string) => {
    if (isSpeaking || isLoadingTTS) return

    setIsLoadingTTS(true)

    try {
      let result

      // If we have itemId, use cached endpoint (checks cache first)
      if (itemId) {
        result = await voiceApi.getTTS(itemId, globalLanguage)
        if (result?.cached) {
          console.log('✅ Using cached TTS audio for question')
        }
      } else {
        // Fallback to generate endpoint
        result = await voiceApi.generateTTS(text, globalLanguage)
      }

      if (result?.audio_base64) {
        // Play the audio
        const audio = new Audio(result.audio_base64)
        audioRef.current = audio

        audio.onplay = () => setIsSpeaking(true)
        audio.onended = () => setIsSpeaking(false)
        audio.onerror = () => {
          setIsSpeaking(false)
          // Fallback to browser TTS
          fallbackBrowserTTS(text)
        }

        await audio.play()
      } else {
        // Fallback to browser TTS
        fallbackBrowserTTS(text)
      }
    } catch (err) {
      console.error('TTS error:', err)
      fallbackBrowserTTS(text)
    } finally {
      setIsLoadingTTS(false)
    }
  }

  // Speak an answer choice (uses cached audio)
  const speakChoice = async (itemId: string, choiceIndex: number, choiceText: string) => {
    if (isSpeaking || isLoadingTTS) return

    setIsLoadingTTS(true)

    try {
      // Use cached endpoint with choice_index parameter
      const result = await voiceApi.getTTS(itemId, globalLanguage, false, choiceIndex)

      if (result?.cached) {
        console.log(`✅ Using cached TTS audio for choice ${choiceIndex}`)
      }

      if (result?.audio_base64) {
        // Play the audio
        const audio = new Audio(result.audio_base64)
        audioRef.current = audio

        audio.onplay = () => setIsSpeaking(true)
        audio.onended = () => setIsSpeaking(false)
        audio.onerror = () => {
          setIsSpeaking(false)
          // Fallback to browser TTS
          fallbackBrowserTTS(choiceText)
        }

        await audio.play()
      } else {
        // Fallback to browser TTS
        fallbackBrowserTTS(choiceText)
      }
    } catch (err) {
      console.error('TTS error for choice:', err)
      fallbackBrowserTTS(choiceText)
    } finally {
      setIsLoadingTTS(false)
    }
  }

  // Fallback browser TTS
  const fallbackBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = globalLanguage === 'en' ? 'en-US' : globalLanguage === 'es' ? 'es-ES' : 'ne-NP'
      utterance.rate = 0.9
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  // Start voice recording using MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        // Create blob and convert to base64
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })

        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result as string
          setAudioBase64(base64)

          // Transcribe using backend ElevenLabs
          setIsTranscribing(true)
          try {
            const result = await voiceApi.transcribe(base64, currentLang.apiCode)
            if (result) {
              setVoiceAnswer(result.transcription)
              setVoiceConfidence(result.confidence)
            }
          } catch (err) {
            console.error('Transcription error:', err)
            setVoiceAnswer('(Transcription failed - please try again)')
          } finally {
            setIsTranscribing(false)
          }
        }
        reader.readAsDataURL(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.current.start(100)
      setIsRecording(true)
      setVoiceAnswer('')
      setVoiceConfidence(null)
      setAudioBase64(null)
    } catch (err) {
      console.error('Recording error:', err)
      alert('Microphone access denied. Please allow microphone access.')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
    }
  }

  // Toggle recording
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Log interaction to backend (for multiple choice)
  const logInteraction = async (stepData: QuizStep, isCorrect: boolean) => {
    if (!learnerId) return

    const responseTimeMs = Date.now() - startTime

    try {
      await adaptiveApi.logInteraction({
        learner_id: learnerId,
        item_id: stepData.itemId,
        kc_id: stepData.kcId,
        session_id: sessionId,
        is_correct: isCorrect,
        response_value: { selected_choice: selectedOption },
        response_time_ms: responseTimeMs,
        hint_used: false,
        input_mode: 'click'
      })
    } catch (err) {
      console.error('Failed to log interaction:', err)
    }
  }

  // Submit voice answer to backend
  const submitVoiceAnswer = async (stepData: QuizStep): Promise<{ isCorrect: boolean; matchedChoice: number | null } | null> => {
    if (!learnerId || !audioBase64) {
      console.log('❌ Voice submission skipped:', { learnerId: !!learnerId, audioBase64: !!audioBase64 })
      return null
    }

    try {
      console.log('🎤 Submitting voice answer:', {
        transcription: voiceAnswer,
        itemId: stepData.itemId,
        kcId: stepData.kcId
      })

      const result = await voiceApi.submitVoiceAnswer({
        learner_id: learnerId,
        item_id: stepData.itemId,
        kc_id: stepData.kcId,
        session_id: sessionId,
        audio_base64: audioBase64,
        language_hint: currentLang.apiCode
      })

      console.log('✅ Voice result:', result)

      if (result) {
        return {
          isCorrect: result.is_correct,
          matchedChoice: result.matched_choice
        }
      }
    } catch (err) {
      console.error('❌ Voice submission error:', err)
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error || !lesson || steps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">{error || 'No questions available'}</p>
          <button
            onClick={() => navigate('/learn')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  const currentStepData = steps[currentStep]
  const progress = ((currentStep) / steps.length) * 100

  const handleCheck = async () => {
    if (status !== 'idle') {
      // Moving to next step
      if (currentStep < steps.length - 1) {
        if (showStreakMilestone) {
          setShowStreakMilestone(false)
          setHasShownStreak(true) // Mark that we've shown the streak
          setCurrentStep(currentStep + 1)
          setStatus('idle')
          setSelectedOption(null)
          setVoiceAnswer('')
          setAudioBase64(null)
          setStartTime(Date.now())
          return
        }

        // Only show streak milestone once (when streak hits 3 for the first time)
        if (status === 'correct' && streak === 3 && !hasShownStreak) {
          setShowStreakMilestone(true)
          return
        }

        setCurrentStep(currentStep + 1)
        setStatus('idle')
        setSelectedOption(null)
        setVoiceAnswer('')
        setAudioBase64(null)
        setStartTime(Date.now())
      } else {
        // Complete Lesson - Save progress to backend
        const accuracy = totalQuizQuestions > 0 ? correctAnswers / totalQuizQuestions : 1.0
        const timeSpentMinutes = Math.round((Date.now() - startTime) / 1000 / 60) || 1

        // Save lesson completion to backend
        if (lessonId && learnerId) {
          curriculumApi.completeLesson(lessonId, {
            learner_id: learnerId,
            xp_earned: 20,
            accuracy: accuracy,
            time_spent_minutes: timeSpentMinutes
          }).then(async (result) => {
            if (result && user) {
              // Store actual earned values from backend
              const actualGemsEarned = result.gems_earned || 5
              const actualXpEarned = result.xp_earned || 20
              setGemsEarned(actualGemsEarned)
              setXpEarned(actualXpEarned)
              
              // Update user data from backend response (includes XP and gems)
              setUser({
                ...user,
                totalXp: result.total_xp || user.totalXp,
                gems: result.gems || user.gems,
              })
              
              // Also sync hearts and refresh full stats from backend
              try {
                const [heartsData, stats] = await Promise.all([
                  learnerApi.getHearts(learnerId!),
                  learnerApi.getStats(learnerId!)
                ])
                
                if (heartsData && stats) {
                  // Use stats from getStats for most accurate data
                  setUser({
                    ...user,
                    totalXp: stats.total_xp || result.total_xp || user.totalXp,
                    gems: stats.gems || result.gems || user.gems,
                    hearts: heartsData.hearts,
                    streak: stats.streak_count || user.streak
                  })
                } else if (heartsData) {
                  setUser({
                    ...user,
                    totalXp: result.total_xp || user.totalXp,
                    gems: result.gems || user.gems,
                    hearts: heartsData.hearts
                  })
                }
              } catch (err) {
                console.error('Failed to sync user data:', err)
                // Fallback to using result data
                if (result) {
                  setUser({
                    ...user,
                    totalXp: result.total_xp || user.totalXp,
                    gems: result.gems || user.gems
                  })
                }
              }
            }
          }).catch((error) => {
            console.error('Failed to save lesson completion:', error)
            // Use default values if backend call fails
            setGemsEarned(5)
            setXpEarned(20)
          })
        } else {
          // Fallback if no lessonId or learnerId
          addXP(20)
          if (user) {
            setUser({ ...user, gems: user.gems + 5 })
          }
        }

        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        })

        setShowCelebration(true)
      }
      return
    }

    if (currentStepData.type === 'content') {
      setStatus('correct')
      return
    }

    if (currentStepData.type === 'quiz') {
      setTotalQuizQuestions(prev => prev + 1)

      let isCorrect = false

      // Check if we have a voice answer to submit
      if (audioBase64 && voiceAnswer) {
        // Submit voice answer to backend for semantic matching
        const voiceResult = await submitVoiceAnswer(currentStepData)

        if (voiceResult) {
          isCorrect = voiceResult.isCorrect
          if (voiceResult.matchedChoice !== null) {
            setSelectedOption(voiceResult.matchedChoice)
          }
        } else {
          // Voice submission failed, fall back to multiple choice if selected
          if (selectedOption !== null) {
            isCorrect = selectedOption === currentStepData.correct
            await logInteraction(currentStepData, isCorrect)
          } else {
            // No valid answer
            setStatus('wrong')
            setStreak(0)
            loseHeart()
            return
          }
        }
      } else if (selectedOption !== null) {
        // Regular multiple choice answer
        isCorrect = selectedOption === currentStepData.correct
        await logInteraction(currentStepData, isCorrect)
      } else {
        // No answer selected
        return
      }

      if (isCorrect) {
        setStatus('correct')
        setCorrectAnswers(prev => prev + 1)
        setStreak(prev => prev + 1)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
        audio.play().catch(() => { })
      } else {
        setStatus('wrong')
        setStreak(0)
        loseHeart()
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3')
        audio.play().catch(() => { })

        // Insert explanation step
        const explanationStep: ContentStep = {
          type: 'content',
          content: currentStepData.explanation
        }

        const newSteps = [...steps]
        newSteps.splice(currentStep + 1, 0, explanationStep)
        setSteps(newSteps)
      }
    }
  }

  const renderContent = (contentData: string | any, blockType?: string, title?: string) => {
    // If it's a string (old format or explanation), render as markdown
    if (typeof contentData === 'string') {
      return contentData.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-2">{line.replace('# ', '')}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mb-2 mt-2">{line.replace('## ', '')}</h2>
        if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>
      })
    }

    // Rich content block rendering
    const content = contentData

    // Render based on block type
    switch (blockType) {
      case 'concept':
        return (
          <div className="space-y-3">
            {title && <h3 className="text-lg font-bold text-gray-800 mb-2">📚 {title}</h3>}
            {content.text && <p className="text-gray-700 leading-relaxed">{content.text}</p>}
            {content.key_fact && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm font-semibold text-blue-900">💡 Key Fact</p>
                <p className="text-blue-800 mt-1">{content.key_fact}</p>
              </div>
            )}
            {content.image_url && <img src={content.image_url} alt={title} className="rounded-lg mt-3 max-w-full" />}
          </div>
        )

      case 'reference_table':
        return (
          <div className="space-y-3">
            {title && <h3 className="text-lg font-bold text-gray-800 mb-2">📊 {title}</h3>}
            {content.columns && content.rows && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      {content.columns.map((col: string, i: number) => (
                        <th key={i} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 text-sm">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.rows.map((row: string[], rowIdx: number) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell: string, cellIdx: number) => (
                          <td key={cellIdx} className="border border-gray-300 px-3 py-2 text-sm text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {content.note && (
              <p className="text-xs text-gray-500 italic mt-2">Note: {content.note}</p>
            )}
          </div>
        )

      case 'example':
        return (
          <div className="space-y-3">
            {title && <h3 className="text-lg font-bold text-gray-800 mb-2">💼 {title}</h3>}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              {content.text && <p className="text-gray-700 leading-relaxed">{content.text}</p>}
            </div>
          </div>
        )

      case 'tip':
        return (
          <div className="space-y-3">
            {title && <h3 className="text-lg font-bold text-gray-800 mb-2">💡 {title}</h3>}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              {content.text && <p className="text-gray-700 leading-relaxed">{content.text}</p>}
            </div>
          </div>
        )

      case 'warning':
        return (
          <div className="space-y-3">
            {title && <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ {title}</h3>}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              {content.text && <p className="text-gray-700 leading-relaxed font-medium">{content.text}</p>}
            </div>
          </div>
        )

      default:
        // Fallback for unknown types
        if (content.text) {
          return <p className="text-gray-700 leading-relaxed">{content.text}</p>
        }
        return <p className="text-gray-700 leading-relaxed">{JSON.stringify(content)}</p>
    }
  }

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
    // Navigate back to section page - it will automatically refresh lessons
    navigate(`/section/${lesson.domain}`, { replace: true })
  }

  // For content steps, always allow next (no check needed)
  // For quiz steps, require selection or voice answer when idle, or allow continue after check
  const canCheck = currentStepData.type === 'content'
    ? true  // Content steps can always proceed
    : status !== 'idle' ||  // After check, can continue
    selectedOption !== null ||  // Has selected option
    (voiceAnswer && audioBase64)  // Has voice answer

  return (
    <>
      <CelebrationOverlay
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        xpEarned={xpEarned}
        gemsEarned={gemsEarned}
        accuracy={totalQuizQuestions > 0 ? Math.round((correctAnswers / totalQuizQuestions) * 100) : 100}
        title="Lesson Complete!"
      />

      <div className="min-h-screen flex flex-col bg-white">
        {/* Top Bar */}
        <div className="px-6 py-8 flex items-center gap-6 max-w-5xl mx-auto w-full">
          <button onClick={() => navigate(`/section/${lesson.domain}`)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
            <motion.div
              className="bg-[#58cc02] h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <Heart className="w-7 h-7 fill-current" />
            {user?.hearts || 5}
          </div>
        </div>

        {/* Removed lesson title to fit content without scrolling */}

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-48">
          <AnimatePresence mode="wait">
            <motion.div
              key={showStreakMilestone ? 'streak' : currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {showStreakMilestone ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-8"
                  >
                    <img src="/streak-nice.gif" alt="Streak!" className="w-64 h-64 object-contain" />
                  </motion.div>
                  <h1 className="text-4xl font-black text-[#ffc840] mb-2">{streak} in a row!</h1>
                  <p className="text-xl font-bold text-gray-500">You're on fire! Keep going!</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
                    {currentStepData.type === 'content' ? 'Read and learn' : 'Select the correct answer'}
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Mascot */}
                    <div className="flex-shrink-0 self-center sm:self-end mb-2 sm:mb-0">
                      <img src="/man.gif" alt="Mascot" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                    </div>

                    {/* Speech Bubble */}
                    <div className="relative border-2 border-gray-200 rounded-2xl p-4 sm:p-6 flex-1 bg-white">
                      <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 sm:top-8 sm:left-[-14px] sm:translate-x-0 w-6 h-6 bg-white border-t-2 border-l-2 border-gray-200 transform rotate-45 sm:-rotate-45"></div>
                      {currentStepData.type === 'content' ? (
                        <div className="prose max-w-none text-base">
                          {renderContent(currentStepData.content || '', currentStepData.block_type, currentStepData.title)}
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-lg font-medium text-gray-700 flex-1">
                            {currentStepData.question}
                          </div>

                          {/* Voice Controls */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Language indicator (read-only - use global selector to change) */}
                            <div
                              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border-2 border-gray-200 bg-gray-50"
                              title={`Current language: ${currentLang.name}. Use the language selector in settings to change.`}
                            >
                              <img
                                src={currentLang.flag}
                                alt={currentLang.name}
                                className="w-6 h-4 rounded object-cover shadow-sm"
                              />
                              <span className="text-xs font-bold text-gray-600 hidden sm:inline">
                                {currentLang.nativeName}
                              </span>
                            </div>

                            {/* Speaker Button */}
                            <button
                              onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(currentStepData.question, currentStepData.itemId)}
                              disabled={isLoadingTTS}
                              className={`p-2.5 rounded-xl border-2 transition-all ${isSpeaking
                                ? 'bg-blue-100 border-blue-300 text-blue-600'
                                : isLoadingTTS
                                  ? 'bg-gray-100 border-gray-200 text-gray-400'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500'
                                }`}
                              title={isSpeaking ? 'Stop speaking' : `Listen in ${currentLang.name}`}
                            >
                              {isLoadingTTS ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quiz Options */}
                  {currentStepData.type === 'quiz' && (
                    <>
                      <div className="grid gap-3 w-full">
                        {currentStepData.options.map((option: string, index: number) => {
                          const isSelected = selectedOption === index;
                          return (
                            <button
                              key={index}
                              onClick={() => status === 'idle' && setSelectedOption(index)}
                              disabled={status !== 'idle'}
                              className={`
                                w-full p-3 rounded-xl border-2 border-b-4 text-base font-medium text-left transition-all flex items-center gap-3 group
                                ${isSelected
                                  ? 'bg-[#ddf4ff] border-[#84d8ff] text-[#1cb0f6]'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }
                                ${status !== 'idle' && index === currentStepData.correct ? '!bg-[#d7ffb8] !border-[#58cc02] !text-[#58cc02]' : ''}
                                ${status === 'wrong' && isSelected ? '!bg-[#ffdfe0] !border-[#ff4b4b] !text-[#ff4b4b]' : ''}
                              `}
                            >
                              <div className={`
                                w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0
                                ${isSelected
                                  ? 'border-[#1cb0f6] text-[#1cb0f6]'
                                  : 'border-gray-200 text-gray-400 group-hover:border-gray-300'
                                }
                                ${status !== 'idle' && index === currentStepData.correct ? '!border-[#58cc02] !text-[#58cc02]' : ''}
                                ${status === 'wrong' && isSelected ? '!border-[#ff4b4b] !text-[#ff4b4b]' : ''}
                              `}>
                                {index + 1}
                              </div>
                              <span className="flex-1">{option}</span>
                              {/* Speaker button for choice */}
                              {currentStepData.itemId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    speakChoice(currentStepData.itemId, index, option)
                                  }}
                                  disabled={isLoadingTTS || isSpeaking}
                                  className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isLoadingTTS || isSpeaking
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-500'
                                    }`}
                                  title={`Listen to option ${index + 1} in ${currentLang.name}`}
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Voice Answer Section */}
                      <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Mic className="w-5 h-5 text-gray-400" />
                            <span className="font-bold text-gray-600">Or speak your answer</span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg">
                              <img src={currentLang.flag} alt={currentLang.name} className="w-4 h-3 rounded object-cover" />
                              <span className="text-xs text-gray-500">{currentLang.nativeName}</span>
                            </div>
                          </div>
                          <button
                            onClick={toggleVoiceRecording}
                            disabled={status !== 'idle' || isTranscribing}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isRecording
                              ? 'bg-red-500 border-red-600 text-white'
                              : isTranscribing
                                ? 'bg-gray-300 border-gray-400 text-gray-500'
                                : 'bg-blue-500 border-blue-600 text-white hover:bg-blue-400 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400'
                              }`}
                          >
                            {isRecording ? (
                              <>
                                <MicOff className="w-4 h-4" />
                                STOP
                              </>
                            ) : isTranscribing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                TRANSCRIBING...
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4" />
                                RECORD
                              </>
                            )}
                          </button>
                        </div>

                        {/* Recording Indicator */}
                        {isRecording && (
                          <div className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl mb-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-600 font-medium">Recording in {currentLang.name}... Speak now!</span>
                          </div>
                        )}

                        {/* Voice Answer Display */}
                        {voiceAnswer && (
                          <div className="p-4 bg-white border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">Your spoken answer:</div>
                              {voiceConfidence !== null && (
                                <div className="text-xs text-gray-400">
                                  Confidence: {Math.round(voiceConfidence * 100)}%
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-medium text-gray-800">"{voiceAnswer}"</div>
                            <div className="text-xs text-green-600 mt-2 font-medium">
                              Click CHECK to submit your voice answer
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={`fixed bottom-0 left-0 right-0 border-t-2 p-4 transition-colors duration-300 ${status === 'correct' ? 'bg-[#d7ffb8] border-transparent' :
          status === 'wrong' ? 'bg-[#ffdfe0] border-transparent' : 'bg-white border-gray-200'
          }`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            {status === 'correct' && (
              <div className="flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="w-10 h-10 bg-[#58cc02] rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-6 h-6 text-white stroke-[4]" />
                </div>
                <div>
                  <div className="font-extrabold text-lg text-[#58cc02]">Nice!</div>
                  <button className="flex items-center gap-1 text-[#58cc02] font-bold text-xs hover:opacity-80">
                    <Flag className="w-3 h-3 fill-current" />
                    REPORT
                  </button>
                </div>
              </div>
            )}

            {status === 'wrong' && (
              <div className="flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="w-10 h-10 bg-[#ff4b4b] rounded-full flex items-center justify-center shadow-sm">
                  <X className="w-6 h-6 text-white stroke-[4]" />
                </div>
                <div>
                  <div className="font-extrabold text-lg text-[#ff4b4b]">Correct solution:</div>
                  {currentStepData.type === 'quiz' && (
                    <div className="text-[#ff4b4b] font-medium text-sm">{currentStepData.options[currentStepData.correct]}</div>
                  )}
                  <button className="flex items-center gap-1 text-[#ff4b4b] font-bold text-xs hover:opacity-80">
                    <Flag className="w-3 h-3 fill-current" />
                    REPORT
                  </button>
                </div>
              </div>
            )}

            {status === 'idle' && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                      setSelectedOption(null);
                      setVoiceAnswer('');
                      setAudioBase64(null);
                      setStartTime(Date.now());
                    } else {
                      navigate(`/section/${lesson.domain}`);
                    }
                  }}
                  className="hidden sm:flex items-center gap-2 text-gray-400 font-bold text-sm hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">
                  <Flag className="w-4 h-4" />
                  SKIP
                </button>
              </div>
            )}

            <button
              onClick={handleCheck}
              disabled={!canCheck}
              className={`
                ml-auto px-6 sm:px-10 py-3 rounded-xl font-extrabold text-base tracking-wide border-b-4 transition-all active:border-b-0 active:translate-y-1
                ${status === 'wrong'
                  ? 'bg-[#ff4b4b] text-white border-[#ea2b2b] hover:bg-[#ea2b2b]'
                  : status === 'correct'
                    ? 'bg-[#58cc02] text-white border-[#46a302] hover:bg-[#46a302]'
                    : 'bg-[#58cc02] text-white border-[#46a302] hover:bg-[#46a302] disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:active:border-b-4 disabled:active:translate-y-0'
                }
              `}
            >
              {currentStepData.type === 'content'
                ? 'NEXT'  // Content steps show "NEXT"
                : status === 'idle'
                  ? 'CHECK'  // Quiz steps show "CHECK" when idle
                  : 'CONTINUE'  // Quiz steps show "CONTINUE" after check
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
