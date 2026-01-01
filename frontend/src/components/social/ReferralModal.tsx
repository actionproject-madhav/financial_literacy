import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Loader2, Gift } from 'lucide-react';
import { Modal } from './Modal';
import { socialApi } from '../../services/api';
import { useUserStore } from '../../stores/userStore';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { learnerId } = useUserStore();
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    if (!isOpen || !learnerId) return;

    const fetchReferralData = async () => {
      setLoading(true);
      try {
        const response = await socialApi.getReferralCode(learnerId);
        setReferralCode(response.referral_code);
        setReferralLink(response.referral_link);
        setTotalReferrals(response.total_referrals);
      } catch (error) {
        console.error('Failed to fetch referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [isOpen, learnerId]);

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on FinLit!',
          text: `Use my referral code ${referralCode} to get started with financial literacy learning!`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy
      handleCopy(referralLink, 'link');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends" maxWidth="md">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1cb0f6] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rewards Info */}
            <div className="bg-[#dceeff] border-2 border-[#1cb0f6] rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-[#1cb0f6] flex items-center justify-center">
                  <Gift className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#3c3c3c] mb-2">Earn 100 XP per Friend</h3>
              <p className="text-[#4b4b4b] font-medium">
                Invite your friends to join and earn 100 XP for each friend who signs up with your referral code
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-[#1cb0f6]">{totalReferrals}</div>
                <div className="text-sm text-[#777] font-bold uppercase tracking-wide mt-1">
                  Total Referrals
                </div>
              </div>
              <div className="border-2 border-[#e5e5e5] rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-[#58cc02]">{totalReferrals * 100}</div>
                <div className="text-sm text-[#777] font-bold uppercase tracking-wide mt-1">
                  XP Earned
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-sm font-bold text-[#777] uppercase tracking-wide mb-2">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 border-2 border-[#e5e5e5] rounded-xl px-4 py-3 bg-gray-50">
                  <div className="font-bold text-[#3c3c3c] text-lg tracking-widest text-center">
                    {referralCode}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(referralCode, 'code')}
                  className="bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold px-4 rounded-xl transition-colors flex items-center gap-2"
                >
                  {copied === 'code' ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="block text-sm font-bold text-[#777] uppercase tracking-wide mb-2">
                Referral Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 border-2 border-[#e5e5e5] rounded-xl px-4 py-3 bg-gray-50 overflow-hidden">
                  <div className="font-bold text-[#3c3c3c] text-sm truncate">
                    {referralLink}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(referralLink, 'link')}
                  className="border-2 border-[#1cb0f6] text-[#1cb0f6] hover:bg-[#1cb0f6] hover:text-white font-bold px-4 rounded-xl transition-colors flex items-center gap-2"
                >
                  {copied === 'link' ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full bg-[#58cc02] hover:bg-[#4caf02] text-white font-extrabold py-4 rounded-xl uppercase tracking-widest text-sm shadow-[0_4px_0_#4caf02] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-[#e5e5e5]">
              <h4 className="font-bold text-[#3c3c3c] mb-2 text-sm">How it works:</h4>
              <ol className="space-y-1 text-sm text-[#4b4b4b]">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#1cb0f6]">1.</span>
                  <span>Share your referral code or link with friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#1cb0f6]">2.</span>
                  <span>They sign up using your code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#1cb0f6]">3.</span>
                  <span>You both get rewarded with XP</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
