import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Check, Flag } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { COMPREHENSIVE_COURSES } from '../data/courses'
import { useUserStore } from '../stores/userStore'
import confetti from 'canvas-confetti'

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
}

type Step = ContentStep | QuizStep;

export const LessonPage = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  // Store actions
  const { user, setUser, addXP, loseHeart } = useUserStore()

  const [steps, setSteps] = useState<Step[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  // Find course and module based on lessonId
  const moduleId = Number(lessonId)
  const course = COMPREHENSIVE_COURSES.find(c => c.modules.some(m => m.id === moduleId))
  const module = course?.modules.find(m => m.id === moduleId)

  useEffect(() => {
    if (!moduleId || !module) {
      navigate('/learn')
      return
    }
    if (module?.content.quiz) {
      // Initialize steps 
      setSteps(module.content.quiz.map(q => ({ type: 'quiz' as const, ...q })))
    } else {
      // Fallback or handle modules without quiz
    }
  }, [moduleId, navigate, module])

  if (!course || !module || steps.length === 0) return null

  const currentStepData = steps[currentStep]
  const progress = ((currentStep) / steps.length) * 100

  const handleCheck = () => {
    if (status !== 'idle') {
      // Moving to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        setStatus('idle')
        setSelectedOption(null)
      } else {
        // Complete Lesson
        // completeLesson(module.id) -> Mock logic
        addXP(20)

        // Add Gems manually
        if (user) {
          setUser({ ...user, gems: user.gems + 5 })
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })

        // Return to Section Page (not Course which is undefined route)
        navigate(`/section/${course.id}`)
      }
      return
    }

    if (currentStepData.type === 'content') {
      setStatus('correct')
      return
    }

    if (currentStepData.type === 'quiz') {
      if (selectedOption === currentStepData.correct) {
        setStatus('correct')
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
        audio.play().catch(() => { })
      } else {
        setStatus('wrong')
        loseHeart()
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3')
        audio.play().catch(() => { })

        // ADAPTIVE LEARNING LOGIC:
        // If wrong, insert a remedial content step
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="px-6 py-8 flex items-center gap-6 max-w-5xl mx-auto w-full">
        <button onClick={() => navigate(`/section/${course.id}`)} className="text-gray-400 hover:text-gray-600 transition-colors">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
              {currentStepData.type === 'content' ? 'Read and learn' : 'Select the correct answer'}
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Mascot */}
              <div className="flex-shrink-0 self-center sm:self-end mb-2 sm:mb-0">
                <img src="/man.gif" alt="Mascot" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
              </div>

              {/* Speech Bubble */}
              <div className="relative border-2 border-gray-200 rounded-2xl p-4 sm:p-6 flex-1 bg-white">
                <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 sm:top-8 sm:left-[-14px] sm:translate-x-0 w-6 h-6 bg-white border-t-2 border-l-2 border-gray-200 transform rotate-45 sm:-rotate-45"></div>
                {currentStepData.type === 'content' ? (
                  <div className="prose max-w-none text-base">
                    {renderContent(currentStepData.content || '')}
                  </div>
                ) : (
                  <div className="text-lg font-medium text-gray-700">
                    {currentStepData.question}
                  </div>
                )}
              </div>
            </div>

            {/* Quiz Options */}
            {currentStepData.type === 'quiz' && (
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
                  // Skip logic: pretend correct but no points? Or just next.
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                    setSelectedOption(null);
                  } else {
                    navigate(`/section/${course.id}`);
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
  )
}
