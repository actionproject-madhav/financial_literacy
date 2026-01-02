import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface HeartRechargeData {
  hearts: number;
  maxHearts: number;
  nextHeartAt: string | null;
  secondsUntilNextHeart: number | null;
  fullHeartsAt: string | null;
}

export const useHeartRecharge = () => {
  const { learnerId, user, setUser } = useUserStore();
  const [rechargeData, setRechargeData] = useState<HeartRechargeData>({
    hearts: user?.hearts || 5,
    maxHearts: 5,
    nextHeartAt: null,
    secondsUntilNextHeart: null,
    fullHeartsAt: null,
  });
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch hearts from backend
  const fetchHearts = useCallback(async () => {
    if (!learnerId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/learners/${learnerId}/hearts`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRechargeData({
          hearts: data.hearts,
          maxHearts: data.max_hearts,
          nextHeartAt: data.next_heart_at,
          secondsUntilNextHeart: data.seconds_until_next_heart,
          fullHeartsAt: data.full_hearts_at,
        });

        // Update user store
        if (user) {
          setUser({ ...user, hearts: data.hearts });
        }
      }
    } catch (error) {
      console.error('Failed to fetch hearts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [learnerId, user, setUser]);

  // Lose a heart (call backend API)
  const loseHeart = useCallback(async () => {
    if (!learnerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/learners/${learnerId}/hearts/lose`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Fetch updated hearts
        await fetchHearts();
      }
    } catch (error) {
      console.error('Failed to lose heart:', error);
    }
  }, [learnerId, fetchHearts]);

  // Format countdown timer
  const formatCountdown = useCallback((seconds: number | null): string | null => {
    if (seconds === null || seconds <= 0) return null;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (rechargeData.secondsUntilNextHeart === null) {
      setCountdown(null);
      return;
    }

    let secondsRemaining = rechargeData.secondsUntilNextHeart;
    setCountdown(formatCountdown(secondsRemaining));

    const interval = setInterval(() => {
      secondsRemaining -= 1;

      if (secondsRemaining <= 0) {
        // Heart should have recharged, fetch new data
        fetchHearts();
        clearInterval(interval);
      } else {
        setCountdown(formatCountdown(secondsRemaining));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rechargeData.secondsUntilNextHeart, formatCountdown, fetchHearts]);

  // Initial fetch
  useEffect(() => {
    fetchHearts();
  }, [learnerId]);

  // Refetch periodically to stay in sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHearts();
    }, 60000); // Refetch every minute

    return () => clearInterval(interval);
  }, [fetchHearts]);

  return {
    hearts: rechargeData.hearts,
    maxHearts: rechargeData.maxHearts,
    countdown,
    nextHeartAt: rechargeData.nextHeartAt,
    fullHeartsAt: rechargeData.fullHeartsAt,
    isAtMax: rechargeData.hearts >= rechargeData.maxHearts,
    loseHeart,
    refetch: fetchHearts,
    isLoading,
  };
};
