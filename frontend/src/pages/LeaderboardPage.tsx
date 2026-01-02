import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUserStore } from '../stores/userStore';
import { leaderboardApi, MyLeagueResponse, League, socialApi } from '../services/api';

// --- Custom SVGs for "Non-Tacky" Look ---

const LeagueShield: React.FC<{
  state: 'locked' | 'unlocked' | 'current';
  color: string;
  className?: string;
}> = ({ state, color, className }) => {
  const isLocked = state === 'locked';
  const isCurrent = state === 'current';

  // Duolingo-style simple shield shape
  const dShieldPath = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";

  return (
    <div className={cn("relative flex items-center justify-center transition-transform hover:scale-105", className)}>
      {/* Background Shadow/Stroke */}
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
        <path
          d={dShieldPath}
          fill={isLocked ? "#E5E7EB" : (isCurrent ? color : "currentColor")}
          className={cn(
            isLocked ? "text-gray-200" : (isCurrent ? "" : "text-gray-300")
          )}
          stroke={isLocked ? "#D1D5DB" : (isCurrent ? color : "currentColor")}
          strokeWidth="0"
        />
        {/* Inner Detail (Optional) */}
        <path
          d="M12 4L4 7v5c0 4.5 5 7.5 8 9 3-1.5 8-4.5 8-9V7l-8-3z"
          fill={isLocked ? "#F3F4F6" : (isCurrent ? color : "#E5E7EB")}
          fillOpacity={isCurrent ? 0.2 : 1}
          className="mix-blend-multiply"
        />
        {isLocked && (
          <path d="M12 8a2 2 0 0 1 2 2v2h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v-2a2 2 0 0 1 2-2z" fill="#9CA3AF" />
        )}
        {isCurrent && (
          <path d="M16 9l-2 8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        )}
      </svg>
    </div>
  );
};

const FireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M13.5 1.5c.3 1.2-.2 2.5-1.2 3.3-1.8 1.5-3.5 3.2-3.8 5.6-.4 3.7 2.4 6.9 6 7.3 1.5.2 3-.2 4.3-1 .5-.3 1.1-.3 1.5.2.4.5.3 1.2-.2 1.6-1.8 1.6-4.2 2.5-6.6 2.5C7.8 21 3 16.2 3 10.3c0-4.8 2.3-9.1 6.1-12 1.1-.7 2.6-.4 3.2.7.4.8.7 1.7 1.2 2.5z" />
  </svg>
);

export const LeaderboardPage: React.FC = () => {
  const { user, learnerId } = useUserStore();
  const [leagueData, setLeagueData] = useState<MyLeagueResponse | null>(null);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [friendStreaks, setFriendStreaks] = useState<Array<{
    user_id: string;
    display_name: string;
    streak_count: number;
    profile_picture_url?: string;
    avatar_url?: string;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!learnerId) {
        setError('Please log in to view leaderboard');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all leagues, current user's league data, friends, and friend streaks
        const [leaguesResponse, myLeagueResponse, friendsResponse, streaksResponse] = await Promise.all([
          leaderboardApi.getLeagues(),
          leaderboardApi.getMyLeague(learnerId),
          socialApi.getFriends(learnerId).catch(() => ({ friends: [], count: 0 })),
          socialApi.getFriendStreaks(learnerId).catch(() => ({ active_streaks: [], count: 0 }))
        ]);

        setAllLeagues(leaguesResponse.leagues);
        setLeagueData(myLeagueResponse);

        // Store friend IDs for filtering
        const ids = new Set(friendsResponse.friends.map(f => f.user_id));
        setFriendIds(ids);
        
        // Store friend streaks
        setFriendStreaks(streaksResponse.active_streaks || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [learnerId]);

  const formatTimeRemaining = (days: number, hours: number) => {
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} left`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    }
    return 'Less than an hour left';
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500 font-medium">Loading leaderboard...</div>
        </div>
    );
  }

  if (error || !leagueData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500 font-medium">{error || 'Failed to load leaderboard'}</div>
      </div>
    );
  }

  const currentLeagueIndex = allLeagues.findIndex(l => l.id === leagueData.league.id);
  const currentLeague = leagueData.league;

  // Filter rankings based on friends-only toggle
  const filteredRankings = friendsOnly
    ? leagueData.rankings.filter(entry =>
        entry.is_current_user || entry.learner_id === learnerId || friendIds.has(entry.learner_id)
      )
    : leagueData.rankings;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 flex gap-8 items-start">
        {/* === Left Column: Leaderboard === */}
        <div className="flex-1 max-w-2xl">
          {/* League Header */}
          <div className="flex flex-col items-center mb-8 sticky top-0 bg-white z-50 pt-10 pb-6 border-b border-gray-100">
            {/* Friends Filter Toggle */}
            {friendIds.size > 0 && (
              <div className="mb-4 w-full flex justify-end">
                <button
                  onClick={() => setFriendsOnly(!friendsOnly)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
                    friendsOnly
                      ? "bg-[#1cb0f6] text-white shadow-md"
                      : "bg-gray-100 text-[#777] hover:bg-gray-200"
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span>Friends Only</span>
                  {friendsOnly && <span className="ml-1">({filteredRankings.length})</span>}
                </button>
              </div>
            )}

            {/* League Icons */}
            <div className="flex items-center gap-4 mb-4">
              {allLeagues.map((league, idx) => {
                const isActive = league.id === currentLeague.id;
                const isLocked = idx > currentLeagueIndex;

                return (
                  <div key={league.id} className="flex flex-col items-center">
                    <LeagueShield
                      state={isLocked ? 'locked' : (isActive ? 'current' : 'unlocked')}
                      color={league.color}
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "w-20 h-20 -mb-2 z-10 drop-shadow-md" : "w-12 h-12"
                      )}
                    />
              </div>
                );
              })}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2">
              {currentLeague.name} League
            </h1>
            <p className="text-gray-500 font-medium">
              Top 10 advance to the next league
            </p>
            <div className="mt-3 px-4 py-1.5 bg-white border border-yellow-400 text-yellow-600 rounded-xl text-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-400" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{formatTimeRemaining(leagueData.time_remaining.days, leagueData.time_remaining.hours)}</span>
            </div>
      </div>

          {/* List */}
          <div className="flex flex-col gap-0.5 relative z-0">
            {filteredRankings.map((entry, index) => {
              const isTop3 = index < 3;
              const isPromotionCutoff = index === 9;
              const isCurrentUser = entry.is_current_user || entry.learner_id === learnerId;

              return (
                <React.Fragment key={entry.learner_id}>
          <motion.div
                    initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
            className={cn(
                      "flex items-center gap-4 py-3 px-4 rounded-xl transition-colors",
                      isCurrentUser
                        ? "bg-white border-2 border-sky-400 z-20 sticky bottom-4 shadow-lg my-2 translate-y-[-2px]"
                        : "hover:bg-gray-50 bg-white border border-transparent"
            )}
          >
            {/* Rank */}
                    <div className={cn(
                      "w-8 text-center font-bold text-lg",
                      index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" :
                          index === 2 ? "text-orange-500" :
                            "text-gray-400"
              )}>
                {entry.rank}
            </div>

            {/* Avatar */}
                    {(entry.profile_image || entry.avatar_url || entry.profile_picture_url) ? (
                      <img
                        src={entry.profile_image || entry.avatar_url || entry.profile_picture_url}
                        alt={entry.display_name}
                        className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : isCurrentUser ? 'bg-sky-400' : 'bg-indigo-400'}">${entry.initials || entry.display_name.charAt(0).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm",
                        index === 0 ? "bg-yellow-400" :
                          index === 1 ? "bg-gray-400" :
                            index === 2 ? "bg-orange-400" :
                              isCurrentUser ? "bg-sky-400" : "bg-indigo-400"
                      )}>
                        {entry.initials || entry.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 font-bold text-gray-700">
                      {entry.display_name} {isCurrentUser && <span className="text-gray-400 text-sm font-medium ml-2">(You)</span>}
                    </div>

                    {/* XP */}
                    <div className="text-gray-600 font-bold text-sm">
                      {entry.weekly_xp} XP
                    </div>
                  </motion.div>

                  {/* Promotion Divider */}
                  {isPromotionCutoff && (
                    <div className="flex items-center gap-4 my-2 px-2">
                      <div className="h-[2px] flex-1 bg-green-100 rounded-full"></div>
                      <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-lg">
                        Promotion Zone
                      </span>
                      <div className="h-[2px] flex-1 bg-green-100 rounded-full"></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* === Right Column: Sidebar === */}
        <div className="w-[380px] hidden lg:flex flex-col gap-6 sticky top-8 pt-8">
          {/* Streak Card */}
          <div className="bg-[#FFFDF0] rounded-2xl p-6 border-2 border-transparent relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#D98229] mb-1">
                  {leagueData.my_ranking?.streak || 0} day streak
                </h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  {leagueData.my_ranking?.streak === 0 
                    ? "Do a lesson today to start a new streak!"
                    : "Keep it going!"}
                </p>
              </div>
              <div className="w-16 h-16">
                <FireIcon className="text-[#FCD34D] opacity-40 w-full h-full" />
              </div>
            </div>

            {/* Days */}
            <div className="flex justify-between items-center mt-6">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">{day}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                </div>
        ))}
            </div>
          </div>

          {/* Friend Streaks */}
          <div className="bg-[#FF6D00] rounded-2xl p-6 text-white relative flex flex-col items-start gap-4">
            <div className="relative z-10 w-full">
              <h3 className="text-lg font-extrabold mb-2">Friend Streaks</h3>
              <p className="text-white/80 text-sm font-medium mb-4">
                {friendStreaks.length} active Friend Streak{friendStreaks.length !== 1 ? 's' : ''}
              </p>
              
              {/* Friend Streaks List */}
              {friendStreaks.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {friendStreaks.slice(0, 5).map((friend) => (
                    <div key={friend.user_id} className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                      {(friend.avatar_url || friend.profile_picture_url) ? (
                        <img
                          src={friend.avatar_url || friend.profile_picture_url}
                          alt={friend.display_name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">${friend.display_name.charAt(0).toUpperCase()}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                          {friend.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate">{friend.display_name}</div>
                        <div className="text-white/80 text-xs">{friend.streak_count} day streak</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-xs mb-4">No friends with active streaks yet</p>
              )}
            </div>
            <button className="w-full py-3 bg-white text-[#FF6D00] font-extrabold rounded-xl text-sm hover:bg-gray-50 transition-colors uppercase tracking-wide">
              View List
            </button>
            <FireIcon className="absolute top-4 right-4 text-white/20 w-12 h-12 rotate-12" />
          </div>

          {/* Streak Society */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-400" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                </svg>
              </div>
            <div>
                <h3 className="font-extrabold text-gray-800">Streak Society</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  Reach a 7 day streak to join the Streak Society and earn exclusive rewards.
              </p>
              </div>
            </div>
            <button className="w-full py-3 bg-sky-400 text-white font-extrabold rounded-xl text-sm hover:bg-sky-500 transition-colors uppercase tracking-wide">
              View Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
