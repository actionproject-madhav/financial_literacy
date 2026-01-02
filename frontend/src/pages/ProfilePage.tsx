import React, { useState, useEffect } from 'react';
import { Settings, Share2, ChevronRight, X, Edit2, Check, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, IconButton } from '../components/ui';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { XPDisplay } from '../components/gamification/XPDisplay';
import { AchievementBadge } from '../components/gamification/AchievementBadge';
import { useUserStore } from '../stores/userStore';
import { learnerApi, socialApi, adaptiveApi } from '../services/api';
import { UserSearchModal } from '../components/social/UserSearchModal';
import { FriendRequestsModal } from '../components/social/FriendRequestsModal';
import { ReferralModal } from '../components/social/ReferralModal';
import { FollowersFollowingModal } from '../components/social/FollowersFollowingModal';
import { FriendsListModal } from '../components/social/FriendsListModal';
import { cn } from '../utils/cn';
import { useToast } from '../components/ui/Toast';
import { LottieAnimation } from '../components/LottieAnimation';

const AVATAR_OPTIONS = [
  '/characters/12.png',
  '/characters/13.png',
  '/characters/14.png',
  '/characters/15.png',
  '/characters/16.png',
  '/characters/17.png',
  '/characters/18.png',
  '/characters/19.png',
  '/characters/20.png',
];

const BACKGROUND_COLORS = [
  '#89e219', // Green
  '#1cb0f6', // Blue
  '#ff4b4b', // Red
  '#ffc800', // Yellow
  '#ce82ff', // Purple
  '#ff96bc', // Pink
  '#ff9600', // Orange
];

const COUNTRY_OPTIONS = [
  { code: 'us', name: 'United States' },
  { code: 'in', name: 'India' },
  { code: 'cn', name: 'China' },
  { code: 'mx', name: 'Mexico' },
  { code: 'ph', name: 'Philippines' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'kr', name: 'South Korea' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'ca', name: 'Canada' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'br', name: 'Brazil' },
  { code: 'fr', name: 'France' },
];

const VISA_STATUS_OPTIONS = [
  'F-1 Student',
  'H-1B Specialty',
  'J-1 Exchange',
  'L-1 Intracompany',
  'O-1 Extraordinary',
  'TN NAFTA',
  'Green Card',
  'Citizen',
  'Other',
];

interface ProfileStats {
  learner_id: string;
  display_name: string;
  username?: string;
  joined_date?: string;
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
  current_league?: string;
  top_3_finishes?: number;
  following?: number;
  followers?: number;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, user: storeUser } = useUserStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Social Modals State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendSuggestions, setFriendSuggestions] = useState<Array<{
    user_id: string;
    display_name: string;
    total_xp: number;
    streak_count: number;
    reason: string;
  }>>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<any[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<any[]>([]);
  // Track friend request states
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const toast = useToast();

  // Customization State - Load from localStorage for persistence
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profileAvatar') || '/3d-models/monster-1.png';
    }
    return '/3d-models/monster-1.png';
  });
  const [selectedBgColor, setSelectedBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profileBgColor') || '#89e219';
    }
    return '#89e219';
  });
  // Country and visa status from database (not localStorage)
  const [selectedCountry, setSelectedCountry] = useState('us');
  const [selectedVisaStatus, setSelectedVisaStatus] = useState('Other');

  // Save to database and localStorage when user saves changes
  const handleSaveProfile = async () => {
    if (!learnerId) return;
    
    try {
      // Save to database
      await learnerApi.updateProfile(learnerId, {
        avatar_url: selectedAvatar,
        country_of_origin: selectedCountry.toUpperCase(),
        visa_type: selectedVisaStatus,
      });
      
      // Also save to localStorage for quick access
      localStorage.setItem('profileAvatar', selectedAvatar);
      localStorage.setItem('profileBgColor', selectedBgColor);
      localStorage.setItem('profileCountry', selectedCountry);
      localStorage.setItem('profileVisaStatus', selectedVisaStatus);
      
      setIsEditingProfile(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  // Fetch real profile stats from backend
  const fetchStats = React.useCallback(async () => {
    if (!learnerId) {
      setError('Please log in to view your profile');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[ProfilePage] Fetching stats from database for learner:', learnerId);
      const profileStats = await learnerApi.getStats(learnerId);

      // Use ALL data from backend - NO MOCK DATA
      setStats({
        ...profileStats,
        username: profileStats.username || undefined,
        joined_date: profileStats.joined_date || 'January 2024', // Fallback only if backend doesn't provide
        current_league: profileStats.current_league || 'Bronze', // Fallback only if backend doesn't provide
        top_3_finishes: profileStats.top_3_finishes || 0,
        following: profileStats.following || 0,
        followers: profileStats.followers || 0
      } as ProfileStats);

      // Load avatar from database if available
      try {
        const profile = await learnerApi.getProfile(learnerId);
        if (profile?.avatar_url) {
          setSelectedAvatar(profile.avatar_url);
        } else if (profile?.profile_picture_url) {
          setSelectedAvatar(profile.profile_picture_url);
        }
      } catch (err) {
        console.error('Failed to load profile avatar:', err);
      }

      // Update country and visa status from database
      if (profileStats.country_of_origin) {
        // Convert country code to lowercase for flag display
        const countryCode = profileStats.country_of_origin.toLowerCase();
        setSelectedCountry(countryCode);
      }
      if (profileStats.visa_type) {
        setSelectedVisaStatus(profileStats.visa_type);
      }

    } catch (err) {
      console.error('[ProfilePage] Failed to fetch profile stats:', err);
      setError('Failed to load profile data. Please check your connection.');
      setStats(null); // Trigger error state
    } finally {
      setIsLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch social stats, friend suggestions, and achievements
  useEffect(() => {
    if (!learnerId) return;

    const fetchSocialData = async () => {
      try {
        const [friendsRes, followersRes, followingRes, requestsRes, suggestionsRes, earnedAchievementsRes, availableAchievementsRes] = await Promise.all([
          socialApi.getFriends(learnerId),
          socialApi.getFollowers(learnerId),
          socialApi.getFollowing(learnerId),
          socialApi.getFriendRequests(learnerId, 'received'),
          socialApi.getFriendSuggestions(learnerId, 5),
          learnerApi.getAchievements(learnerId).catch(() => []),
          adaptiveApi.getAvailableAchievements(learnerId).catch(() => []),
        ]);

        setFriendsCount(friendsRes.count);
        setFollowersCount(followersRes.count);
        setFollowingCount(followingRes.count);
        setPendingRequestsCount(requestsRes.count);
        setFriendSuggestions(suggestionsRes.suggestions || []);
        setEarnedAchievements(Array.isArray(earnedAchievementsRes) ? earnedAchievementsRes : (earnedAchievementsRes as any).achievements || []);
        setAvailableAchievements(Array.isArray(availableAchievementsRes) ? availableAchievementsRes : (availableAchievementsRes as any).achievements || []);
      } catch (error) {
        console.error('Failed to fetch social data:', error);
      }
    };

    fetchSocialData();
  }, [learnerId]);

  // Refresh stats when page becomes visible (e.g., after completing a lesson)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only refresh if we have a valid MongoDB ObjectId
      const isValidLearnerId = learnerId && /^[0-9a-fA-F]{24}$/.test(learnerId)
      if (document.visibilityState === 'visible' && isValidLearnerId) {
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

  // Show error state (only if no stats available)
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load profile'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Use real data from backend - ALL FROM DATABASE
  const userData = {
    name: stats.display_name,
    username: stats.username || `@${stats.display_name.toLowerCase().replace(/\s+/g, '')}`,
    joined: stats.joined_date, // From database created_at
    following: stats.following, // From database
    followers: stats.followers, // From database
    stats: {
      streak: stats.streak_count, // From database
      totalXP: stats.total_xp, // From database
      league: stats.current_league, // Calculated from XP
      topFinishes: stats.top_3_finishes // From database (currently 0, can be implemented later)
    }
  };

  return (
    <div className="max-w-[1056px] mx-auto px-4 py-6 flex flex-col md:flex-row gap-8">

      {/* LEFT COLUMN - Main Profile Info */}
      <div className="flex-1 min-w-0 space-y-8">

        {/* Profile Header */}
        <div className="space-y-4">
          <div className="relative">
            {/* Banner */}
            <div className="h-48 bg-[#dceeff] rounded-2xl relative">
              <button className="absolute top-4 right-4 text-[#1cb0f6] hover:bg-[#cce5ff] p-2 rounded-xl transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar with Edit Button */}
            <div className="absolute -bottom-4 left-6 group">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-transparent rounded-full border-4 border-white overflow-hidden relative">
                <img
                  src={selectedAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover transition-colors duration-300"
                  style={{ backgroundColor: selectedBgColor }}
                />

                {/* Edit Overlay */}
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Edit2 className="w-8 h-8 text-white" />
                </button>
              </div>

              <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-8 h-8 bg-[#1cb0f6] rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-[#1899d6] transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="pt-2 px-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-[#3c3c3c]">{userData.name}</h1>
              <p className="text-[#a5a5a5] font-medium mb-2">{userData.username}</p>
              <p className="text-[#a5a5a5] text-sm font-medium mb-3">Joined {userData.joined}</p>
              <div className="flex gap-4 text-[#1cb0f6] font-bold text-sm">
                <span className="cursor-pointer hover:opacity-80" onClick={() => setShowFollowingModal(true)}>
                  {followingCount} Following
                </span>
                <span className="cursor-pointer hover:opacity-80" onClick={() => setShowFollowersModal(true)}>
                  {followersCount} Followers
                </span>
                {friendsCount > 0 && (
                  <span className="cursor-pointer hover:opacity-80" onClick={() => setShowFriendsModal(true)}>
                    {friendsCount} Friends
                  </span>
                )}
              </div>
            </div>

            {/* Flag Icon */}
            <div className="mt-2 flex flex-col items-end gap-2">
              <img src={`https://flagcdn.com/w80/${selectedCountry}.png`} alt="Country" className="w-8 rounded-md shadow-sm opacity-80" />
              <Badge variant="xp" size="sm" className="whitespace-nowrap">{selectedVisaStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div>
          <h2 className="text-2xl font-bold text-[#3c3c3c] mb-6">Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Streak Card */}
            <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-6 h-6">
                <img src="/fire.svg" alt="Streak" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-xl font-bold text-[#4b4b4b]">{userData.stats.streak}</div>
                <div className="text-[#777] text-sm font-bold uppercase tracking-wide">Day streak</div>
              </div>
            </div>

            {/* XP Card */}
            <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-6 h-6">
                <img src="/coin.svg" alt="XP" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-xl font-bold text-[#4b4b4b]">{userData.stats.totalXP}</div>
                <div className="text-[#777] text-sm font-bold uppercase tracking-wide">Total XP</div>
              </div>
            </div>

            {/* League Card */}
            <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                <LottieAnimation 
                  src="shield.json" 
                  className="w-full h-full"
                  loop={true}
                />
              </div>
              <div>
                <div className="text-xl font-bold text-[#4b4b4b]">{userData.stats.league}</div>
                <div className="text-[#777] text-sm font-bold uppercase tracking-wide">Current league</div>
              </div>
            </div>

            {/* Top Finishes Card */}
            <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-6 h-6">
                <img src="/trophy.svg" alt="Trophy" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-xl font-bold text-[#4b4b4b]">{userData.stats.topFinishes}</div>
                <div className="text-[#777] text-sm font-bold uppercase tracking-wide">Top 3 finishes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Friend Suggestions */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#3c3c3c]">Friend suggestions</h2>
            <button 
              onClick={() => setShowSearchModal(true)}
              className="text-[#1cb0f6] font-bold text-sm uppercase tracking-wider hover:opacity-80"
            >
              VIEW ALL
            </button>
          </div>

          {friendSuggestions.length > 0 ? (
            <div className="space-y-4">
              {friendSuggestions.map((suggestion) => (
                <div key={suggestion.user_id} className="border-2 border-[#e5e5e5] rounded-2xl p-6 relative flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-[#1cb0f6] flex items-center justify-center text-white text-3xl font-extrabold mb-3 shadow-sm">
                    {suggestion.display_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-xl font-bold text-[#3c3c3c] mb-1">{suggestion.display_name}</div>
                  <div className="text-[#afafaf] font-bold text-sm mb-6">{suggestion.reason}</div>

                  <button 
                    onClick={async () => {
                      if (!learnerId || sendingRequests.has(suggestion.user_id) || sentRequests.has(suggestion.user_id)) {
                        return;
                      }

                      setSendingRequests(prev => new Set(prev).add(suggestion.user_id));
                      
                      try {
                        await socialApi.sendFriendRequest(learnerId, suggestion.user_id);
                        // Success - mark as sent
                        setSentRequests(prev => new Set(prev).add(suggestion.user_id));
                        // Show success message
                        toast.success(`Friend request sent to ${suggestion.display_name}!`);
                        // Refresh suggestions to remove this user
                        try {
                          const res = await socialApi.getFriendSuggestions(learnerId, 5);
                          setFriendSuggestions(res.suggestions || []);
                        } catch (refreshErr) {
                          console.error('Failed to refresh suggestions:', refreshErr);
                        }
                      } catch (err: any) {
                        console.error('Failed to send friend request:', err);
                        // Handle specific error cases
                        const errorMessage = err?.message || 'Failed to send friend request';
                        if (errorMessage.includes('already exists') || errorMessage.includes('Friend request already exists')) {
                          // Request already exists - mark as sent and show friendly message
                          setSentRequests(prev => new Set(prev).add(suggestion.user_id));
                          toast.info(`You've already sent a friend request to ${suggestion.display_name}. They'll see it in their notifications.`);
                        } else if (errorMessage.includes('Already friends')) {
                          // Already friends - mark as sent
                          setSentRequests(prev => new Set(prev).add(suggestion.user_id));
                          toast.success(`You're already friends with ${suggestion.display_name}!`);
                        } else {
                          // Other error
                          toast.error(`Unable to send friend request: ${errorMessage}`);
                        }
                      } finally {
                        setSendingRequests(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(suggestion.user_id);
                          return newSet;
                        });
                      }
                    }}
                    disabled={sendingRequests.has(suggestion.user_id) || sentRequests.has(suggestion.user_id)}
                    className={cn(
                      "w-full font-extrabold py-3.5 rounded-xl uppercase tracking-widest text-sm transition-all",
                      sentRequests.has(suggestion.user_id)
                        ? "bg-[#58cc02] hover:bg-[#46a302] text-white shadow-[0_4px_0_#46a302] active:shadow-none active:translate-y-[4px] cursor-default"
                        : sendingRequests.has(suggestion.user_id)
                        ? "bg-[#afafaf] text-white shadow-[0_4px_0_#999] cursor-wait"
                        : "bg-[#1cb0f6] hover:bg-[#1899d6] text-white shadow-[0_4px_0_#1899d6] active:shadow-none active:translate-y-[4px]"
                    )}
                  >
                    {sendingRequests.has(suggestion.user_id) 
                      ? 'Sending...' 
                      : sentRequests.has(suggestion.user_id)
                      ? 'Request Sent ✓'
                      : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-[#e5e5e5] rounded-2xl p-6 text-center">
              <p className="text-[#afafaf] font-bold text-sm">No suggestions available</p>
              <button 
                onClick={() => setShowSearchModal(true)}
                className="mt-4 text-[#1cb0f6] font-bold text-sm uppercase tracking-wider hover:opacity-80"
              >
                Search for friends
              </button>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div>
          <div className="flex justify-between items-center mb-6 mt-10">
            <h2 className="text-2xl font-bold text-[#3c3c3c]">Achievements</h2>
            <button className="text-[#1cb0f6] font-bold text-sm uppercase tracking-wider hover:opacity-80">VIEW ALL</button>
          </div>

          <div className="border-2 border-[#e5e5e5] rounded-2xl overflow-hidden">
            {/* Show earned achievements first */}
            {earnedAchievements.length > 0 && earnedAchievements.slice(0, 3).map((achievement, index) => {
              const isLast = index === Math.min(earnedAchievements.length - 1, 2) && availableAchievements.length === 0;
              return (
                <div key={achievement.achievement_id || index} className={`p-6 flex gap-6 items-center ${!isLast ? 'border-b-2 border-[#e5e5e5]' : ''}`}>
                  <div className="w-20 h-24 bg-[#58cc02] rounded-xl flex flex-col items-center justify-center relative shrink-0 transform rotate-[2deg] shadow-sm border-b-4 border-[#46a302]">
                    {achievement.icon_url ? (
                      <img src={achievement.icon_url} alt={achievement.name} className="w-12 h-12 mb-2 object-contain" />
                    ) : (
                      <img src="/trophy.svg" alt={achievement.name} className="w-10 h-10 mb-2 filter brightness-0 invert" />
                    )}
                    <div className="absolute bottom-2 text-[10px] font-black text-white uppercase tracking-wide">Earned</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold text-[#3c3c3c] text-lg">{achievement.name}</h3>
                    </div>
                    <p className="text-[#777] text-md font-medium">{achievement.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Show available achievements with progress */}
            {availableAchievements.length > 0 && availableAchievements.slice(0, 3 - earnedAchievements.length).map((achievement, index) => {
              const progress = achievement.progress || 0;
              const threshold = achievement.threshold || 1;
              const progressPercent = Math.min((progress / threshold) * 100, 100);
              const isLast = index === availableAchievements.length - 1 && earnedAchievements.length === 0;
              
              return (
                <div key={achievement.achievement_id || `available-${index}`} className={`p-6 flex gap-6 items-center ${!isLast ? 'border-b-2 border-[#e5e5e5]' : ''}`}>
                  <div className="w-20 h-24 bg-[#ff4b4b] rounded-xl flex flex-col items-center justify-center relative shrink-0 transform rotate-[-3deg] shadow-sm border-b-4 border-[#ce3a3a]">
                    {achievement.icon_url ? (
                      <img src={achievement.icon_url} alt={achievement.name} className="w-10 h-10 mb-2 filter brightness-0 invert" />
                    ) : (
                      <img src="/fire.svg" alt={achievement.name} className="w-10 h-10 mb-2 filter brightness-0 invert" />
                    )}
                    <div className="absolute bottom-2 text-[10px] font-black text-white uppercase tracking-wide">
                      {progress >= threshold ? 'Done' : `${Math.floor(progressPercent)}%`}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold text-[#3c3c3c] text-lg">{achievement.name}</h3>
                      <span className="text-[#afafaf] font-bold">{progress}/{threshold}</span>
                    </div>
                    <div className="h-4 bg-[#e5e5e5] rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-[#ffc800] rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-[#777] text-md font-medium">{achievement.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Show message if no achievements */}
            {earnedAchievements.length === 0 && availableAchievements.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-[#afafaf] font-bold text-sm">No achievements yet. Complete lessons to earn achievements!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN - Sidebar Widgets */}
      <div className="w-full md:w-[350px] space-y-6">

        {/* Following/Followers Widget */}
        <div className="border-2 border-[#e5e5e5] rounded-2xl overflow-hidden bg-white">
          <div className="flex border-b-2 border-[#e5e5e5]">
            <button
              onClick={() => setShowFollowingModal(true)}
              className="flex-1 py-3 text-sm font-bold text-[#3c3c3c] border-b-2 border-[#1cb0f6] -mb-[2px] hover:bg-gray-50 transition-colors"
            >
              FOLLOWING ({followingCount})
            </button>
            <button
              onClick={() => setShowFollowersModal(true)}
              className="flex-1 py-3 text-sm font-bold text-[#777] hover:bg-gray-50 transition-colors"
            >
              FOLLOWERS ({followersCount})
            </button>
          </div>
          <div className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
            <img src="/happy-women.gif" alt="Community" className="w-32 h-32 object-contain mb-4" />
            <p className="text-[#777] text-[15px] leading-relaxed">
              Learning is more fun and effective when you connect with others.
            </p>
          </div>
        </div>

        {/* Add Friends Widget */}
        <div className="border-2 border-[#e5e5e5] rounded-2xl bg-white p-2">
          <h3 className="font-bold text-[#3c3c3c] text-lg px-4 py-2">Add friends</h3>

          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-[#1cb0f6]" />
              </div>
              <span className="font-bold text-[#3c3c3c] group-hover:text-[#1cb0f6] transition-colors">Find friends</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#ccc]" />
          </button>

          {pendingRequestsCount > 0 && (
            <button
              onClick={() => setShowFriendRequestsModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center relative">
                  <UserPlus className="w-5 h-5 text-[#ce82ff]" />
                  {pendingRequestsCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4b4b] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {pendingRequestsCount}
                    </div>
                  )}
                </div>
                <span className="font-bold text-[#3c3c3c] group-hover:text-[#ce82ff] transition-colors">Friend requests</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#ccc]" />
            </button>
          )}

          <button
            onClick={() => setShowReferralModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✉️</div>
              </div>
              <span className="font-bold text-[#3c3c3c] group-hover:text-green-500 transition-colors">Invite friends</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#ccc]" />
          </button>
        </div>

        {/* Small footer links */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#afafaf] text-xs font-bold justify-center px-4">
          <a href="#" className="hover:text-[#1cb0f6]">ABOUT</a>
          <a href="#" className="hover:text-[#1cb0f6]">BLOG</a>
          <a href="#" className="hover:text-[#1cb0f6]">STORE</a>
          <a href="#" className="hover:text-[#1cb0f6]">EFFICACY</a>
          <a href="#" className="hover:text-[#1cb0f6]">CAREERS</a>
          <a href="#" className="hover:text-[#1cb0f6]">INVESTORS</a>
          <a href="#" className="hover:text-[#1cb0f6]">TERMS</a>
          <a href="#" className="hover:text-[#1cb0f6]">PRIVACY</a>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-[#3c3c3c]">Customize Profile</h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent hover:bg-gray-100 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col items-center mb-8">
                {/* Preview */}
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden relative mb-4">
                  <img
                    src={selectedAvatar}
                    alt="Preview"
                    className="w-full h-full object-cover transition-colors duration-300"
                    style={{ backgroundColor: selectedBgColor }}
                  />
                </div>
                <h3 className="text-[#777] font-bold text-sm uppercase tracking-wide">Preview</h3>
              </div>

              {/* Avatar Selection */}
              <div className="mb-8">
                <h3 className="text-[#3c3c3c] font-bold text-lg mb-4">Choose Avatar</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => setSelectedAvatar('/3d-models/monster-1.png')}
                    className={`rounded-xl border-2 overflow-hidden transition-all aspect-square ${selectedAvatar === '/3d-models/monster-1.png' ? 'border-[#1cb0f6] ring-2 ring-[#1cb0f6]/30 scale-105' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <div className="w-full h-full bg-[#89e219]">
                      <img src="/3d-models/monster-1.png" alt="Default" className="w-full h-full object-cover" />
                    </div>
                  </button>
                  {AVATAR_OPTIONS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`rounded-xl border-2 overflow-hidden transition-all aspect-square ${selectedAvatar === avatar ? 'border-[#1cb0f6] ring-2 ring-[#1cb0f6]/30 scale-105' : 'border-transparent hover:border-gray-200'}`}
                    >
                      <div className="w-full h-full bg-gray-100">
                        <img src={avatar} alt={`Option ${index}`} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Selection */}
              <div className="mb-8">
                <h3 className="text-[#3c3c3c] font-bold text-lg mb-4">Background Color</h3>
                <div className="flex flex-wrap gap-4">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedBgColor(color)}
                      className={`w-12 h-12 rounded-full border-4 transition-all flex items-center justify-center ${selectedBgColor === color ? 'border-[#3c3c3c] scale-110' : 'border-white shadow-sm hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedBgColor === color && <Check className="w-6 h-6 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div className="mb-8">
                <h3 className="text-[#3c3c3c] font-bold text-lg mb-4">Country of Origin</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {COUNTRY_OPTIONS.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => setSelectedCountry(country.code)}
                      className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedCountry === country.code ? 'border-[#1cb0f6] bg-blue-50 ring-2 ring-[#1cb0f6]/30' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                    >
                      <img
                        src={`https://flagcdn.com/w80/${country.code}.png`}
                        alt={country.name}
                        className="w-10 rounded-md shadow-sm"
                      />
                      <span className="text-xs font-bold text-[#777] text-center line-clamp-1">{country.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visa Status Selection */}
              <div className="mb-8">
                <h3 className="text-[#3c3c3c] font-bold text-lg mb-4">Visa Status</h3>
                <div className="flex flex-wrap gap-2">
                  {VISA_STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedVisaStatus(status)}
                      className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedVisaStatus === status ? 'border-[#1cb0f6] bg-[#1cb0f6] text-white shadow-md' : 'border-gray-200 bg-white text-[#777] hover:bg-gray-50'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Social Modals */}
      <UserSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <FriendRequestsModal isOpen={showFriendRequestsModal} onClose={() => setShowFriendRequestsModal(false)} />
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} />
      <FriendsListModal isOpen={showFriendsModal} onClose={() => setShowFriendsModal(false)} />
      <FollowersFollowingModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        type="followers"
      />
      <FollowersFollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        type="following"
      />
    </div>
  );
};
