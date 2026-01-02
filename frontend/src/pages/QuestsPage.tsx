import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, CheckCircle2 } from 'lucide-react';
import { questsApi, Quest, socialApi, learnerApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { LottieAnimation } from '../components/LottieAnimation';
import Lottie from 'lottie-react';
import fireAnimation from '../assets/animations/streak-fire.json';

interface QuestsData {
    daily: Quest[];
    weekly: Quest[];
    special: Quest[];
    daily_reset_hours: number;
    weekly_reset_hours: number;
}

export function QuestsPage() {
    const { user, learnerId, setUser } = useUserStore();
    const { t } = useLanguage();
    const toast = useToast();
    const [quests, setQuests] = useState<QuestsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<Set<string>>(new Set());
    const [friendStreaks, setFriendStreaks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [gems, setGems] = useState<number>(0);
    const [hearts, setHearts] = useState<number>(5);

    // Fetch quests from backend
    useEffect(() => {
        const fetchQuests = async () => {
            if (!learnerId) return;
            
            try {
                setLoading(true);
                const data = await questsApi.getQuests(learnerId);
                setQuests(data);
            } catch (error) {
                console.error('Failed to fetch quests:', error);
                toast.error('Failed to load quests. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchQuests();
        
        // Refresh quests every 30 seconds to update progress
        const interval = setInterval(fetchQuests, 30000);
        return () => clearInterval(interval);
    }, [learnerId, toast]);

    // Fetch user stats, gems, and hearts from backend
    useEffect(() => {
        const fetchUserData = async () => {
            if (!learnerId) return;
            
            try {
                // Fetch stats (includes streak)
                const statsData = await learnerApi.getStats(learnerId);
                setStats(statsData);
                
                // Fetch gems directly from backend
                try {
                    const gemsData = await learnerApi.getGems(learnerId);
                    setGems(gemsData.gems || 0);
                } catch (err) {
                    console.error('Failed to fetch gems:', err);
                }
                
                // Fetch hearts directly from backend
                try {
                    const heartsData = await learnerApi.getHearts(learnerId);
                    setHearts(heartsData.hearts || 5);
                } catch (err) {
                    console.error('Failed to fetch hearts:', err);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchUserData();
        
        // Refresh every 30 seconds to keep data current
        const interval = setInterval(fetchUserData, 30000);
        return () => clearInterval(interval);
    }, [learnerId]);

    // Fetch friend streaks
    useEffect(() => {
        const fetchFriendStreaks = async () => {
            if (!learnerId) return;
            
            try {
                const data = await socialApi.getFriendStreaks(learnerId);
                setFriendStreaks(data.active_streaks || []);
            } catch (error) {
                console.error('Failed to fetch friend streaks:', error);
            }
        };

        fetchFriendStreaks();
    }, [learnerId]);

    const handleClaimQuest = async (questId: string, questType: 'daily' | 'weekly' | 'special') => {
        if (!learnerId || claiming.has(questId)) return;

        setClaiming(prev => new Set(prev).add(questId));

        try {
            const result = await questsApi.claimQuest(learnerId, questId);
            
            if (result.success) {
                // Update user store with new XP and gems
                if (user) {
                    setUser({
                        ...user,
                        totalXp: result.total_xp || user.totalXp,
                        gems: (result.total_gems !== undefined ? result.total_gems : user.gems)
                    });
                }
                
                // Refresh gems and stats from backend
                if (learnerId) {
                    try {
                        const gemsData = await learnerApi.getGems(learnerId);
                        setGems(gemsData.gems || 0);
                        
                        const statsData = await learnerApi.getStats(learnerId);
                        setStats(statsData);
                    } catch (err) {
                        console.error('Failed to refresh after quest claim:', err);
                    }
                }

                toast.success(
                    `Quest claimed! Earned ${result.xp_earned} XP${result.gems_earned ? ` and ${result.gems_earned} gems` : ''}`
                );

                // Refresh quests to update claimed status
                const data = await questsApi.getQuests(learnerId);
                setQuests(data);
            }
        } catch (error: any) {
            console.error('Failed to claim quest:', error);
            const errorMessage = error?.message || 'Failed to claim quest';
            if (errorMessage.includes('already claimed')) {
                toast.info('This quest has already been claimed.');
            } else if (errorMessage.includes('not complete')) {
                toast.warning('Quest is not yet complete.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setClaiming(prev => {
                const newSet = new Set(prev);
                newSet.delete(questId);
                return newSet;
            });
        }
    };

    const formatTimeRemaining = (hours: number): string => {
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days} ${days === 1 ? 'DAY' : 'DAYS'}`;
        }
        return `${hours} HOURS`;
    };

    const getQuestIcon = (icon: string) => {
        const iconMap: Record<string, string> = {
            'xp': '/coin.svg',
            'lesson': '/home-pixel.svg',
            'perfect': '/trophy.svg',
            'streak': '/fire.svg',
        };
        return iconMap[icon] || '/quest.svg';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Week days for streak calendar
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().getDay();
    // Use streak from stats (database) - fallback to user store only if stats not loaded yet
    const currentStreak = stats?.streak ?? stats?.streak_count ?? user?.streak ?? 0;

    // Calculate monthly quest progress (completed quests this month)
    const monthlyProgress = quests ? 
        [...quests.daily, ...quests.weekly, ...quests.special].filter(q => q.completed).length : 0;
    const monthlyTarget = 30;

    if (loading && !quests) {
        return (
            <div className="max-w-6xl mx-auto p-6 pb-20 pt-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading quests...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 pb-20 pt-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Main Quests */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Monthly Challenge Banner - Orange Theme */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl p-6 relative overflow-hidden"
                            style={{ backgroundColor: '#FF6B35' }}
                        >
                            {/* Month Badge */}
                            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-4">
                                <span className="text-white font-bold text-sm uppercase tracking-wide">
                                    {new Date().toLocaleString('default', { month: 'long' })}
                                </span>
                            </div>

                            <h2 className="text-2xl font-extrabold text-white mb-2">
                                Your Financial Quest
                            </h2>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-6">
                                <span>⏱</span>
                                <span>{quests ? formatTimeRemaining(quests.daily_reset_hours) : '5 HOURS'}</span>
                            </div>

                            {/* Progress Card */}
                            <div className="bg-white rounded-2xl p-4">
                                <p className="font-bold text-gray-800 mb-3">Complete 30 quests</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ 
                                                width: `${Math.min((monthlyProgress / monthlyTarget) * 100, 100)}%`, 
                                                backgroundColor: '#FF6B35' 
                                            }}
                                        />
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">
                                        {monthlyProgress} / {monthlyTarget}
                                    </span>
                                    <img
                                        src="/3d-models/monster-3.png"
                                        alt="Reward"
                                        className="w-10 h-10 object-contain"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Daily Quests Section */}
                        <motion.section variants={itemVariants}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Daily Quests</h2>
                                <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                                    <span>⏱</span> {quests ? formatTimeRemaining(quests.daily_reset_hours) : '5 HOURS'}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                {quests?.daily.map((quest, index) => (
                                    <div
                                        key={quest.id}
                                        className={`p-4 flex items-center gap-4 ${index !== quests.daily.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gray-50">
                                            <img src={getQuestIcon(quest.icon)} alt="" className="w-7 h-7 object-contain" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-2">{quest.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-orange-400 transition-all"
                                                        style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
                                                    {quest.progress} / {quest.target}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {quest.completed ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span className="text-xs font-bold">CLAIMED</span>
                                                </div>
                                            ) : quest.can_claim ? (
                                                <button
                                                    onClick={() => handleClaimQuest(quest.id, 'daily')}
                                                    disabled={claiming.has(quest.id)}
                                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {claiming.has(quest.id) ? 'CLAIMING...' : 'CLAIM'}
                                                </button>
                                            ) : (
                                                <div className="text-center">
                                                    <img src="/quest.svg" alt="Reward" className="w-10 h-10 object-contain opacity-60" />
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        +{quest.xp_reward} XP
                                                        {(quest.gems_reward ?? 0) > 0 && ` +${quest.gems_reward} 💎`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Weekly Quests Section */}
                        <motion.section variants={itemVariants}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Weekly Quests</h2>
                                <span className="text-sm font-bold text-purple-500 flex items-center gap-1">
                                    <span>⏱</span> {quests ? formatTimeRemaining(quests.weekly_reset_hours) : '4 DAYS'}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                {quests?.weekly.map((quest, index) => (
                                    <div
                                        key={quest.id}
                                        className={`p-4 flex items-center gap-4 ${index !== quests.weekly.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gray-50">
                                            <img src={getQuestIcon(quest.icon)} alt="" className="w-7 h-7 object-contain" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-2">{quest.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-purple-400 transition-all"
                                                        style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
                                                    {quest.progress} / {quest.target}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {quest.completed ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span className="text-xs font-bold">CLAIMED</span>
                                                </div>
                                            ) : quest.can_claim ? (
                                                <button
                                                    onClick={() => handleClaimQuest(quest.id, 'weekly')}
                                                    disabled={claiming.has(quest.id)}
                                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {claiming.has(quest.id) ? 'CLAIMING...' : 'CLAIM'}
                                                </button>
                                            ) : (
                                                <div className="text-center">
                                                    <img src="/quest.svg" alt="Reward" className="w-10 h-10 object-contain opacity-60" />
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        +{quest.xp_reward} XP
                                                        {(quest.gems_reward ?? 0) > 0 && ` +${quest.gems_reward} 💎`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    </div>

                    {/* RIGHT COLUMN - Stats & Widgets */}
                    <div className="space-y-6">

                        {/* Stats Header Row */}
                        <motion.div variants={itemVariants} className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <Lottie 
                                        animationData={fireAnimation} 
                                        loop={true} 
                                        className="w-full h-full"
                                    />
                                </div>
                                <span className="font-bold text-gray-700">{currentStreak}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img src="/coin.svg" alt="Gems" className="w-6 h-6" />
                                <span className="font-bold text-gray-700">{gems}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                                <span className="font-bold text-red-500">{hearts}</span>
                            </div>
                        </motion.div>

                        {/* Streak Widget - Light Blue Theme */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-2xl p-5"
                            style={{ backgroundColor: '#E0F7FA' }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-xl font-extrabold text-gray-800">{currentStreak} day streak</h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {currentStreak > 0 
                                            ? 'Keep it going! Maintain your streak by practicing daily.'
                                            : 'Start your streak today! Complete a lesson to begin.'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <Lottie 
                                        animationData={fireAnimation} 
                                        loop={true} 
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>

                            {/* Week Calendar */}
                            <div className="flex justify-between mt-4">
                                {weekDays.map((day, index) => {
                                    // Calculate if this day should be marked as completed
                                    // For simplicity, mark days up to today if streak is active
                                    const isCompleted = currentStreak > 0 && index <= today;
                                    const isToday = index === today;
                                    
                                    return (
                                        <div key={index} className="text-center">
                                            <span className="text-xs font-bold text-gray-500 block mb-2">{day}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                isCompleted
                                                    ? 'bg-orange-500'
                                                    : isToday
                                                        ? 'bg-orange-500 ring-2 ring-orange-300'
                                                        : 'bg-gray-200'
                                            }`}>
                                                {isCompleted && (
                                                    <span className="text-white text-xs">✓</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Friend Streaks - Orange Theme */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-2xl p-5 flex items-center gap-4"
                            style={{ backgroundColor: '#FF6B35' }}
                        >
                            <img
                                src="/3d-models/monster-6.png"
                                alt="Friends"
                                className="w-16 h-16 object-contain"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-white">Friend Streaks</h3>
                                <p className="text-white/80 text-sm">
                                    {friendStreaks.length} active Friend Streak{friendStreaks.length !== 1 ? 's' : ''}
                                </p>
                                {friendStreaks.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {friendStreaks.slice(0, 3).map((friend) => (
                                            <div key={friend.user_id} className="text-white/90 text-xs">
                                                {friend.display_name}: {friend.streak_count} days
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Streak Society */}
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <img src="/trophy.svg" alt="Society" className="w-8 h-8 opacity-40" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Streak Society</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {currentStreak >= 7 
                                            ? 'Congratulations! You\'re a member of the Streak Society!'
                                            : `Reach a 7 day streak to join the Streak Society and earn exclusive rewards. ${7 - currentStreak} more day${7 - currentStreak !== 1 ? 's' : ''} to go!`}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
