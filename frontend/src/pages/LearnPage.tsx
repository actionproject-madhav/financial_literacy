import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Lock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { curriculumApi, adaptiveApi, Course } from '../services/api'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../contexts/LanguageContext'
import { TranslatedText } from '../components/TranslatedText'
import { HeartsDisplay } from '../components/gamification/HeartsDisplay'
import { useHeartRecharge } from '../hooks/useHeartRecharge'

// Extended Course type with personalization fields
interface PersonalizedCourse extends Course {
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
    const { hearts, countdown } = useHeartRecharge()
    const [courses, setCourses] = useState<PersonalizedCourse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [personalization, setPersonalization] = useState<PersonalizationSummary | null>(null)
    const [reviewStats, setReviewStats] = useState<{ due: number; mistakes: number; total: number } | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Only use learnerId if it's a valid MongoDB ObjectId (24-char hex string)
                const isValidObjectId = learnerId && /^[a-fA-F0-9]{24}$/.test(learnerId)

                // Fetch courses with personalization data from API
                const response = await curriculumApi.getCourses(isValidObjectId ? learnerId : undefined)

                // Courses are already sorted by priority from the API
                setCourses(response.courses)

                // Store personalization summary if available
                if (response.personalization) {
                    setPersonalization(response.personalization)
                }

                // Fetch review queue stats (only for valid logged-in users)
                if (isValidObjectId) {
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
                                        Paying your rent online can now boost your credit score. Experian Boost™ averages a 13pt increase for new users.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {courses.map((course, index) => {
                            const isUnlocked = course.unlocked
                            const progress = course.progress * 100

                            // Color palette for each course (bg, border, button, button-border, label)
                            const courseColors = [
                                { bg: '#FFF9E6', border: '#FFE082', btn: '#FFB300', btnBorder: '#FF8F00', label: '#FF8F00' }, // Section 1: Banking - YELLOW
                                { bg: '#E3F2FD', border: '#BBDEFB', btn: '#2196F3', btnBorder: '#1565C0', label: '#1565C0' }, // Section 2: Credit - Blue
                                { bg: '#F3E5F5', border: '#E1BEE7', btn: '#9C27B0', btnBorder: '#6A1B9A', label: '#7B1FA2' }, // Section 3: Tax - Purple
                                { bg: '#FFF9E6', border: '#FFE082', btn: '#FFB300', btnBorder: '#FF8F00', label: '#FF8F00' }, // Section 4: Investing - YELLOW
                                { bg: '#E3F2FD', border: '#BBDEFB', btn: '#2196F3', btnBorder: '#1565C0', label: '#1565C0' }, // Section 5: Crypto - Blue
                                { bg: '#E8F5E9', border: '#C8E6C9', btn: '#4CAF50', btnBorder: '#2E7D32', label: '#2E7D32' }, // Section 6: Cryptocurrency - Green
                                { bg: '#FFF3E0', border: '#FFCC80', btn: '#FF9800', btnBorder: '#E65100', label: '#E65100' }, // Section 7: Money-Management - ORANGE
                                { bg: '#E0F7FA', border: '#B2EBF2', btn: '#00BCD4', btnBorder: '#00838F', label: '#00838F' }, // Section 8: Teal
                            ]
                            const colors = courseColors[index % 8]

                            return (
                                <div
                                    key={course.id}
                                    className="rounded-2xl relative overflow-hidden transition-all hover:translate-y-[-2px]"
                                    style={{
                                        backgroundColor: isUnlocked ? colors.bg : '#f9fafb',
                                        border: `2px solid ${isUnlocked ? colors.bg : '#e5e7eb'}`
                                    }}
                                >
                                    {/* Card Content */}
                                    <div className="p-6 pb-4">
                                        <div className="flex">
                                            {/* Left Content */}
                                            <div className="flex-1 pr-4">
                                                {/* Section Label */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span
                                                        className="text-xs font-extrabold tracking-widest uppercase"
                                                        style={{ color: isUnlocked ? colors.label : '#9ca3af' }}
                                                    >
                                                        {t('learn.section')} {index + 1} · {course.lessons_count} {t('learn.lessons')}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight leading-tight mb-1">
                                                    <TranslatedText context="course title">{course.title}</TranslatedText>
                                                </h3>

                                                {/* Subtitle */}
                                                <p className="text-gray-700 text-sm mb-4">
                                                    <TranslatedText context="course description">{`${course.description.split('.')[0]}.`}</TranslatedText>
                                                </p>

                                                {isUnlocked && (
                                                    /* Progress Bar - Directly below subtitle */
                                                    <div className="flex items-center mb-6">
                                                        <div className="flex-1 h-4 bg-white rounded-full overflow-hidden shadow-inner relative">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.max(progress, 5)}%`,
                                                                    backgroundColor: colors.btn
                                                                }}
                                                            />
                                                        </div>
                                                        {/* Trophy attached directly to progress bar end */}
                                                        <img src="/trophy.svg" alt="Trophy" className="w-10 h-10 -ml-1" />
                                                    </div>
                                                )}

                                                {/* Button in middle */}
                                                {isUnlocked ? (
                                                    <button
                                                        onClick={() => navigate(`/section/${course.id}`)}
                                                        className="w-full max-w-[320px] py-3.5 text-white font-bold text-sm rounded-xl border-b-4 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-sm"
                                                        style={{
                                                            backgroundColor: colors.btn,
                                                            borderBottomColor: colors.btnBorder
                                                        }}
                                                    >
                                                        {progress > 0 ? t('common.continue') : t('common.start')}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 text-gray-400 font-bold bg-gray-100 px-4 py-3 rounded-xl w-fit border-2 border-gray-100 mb-4">
                                                            <Lock className="w-5 h-5" />
                                                            <span className="tracking-widest text-xs">{t('learn.locked').toUpperCase()}</span>
                                                        </div>
                                                        <button disabled className="w-full max-w-[320px] py-3.5 bg-gray-200 text-gray-400 font-bold text-sm rounded-xl border-b-4 border-gray-300 cursor-not-allowed uppercase tracking-widest">
                                                            {t('learn.complete_previous')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Mascot Area - Right side */}
                                            <div className="flex flex-col items-center justify-center relative">
                                                {/* Speech Bubble */}
                                                {isUnlocked && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        className="absolute top-0 z-20"
                                                    >
                                                        <div className="relative bg-white border-2 border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
                                                            <p className="text-sm font-bold text-gray-700 whitespace-nowrap">
                                                                {[
                                                                    "Let's go!",
                                                                    "You got this!",
                                                                    "Level up!",
                                                                    "Keep going!",
                                                                    "Almost there!",
                                                                    "Nice work!",
                                                                    "Awesome!",
                                                                    "You rock!"
                                                                ][index % 8]}
                                                            </p>
                                                            <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-gray-200 transform rotate-45"></div>
                                                            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-2 bg-white"></div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                <img
                                                    src={`/3d-models/monster-${(index % 7) + 1}.png`}
                                                    alt={course.title}
                                                    className={`course-mascot mt-8 ${!isUnlocked && 'grayscale opacity-60'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Fixed Position */}
            <div className="hidden xl:flex fixed right-0 top-0 w-96 h-screen flex-col border-l-2 border-gray-200 bg-white z-40">
                {/* Fixed Stats Header - Outside Overflow */}
                <div className="p-8 pb-4 border-b border-gray-100 bg-white z-50">
                    <div className="flex items-center justify-between">
                        <LanguageSelector compact />
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/fire.svg" alt="Streak" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-orange-500">{user.streak || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/coin.svg" alt="Coins" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-yellow-500">{user.gems || 0}</span>
                        </div>
                        <div className="cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <HeartsDisplay hearts={hearts} countdown={countdown} size="sm" />
                        </div>
                    </div>
                </div>

                {/* Scrollable Widgets Area */}
                <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 no-scrollbar">

                    {/* FinAI Coach Widget - Modern AI Chatbot Design */}
                    <div className="rounded-2xl overflow-hidden bg-white border-2 border-gray-100 shadow-sm">
                        {/* Header with greeting and mascot */}
                        <div className="p-4 pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500">Try Premium</span>
                                        <span className="text-yellow-400">⚡</span>
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-gray-800">
                                        Hi, {user.name?.split(' ')[0] || 'Friend'}!
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">Your AI Financial Guide!</p>
                                </div>
                                <img
                                    src="/3d-models/monster-1.png"
                                    alt="FinAI Mascot"
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                        </div>

                        {/* Quick Suggestions Label */}
                        <div className="px-4 mb-2">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quick Questions</span>
                        </div>

                        {/* Suggestion Cards */}
                        <div className="px-4 pb-3">
                            <div className="grid grid-cols-2 gap-2">
                                {/* Card 1 - Light Green */}
                                <div
                                    className="bg-[#E8F5E9] rounded-xl p-3 cursor-pointer hover:brightness-95 transition-all"
                                    onClick={() => {
                                        const event = new CustomEvent('openCoach', { detail: { message: 'How do I start building credit?' } });
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    <div className="w-6 h-6 mb-2 flex items-center justify-center bg-white/50 rounded-lg">
                                        <span className="text-sm">💳</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700">How to build credit?</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Start from scratch...</p>
                                </div>
                                {/* Card 2 - Light Purple */}
                                <div
                                    className="bg-[#F3E5F5] rounded-xl p-3 cursor-pointer hover:brightness-95 transition-all"
                                    onClick={() => {
                                        const event = new CustomEvent('openCoach', { detail: { message: 'Explain 401k to me' } });
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    <div className="w-6 h-6 mb-2 flex items-center justify-center bg-white/50 rounded-lg">
                                        <span className="text-sm">🌐</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700">What is a 401(k)?</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Retirement basics...</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Topics */}
                        <div className="px-4 pb-3">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Recent Topics</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors">
                                    Tax Filing
                                </span>
                                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors">
                                    SSN Tips
                                </span>
                                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors">
                                    Banking
                                </span>
                            </div>
                        </div>

                        {/* Start Chat Button */}
                        <div className="p-4 pt-2">
                            <button
                                onClick={() => {
                                    const event = new CustomEvent('openCoach');
                                    window.dispatchEvent(event);
                                }}
                                className="w-full py-3 px-4 bg-gray-900 rounded-full text-white text-sm font-bold flex items-center justify-between hover:bg-gray-800 transition-colors"
                            >
                                <span>Start new chat</span>
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-gray-900 text-sm">→</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* My American Journey Widget */}
                    <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">My American Journey</h3>
                            <span className="text-gray-400">↗</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-sm font-bold text-gray-400 line-through">Visa Approved</span>
                            </div>
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-sm font-bold text-gray-400 line-through">SSN Obtained</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-50">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                                <span className="text-sm font-bold text-gray-800">Open Bank Account</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                <span className="text-sm font-bold text-gray-400">Build Credit Score</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t-2 border-gray-100">
                            <button className="w-full text-center text-gray-400 text-xs font-extrabold uppercase tracking-widest hover:text-gray-600">
                                View Full Roadmap
                            </button>
                        </div>
                    </div>

                    {/* Review Time Widget */}
                    <div className="border-2 border-[#DDF4FF] rounded-2xl p-0 overflow-hidden bg-[#F0F9FF] hover:bg-[#DDF4FF] transition-colors cursor-pointer group shadow-sm" onClick={() => navigate('/review')}>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
                                    <span className="text-xl">🔄</span>
                                    Review Time
                                </h3>
                                <div className="px-2 py-1 bg-[#1CB0F6] rounded-lg text-[10px] font-bold text-white uppercase tracking-wide">
                                    {reviewStats?.total || 10} DUE
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-3">
                                {reviewStats?.mistakes || 7} past mistakes
                            </p>
                            <button
                                className="w-full py-2.5 px-3 bg-[#1CB0F6] border-b-4 border-[#1899D6] rounded-xl text-white text-xs font-bold uppercase tracking-wide hover:bg-[#47C1FF] active:border-b-0 active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2"
                            >
                                Start Review
                            </button>
                        </div>
                    </div>

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

                    {/* Gold League */}
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
                            <img src="/generated_icons/xp_bolt.png" alt="XP" className="w-10 h-10 object-contain" />
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
    )
}
