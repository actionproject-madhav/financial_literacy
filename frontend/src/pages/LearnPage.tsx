import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Lock, ArrowLeft, TrendingUp, CheckCircle2, Circle, Target, Sparkles, RotateCcw, Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { curriculumApi, adaptiveApi, Course } from '../services/api'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../contexts/LanguageContext'
import { TranslatedText } from '../components/TranslatedText'

// Avatar mapping for sections - using human avatars
const SECTION_AVATARS: Record<string, string> = {
    'banking': 'https://api.dicebear.com/7.x/avataaars/svg?seed=banking&backgroundColor=b6e3f4',
    'credit': 'https://api.dicebear.com/7.x/avataaars/svg?seed=credit&backgroundColor=c0aede',
    'taxes': 'https://api.dicebear.com/7.x/avataaars/svg?seed=taxes&backgroundColor=ffd5dc',
    'investing': 'https://api.dicebear.com/7.x/avataaars/svg?seed=investing&backgroundColor=ffdfbf',
    'immigration_finance': 'https://api.dicebear.com/7.x/avataaars/svg?seed=immigration&backgroundColor=d1d4f9',
    'budgeting': 'https://api.dicebear.com/7.x/avataaars/svg?seed=budgeting&backgroundColor=c5e1a5',
    'retirement': 'https://api.dicebear.com/7.x/avataaars/svg?seed=retirement&backgroundColor=ffecb3',
    'insurance': 'https://api.dicebear.com/7.x/avataaars/svg?seed=insurance&backgroundColor=b2dfdb',
    'consumer_protection': 'https://api.dicebear.com/7.x/avataaars/svg?seed=protection&backgroundColor=f8bbd0',
    'major_purchases': 'https://api.dicebear.com/7.x/avataaars/svg?seed=purchases&backgroundColor=e1bee7',
    'cryptocurrency': 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto&backgroundColor=ffe0b2',
    'financial_planning': 'https://api.dicebear.com/7.x/avataaars/svg?seed=planning&backgroundColor=c5cae9',
}

// Extended Course type with personalization fields
interface PersonalizedCourse extends Course {
    priority_score?: number;
    recommendation_type?: 'priority' | 'suggested' | 'optional' | 'mastered';
    recommendation_reason?: string;
    blur_level?: number;
}

// Personalization summary from API
interface PersonalizationSummary {
    is_us_resident?: boolean;
    is_advanced_user?: boolean;
    goal_domains?: string[];
    diagnostic_completed?: boolean;
    experience_level?: string;
    visa_type?: string;
    country?: string;
}

export const LearnPage = () => {
    const { user, learnerId } = useUserStore()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [courses, setCourses] = useState<PersonalizedCourse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [personalization, setPersonalization] = useState<PersonalizationSummary | null>(null)
    const [reviewStats, setReviewStats] = useState<{ due: number; mistakes: number; total: number } | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch courses with personalization data from API
                const response = await curriculumApi.getCourses(learnerId || undefined)

                // Courses are already sorted by priority from the API
                setCourses(response.courses)

                // Store personalization summary if available
                if (response.personalization) {
                    setPersonalization(response.personalization)
                }

                // Fetch review queue stats
                if (learnerId) {
                    try {
                        const reviewResponse = await adaptiveApi.getReviewQueue(learnerId, 10)
                        setReviewStats({
                            due: reviewResponse.queue_stats.due_reviews,
                            mistakes: reviewResponse.queue_stats.mistake_reviews,
                            total: reviewResponse.queue_stats.total
                        })
                    } catch {
                        // Silently fail - review stats are optional
                    }
                }

                setError(null)
            } catch (err) {
                console.error('Failed to fetch courses:', err)
                setError('Failed to load courses')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [learnerId])

    if (!user) return null

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">{t('common.loading')}</p>
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
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-white">
            {/* Back Header - Sticky */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 xl:pr-96">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:bg-gray-100 rounded-full transition-colors" strokeWidth={3} />
                    <span className="font-bold uppercase tracking-widest text-sm">{t('common.back')}</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex justify-center xl:pr-96">
                <div className="w-full max-w-[720px] py-8 px-5">
                    {/* Daily AI Insight Banner */}
                    <div className="mb-8">
                        <div className="bg-[#ddf4ff] border-2 border-[#ddf4ff] rounded-2xl p-0.5 relative overflow-hidden group hover:bg-[#cbeaff] transition-colors">
                            <div className="p-5 flex items-start gap-4">
                                <div className="p-2 rounded-xl">
                                    <img src="/fire.svg" alt="Fire" className="w-8 h-8 object-contain" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-extrabold text-orange-500 uppercase tracking-widest">
                                            AI Insight of the Day
                                        </span>
                                    </div>
                                    <h3 className="text-gray-800 font-extrabold text-lg mb-1">Credit Score Boost</h3>
                                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                        Paying your rent online can now boost your credit score. Experian Boost averages a 13pt increase for new users.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {courses.map((course, index) => {
                            const isUnlocked = course.unlocked
                            const progress = course.progress * 100

                            // Use personalization data from API
                            const isPriority = course.recommendation_type === 'priority'
                            const isStrong = course.recommendation_type === 'mastered' || course.recommendation_type === 'optional'
                            const blurLevel = course.blur_level || 0
                            const reason = course.recommendation_reason || ''

                            return (
                                <div
                                    key={course.id}
                                    className={`rounded-2xl p-0 relative overflow-hidden border-2 transition-all hover:translate-y-[-2px] ${isPriority
                                        ? 'bg-[#DDF4FF] border-[#1CB0F6] shadow-[0_0_20px_rgba(28,176,246,0.3)]'
                                        : isUnlocked
                                            ? 'bg-[#dcfce7] border-[#dcfce7]'
                                            : 'bg-white border-gray-200'
                                        }`}
                                    style={{ opacity: blurLevel > 0 ? 1 - (blurLevel * 0.4) : 1 }}
                                >
                                    {/* Priority/Strong badges */}
                                    {isPriority && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="flex items-center gap-1.5 bg-[#1CB0F6] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                                                <Target className="w-3.5 h-3.5" />
                                                Recommended
                                            </div>
                                        </div>
                                    )}
                                    {isStrong && !isPriority && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="flex items-center gap-1.5 bg-[#58CC02] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                {course.recommendation_type === 'mastered' ? 'Mastered' : 'Strong'}
                                            </div>
                                        </div>
                                    )}

                                    <div className={`p-4 pb-2 border-b-0 ${isPriority ? 'bg-[#DDF4FF]' : isUnlocked ? 'bg-[#dcfce7]' : 'bg-white'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-extrabold tracking-widest uppercase ${isPriority ? 'text-[#1899D6]' : isUnlocked ? 'text-green-600' : 'text-cyan-500'}`}>
                                                    {t('learn.section')} {index + 1} · {course.lessons_count} {t('learn.lessons')}
                                                    {reason && (
                                                        <span className="ml-2 text-gray-400 normal-case font-bold">· {reason}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none mb-2">
                                                <TranslatedText context="course title">{course.title}</TranslatedText>
                                            </h3>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-2">
                                            <TranslatedText context="course description">{course.description}</TranslatedText>
                                        </p>
                                    </div>

                                    <div className={`px-4 pb-6 flex justify-between items-end relative z-10 ${isPriority ? 'bg-[#DDF4FF]' : ''}`}>
                                        <div className="flex-1 max-w-[60%] space-y-4">
                                            {isUnlocked ? (
                                                <>
                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="flex-1 h-4 bg-white rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${isPriority ? 'bg-[#1CB0F6]' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.max(progress, 5)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-sm font-bold ${isPriority ? 'text-[#1899D6]' : 'text-green-600'}`}>{Math.round(progress)}%</span>
                                                        <img src="/trophy.svg" alt="Trophy" className="w-12 h-12 drop-shadow-sm" />
                                                    </div>

                                                    <button
                                                        onClick={() => navigate(`/section/${course.id}`)}
                                                        className={`w-full py-3.5 text-white font-bold text-sm rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-sm ${isPriority
                                                            ? 'bg-[#1CB0F6] border-[#1899D6] hover:bg-[#14B8FF] hover:border-[#1899D6]'
                                                            : 'bg-green-500 border-green-600 hover:bg-green-400 hover:border-green-500'
                                                            }`}
                                                    >
                                                        {isPriority ? 'Start Now' : progress > 0 ? t('common.continue') : t('common.start')}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-gray-400 font-bold bg-gray-100 px-4 py-3 rounded-xl mb-4 w-fit border-2 border-gray-100">
                                                        <Lock className="w-5 h-5" />
                                                        <span className="tracking-widest text-xs">{t('learn.locked').toUpperCase()}</span>
                                                    </div>
                                                    <button disabled className="w-full py-3.5 bg-gray-200 text-gray-400 font-bold text-sm rounded-xl border-b-4 border-gray-300 cursor-not-allowed uppercase tracking-widest">
                                                        {t('learn.complete_previous')}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Mascot Area */}
                                        <div className="flex flex-col items-center justify-end w-32 md:w-40 relative -mb-2">
                                            {/* Speech Bubble */}
                                            {isUnlocked && (isPriority || index === 0) && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className="absolute -top-16 -left-4 z-20"
                                                >
                                                    <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${isPriority
                                                        ? 'bg-[#1CB0F6] border-2 border-[#1899D6]'
                                                        : 'bg-white border-2 border-gray-200'
                                                        }`}>
                                                        <p className={`text-sm font-bold whitespace-nowrap ${isPriority ? 'text-white' : 'text-gray-700'}`}>
                                                            {isPriority ? 'Focus here!' : t('learn.lets_go')}
                                                        </p>
                                                        <div className={`absolute -bottom-[9px] right-6 w-4 h-4 border-r-2 border-b-2 transform rotate-45 ${isPriority
                                                            ? 'bg-[#1CB0F6] border-[#1899D6]'
                                                            : 'bg-white border-gray-200'
                                                            }`}></div>
                                                        <div className={`absolute -bottom-[2px] right-6 w-4 h-2 ${isPriority ? 'bg-[#1CB0F6]' : 'bg-white'}`}></div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {!isUnlocked && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute -top-16 -left-8 z-20"
                                                >
                                                    <div className="relative bg-white border-2 border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
                                                        <p className="text-xs font-bold text-gray-500 whitespace-nowrap">Complete Section {index}</p>
                                                        <div className="absolute -bottom-[9px] right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-gray-200 transform rotate-45"></div>
                                                        <div className="absolute -bottom-[2px] right-6 w-4 h-2 bg-white transform"></div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            <img
                                                src={SECTION_AVATARS[course.id] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.id}&backgroundColor=e0e0e0`}
                                                alt={course.title}
                                                className={`w-28 h-28 md:w-32 md:h-32 object-contain ${!isUnlocked && 'grayscale opacity-60'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Fixed Position */}
            <div className="hidden xl:flex fixed right-0 top-0 w-96 h-screen flex-col border-l-2 border-gray-200 bg-white overflow-y-auto z-40">
                <div className="p-8 space-y-8">
                    {/* Language Selector - Full Width */}
                    <div className="flex justify-end">
                        <LanguageSelector />
                    </div>
                    
                    {/* Stats Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/fire.svg" alt="Streak" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-gray-500">{user.streak}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/coin.svg" alt="Coins" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-gray-500">{user.gems}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                            <span className="font-bold text-gray-400 hover:text-red-500 transition-colors">{user.hearts}</span>
                        </div>
                    </div>

                    {/* Widgets */}
                    <div className="space-y-6">

                        {/* AI Financial Coach Widget */}
                        <div className="border-2 border-[#e5f7d3] rounded-2xl p-0 overflow-hidden bg-[#e5f7d3] hover:bg-[#d4f0b8] transition-colors cursor-pointer group shadow-sm">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
                                        <img src="/profile.svg" alt="Coach" className="w-6 h-6 object-contain" />
                                        FinAI Coach
                                    </h3>
                                    <div className="px-2 py-1 bg-[#58cc02] rounded-lg text-[10px] font-bold text-white uppercase tracking-wide">
                                        BETA
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">
                                    Confused about taxes or 401(k)? Get tailored advice for your situation.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const event = new CustomEvent('openCoach');
                                            window.dispatchEvent(event);
                                        }}
                                        className="flex-1 py-2 px-3 bg-white border-2 border-gray-200 rounded-xl text-[#58cc02] text-xs font-bold uppercase tracking-wide hover:border-[#58cc02] transition-colors text-center"
                                    >
                                        Ask Question
                                    </button>
                                    <button
                                        onClick={() => {
                                            const event = new CustomEvent('openCoach');
                                            window.dispatchEvent(event);
                                        }}
                                        className="flex-1 py-2 px-3 bg-[#58cc02] border-b-4 border-[#46a302] rounded-xl text-white text-xs font-bold uppercase tracking-wide hover:bg-[#46a302] active:border-b-0 active:translate-y-0.5 transition-all text-center"
                                    >
                                        Start Chat
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Immigrant Journey Tracker - Only show for non-citizens */}
                        {personalization && personalization.visa_type &&
                         !['CITIZEN', 'GREEN_CARD'].includes(personalization.visa_type) && (
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">My American Journey</h3>
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />
                                    <span className="text-sm font-bold text-gray-400 line-through">Visa Approved</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />
                                    <span className="text-sm font-bold text-gray-400 line-through">SSN Obtained</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-50">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Open Bank Account</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Circle className="w-5 h-5 text-gray-300" />
                                    <span className="text-sm font-bold text-gray-400">Build Credit Score</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t-2 border-gray-100">
                                <button className="w-full text-center text-gray-400 text-xs font-extrabold uppercase tracking-widest hover:text-gray-600">
                                    View Full Roadmap
                                </button>
                            </div>
                        </div>
                        )}

                        {/* Due Reviews Widget */}
                        {reviewStats && reviewStats.total > 0 && (
                            <div className="border-2 border-[#DDF4FF] rounded-2xl p-0 overflow-hidden bg-[#F0F9FF] hover:bg-[#DDF4FF] transition-colors cursor-pointer group shadow-sm" onClick={() => navigate('/review')}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
                                            <RotateCcw className="w-5 h-5 text-[#1CB0F6]" />
                                            Review Time
                                        </h3>
                                        <div className="px-2 py-1 bg-[#1CB0F6] rounded-lg text-[10px] font-bold text-white uppercase tracking-wide">
                                            {reviewStats.total} DUE
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed mb-3">
                                        {reviewStats.due > 0 && `${reviewStats.due} spaced reviews`}
                                        {reviewStats.due > 0 && reviewStats.mistakes > 0 && ' + '}
                                        {reviewStats.mistakes > 0 && `${reviewStats.mistakes} past mistakes`}
                                        {reviewStats.due === 0 && reviewStats.mistakes === 0 && 'Practice your weak areas'}
                                    </p>
                                    <button
                                        className="w-full py-2.5 px-3 bg-[#1CB0F6] border-b-4 border-[#1899D6] rounded-xl text-white text-xs font-bold uppercase tracking-wide hover:bg-[#47C1FF] active:border-b-0 active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Start Review
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Try Super */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 leading-tight">Try Super for free</h3>
                                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg uppercase tracking-wide">NEW</div>
                                </div>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">No ads, personalized practice, and unlimited Legendary!</p>
                                <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl border-b-4 border-blue-600 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm shadow-sm">
                                    TRY 1 WEEK FREE
                                </button>
                            </div>
                        </div>

                        {/* League */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Gold League</h3>
                                <button onClick={() => navigate('/leaderboard')} className="text-cyan-500 font-bold text-xs uppercase tracking-widest hover:text-cyan-400">VIEW LEAGUE</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/trophy.svg" alt="Trophy" className="w-12 h-12 object-contain" />
                                <p className="text-gray-400 text-sm font-medium">Complete a lesson to join this week's leaderboard</p>
                            </div>
                        </div>

                        {/* Daily Quests */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Daily Quests</h3>
                                <button onClick={() => navigate('/quests')} className="text-cyan-500 font-bold text-xs uppercase tracking-widest hover:text-cyan-400">VIEW ALL</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/fire.svg" alt="Fire" className="w-10 h-10 object-contain" />
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm font-bold mb-1">
                                        <span className="text-gray-700">Earn 50 XP</span>
                                        <span className="text-gray-400">35 / 50</span>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full shadow-inner" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
