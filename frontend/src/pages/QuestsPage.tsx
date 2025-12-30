import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Zap, BookOpen, Target, Loader2, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { questsApi, Quest } from '../services/api'

export const QuestsPage = () => {
    const { user, learnerId } = useUserStore()
    const navigate = useNavigate()
    const [dailyQuests, setDailyQuests] = useState<Quest[]>([])
    const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([])
    const [specialQuests, setSpecialQuests] = useState<Quest[]>([])
    const [dailyResetHours, setDailyResetHours] = useState(12)
    const [weeklyResetHours, setWeeklyResetHours] = useState(48)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (learnerId) {
            loadQuests()
        }
    }, [learnerId])

    const loadQuests = async () => {
        if (!learnerId) return
        setLoading(true)
        setError(null)
        try {
            const data = await questsApi.getQuests(learnerId)
            setDailyQuests(data.daily)
            setWeeklyQuests(data.weekly)
            setSpecialQuests(data.special)
            setDailyResetHours(data.daily_reset_hours)
            setWeeklyResetHours(data.weekly_reset_hours)
        } catch (err) {
            console.error('Failed to load quests:', err)
            setError('Failed to load quests. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClaimQuest = async (questId: string) => {
        if (!learnerId || claiming) return
        setClaiming(questId)
        try {
            const result = await questsApi.claimQuest(learnerId, questId)
            if (result.success) {
                await loadQuests()
            }
        } catch (err) {
            console.error('Failed to claim quest:', err)
        } finally {
            setClaiming(null)
        }
    }

    if (!learnerId) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 font-medium mb-4">Please log in to view quests</p>
                </div>
            </div>
        )
    }

    const formatResetTime = (hours: number) => {
        if (hours < 1) return 'Less than 1h'
        if (hours < 24) return `${hours}h`
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return `${days}d ${remainingHours}h`
    }

    const getIcon = (iconType: string) => {
        switch (iconType) {
            case 'xp':
                return <Zap className="w-10 h-10 text-yellow-400" />
            case 'lesson':
                return <BookOpen className="w-10 h-10 text-blue-400" />
            case 'streak':
                return <Target className="w-10 h-10 text-orange-400" />
            case 'perfect':
                return <Target className="w-10 h-10 text-green-400" />
            default:
                return <Target className="w-10 h-10 text-gray-400" />
        }
    }

    const QuestCard = ({ quest, index }: { quest: Quest; index: number }) => {
        const progressPercent = Math.min((quest.progress / quest.target) * 100, 100)
        const canClaim = quest.can_claim && !quest.completed
        const isCompleted = quest.completed

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white border-2 ${isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-2xl p-4 transition-all hover:shadow-md`}
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    {getIcon(quest.icon)}

                    {/* Content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-extrabold text-sm ${isCompleted ? 'text-green-600' : 'text-gray-800'}`}>
                                {quest.title}
                            </h3>
                            {!isCompleted && (
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                                    <span className="font-bold text-yellow-600 text-xs">+{quest.xp_reward}</span>
                                    <Zap className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                </div>
                            )}
                            {isCompleted && (
                                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg">
                                    <span className="font-bold text-green-600 text-xs">COMPLETED</span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-500 text-xs mb-3 font-medium">{quest.description}</p>

                        {/* Progress Bar */}
                        <div className="relative w-full bg-gray-100 h-6 rounded-full overflow-hidden border border-gray-200 mb-3">
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tighter">
                                    {quest.progress} / {quest.target}
                                </span>
                            </div>
                            <div
                                className={`h-full rounded-full transition-all ${
                                    isCompleted ? 'bg-green-500' : 'bg-yellow-400'
                                } border-r-2 ${isCompleted ? 'border-green-600/20' : 'border-yellow-500/20'}`}
                                style={{ width: `${Math.max(progressPercent, 2)}%` }}
                            />
                        </div>

                        {/* Claim Button */}
                        {canClaim && (
                            <button
                                onClick={() => handleClaimQuest(quest.id)}
                                disabled={claiming === quest.id}
                                className="w-full py-3 bg-green-500 text-white font-bold text-xs rounded-xl border-b-4 border-green-600 hover:bg-green-400 hover:border-green-500 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {claiming === quest.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        CLAIMING...
                                    </>
                                ) : (
                                    'CLAIM REWARD'
                                )}
                            </button>
                        )}
                    </div>

                    {/* Reward Icon */}
                    <img src="/quest.svg" className="w-12 h-12 object-contain cursor-pointer transition-transform hover:scale-110 -ml-1 pt-4" alt="Reward" />
                </div>
            </motion.div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading quests...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-white">
            {/* Back Header - Sticky */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:bg-gray-100 rounded-full transition-colors" strokeWidth={3} />
                    <span className="font-bold uppercase tracking-widest text-sm">Back</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex justify-center">
                <div className="w-full max-w-[720px] py-8 px-5">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">Quests</h1>
                        <p className="text-gray-500 text-sm font-medium">Complete quests to earn bonus XP</p>
                    </div>

                    {/* Reset Timer */}
                    <div className="mb-6 flex items-center gap-2 bg-white border-2 border-gray-200 px-4 py-3 rounded-xl w-fit">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Resets in {formatResetTime(dailyResetHours)}</span>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Daily Quests */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="font-extrabold text-gray-800 text-lg uppercase tracking-wider">Daily Quests</h2>
                        </div>
                        <div className="space-y-3">
                            {dailyQuests.length > 0 ? (
                                dailyQuests.map((quest, index) => (
                                    <QuestCard key={quest.id} quest={quest} index={index} />
                                ))
                            ) : (
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                                    <p className="text-gray-400 font-medium">No daily quests available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Quests */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="font-extrabold text-gray-800 text-lg uppercase tracking-wider">Weekly Quests</h2>
                            </div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Resets in {formatResetTime(weeklyResetHours)}</span>
                        </div>
                        <div className="space-y-3">
                            {weeklyQuests.length > 0 ? (
                                weeklyQuests.map((quest, index) => (
                                    <QuestCard key={quest.id} quest={quest} index={index + dailyQuests.length} />
                                ))
                            ) : (
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                                    <p className="text-gray-400 font-medium">No weekly quests available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Special Quests */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="font-extrabold text-gray-800 text-lg uppercase tracking-wider">Special Quests</h2>
                        </div>
                        <div className="space-y-3">
                            {specialQuests.length > 0 ? (
                                specialQuests.map((quest, index) => (
                                    <QuestCard key={quest.id} quest={quest} index={index + dailyQuests.length + weeklyQuests.length} />
                                ))
                            ) : (
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                                    <p className="text-gray-400 font-medium">No special quests available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
