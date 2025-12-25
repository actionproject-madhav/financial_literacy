import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Share2, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { XPDisplay } from '../components/gamification/XPDisplay';
import { AchievementBadge } from '../components/gamification/AchievementBadge';

// Mock user data
const mockUser = {
  name: 'Rajesh Kumar',
  email: 'rajesh@example.com',
  avatar: null,
  country: 'India',
  visaType: 'F1',
  joinDate: '2024-01-15',
  stats: {
    streak: 42,
    totalXP: 4250,
    lessonsCompleted: 67,
    skillsMastered: 8,
    currentLevel: 12,
    levelProgress: 65,
  },
  achievements: [
    { id: 'streak-7', icon: '🔥', title: 'Week Warrior', description: '7-day streak', unlocked: true },
    { id: 'streak-30', icon: '🔥', title: 'Monthly Master', description: '30-day streak', unlocked: true },
    { id: 'perfect', icon: '⭐', title: 'Perfect!', description: '100% accuracy lesson', unlocked: true },
    { id: 'xp-1000', icon: '⚡', title: 'XP Hunter', description: 'Earn 1000 XP', unlocked: true },
    { id: 'streak-100', icon: '💎', title: 'Century', description: '100-day streak', unlocked: false, progress: { current: 42, total: 100 } },
  ],
};

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-5"> {/* Duolingo uses 20px (5 * 4px) spacing */}
      {/* Profile Header */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={mockUser.avatar || undefined}
              alt={mockUser.name}
              fallback={mockUser.name.charAt(0)}
              size="xl"
            />
            <div>
              <h1 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                {mockUser.name}
              </h1>
              <p className="text-[15px] text-[#737373]" style={{ lineHeight: '24px', marginTop: '8px' }}>{mockUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" size="sm">{mockUser.country}</Badge>
                <Badge variant="xp" size="sm">{mockUser.visaType} Visa</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <IconButton aria-label="Share" variant="ghost">
              <Share2 className="w-5 h-5" />
            </IconButton>
            <IconButton aria-label="Settings" variant="ghost">
              <Settings className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t-2 border-[#E5E5E5]">
          <div className="text-center">
            <StreakCounter days={mockUser.stats.streak} size="md" />
            <p className="text-xs text-duo-text-muted mt-1">Day Streak</p>
          </div>
          <div className="text-center">
            <XPDisplay amount={mockUser.stats.totalXP} size="md" />
            <p className="text-xs text-duo-text-muted mt-1">Total XP</p>
          </div>
          <div className="text-center">
            <p className="text-[23px] font-bold text-[#58CC02]" style={{ lineHeight: '32px' }}>
              {mockUser.stats.lessonsCompleted}
            </p>
            <p className="text-[13px] text-[#737373] mt-1 font-bold">Lessons</p>
          </div>
          <div className="text-center">
            <p className="text-[23px] font-bold text-[#FFC800]" style={{ lineHeight: '32px' }}>
              {mockUser.stats.skillsMastered}
            </p>
            <p className="text-[13px] text-[#737373] mt-1 font-bold">Skills Mastered</p>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-[#4B4B4B] text-[17px]" style={{ lineHeight: '24px' }}>Level {mockUser.stats.currentLevel}</h2>
            <p className="text-[15px] text-[#737373] mt-1">Financial Explorer</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#1CB0F6] text-[17px]" style={{ lineHeight: '24px' }}>{mockUser.stats.levelProgress}%</p>
            <p className="text-[15px] text-[#737373] mt-1">to next level</p>
          </div>
        </div>
        <ProgressBar
          value={mockUser.stats.levelProgress}
          max={100}
          variant="xp"
          size="lg"
        />
      </Card>

      {/* Achievements */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#4B4B4B] text-[19px]" style={{ lineHeight: '25px' }}>Achievements</h2>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            See All
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {mockUser.achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              icon={achievement.icon}
              title={achievement.title}
              description={achievement.description}
              isUnlocked={achievement.unlocked}
              progress={achievement.progress}
              size="sm"
            />
          ))}
        </div>
      </Card>

      {/* Settings Links */}
      <Card variant="bordered" padding="none">
        {[
          { label: 'Notification Settings', path: '/settings/notifications' },
          { label: 'Voice & Audio', path: '/settings/voice' },
          { label: 'Daily Goal', path: '/settings/goal' },
          { label: 'Language Preferences', path: '/settings/language' },
        ].map((item, index) => (
          <button
            key={item.path}
            className={`w-full flex items-center justify-between p-5 hover:bg-[#F7F7F7] transition-colors ${
              index !== 0 ? 'border-t-2 border-[#E5E5E5]' : ''
            }`}
          >
            <span className="font-bold text-[#4B4B4B] text-[15px]">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </button>
        ))}
      </Card>
    </div>
  );
};

