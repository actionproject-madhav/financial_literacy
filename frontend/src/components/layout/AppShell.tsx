import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';
import { useUserStore } from '../../stores/userStore';

export const AppShell: React.FC = () => {
  const { user } = useUserStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Convert user store format to TopNav format
  const navUser = user ? {
    name: user.name,
    avatar: undefined, // Add if available in user object
    streak: user.streak,
    gems: user.gems,
    hearts: user.hearts,
  } : undefined;

  return (
    <div className="min-h-screen bg-duo-bg">
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
          <div className="max-w-3xl mx-auto px-4 sm:px-5 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};

