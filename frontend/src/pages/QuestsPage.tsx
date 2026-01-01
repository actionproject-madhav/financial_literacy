import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart } from 'lucide-react';

// Mock Data for Quests
const MOCK_DAILY_QUESTS = [
    { id: 1, title: 'Extend your streak', target: 1, current: 0, reward: 10, icon: '/fire.svg' },
    { id: 2, title: 'Spend 5 minutes learning', target: 5, current: 0, reward: 20, icon: '/trophy.svg' },
    { id: 3, title: 'Score 80% or higher in 3 lessons', target: 3, current: 0, reward: 50, icon: '/leaderboard.svg' },
];

const MOCK_WEEKLY_QUESTS = [
    { id: 4, title: 'Earn 500 XP this week', target: 500, current: 340, reward: 100, icon: '/coin.svg' },
    { id: 5, title: 'Complete 10 lessons', target: 10, current: 6, reward: 150, icon: '/home-pixel.svg' },
];

export function QuestsPage() {
    const { user } = useUserStore();
    const { t } = useLanguage();
    const [dailyQuests] = useState(MOCK_DAILY_QUESTS);
    const [weeklyQuests] = useState(MOCK_WEEKLY_QUESTS);

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
                                <span className="text-white font-bold text-sm uppercase tracking-wide">December</span>
                            </div>

                            <h2 className="text-2xl font-extrabold text-white mb-2">
                                Your Financial Quest
                            </h2>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-6">
                                <span>⏱</span>
                                <span>5 HOURS</span>
                            </div>

                            {/* Progress Card */}
                            <div className="bg-white rounded-2xl p-4">
                                <p className="font-bold text-gray-800 mb-3">Complete 30 quests</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: '3%', backgroundColor: '#FF6B35' }}
                                        />
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">1 / 30</span>
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
                                    <span>⏱</span> 5 HOURS
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                {dailyQuests.map((quest, index) => (
                                    <div
                                        key={quest.id}
                                        className={`p-4 flex items-center gap-4 ${index !== dailyQuests.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gray-50">
                                            <img src={quest.icon} alt="" className="w-7 h-7 object-contain" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-2">{quest.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gray-200"
                                                        style={{ width: `${Math.min((quest.current / quest.target) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
                                                    {quest.current} / {quest.target}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <img src="/quest.svg" alt="Reward" className="w-10 h-10 object-contain opacity-60" />
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
                                    <span>⏱</span> 4 DAYS
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                {weeklyQuests.map((quest, index) => (
                                    <div
                                        key={quest.id}
                                        className={`p-4 flex items-center gap-4 ${index !== weeklyQuests.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gray-50">
                                            <img src={quest.icon} alt="" className="w-7 h-7 object-contain" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-2">{quest.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-purple-400"
                                                        style={{ width: `${Math.min((quest.current / quest.target) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
                                                    {quest.current} / {quest.target}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <img src="/quest.svg" alt="Reward" className="w-10 h-10 object-contain opacity-60" />
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
                                <img src="/fire.svg" alt="Streak" className="w-6 h-6" />
                                <span className="font-bold text-gray-700">{user?.streak || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img src="/coin.svg" alt="Gems" className="w-6 h-6" />
                                <span className="font-bold text-gray-700">{user?.gems || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                                <span className="font-bold text-red-500">{user?.hearts || 5}</span>
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
                                    <h3 className="text-xl font-extrabold text-gray-800">{user?.streak || 1} day streak</h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Streak frozen yesterday. Extend your streak now!
                                    </p>
                                </div>
                                <img src="/fire.svg" alt="Streak" className="w-12 h-12" />
                            </div>

                            {/* Week Calendar */}
                            <div className="flex justify-between mt-4">
                                {weekDays.map((day, index) => (
                                    <div key={index} className="text-center">
                                        <span className="text-xs font-bold text-gray-500 block mb-2">{day}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < today
                                            ? 'bg-orange-500'
                                            : index === today
                                                ? 'bg-orange-500 ring-2 ring-orange-300'
                                                : 'bg-gray-200'
                                            }`}>
                                            {index <= today && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                                <p className="text-white/80 text-sm">0 active Friend Streaks</p>
                                <button className="mt-2 bg-white text-orange-600 font-bold text-sm px-4 py-1.5 rounded-full">
                                    VIEW LIST
                                </button>
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
                                        Reach a 7 day streak to join the Streak Society and earn exclusive rewards.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* View More Button */}
                        <motion.button
                            variants={itemVariants}
                            className="w-full py-4 rounded-2xl font-bold text-white text-sm uppercase tracking-wide"
                            style={{ backgroundColor: '#FF8C42' }}
                        >
                            View More
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
