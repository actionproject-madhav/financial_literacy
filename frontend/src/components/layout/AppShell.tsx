import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useUserStore } from '../../stores/userStore';
import { learnerApi } from '../../services/api';
import { FinAICoachPanel } from '../FinAICoachPanel';
import { CoachButton } from '../CoachButton';
import { useCoach } from '../../contexts/CoachContext';

export const AppShell: React.FC = () => {
  const { user, learnerId, setUser } = useUserStore();
  const location = useLocation();
  const isLessonPage = location.pathname.startsWith('/lesson');
  const { isOpen: isCoachOpen, openCoach, closeCoach, toggleCoach } = useCoach();

  // Listen for custom events to open coach
  useEffect(() => {
    const handleOpenCoach = () => {
      openCoach();
    };
    window.addEventListener('openCoach', handleOpenCoach);
    return () => {
      window.removeEventListener('openCoach', handleOpenCoach);
    };
  }, [openCoach]);

  // Sync user data from backend when learnerId is available
  useEffect(() => {
    const syncUserData = async () => {
      if (learnerId && user) {
        try {
          const stats = await learnerApi.getStats(learnerId);
          setUser({
            ...user,
            totalXp: stats.total_xp,
            streak: stats.streak_count,
            gems: stats.gems,
            hearts: stats.hearts,
          });
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      }
    };

    // Sync on mount and when learnerId changes
    syncUserData();
    
    // Also sync periodically (every 30 seconds) to keep data fresh
    const interval = setInterval(syncUserData, 30000);
    return () => clearInterval(interval);
  }, [learnerId, user, setUser]);

  // If we are in a lesson, render only the content (immersive mode)
  if (isLessonPage) {
    return (
      <>
        <Outlet />
        <CoachButton onClick={toggleCoach} isOpen={isCoachOpen} />
        <FinAICoachPanel isOpen={isCoachOpen} onClose={closeCoach} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar (Desktop) - Fixed Left */}
      <Sidebar onCoachClick={openCoach} />

      {/* Main Content - Shifted by Sidebar Width */}
      <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />

      {/* Coach Panel - Globally Available */}
      <CoachButton onClick={toggleCoach} isOpen={isCoachOpen} />
      <FinAICoachPanel isOpen={isCoachOpen} onClose={closeCoach} />
    </div>
  );
};
