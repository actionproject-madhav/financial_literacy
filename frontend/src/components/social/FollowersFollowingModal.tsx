import React, { useState, useEffect } from 'react';
import { Users, Loader2, UserMinus } from 'lucide-react';
import { Modal } from './Modal';
import { socialApi, Friend } from '../../services/api';
import { useUserStore } from '../../stores/userStore';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  userId?: string; // Optional: view another user's followers/following
}

export const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({
  isOpen,
  onClose,
  type,
  userId
}) => {
  const { learnerId } = useUserStore();
  const targetUserId = userId || learnerId;
  const [users, setUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          const response = await socialApi.getFollowers(targetUserId);
          setUsers(response.followers);
        } else {
          const response = await socialApi.getFollowing(targetUserId);
          setUsers(response.following);
        }
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, targetUserId, type]);

  const handleUnfollow = async (userId: string) => {
    if (!learnerId) return;

    setProcessing(userId);
    try {
      await socialApi.unfollowUser(learnerId, userId);
      setUsers(prev => prev.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    if (!learnerId) return;

    setProcessing(userId);
    try {
      // To remove a follower, they need to unfollow you
      // This might require a different endpoint or approach
      // For now, we'll just refresh the list
      setUsers(prev => prev.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error('Failed to remove follower:', error);
    } finally {
      setProcessing(null);
    }
  };

  const isViewingOwnProfile = targetUserId === learnerId;
  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1cb0f6] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
            <p className="text-[#afafaf] font-bold">
              No {type} yet
            </p>
            <p className="text-[#afafaf] text-sm mt-1">
              {type === 'followers'
                ? 'Users who follow you will appear here'
                : 'Users you follow will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="border-2 border-[#e5e5e5] rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#1cb0f6] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#3c3c3c] truncate">
                        {user.display_name}
                      </div>
                      <div className="text-sm text-[#afafaf] font-bold">
                        {user.total_xp.toLocaleString()} XP • {user.streak_count} day streak
                      </div>
                      {(user.friendship_since || user.following_since) && (
                        <div className="text-xs text-[#afafaf] mt-1">
                          {type === 'followers' ? 'Following since' : 'Following since'}{' '}
                          {new Date(user.following_since || user.friendship_since || '').toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions - only show for own profile */}
                  {isViewingOwnProfile && (
                    <div className="flex gap-2 flex-shrink-0">
                      {type === 'following' ? (
                        <button
                          onClick={() => handleUnfollow(user.user_id)}
                          disabled={processing === user.user_id}
                          className="border-2 border-[#e5e5e5] text-[#afafaf] hover:border-[#ff4b4b] hover:text-[#ff4b4b] font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processing === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserMinus className="w-4 h-4" />
                              <span className="text-sm">Unfollow</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="border-2 border-[#1cb0f6] text-[#1cb0f6] hover:bg-[#1cb0f6] hover:text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                        >
                          View Profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
