import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Check, Flag, Volume2, Mic, MicOff } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { curriculumApi, adaptiveApi, Question } from '../services/api'
import confetti from 'canvas-confetti'
import { CelebrationOverlay } from '../components/CelebrationOverlay'

interface StepBase {
  type: 'content' | 'quiz';
}

interface ContentStep extends StepBase {
  type: 'content';
  content: string;
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
  const { user, learnerId, setUser, addXP, loseHeart } = useUserStore()

  const [lesson, setLesson] = useState<LessonInfo | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Voice accessibility states
  const [isRecording, setIsRecording] = useState(false)
  const [voiceAnswer, setVoiceAnswer] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalQuizQuestions, setTotalQuizQuestions] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showStreakMilestone, setShowStreakMilestone] = useState(false)

  // Language configuration
  type LanguageCode = 'en' | 'hi' | 'ne'
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')

  const languages: Record<LanguageCode, { name: string; flag: string; speechCode: string; nativeName: string }> = {
    en: { name: 'English', nativeName: 'English', flag: 'https://flagcdn.com/w40/us.png', speechCode: 'en-US' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: 'https://flagcdn.com/w40/in.png', speechCode: 'hi-IN' },
    ne: { name: 'Nepali', nativeName: 'नेपाली', flag: 'https://flagcdn.com/w40/np.png', speechCode: 'ne-NP' }
  }

  const currentLang = languages[selectedLanguage]

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!lessonId) {
        navigate('/learn')
        return
      }

      try {
        setLoading(true)
        const response = await curriculumApi.getLessonQuestions(lessonId, learnerId || undefined)

        setLesson(response.lesson)

        // Convert database questions to steps
        const quizSteps: Step[] = response.questions.map((q: Question) => ({
          type: 'quiz' as const,
          question: q.content.stem,
          options: q.content.choices,
          correct: q.content.correct_answer,
          explanation: q.content.explanation,
          itemId: q.id,
          kcId: lessonId
        }))

        if (quizSteps.length === 0) {
          setError('No questions available for this lesson')
          return
        }

        setSteps(quizSteps)
        setSessionId(`session-${Date.now()}`)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch questions:', err)
        setError('Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [lessonId, learnerId, navigate])

  // Cycle through languages
  const cycleLanguage = () => {
    const langOrder: LanguageCode[] = ['en', 'hi', 'ne']
    const currentIndex = langOrder.indexOf(selectedLanguage)
    const nextIndex = (currentIndex + 1) % langOrder.length
    setSelectedLanguage(langOrder[nextIndex])
  }

  // Text-to-Speech: Read the question aloud in selected language
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = currentLang.speechCode
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  // Speech-to-Text: Record user's voice answer in selected language
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Please use Chrome.')
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = currentLang.speechCode

    recognition.onstart = () => {
      setIsRecording(true)
      setVoiceAnswer('')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceAnswer(transcript)
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }

  // Log interaction to backend
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
        // If we just finished showing a streak milestone, just move to next step
        if (showStreakMilestone) {
          setShowStreakMilestone(false)
          setCurrentStep(currentStep + 1)
          setStatus('idle')
          setSelectedOption(null)
          setStartTime(Date.now())
          return
        }

        // Check if we should show a streak milestone
        if (status === 'correct' && streak === 3) {
          setShowStreakMilestone(true)
          return
        }

        setCurrentStep(currentStep + 1)
        setStatus('idle')
        setSelectedOption(null)
        setStartTime(Date.now())
      } else {
        // Complete Lesson
        addXP(20)

        if (user) {
          setUser({ ...user, gems: user.gems + 5 })
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
      const isCorrect = selectedOption === currentStepData.correct

      // Log interaction to backend
      await logInteraction(currentStepData, isCorrect)

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

        // Insert a remedial content step
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

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-2">{line.replace('# ', '')}</h1>
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mb-2 mt-2">{line.replace('## ', '')}</h2>
      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>
      if (line.trim() === '') return <br key={i} />
      return <p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>
    })
  }

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
    navigate(`/section/${lesson.domain}`)
  }

  return (
    <>
      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        xpEarned={20}
        gemsEarned={5}
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

        {/* Lesson Title */}
        <div className="text-center mb-4 px-4">
          <h1 className="text-lg font-bold text-gray-600">{lesson.title}</h1>
          <p className="text-sm text-gray-400">Question {currentStep + 1} of {steps.length}</p>
        </div>

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
                      <img src="/man.gif" alt="Mascot" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
                    </div>

                    {/* Speech Bubble with Voice Button */}
                    <div className="relative border-2 border-gray-200 rounded-2xl p-4 sm:p-6 flex-1 bg-white">
                      <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 sm:top-8 sm:left-[-14px] sm:translate-x-0 w-6 h-6 bg-white border-t-2 border-l-2 border-gray-200 transform rotate-45 sm:-rotate-45"></div>
                      {currentStepData.type === 'content' ? (
                        <div className="prose max-w-none text-base">
                          {renderContent(currentStepData.content || '')}
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-lg font-medium text-gray-700 flex-1">
                            {currentStepData.question}
                          </div>

                          {/* Voice Controls: Flag + Speaker */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Language Flag Button */}
                            <button
                              onClick={cycleLanguage}
                              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all"
                              title={`Current: ${currentLang.name}. Click to change.`}
                            >
                              <img
                                src={currentLang.flag}
                                alt={currentLang.name}
                                className="w-6 h-4 rounded object-cover shadow-sm"
                              />
                              <span className="text-xs font-bold text-gray-600 hidden sm:inline">
                                {currentLang.nativeName}
                              </span>
                            </button>

                            {/* Speaker Button */}
                            <button
                              onClick={() => speakQuestion(currentStepData.question)}
                              className={`p-2.5 rounded-xl border-2 transition-all ${isSpeaking
                                ? 'bg-blue-100 border-blue-300 text-blue-600'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500'
                                }`}
                              title={`Listen in ${currentLang.name}`}
                            >
                              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
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
                              {option}
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
                            disabled={status !== 'idle'}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isRecording
                              ? 'bg-red-500 border-red-600 text-white'
                              : 'bg-blue-500 border-blue-600 text-white hover:bg-blue-400 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400'
                              }`}
                          >
                            {isRecording ? (
                              <>
                                <MicOff className="w-4 h-4" />
                                STOP
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
                            <span className="text-red-600 font-medium">Listening in {currentLang.name}... Speak now!</span>
                          </div>
                        )}

                        {/* Voice Answer Display */}
                        {voiceAnswer && (
                          <div className="p-4 bg-white border-2 border-blue-200 rounded-xl">
                            <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Your spoken answer:</div>
                            <div className="text-lg font-medium text-gray-800">"{voiceAnswer}"</div>
                            <div className="text-xs text-gray-400 mt-2">AI will analyze this answer when you click CHECK</div>
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
              disabled={status === 'idle' && currentStepData.type === 'quiz' && selectedOption === null}
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
              {status === 'idle' ? 'CHECK' : 'CONTINUE'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
