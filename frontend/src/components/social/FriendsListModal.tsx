import React, { useState, useEffect } from 'react';
import { Users, Loader2, UserMinus } from 'lucide-react';
import { Modal } from './Modal';
import { socialApi, Friend } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { ProfileAvatar } from './ProfileAvatar';

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendsListModal: React.FC<FriendsListModalProps> = ({ isOpen, onClose }) => {
  const { learnerId } = useUserStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !learnerId) return;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await socialApi.getFriends(learnerId);
        setFriends(response.friends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isOpen, learnerId]);

  const handleRemoveFriend = async (friendId: string) => {
    if (!learnerId || !confirm('Are you sure you want to remove this friend?')) return;

    setRemoving(friendId);
    try {
      await socialApi.removeFriend(learnerId, friendId);
      setFriends(prev => prev.filter(friend => friend.user_id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Friends" maxWidth="md">
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1cb0f6] animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
            <p className="text-[#afafaf] font-bold">No friends yet</p>
            <p className="text-[#afafaf] text-sm mt-1">
              Search for users to add as friends
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.user_id}
                className="border-2 border-[#e5e5e5] rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <ProfileAvatar
                      profilePictureUrl={friend.profile_picture_url}
                      avatarUrl={friend.avatar_url}
                      displayName={friend.display_name}
                    />

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#3c3c3c] truncate">
                        {friend.display_name}
                      </div>
                      <div className="text-sm text-[#afafaf] font-bold">
                        {friend.total_xp.toLocaleString()} XP • {friend.streak_count} day streak
                      </div>
                      {friend.friendship_since && (
                        <div className="text-xs text-[#afafaf] mt-1">
                          Friends since {new Date(friend.friendship_since).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRemoveFriend(friend.user_id)}
                      disabled={removing === friend.user_id}
                      className="border-2 border-[#e5e5e5] text-[#afafaf] hover:border-[#ff4b4b] hover:text-[#ff4b4b] font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {removing === friend.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span className="text-sm">Remove</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
