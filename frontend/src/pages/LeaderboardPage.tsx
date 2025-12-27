import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronUp, ChevronDown, Minus, Trophy, Shield, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUserStore } from '../stores/userStore';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  change: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

const getMockLeaderboard = (currentUserName: string): LeaderboardEntry[] => [
  { rank: 1, name: 'Alex Chen', xp: 1847, streak: 89, change: 'same', isCurrentUser: false },
  { rank: 2, name: 'Sarah Johnson', xp: 1756, streak: 76, change: 'up', isCurrentUser: false },
  { rank: 3, name: 'Priya Sharma', xp: 1698, streak: 65, change: 'up', isCurrentUser: false },
  { rank: 4, name: 'Mike Rodriguez', xp: 1542, streak: 58, change: 'down', isCurrentUser: false },
  { rank: 5, name: currentUserName, xp: 1489, streak: 45, change: 'up', isCurrentUser: true },
  { rank: 6, name: 'Emma Wilson', xp: 1423, streak: 52, change: 'same', isCurrentUser: false },
  { rank: 7, name: 'David Kim', xp: 1387, streak: 48, change: 'down', isCurrentUser: false },
  { rank: 8, name: 'Lisa Brown', xp: 1298, streak: 45, change: 'up', isCurrentUser: false },
  { rank: 9, name: 'Raj Patel', xp: 1245, streak: 42, change: 'same', isCurrentUser: false },
  { rank: 10, name: 'Maria Garcia', xp: 1189, streak: 38, change: 'down', isCurrentUser: false },
  { rank: 11, name: 'Chris Lee', xp: 1134, streak: 35, change: 'up', isCurrentUser: false },
  { rank: 12, name: 'Ana Martinez', xp: 1098, streak: 32, change: 'same', isCurrentUser: false },
  { rank: 13, name: 'Tom Wilson', xp: 1045, streak: 28, change: 'down', isCurrentUser: false },
  { rank: 14, name: 'Nina Patel', xp: 987, streak: 25, change: 'up', isCurrentUser: false },
  { rank: 15, name: 'Jake Thompson', xp: 923, streak: 22, change: 'same', isCurrentUser: false },
];

// League definitions with Duolingo-style theming
const leagues = [
  { name: 'Gold', color: '#FFC800', bgColor: '#FFF9E6', icon: '🏆' },
  { name: 'Silver', color: '#A3A3A3', bgColor: '#F5F5F5', icon: '🥈' },
  { name: 'Bronze', color: '#CD7F32', bgColor: '#FDF4E8', icon: '🥉' },
];

const currentLeague = leagues[0]; // Gold league

export const LeaderboardPage: React.FC = () => {
  const { user } = useUserStore();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const currentUserName = user?.name || 'Demo User';
  const mockLeaderboard = getMockLeaderboard(currentUserName);
  const currentUserRank = mockLeaderboard.find(e => e.isCurrentUser);

  const timeframes: Array<{ id: 'week' | 'month' | 'all'; label: string }> = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  const getChangeIcon = (change: 'up' | 'down' | 'same') => {
    if (change === 'up') return <ChevronUp className="w-4 h-4 text-[#58cc02]" />;
    if (change === 'down') return <ChevronDown className="w-4 h-4 text-[#ff4b4b]" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* League Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFF9E6] border-2 border-[#FFC800] rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-2xl border-2 border-[#FFC800] flex items-center justify-center shadow-sm">
                <img src="/trophy.svg" alt="Trophy" className="w-14 h-14" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Gold League</h1>
                <p className="text-sm text-gray-600 font-medium">Top 10 advance to Diamond League!</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-[#FFC800]">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-gray-700">3 days left</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Rank Badge */}
            <div className="text-center">
              <div className="bg-white px-4 py-3 rounded-xl border-2 border-[#58cc02] shadow-sm">
                <div className="text-xs font-bold text-[#58cc02] uppercase tracking-widest mb-1">Your Rank</div>
                <div className="text-3xl font-extrabold text-gray-800">#{currentUserRank?.rank}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeframe Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-bold text-sm transition-all',
                timeframe === tf.id
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Promotion/Demotion Zones Info */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-[#58cc02] rounded-full"></div>
            <span className="text-gray-600 font-medium">Promotion zone (Top 10)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-[#ff4b4b] rounded-full"></div>
            <span className="text-gray-600 font-medium">Demotion zone (Bottom 5)</span>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
          {mockLeaderboard.map((entry, index) => {
            const isPromotion = entry.rank <= 10;
            const isDemotion = entry.rank > 10;

            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'flex items-center gap-4 p-4 transition-colors',
                  entry.isCurrentUser && 'bg-[#ddf4ff]',
                  !entry.isCurrentUser && 'hover:bg-gray-50',
                  index !== mockLeaderboard.length - 1 && 'border-b border-gray-100'
                )}
              >
                {/* Rank with zone indicator */}
                <div className="flex items-center gap-2 w-14">
                  <div className={cn(
                    'w-2 h-8 rounded-full',
                    isPromotion && 'bg-[#58cc02]',
                    isDemotion && 'bg-[#ff4b4b]'
                  )}></div>
                  <span className={cn(
                    'text-lg font-extrabold',
                    entry.isCurrentUser ? 'text-[#1cb0f6]' : 'text-gray-700'
                  )}>
                    {entry.rank}
                  </span>
                </div>

                {/* Rank change indicator */}
                <div className="w-6">
                  {getChangeIcon(entry.change)}
                </div>

                {/* Avatar */}
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white relative',
                  entry.isCurrentUser ? 'bg-[#1cb0f6]' :
                    entry.rank === 1 ? 'bg-[#FFC800]' :
                      entry.rank === 2 ? 'bg-[#A3A3A3]' :
                        entry.rank === 3 ? 'bg-[#CD7F32]' :
                          'bg-[#58cc02]'
                )}>
                  {entry.name.charAt(0)}
                  {getRankBadge(entry.rank) && (
                    <span className="absolute -top-1 -right-1 text-lg">{getRankBadge(entry.rank)}</span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      'font-bold truncate',
                      entry.isCurrentUser ? 'text-[#1cb0f6]' : 'text-gray-800'
                    )}>
                      {entry.name}
                    </h3>
                    {entry.isCurrentUser && (
                      <span className="px-2 py-0.5 bg-[#1cb0f6] text-white text-xs font-bold rounded-full">YOU</span>
                    )}
                  </div>
                </div>

                {/* XP with fire streak */}
                <div className="text-right">
                  <div className="font-extrabold text-gray-800">{entry.xp.toLocaleString()} XP</div>
                  <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span>{entry.streak}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          {/* Weekly Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#58cc02]/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#58cc02]" />
              </div>
              <h3 className="font-bold text-gray-800">Weekly XP</h3>
            </div>
            <div className="text-3xl font-extrabold text-gray-800 mb-1">{currentUserRank?.xp.toLocaleString()}</div>
            <p className="text-sm text-gray-500">+234 from last week</p>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-800">Day Streak</h3>
            </div>
            <div className="text-3xl font-extrabold text-gray-800 mb-1">{currentUserRank?.streak}</div>
            <p className="text-sm text-gray-500">Keep it going! 🔥</p>
          </motion.div>
        </div>

        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-100"
        >
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="font-extrabold text-gray-800 text-lg mb-2">
            {currentUserRank && currentUserRank.rank <= 10
              ? "You're in the promotion zone!"
              : "Push harder to reach the top 10!"}
          </h3>
          <p className="text-gray-500">
            {currentUserRank && currentUserRank.rank <= 10
              ? "Keep learning to advance to Diamond League next week!"
              : `You need ${mockLeaderboard[9].xp - (currentUserRank?.xp || 0)} more XP to reach 10th place`}
          </p>
        </motion.div>

      </div>
    </div>
  );
};
