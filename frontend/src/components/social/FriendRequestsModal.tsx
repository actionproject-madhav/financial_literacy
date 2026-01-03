import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Loader2, Users } from 'lucide-react';
import { Modal } from './Modal';
import { socialApi, FriendRequest } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { ProfileAvatar } from './ProfileAvatar';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ isOpen, onClose }) => {
  const { learnerId } = useUserStore();
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (!isOpen || !learnerId) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const [received, sent] = await Promise.all([
          socialApi.getFriendRequests(learnerId, 'received'),
          socialApi.getFriendRequests(learnerId, 'sent'),
        ]);
        setReceivedRequests(received.requests);
        setSentRequests(sent.requests);
      } catch (error) {
        console.error('Failed to fetch friend requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [isOpen, learnerId]);

  const handleAccept = async (requestId: string) => {
    if (!learnerId) return;
    
    setProcessing(requestId);
    try {
      await socialApi.acceptFriendRequest(requestId);
      // Refresh from database
      const [received, sent] = await Promise.all([
        socialApi.getFriendRequests(learnerId, 'received'),
        socialApi.getFriendRequests(learnerId, 'sent'),
      ]);
      setReceivedRequests(received.requests);
      setSentRequests(sent.requests);
      // Trigger refresh on ProfilePage
      window.dispatchEvent(new CustomEvent('social-action'));
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!learnerId) return;
    
    setProcessing(requestId);
    try {
      await socialApi.rejectFriendRequest(requestId);
      // Refresh from database
      const [received, sent] = await Promise.all([
        socialApi.getFriendRequests(learnerId, 'received'),
        socialApi.getFriendRequests(learnerId, 'sent'),
      ]);
      setReceivedRequests(received.requests);
      setSentRequests(sent.requests);
      // Trigger refresh on ProfilePage
      window.dispatchEvent(new CustomEvent('social-action'));
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const requests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Friend Requests" maxWidth="md">
      <div>
        {/* Tabs */}
        <div className="flex border-b border-[#e5e5e5] bg-gray-50">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wide transition-colors ${
              activeTab === 'received'
                ? 'text-[#1cb0f6] border-b-2 border-[#1cb0f6] bg-white'
                : 'text-[#afafaf] hover:text-[#3c3c3c]'
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wide transition-colors ${
              activeTab === 'sent'
                ? 'text-[#1cb0f6] border-b-2 border-[#1cb0f6] bg-white'
                : 'text-[#afafaf] hover:text-[#3c3c3c]'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#1cb0f6] animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
              <p className="text-[#afafaf] font-bold">
                {activeTab === 'received' ? 'No pending requests' : 'No sent requests'}
              </p>
              <p className="text-[#afafaf] text-sm mt-1">
                {activeTab === 'received'
                  ? 'Friend requests will appear here'
                  : 'Send requests to connect with others'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const user = activeTab === 'received' ? request.from_user : request.to_user;

                return (
                  <div
                    key={request.request_id}
                    className="border-2 border-[#e5e5e5] rounded-xl p-4"
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
                          <div className="font-bold text-[#3c3c3c] truncate">
                            {user.display_name}
                          </div>
                          <div className="text-sm text-[#afafaf] font-bold">
                            {user.total_xp.toLocaleString()} XP • {user.streak_count} day streak
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {activeTab === 'received' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleAccept(request.request_id)}
                            disabled={processing === request.request_id}
                            className="bg-[#58cc02] hover:bg-[#4caf02] text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {processing === request.request_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="text-sm">Accept</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(request.request_id)}
                            disabled={processing === request.request_id}
                            className="border-2 border-[#ff4b4b] text-[#ff4b4b] hover:bg-[#ff4b4b] hover:text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-sm">Decline</span>
                          </button>
                        </div>
                      )}

                      {activeTab === 'sent' && (
                        <span className="text-[#afafaf] font-bold text-sm">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
