import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';
import { useUserStore } from '../../stores/userStore';
import { mockUser } from '../../data/mockData';

export const AppShell: React.FC = () => {
  const { user, setUser } = useUserStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  
  // Convert user store format to TopNav format, fallback to mock
  const displayUser = user || {
    name: mockUser.name,
    streak: mockUser.streak,
    gems: mockUser.gems,
    hearts: mockUser.hearts,
  };

  const navUser = {
    name: displayUser.name,
    avatar: undefined,
    streak: displayUser.streak,
    gems: displayUser.gems,
    hearts: displayUser.hearts,
  };

  return (
    <div className="min-h-screen" style={{ background: 'rgb(240, 240, 240)' }}>
      {/* Top Navigation */}
      <TopNav
        user={navUser}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-70px)] pb-20 lg:pb-0" style={{ background: 'rgb(240, 240, 240)' }}>
          <div className="max-w-3xl mx-auto px-5 py-6"> {/* Duolingo uses 20px (px-5) padding */}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};

