import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUserStore } from '../stores/userStore';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  isCurrentUser?: boolean;
}

const getMockLeaderboard = (currentUserName: string): LeaderboardEntry[] => [
  { rank: 1, name: 'Alex Chen', xp: 12500, streak: 89, isCurrentUser: false },
  { rank: 2, name: 'Sarah Johnson', xp: 11800, streak: 76, isCurrentUser: false },
  { rank: 3, name: currentUserName, xp: 9800, streak: 65, isCurrentUser: true },
  { rank: 4, name: 'Mike Rodriguez', xp: 9200, streak: 58, isCurrentUser: false },
  { rank: 5, name: 'Emma Wilson', xp: 8800, streak: 52, isCurrentUser: false },
  { rank: 6, name: 'David Kim', xp: 8400, streak: 48, isCurrentUser: false },
  { rank: 7, name: 'Lisa Brown', xp: 7900, streak: 45, isCurrentUser: false },
  { rank: 8, name: 'James Taylor', xp: 7500, streak: 42, isCurrentUser: false },
  { rank: 9, name: 'Maria Garcia', xp: 7100, streak: 38, isCurrentUser: false },
  { rank: 10, name: 'Chris Lee', xp: 6800, streak: 35, isCurrentUser: false },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-6 h-6 text-[#FFC800]" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-[#CD7F32]" />;
  return null;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return 'bg-[#FFC800]';
  if (rank === 2) return 'bg-[#C0C0C0]';
  if (rank === 3) return 'bg-[#CD7F32]';
  return 'bg-[#E5E5E5]';
};

export const LeaderboardPage: React.FC = () => {
  const { user } = useUserStore();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // Use current user's name if available, otherwise use "You"
  const currentUserName = user?.name || 'You';
  const mockLeaderboard = getMockLeaderboard(currentUserName);

  const timeframes: Array<{ id: 'week' | 'month' | 'all'; label: string }> = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
            Leaderboards
          </h1>
          <p className="text-[15px] text-[#737373] mt-1" style={{ lineHeight: '24px' }}>
            Compete with learners worldwide
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {/* 2nd Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <Card variant="elevated" padding="lg" className="w-full text-center">
            <div className="flex justify-center mb-3">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[19px]', getRankColor(2))}>
                2
              </div>
            </div>
            <Avatar
              src={mockLeaderboard[1]?.avatar}
              alt={mockLeaderboard[1]?.name || ''}
              fallback={mockLeaderboard[1]?.name.charAt(0) || '?'}
              size="lg"
              className="mx-auto mb-3"
            />
            <h3 className="text-[17px] font-bold text-[#4B4B4B] mb-1" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[1]?.name}
            </h3>
            <p className="text-[15px] font-bold text-[#8549BA]" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[1]?.xp.toLocaleString()} XP
            </p>
          </Card>
        </motion.div>

        {/* 1st Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <Card variant="elevated" padding="lg" className="w-full text-center border-2 border-[#FFC800]">
            <div className="flex justify-center mb-3">
              <Crown className="w-8 h-8 text-[#FFC800]" />
            </div>
            <Avatar
              src={mockLeaderboard[0]?.avatar}
              alt={mockLeaderboard[0]?.name || ''}
              fallback={mockLeaderboard[0]?.name.charAt(0) || '?'}
              size="xl"
              className="mx-auto mb-3 border-4 border-[#FFC800]"
            />
            <h3 className="text-[17px] font-bold text-[#4B4B4B] mb-1" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[0]?.name}
            </h3>
            <p className="text-[15px] font-bold text-[#8549BA]" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[0]?.xp.toLocaleString()} XP
            </p>
          </Card>
        </motion.div>

        {/* 3rd Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <Card variant="elevated" padding="lg" className="w-full text-center">
            <div className="flex justify-center mb-3">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[19px]', getRankColor(3))}>
                3
              </div>
            </div>
            <Avatar
              src={mockLeaderboard[2]?.avatar}
              alt={mockLeaderboard[2]?.name || ''}
              fallback={mockLeaderboard[2]?.name.charAt(0) || '?'}
              size="lg"
              className="mx-auto mb-3"
            />
            <h3 className="text-[17px] font-bold text-[#4B4B4B] mb-1" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[2]?.name}
            </h3>
            <p className="text-[15px] font-bold text-[#8549BA]" style={{ lineHeight: '24px' }}>
              {mockLeaderboard[2]?.xp.toLocaleString()} XP
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Timeframe Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-custom">
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            className={cn(
              'px-5 py-2 rounded-[12px] font-bold text-[15px] transition-colors whitespace-nowrap',
              timeframe === tf.id
                ? 'bg-[#1CB0F6] text-white' // Duolingo exact blue
                : 'bg-white text-[#737373] border-2 border-[#E5E5E5] hover:bg-[#F7F7F7]'
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <Card variant="elevated" padding="none">
        {mockLeaderboard.slice(3).map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className={cn(
              'flex items-center gap-4 p-5',
              entry.isCurrentUser && 'bg-[#DDF4FF]', // Highlight current user
              index !== mockLeaderboard.length - 4 && 'border-b-2 border-[#E5E5E5]'
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-10">
              <span className={cn(
                'text-[17px] font-bold',
                entry.isCurrentUser ? 'text-[#1CB0F6]' : 'text-[#737373]'
              )}>
                {entry.rank}
              </span>
            </div>

            {/* Avatar */}
            <Avatar
              src={entry.avatar}
              alt={entry.name}
              fallback={entry.name.charAt(0)}
              size="md"
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  'text-[15px] font-bold truncate',
                  entry.isCurrentUser ? 'text-[#1CB0F6]' : 'text-[#4B4B4B]'
                )} style={{ lineHeight: '24px' }}>
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="ml-2 text-[13px]">(You)</span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[13px] text-[#737373] font-bold">
                  {entry.xp.toLocaleString()} XP
                </span>
                <span className="text-[13px] text-[#FF9600] font-bold">
                  🔥 {entry.streak} day streak
                </span>
              </div>
            </div>

            {/* Trophy Icon for Top 10 */}
            {entry.rank <= 10 && entry.rank > 3 && (
              <Trophy className="w-5 h-5 text-[#737373]" />
            )}
          </motion.div>
        ))}
      </Card>

      {/* Current User Rank Highlight */}
      {mockLeaderboard.find(e => e.isCurrentUser) && (
        <Card variant="bordered" padding="lg" className="bg-[#DDF4FF] border-2 border-[#1CB0F6]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-bold text-[#1CB0F6] mb-1">Your Position</p>
              <p className="text-[23px] font-bold text-[#4B4B4B]">
                #{mockLeaderboard.find(e => e.isCurrentUser)?.rank}
              </p>
            </div>
            <Trophy className="w-12 h-12 text-[#1CB0F6]" />
          </div>
        </Card>
      )}
    </div>
  );
};

