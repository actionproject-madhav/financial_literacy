import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { socialApi, UserProfile } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { ProfileAvatar } from './ProfileAvatar';
import { useToast } from '../ui/Toast';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
  const { learnerId } = useUserStore();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length < 2) return;

      setLoading(true);
      try {
        const response = await socialApi.searchUsers(searchQuery, 20);
        // Filter out current user from results
        let filtered = response.users.filter(u => u.user_id !== learnerId);
        
        // For each user, check their relationship status with current user
        if (learnerId) {
          const usersWithStatus = await Promise.all(
            filtered.map(async (user) => {
              try {
                const profile = await socialApi.getUserProfile(user.user_id, learnerId);
                return {
                  ...user,
                  is_friend: profile.is_friend || false,
                  is_following: profile.is_following || false,
                  has_pending_request: profile.has_pending_request || false
                };
              } catch (err) {
                console.error(`Failed to get profile for ${user.user_id}:`, err);
                return user;
              }
            })
          );
          setSearchResults(usersWithStatus);
        } else {
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, learnerId]);

  const handleSendFriendRequest = async (userId: string) => {
    if (!learnerId) return;

    setSendingRequest(userId);
    try {
      await socialApi.sendFriendRequest(learnerId, userId);
      // Refresh user profile to get updated status from database
      try {
        const profile = await socialApi.getUserProfile(userId, learnerId);
        setSearchResults(prev =>
          prev.map(u =>
            u.user_id === userId
              ? { 
                  ...u, 
                  has_pending_request: profile.has_pending_request || true,
                  is_friend: profile.is_friend || false
                }
              : u
          )
        );
        toast.success(`Friend request sent to ${profile.display_name || 'user'}!`);
        // Trigger refresh on ProfilePage
        window.dispatchEvent(new CustomEvent('social-action'));
      } catch (err) {
        // Fallback to optimistic update
        const user = searchResults.find(u => u.user_id === userId);
        setSearchResults(prev =>
          prev.map(u =>
            u.user_id === userId
              ? { ...u, has_pending_request: true }
              : u
          )
        );
        toast.success(`Friend request sent to ${user?.display_name || 'user'}!`);
        window.dispatchEvent(new CustomEvent('social-action'));
      }
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      const errorMessage = error?.message || 'Failed to send friend request';
      const user = searchResults.find(u => u.user_id === userId);
      
      if (errorMessage.includes('already exists') || errorMessage.includes('Friend request already exists')) {
        // Refresh from database to get actual status
        try {
          const profile = await socialApi.getUserProfile(userId, learnerId);
          setSearchResults(prev =>
            prev.map(u =>
              u.user_id === userId
                ? { 
                    ...u, 
                    has_pending_request: profile.has_pending_request || true,
                    is_friend: profile.is_friend || false
                  }
                : u
            )
          );
        } catch (err) {
          setSearchResults(prev =>
            prev.map(u =>
              u.user_id === userId
                ? { ...u, has_pending_request: true }
                : u
            )
          );
        }
        toast.info(`You've already sent a friend request to ${user?.display_name || 'this user'}. They'll see it in their notifications.`);
      } else if (errorMessage.includes('Already friends')) {
        // Refresh from database
        try {
          const profile = await socialApi.getUserProfile(userId, learnerId);
          setSearchResults(prev =>
            prev.map(u =>
              u.user_id === userId
                ? { 
                    ...u, 
                    is_friend: profile.is_friend || true,
                    has_pending_request: false
                  }
                : u
            )
          );
        } catch (err) {
          setSearchResults(prev =>
            prev.map(u =>
              u.user_id === userId
                ? { ...u, is_friend: true, has_pending_request: false }
                : u
            )
          );
        }
        toast.success(`You're already friends with ${user?.display_name || 'this user'}!`);
      } else {
        // Other error
        toast.error(`Unable to send friend request: ${errorMessage}`);
      }
    } finally {
      setSendingRequest(null);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!learnerId) return;

    try {
      await socialApi.followUser(learnerId, userId);
      // Refresh user profile to get updated status from database
      try {
        const profile = await socialApi.getUserProfile(userId, learnerId);
        setSearchResults(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, is_following: profile.is_following || true }
              : user
          )
        );
        toast.success(`Now following ${profile.display_name || 'user'}`);
        // Trigger refresh on ProfilePage
        window.dispatchEvent(new CustomEvent('social-action'));
      } catch (err) {
        // Fallback to optimistic update
        setSearchResults(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, is_following: true }
              : user
          )
        );
        window.dispatchEvent(new CustomEvent('social-action'));
      }
    } catch (error: any) {
      console.error('Failed to follow user:', error);
      const errorMessage = error?.message || 'Failed to follow user';
      if (errorMessage.includes('Already following')) {
        toast.info('You are already following this user.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!learnerId) return;

    try {
      await socialApi.unfollowUser(learnerId, userId);
      // Refresh user profile to get updated status from database
      try {
        const profile = await socialApi.getUserProfile(userId, learnerId);
        setSearchResults(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, is_following: profile.is_following || false }
              : user
          )
        );
        toast.success(`Unfollowed ${profile.display_name || 'user'}`);
        // Trigger refresh on ProfilePage
        window.dispatchEvent(new CustomEvent('social-action'));
      } catch (err) {
        // Fallback to optimistic update
        setSearchResults(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, is_following: false }
              : user
          )
        );
        window.dispatchEvent(new CustomEvent('social-action'));
      }
    } catch (error: any) {
      console.error('Failed to unfollow user:', error);
      toast.error(error?.message || 'Failed to unfollow user');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Find Friends" maxWidth="md">
      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#afafaf]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#e5e5e5] rounded-xl font-bold text-[#3c3c3c] placeholder-[#afafaf] focus:border-[#1cb0f6] focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#1cb0f6] animate-spin" />
            </div>
          )}

          {!loading && searchQuery.trim() && searchResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#afafaf] font-bold">No users found</p>
              <p className="text-[#afafaf] text-sm mt-1">Try searching by name or email</p>
            </div>
          )}

          {!loading && searchResults.map((user) => (
            <div
              key={user.user_id}
              className="border-2 border-[#e5e5e5] rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <ProfileAvatar
                    profilePictureUrl={user.profile_picture_url}
                    avatarUrl={user.avatar_url}
                    displayName={user.display_name}
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#3c3c3c] truncate">{user.display_name}</div>
                    <div className="text-sm text-[#afafaf] font-bold">
                      Level {user.level} • {user.total_xp.toLocaleString()} XP
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {user.is_friend ? (
                    <span className="px-4 py-2 text-[#58cc02] font-bold text-sm">Friends</span>
                  ) : user.has_pending_request ? (
                    <span className="px-4 py-2 text-[#afafaf] font-bold text-sm">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleSendFriendRequest(user.user_id)}
                      disabled={sendingRequest === user.user_id}
                      className="bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingRequest === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">Add</span>
                        </>
                      )}
                    </button>
                  )}

                  {!user.is_following ? (
                    <button
                      onClick={() => handleFollow(user.user_id)}
                      className="border-2 border-[#1cb0f6] text-[#1cb0f6] hover:bg-[#1cb0f6] hover:text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                    >
                      Follow
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnfollow(user.user_id)}
                      className="border-2 border-[#e5e5e5] text-[#afafaf] hover:border-[#ff4b4b] hover:text-[#ff4b4b] font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                    >
                      Following
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!searchQuery.trim() && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
            <p className="text-[#afafaf] font-bold">Search for friends</p>
            <p className="text-[#afafaf] text-sm mt-1">Enter a name or email to get started</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
