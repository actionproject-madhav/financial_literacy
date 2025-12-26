import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useUserStore } from '../../stores/userStore';
import { mockUser } from '../../data/mockData';

export const AppShell: React.FC = () => {
  const { user, setUser } = useUserStore();
  const location = useLocation();
  const isLessonPage = location.pathname.startsWith('/lesson');

  // Initialize with mock user if no user exists
  useEffect(() => {
    if (!user) {
      setUser({
        name: mockUser.name,
        email: mockUser.email,
        country: mockUser.country,
        visaType: mockUser.visaType,
        streak: mockUser.streak,
        totalXp: mockUser.totalXp,
        hearts: mockUser.hearts,
        gems: mockUser.gems,
      });
    }
  }, [user, setUser]);

  // If we are in a lesson, render only the content (immersive mode)
  if (isLessonPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar (Desktop) - Fixed Left */}
      <Sidebar />

      {/* Main Content - Shifted by Sidebar Width */}
      <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};
