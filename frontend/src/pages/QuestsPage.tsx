import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Zap, BookOpen, Target, Gift, Loader2 } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { questsApi, Quest } from '../services/api'

const iconMap = {
    xp: <Zap className="w-6 h-6" />,
    lesson: <BookOpen className="w-6 h-6" />,
    streak: <Target className="w-6 h-6" />,
    perfect: <CheckCircle2 className="w-6 h-6" />,
}

export const QuestsPage = () => {
    const { user } = useUserStore()
    const [dailyQuests, setDailyQuests] = useState<Quest[]>([])
    const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([])
    const [specialQuests, setSpecialQuests] = useState<Quest[]>([])
    const [dailyResetHours, setDailyResetHours] = useState(12)
    const [weeklyResetHours, setWeeklyResetHours] = useState(48)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user?.id) {
            loadQuests()
        }
    }, [user?.id])

    const loadQuests = async () => {
        if (!user?.id) return
        setLoading(true)
        setError(null)
        try {
            const data = await questsApi.getQuests(user.id)
            setDailyQuests(data.daily)
            setWeeklyQuests(data.weekly)
            setSpecialQuests(data.special)
            setDailyResetHours(data.daily_reset_hours)
            setWeeklyResetHours(data.weekly_reset_hours)
        } catch (err) {
            console.error('Failed to load quests:', err)
            setError('Failed to load quests')
        } finally {
            setLoading(false)
        }
    }

    const handleClaimQuest = async (questId: string) => {
        if (!user?.id || claiming) return
        setClaiming(questId)
        try {
            const result = await questsApi.claimQuest(user.id, questId)
            if (result.success) {
                // Reload quests to get updated state
                await loadQuests()
            }
        } catch (err) {
            console.error('Failed to claim quest:', err)
        } finally {
            setClaiming(null)
        }
    }

    if (!user) return null

    const formatResetTime = (hours: number) => {
        if (hours < 1) return 'Less than 1h'
        if (hours < 24) return `${hours}h`
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return `${days}d ${remainingHours}h`
    }

    const QuestCard = ({ quest }: { quest: Quest }) => {
        const progressPercent = Math.min((quest.progress / quest.target) * 100, 100)
        const canClaim = quest.can_claim && !quest.completed

        return (
            <div className={`bg-white border-2 ${quest.completed ? 'border-[#58cc02] bg-[#e5f7d3]' : 'border-gray-200'} rounded-2xl p-4 transition-all`}>
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quest.completed ? 'bg-[#58cc02] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {iconMap[quest.icon as keyof typeof iconMap] || <Target className="w-6 h-6" />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-extrabold ${quest.completed ? 'text-[#58cc02]' : 'text-gray-800'}`}>
                                {quest.title}
                            </h3>
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                <span className="font-bold text-amber-500 text-sm">+{quest.xp_reward}</span>
                                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm mb-3">{quest.description}</p>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${quest.completed ? 'bg-[#58cc02]' : 'bg-[#ffc800]'}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-500">
                                {quest.progress}/{quest.target}
                            </span>
                        </div>

                        {/* Claim Button */}
                        {canClaim && (
                            <button
                                onClick={() => handleClaimQuest(quest.id)}
                                disabled={claiming === quest.id}
                                className="mt-3 w-full bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {claiming === quest.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Claiming...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-4 h-4" />
                                        Claim Reward
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#58cc02] animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7] pb-20">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800">Quests</h1>
                        <p className="text-gray-500 text-sm">Complete quests to earn bonus XP</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border-2 border-gray-200 px-3 py-2 rounded-xl">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Resets in {formatResetTime(dailyResetHours)}</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600">
                        {error}
                    </div>
                )}

                {/* Daily Quests */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-[#ffc800] rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-extrabold text-gray-800 text-lg">Daily Quests</h2>
                    </div>
                    <div className="space-y-3">
                        {dailyQuests.length > 0 ? (
                            dailyQuests.map(quest => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">No daily quests available</div>
                        )}
                    </div>
                </div>

                {/* Weekly Quests */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-[#1cb0f6] rounded-lg flex items-center justify-center">
                            <Gift className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-extrabold text-gray-800 text-lg">Weekly Quests</h2>
                        <span className="text-sm text-gray-500 ml-auto">Resets in {formatResetTime(weeklyResetHours)}</span>
                    </div>
                    <div className="space-y-3">
                        {weeklyQuests.length > 0 ? (
                            weeklyQuests.map(quest => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">No weekly quests available</div>
                        )}
                    </div>
                </div>

                {/* Special Quests */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-[#ce82ff] rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-extrabold text-gray-800 text-lg">Special Quests</h2>
                    </div>
                    <div className="space-y-3">
                        {specialQuests.length > 0 ? (
                            specialQuests.map(quest => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">No special quests available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
