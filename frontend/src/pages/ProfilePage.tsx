import React, { useState, useEffect } from 'react';
import { Settings, Share2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { XPDisplay } from '../components/gamification/XPDisplay';
import { AchievementBadge } from '../components/gamification/AchievementBadge';
import { useUserStore } from '../stores/userStore';
import { learnerApi } from '../services/api';

interface ProfileStats {
  learner_id: string;
  display_name: string;
  email: string;
  country_of_origin: string;
  visa_type: string;
  total_xp: number;
  streak_count: number;
  lessons_completed: number;
  skills_mastered: number;
  level: number;
  level_progress: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_in_current_level: number;
  xp_needed_for_level: number;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, user: storeUser } = useUserStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real profile stats from backend
  const fetchStats = React.useCallback(async () => {
    if (!learnerId) {
      setError('Not logged in');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[ProfilePage] Fetching stats from database for learner:', learnerId);
      const profileStats = await learnerApi.getStats(learnerId);
      console.log('[ProfilePage] Stats loaded from database:', {
        total_xp: profileStats.total_xp,
        streak_count: profileStats.streak_count,
        lessons_completed: profileStats.lessons_completed,
        skills_mastered: profileStats.skills_mastered,
        level: profileStats.level,
        level_progress: profileStats.level_progress
      });
      setStats(profileStats);
    } catch (err) {
      console.error('[ProfilePage] Failed to fetch profile stats:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refresh stats when page becomes visible (e.g., after completing a lesson)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && learnerId) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats, learnerId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-duo-primary mx-auto mb-4"></div>
          <p className="text-duo-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load profile'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Use real data from backend
  const userData = {
    name: stats.display_name || storeUser?.name || 'User',
    email: stats.email || storeUser?.email || '',
    country: stats.country_of_origin || storeUser?.country || 'US',
    visaType: stats.visa_type || storeUser?.visaType || 'Other',
    stats: {
      streak: stats.streak_count,
      totalXP: stats.total_xp,
      lessonsCompleted: stats.lessons_completed,
      skillsMastered: stats.skills_mastered,
      currentLevel: stats.level,
      levelProgress: stats.level_progress,
    },
    // TODO: Fetch real achievements from backend
    achievements: [
      { id: 'streak-7', icon: '🔥', title: 'Week Warrior', description: '7-day streak', unlocked: stats.streak_count >= 7 },
      { id: 'streak-30', icon: '🔥', title: 'Monthly Master', description: '30-day streak', unlocked: stats.streak_count >= 30 },
      { id: 'perfect', icon: '⭐', title: 'Perfect!', description: '100% accuracy lesson', unlocked: false },
      { id: 'xp-1000', icon: '⚡', title: 'XP Hunter', description: 'Earn 1000 XP', unlocked: stats.total_xp >= 1000 },
      { id: 'streak-100', icon: '💎', title: 'Century', description: '100-day streak', unlocked: stats.streak_count >= 100, progress: stats.streak_count < 100 ? { current: stats.streak_count, total: 100 } : undefined },
    ],
  };

  return (
    <div className="space-y-5"> {/* Duolingo uses 20px (5 * 4px) spacing */}
      {/* Profile Header */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={userData.avatar || undefined}
              alt={userData.name}
              fallback={userData.name.charAt(0)}
              size="xl"
            />
            <div>
              <h1 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                {userData.name}
              </h1>
              <p className="text-[15px] text-[#737373]" style={{ lineHeight: '24px', marginTop: '8px' }}>{userData.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" size="sm">{userData.country}</Badge>
                <Badge variant="xp" size="sm">{userData.visaType} Visa</Badge>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 border-t-2 border-[#E5E5E5]"> {/* Duolingo uses 20px gaps */}
          <div className="text-center">
            <StreakCounter days={userData.stats.streak} size="md" />
            <p className="text-xs text-duo-text-muted mt-1">Day Streak</p>
          </div>
          <div className="text-center">
            <XPDisplay amount={userData.stats.totalXP} size="md" />
            <p className="text-xs text-duo-text-muted mt-1">Total XP</p>
          </div>
          <div className="text-center">
            <p className="text-[23px] font-bold text-[#58CC02]" style={{ lineHeight: '32px' }}>
              {userData.stats.lessonsCompleted}
            </p>
            <p className="text-[13px] text-[#737373] mt-1 font-bold">Lessons</p>
          </div>
          <div className="text-center">
            <p className="text-[23px] font-bold text-[#FFC800]" style={{ lineHeight: '32px' }}>
              {userData.stats.skillsMastered}
            </p>
            <p className="text-[13px] text-[#737373] mt-1 font-bold">Skills Mastered</p>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-[#4B4B4B] text-[17px]" style={{ lineHeight: '24px' }}>Level {userData.stats.currentLevel}</h2>
            <p className="text-[15px] text-[#737373] mt-1">Financial Explorer</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#1CB0F6] text-[17px]" style={{ lineHeight: '24px' }}>{userData.stats.levelProgress}%</p>
            <p className="text-[15px] text-[#737373] mt-1">to next level</p>
          </div>
        </div>
        <ProgressBar
          value={userData.stats.levelProgress}
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
          {userData.achievements.map((achievement) => (
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
          { label: 'Notification Settings', section: 'notifications' },
          { label: 'Voice & Audio', section: 'voice' },
          { label: 'Daily Goal', section: 'goal' },
          { label: 'Language Preferences', section: 'language' },
        ].map((item, index) => (
          <button
            key={item.section}
            onClick={() => navigate(`/settings?section=${item.section}`)}
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

