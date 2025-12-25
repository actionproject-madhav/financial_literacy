import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';

interface AppShellProps {
  user?: {
    name: string;
    avatar?: string;
    streak: number;
    gems: number;
    hearts: number;
  };
}

export const AppShell: React.FC<AppShellProps> = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-duo-bg">
      {/* Top Navigation */}
      <TopNav
        user={user}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-64px)] pb-20 lg:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};

