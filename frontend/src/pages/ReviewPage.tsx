import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Target, Brain, AlertCircle, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { adaptiveApi } from '../services/api'
import { TranslatedText } from '../components/TranslatedText'

interface ReviewItem {
  item_id: string
  item_type: string
  content: {
    stem: string
    choices: string[]
    correct_answer: number
    explanation: string
  }
  kc_id: string
  kc_name: string
  domain: string
  review_reason: 'due_for_review' | 'past_mistake' | 'low_mastery'
  p_mastery: number
  last_seen_at: string | null
  times_wrong: number
}

interface QueueStats {
  due_reviews: number
  mistake_reviews: number
  low_mastery_reviews: number
  total: number
}

const REVIEW_REASON_CONFIG = {
  due_for_review: {
    label: 'Spaced Review',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    icon: Clock,
    description: 'Time to refresh your memory!'
  },
  past_mistake: {
    label: 'Past Mistake',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    icon: AlertCircle,
    description: 'You got this wrong before'
  },
  low_mastery: {
    label: 'Needs Practice',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    icon: Target,
    description: 'Build your confidence here'
  }
}

export const ReviewPage = () => {
  const { learnerId } = useUserStore()
  const navigate = useNavigate()

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)

  const startTime = useRef(Date.now())
  const sessionId = useRef(`review-${Date.now()}`)

  useEffect(() => {
    const fetchReviewQueue = async () => {
      if (!learnerId) {
        setError('Please log in to access reviews')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await adaptiveApi.getReviewQueue(learnerId, 10)
        setReviewItems(response.review_items)
        setQueueStats(response.queue_stats)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch review queue:', err)
        setError('Failed to load review questions')
      } finally {
        setLoading(false)
      }
    }

    fetchReviewQueue()
  }, [learnerId])

  const handleOptionSelect = (index: number) => {
    if (showResult) return
    setSelectedOption(index)
  }

  const handleSubmit = async () => {
    if (selectedOption === null) return

    const currentItem = reviewItems[currentIndex]
    const correct = selectedOption === currentItem.content.correct_answer

    setIsCorrect(correct)
    setShowResult(true)
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }))

    // Log interaction to adaptive system
    if (learnerId) {
      try {
        await adaptiveApi.logInteraction({
          learner_id: learnerId,
          item_id: currentItem.item_id,
          kc_id: currentItem.kc_id,
          session_id: sessionId.current,
          is_correct: correct,
          response_value: { selected_choice: selectedOption },
          response_time_ms: Date.now() - startTime.current,
          hint_used: false,
          input_mode: 'click'
        })
      } catch (err) {
        console.error('Failed to log interaction:', err)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowResult(false)
      startTime.current = Date.now()
    } else {
      setSessionComplete(true)
    }
  }

  const handleRestart = async () => {
    if (!learnerId) return

    try {
      setLoading(true)
      const response = await adaptiveApi.getReviewQueue(learnerId, 10)
      setReviewItems(response.review_items)
      setQueueStats(response.queue_stats)
      setCurrentIndex(0)
      setSelectedOption(null)
      setShowResult(false)
      setSessionStats({ correct: 0, total: 0 })
      setSessionComplete(false)
      sessionId.current = `review-${Date.now()}`
      startTime.current = Date.now()
    } catch (err) {
      console.error('Failed to reload reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading review queue...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
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

  if (reviewItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">All Caught Up!</h2>
          <p className="text-gray-500 mb-6">
            You have no reviews due right now. Keep learning and check back later!
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl border-b-4 border-green-600 hover:bg-green-400 active:border-b-0 active:translate-y-1 transition-all"
          >
            Continue Learning
          </button>
        </motion.div>
      </div>
    )
  }

  if (sessionComplete) {
    const accuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className={`w-24 h-24 ${accuracy >= 70 ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {accuracy >= 70 ? (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            ) : (
              <Brain className="w-12 h-12 text-orange-500" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Review Complete!</h2>
          <div className="text-5xl font-black text-gray-800 mb-2">{accuracy}%</div>
          <p className="text-gray-500 mb-2">
            {sessionStats.correct} of {sessionStats.total} correct
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {accuracy >= 80 ? 'Excellent memory retention!' :
             accuracy >= 60 ? 'Good progress, keep practicing!' :
             'These topics need more attention'}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="px-5 py-3 bg-blue-500 text-white font-bold rounded-xl border-b-4 border-blue-600 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Review More
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-5 py-3 bg-green-500 text-white font-bold rounded-xl border-b-4 border-green-600 hover:bg-green-400 active:border-b-0 active:translate-y-1 transition-all"
            >
              Continue Learning
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentItem = reviewItems[currentIndex]
  const reasonConfig = REVIEW_REASON_CONFIG[currentItem.review_reason]
  const ReasonIcon = reasonConfig.icon

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
          </button>

          {/* Progress */}
          <div className="flex-1 mx-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / reviewItems.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="text-sm font-bold text-gray-500">
            {currentIndex + 1}/{reviewItems.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Review Reason Badge */}
          <div className="flex justify-center mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${reasonConfig.bgColor}`}>
              <ReasonIcon className={`w-4 h-4 ${reasonConfig.color.replace('bg-', 'text-')}`} />
              <span className={`text-sm font-bold ${reasonConfig.color.replace('bg-', 'text-')}`}>
                {reasonConfig.label}
              </span>
            </div>
          </div>

          {/* Topic */}
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {currentItem.domain.replace('_', ' ')} · {currentItem.kc_name}
            </span>
            {currentItem.times_wrong > 0 && (
              <span className="ml-2 text-xs text-orange-500 font-bold">
                (missed {currentItem.times_wrong}x)
              </span>
            )}
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 text-center mb-8">
                <TranslatedText context="question">{currentItem.content.stem}</TranslatedText>
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentItem.content.choices.map((choice, index) => {
                  const isSelected = selectedOption === index
                  const isCorrectAnswer = index === currentItem.content.correct_answer

                  let optionStyle = 'bg-white border-gray-200 hover:border-blue-400'
                  if (showResult) {
                    if (isCorrectAnswer) {
                      optionStyle = 'bg-green-50 border-green-500'
                    } else if (isSelected && !isCorrectAnswer) {
                      optionStyle = 'bg-red-50 border-red-500'
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-blue-50 border-blue-500'
                  }

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${optionStyle}`}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                          showResult && isCorrectAnswer ? 'bg-green-500 border-green-500 text-white' :
                          showResult && isSelected && !isCorrectAnswer ? 'bg-red-500 border-red-500 text-white' :
                          isSelected ? 'bg-blue-500 border-blue-500 text-white' :
                          'border-gray-300 text-gray-500'
                        }`}>
                          {showResult && isCorrectAnswer ? <CheckCircle2 className="w-4 h-4" /> :
                           showResult && isSelected && !isCorrectAnswer ? <XCircle className="w-4 h-4" /> :
                           String.fromCharCode(65 + index)}
                        </div>
                        <span className={`font-medium ${
                          showResult && isCorrectAnswer ? 'text-green-700' :
                          showResult && isSelected && !isCorrectAnswer ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          <TranslatedText context="answer choice">{choice}</TranslatedText>
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Explanation */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                        {isCorrect ? 'Great job!' : 'Not quite right'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        <TranslatedText context="explanation">{currentItem.content.explanation}</TranslatedText>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className={`w-full py-4 rounded-xl font-bold text-lg border-b-4 transition-all ${
                selectedOption !== null
                  ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-400 active:border-b-0 active:translate-y-1'
                  : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              CHECK ANSWER
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`w-full py-4 rounded-xl font-bold text-lg border-b-4 transition-all ${
                isCorrect
                  ? 'bg-green-500 text-white border-green-600 hover:bg-green-400'
                  : 'bg-orange-500 text-white border-orange-600 hover:bg-orange-400'
              } active:border-b-0 active:translate-y-1`}
            >
              {currentIndex < reviewItems.length - 1 ? 'NEXT QUESTION' : 'FINISH REVIEW'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Sidebar (visible on larger screens) */}
      {queueStats && (
        <div className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 bg-white border-2 border-gray-200 rounded-2xl p-4 w-48">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Review Stats
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Due Reviews</span>
              <span className="font-bold text-blue-600">{queueStats.due_reviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Past Mistakes</span>
              <span className="font-bold text-orange-600">{queueStats.mistake_reviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Low Mastery</span>
              <span className="font-bold text-purple-600">{queueStats.low_mastery_reviews}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="text-gray-700 font-medium">Session</span>
              <span className="font-bold text-green-600">
                {sessionStats.correct}/{sessionStats.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
