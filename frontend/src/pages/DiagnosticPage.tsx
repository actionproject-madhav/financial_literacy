import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ChevronRight, Brain, Target, Sparkles, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { diagnosticApi, DiagnosticItem, DiagnosticResult, DiagnosticResponse } from '../services/api'
import confetti from 'canvas-confetti'
import { Button, Card } from '../components/ui'
import { LottieAnimation } from '../components/LottieAnimation'

// Domain display names, colors, and Lottie animations
const DOMAIN_CONFIG: Record<string, { name: string; color: string; bgColor: string; lottieFile: string }> = {
  banking: { name: 'Banking', color: '#58CC02', bgColor: '#D7FFB8', lottieFile: 'banking.json' },
  credit: { name: 'Credit', color: '#1CB0F6', bgColor: '#DDF4FF', lottieFile: 'credit.json' },
  taxes: { name: 'Taxes', color: '#8549BA', bgColor: '#F3E5FF', lottieFile: 'taxes.json' },
  investing: { name: 'Investing', color: '#FF9600', bgColor: '#FFF0D5', lottieFile: 'investing.json' },
  budgeting: { name: 'Budgeting', color: '#FF4B4B', bgColor: '#FFDFE0', lottieFile: 'budgeting.json' },
  retirement: { name: 'Retirement', color: '#FFC800', bgColor: '#FFF4CC', lottieFile: 'retirement.json' },
  insurance: { name: 'Insurance', color: '#1899D6', bgColor: '#DDF4FF', lottieFile: 'insurance.json' },
  cryptocurrency: { name: 'Crypto', color: '#FF9600', bgColor: '#FFF0D5', lottieFile: 'crypto.json' },
}

type DiagnosticStep = 'intro' | 'quiz' | 'results'

export const DiagnosticPage = () => {
  const navigate = useNavigate()
  const { learnerId, setUser, user } = useUserStore()

  const [step, setStep] = useState<DiagnosticStep>('intro')
  const [testId, setTestId] = useState('')
  const [items, setItems] = useState<DiagnosticItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  // Start the diagnostic test
  const startTest = async () => {
    if (!learnerId) {
      navigate('/auth')
      return
    }

    setLoading(true)
    try {
      const response = await diagnosticApi.startTest(learnerId)
      setTestId(response.test_id)
      setItems(response.items)
      setResults([])
      setCurrentIndex(0)
      setStep('quiz')
      setStartTime(Date.now())
    } catch (error) {
      console.error('Failed to start diagnostic test:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle answer selection and move to next
  const handleCheck = async () => {
    if (status !== 'idle') {
      // Moving to next question
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedOption(null)
        setStatus('idle')
        setStartTime(Date.now())
      } else {
        // Complete the test
        await completeTest()
      }
      return
    }

    if (selectedOption === null) return

    const currentItem = items[currentIndex]
    const isCorrect = selectedOption === currentItem.content.correct_answer
    const responseTimeMs = Date.now() - startTime

    // Record result
    const result: DiagnosticResult = {
      item_id: currentItem.item_id,
      kc_id: currentItem.kc_id,
      kc_domain: currentItem.kc_domain,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
      selected_choice: selectedOption,
    }
    setResults(prev => [...prev, result])

    // Show feedback
    setStatus(isCorrect ? 'correct' : 'wrong')

    // Play sound
    const soundUrl = isCorrect
      ? 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
      : 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'
    const audio = new Audio(soundUrl)
    audio.play().catch(() => {})
  }

  // Complete the diagnostic test
  const completeTest = async () => {
    if (!learnerId) return

    setLoading(true)
    try {
      const response = await diagnosticApi.completeTest({
        learner_id: learnerId,
        test_id: testId,
        results: results,
      })

      setDiagnosticResults(response)
      setStep('results')

      // Celebration confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      })
    } catch (error) {
      console.error('Failed to complete diagnostic test:', error)
    } finally {
      setLoading(false)
    }
  }

  // Skip diagnostic and go to learn
  const skipDiagnostic = () => {
    navigate('/learn')
  }

  const currentItem = items[currentIndex]
  const progress = items.length > 0 ? ((currentIndex) / items.length) * 100 : 0
  const domainConfig = currentItem ? DOMAIN_CONFIG[currentItem.kc_domain] || { name: currentItem.kc_domain, color: '#737373', bgColor: '#F0F0F0', lottieFile: 'default.json' } : null

  // Render intro screen
  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: '#F0F0F0' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg text-center"
        >
          {/* Lottie animation for knowledge check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-32 h-32 bg-[#1CB0F6] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_6px_0_#1899D6] overflow-hidden"
          >
            <LottieAnimation
              src="chart.json"
              className="w-24 h-24"
              loop={true}
              autoplay={true}
              fallback={
                <Brain className="w-12 h-12 text-white" />
              }
            />
          </motion.div>

          <h1 className="text-[32px] font-bold text-[#4B4B4B] mb-3" style={{ lineHeight: '40px' }}>
            Quick Knowledge Check
          </h1>
          <p className="text-[17px] text-[#737373] mb-8" style={{ lineHeight: '24px' }}>
            Answer a few questions so we can personalize your learning path. This helps us identify your strengths and areas for growth.
          </p>

          {/* What to expect */}
          <Card variant="bordered" padding="md" className="mb-8 text-left">
            <h3 className="font-bold text-[15px] text-[#4B4B4B] mb-3">What to expect:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#DDF4FF] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottieAnimation
                    src="Target.json"
                    className="w-full h-full"
                    loop={true}
                    autoplay={true}
                    fallback={
                      <Target className="w-6 h-6 text-[#1CB0F6]" />
                    }
                  />
                </div>
                <span className="text-[14px] text-[#737373]">~12 quick questions across all topics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#D7FFB8] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottieAnimation
                    src="shield.json"
                    className="w-full h-full"
                    loop={true}
                    autoplay={true}
                    fallback={
                      <Check className="w-6 h-6 text-[#58CC02]" />
                    }
                  />
                </div>
                <span className="text-[14px] text-[#737373]">No penalty for wrong answers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F3E5FF] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottieAnimation
                    src="growth.json"
                    className="w-full h-full"
                    loop={true}
                    autoplay={true}
                    fallback={
                      <TrendingUp className="w-6 h-6 text-[#8549BA]" />
                    }
                  />
                </div>
                <span className="text-[14px] text-[#737373]">We'll customize your learning path</span>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={startTest}
            isLoading={loading}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Start Assessment
          </Button>

          <button
            onClick={skipDiagnostic}
            className="mt-4 text-[15px] font-bold text-[#AFAFAF] hover:text-[#737373] transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    )
  }

  // Render results screen
  if (step === 'results' && diagnosticResults) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: '#F0F0F0' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 bg-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_6px_0_#46A302]"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-[32px] font-bold text-[#4B4B4B] mb-2" style={{ lineHeight: '40px' }}>
              Assessment Complete!
            </h1>
            <p className="text-[17px] text-[#737373]">
              Score: {diagnosticResults.correct_count}/{diagnosticResults.total_items} ({Math.round(diagnosticResults.overall_score * 100)}%)
            </p>
          </div>

          {/* Domain Scores */}
          <Card variant="bordered" padding="md" className="mb-6">
            <h3 className="font-bold text-[15px] text-[#4B4B4B] mb-4">Your Results by Topic</h3>
            <div className="space-y-3">
              {Object.entries(diagnosticResults.domain_scores)
                .sort(([, a], [, b]) => a - b) // Sort by score ascending (weakest first)
                .map(([domain, score]) => {
                  const config = DOMAIN_CONFIG[domain] || { name: domain, color: '#737373', bgColor: '#F0F0F0', lottieFile: 'default.json' }
                  const percentage = Math.round(score * 100)
                  const isWeak = score <= 0.5
                  const isStrong = score >= 0.75

                  return (
                    <div key={domain} className="flex items-center gap-4">
                      {/* Lottie animation for domain icon - larger and more visible */}
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: config.bgColor }}>
                        <LottieAnimation
                          src={config.lottieFile}
                          className="w-full h-full"
                          loop={true}
                          autoplay={true}
                          fallback={
                            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: config.color }} />
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[14px] text-[#4B4B4B]">{config.name}</span>
                          <div className="flex items-center gap-2">
                            {isWeak && (
                              <span className="text-[11px] font-bold text-[#FF4B4B] bg-[#FFDFE0] px-2 py-0.5 rounded-full">
                                Focus Area
                              </span>
                            )}
                            {isStrong && (
                              <span className="text-[11px] font-bold text-[#58CC02] bg-[#D7FFB8] px-2 py-0.5 rounded-full">
                                Strong
                              </span>
                            )}
                            <span className="text-[13px] font-bold text-[#737373]">{percentage}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </Card>

          {/* Recommendations */}
          {diagnosticResults.recommendations.length > 0 && (
            <Card variant="elevated" padding="md" className="mb-6" style={{ backgroundColor: '#DDF4FF', border: '2px solid #1CB0F6' }}>
              <h3 className="font-bold text-[15px] text-[#1899D6] mb-3">Your Personalized Path</h3>
              <div className="space-y-2">
                {diagnosticResults.recommendations.map((rec, index) => {
                  const config = DOMAIN_CONFIG[rec.domain] || { name: rec.domain, color: '#737373', bgColor: '#F0F0F0', lottieFile: 'default.json' }
                  return (
                    <div key={rec.domain} className="flex items-start gap-2">
                      <span className="font-bold text-[#1CB0F6]">{index + 1}.</span>
                      <div>
                        <span className="font-bold text-[#4B4B4B]">{config.name}</span>
                        <span className="text-[#737373]"> - {rec.message}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={() => navigate('/learn')}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Start Learning
          </Button>
        </motion.div>
      </div>
    )
  }

  // Render quiz screen
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="px-6 py-8 flex items-center gap-6 max-w-5xl mx-auto w-full">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
              navigate('/learn')
            }
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
          <motion.div
            className="bg-[#1CB0F6] h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-[15px] font-bold text-[#737373]">
          {currentIndex + 1}/{items.length}
        </div>
      </div>

      {/* Domain Badge */}
      {domainConfig && (
        <div className="text-center mb-6 px-4">
          <div className="flex flex-col items-center gap-3">
            {/* Large Lottie animation - prominent above the badge */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: domainConfig.bgColor }}>
              <LottieAnimation
                src={domainConfig.lottieFile}
                className="w-full h-full"
                loop={true}
                autoplay={true}
                fallback={
                  <div className="w-16 h-16 rounded-full" style={{ backgroundColor: domainConfig.color, opacity: 0.3 }} />
                }
              />
            </div>
            {/* Domain name badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[15px]"
              style={{ backgroundColor: domainConfig.bgColor, color: domainConfig.color }}
            >
              {domainConfig.name}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
              Select the correct answer
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Mascot */}
              <div className="flex-shrink-0 self-center sm:self-end mb-2 sm:mb-0">
                <img src="/profile.svg" alt="Mascot" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
              </div>

              {/* Speech Bubble */}
              <div className="relative border-2 border-gray-200 rounded-2xl p-4 sm:p-6 flex-1 bg-white">
                <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 sm:top-8 sm:left-[-14px] sm:translate-x-0 w-6 h-6 bg-white border-t-2 border-l-2 border-gray-200 transform rotate-45 sm:-rotate-45"></div>
                <div className="text-lg font-medium text-gray-700">
                  {currentItem?.content.stem}
                </div>
              </div>
            </div>

            {/* Quiz Options */}
            {currentItem && (
              <div className="grid gap-3 w-full">
                {currentItem.content.choices.map((option: string, index: number) => {
                  const isSelected = selectedOption === index
                  const isCorrect = index === currentItem.content.correct_answer

                  return (
                    <button
                      key={index}
                      onClick={() => status === 'idle' && setSelectedOption(index)}
                      disabled={status !== 'idle'}
                      className={`
                        w-full p-3 rounded-xl border-2 border-b-4 text-base font-medium text-left transition-all flex items-center gap-3 group
                        ${isSelected && status === 'idle'
                          ? 'bg-[#ddf4ff] border-[#84d8ff] text-[#1cb0f6]'
                          : status === 'idle'
                            ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            : ''
                        }
                        ${status !== 'idle' && isCorrect ? '!bg-[#d7ffb8] !border-[#58cc02] !text-[#58cc02]' : ''}
                        ${status === 'wrong' && isSelected ? '!bg-[#ffdfe0] !border-[#ff4b4b] !text-[#ff4b4b]' : ''}
                      `}
                    >
                      <div className={`
                        w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0
                        ${isSelected && status === 'idle'
                          ? 'border-[#1cb0f6] text-[#1cb0f6]'
                          : status === 'idle'
                            ? 'border-gray-200 text-gray-400 group-hover:border-gray-300'
                            : ''
                        }
                        ${status !== 'idle' && isCorrect ? '!border-[#58cc02] !text-[#58cc02]' : ''}
                        ${status === 'wrong' && isSelected ? '!border-[#ff4b4b] !text-[#ff4b4b]' : ''}
                      `}>
                        {index + 1}
                      </div>
                      <span className="flex-1">{option}</span>
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
              <div className="font-extrabold text-lg text-[#58cc02]">Correct!</div>
            </div>
          )}

          {status === 'wrong' && currentItem && (
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="w-10 h-10 bg-[#ff4b4b] rounded-full flex items-center justify-center shadow-sm">
                <X className="w-6 h-6 text-white stroke-[4]" />
              </div>
              <div>
                <div className="font-extrabold text-lg text-[#ff4b4b]">Correct answer:</div>
                <div className="text-[#ff4b4b] font-medium text-sm">
                  {currentItem.content.choices[currentItem.content.correct_answer]}
                </div>
              </div>
            </div>
          )}

          {status === 'idle' && <div />}

          <button
            onClick={handleCheck}
            disabled={status === 'idle' && selectedOption === null}
            className={`
              px-8 py-3 rounded-xl font-bold text-base uppercase tracking-widest transition-all border-b-4
              ${status === 'idle' && selectedOption === null
                ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                : status === 'correct'
                  ? 'bg-[#58cc02] border-[#46a302] text-white hover:bg-[#61d800] active:border-b-0 active:translate-y-1'
                  : status === 'wrong'
                    ? 'bg-[#ff4b4b] border-[#ea2b2b] text-white hover:bg-[#ff5252] active:border-b-0 active:translate-y-1'
                    : 'bg-[#1cb0f6] border-[#1899d6] text-white hover:bg-[#14b8ff] active:border-b-0 active:translate-y-1'
              }
            `}
          >
            {status === 'idle' ? 'Check' : currentIndex === items.length - 1 ? 'See Results' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticPage
