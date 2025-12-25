import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, GraduationCap, Trophy, User, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/learn', label: 'Learn', icon: <Home className="w-6 h-6" /> },
  { path: '/practice', label: 'Practice', icon: <GraduationCap className="w-6 h-6" /> },
  { path: '/invest', label: 'Invest', icon: <TrendingUp className="w-6 h-6" /> },
  { path: '/leaderboard', label: 'Leagues', icon: <Trophy className="w-6 h-6" /> },
  { path: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#E5E5E5] lg:hidden"
      style={{ 
        background: 'rgb(255, 255, 255)',
        borderTop: '2px solid rgb(229, 229, 229)',
        padding: '16px' // Duolingo exact padding
      }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2 flex-1"
            >
              <span
                className={cn(
                  'relative z-10 transition-colors',
                  isActive ? 'text-[#1CB0F6]' : 'text-[#737373]' // Duolingo exact colors
                )}
              >
                {item.icon}
              </span>
              
              <span
                className={cn(
                  'relative z-10 text-[13px] font-bold transition-colors uppercase tracking-[0.04em]', // Duolingo exact typography
                  isActive ? 'text-[#1CB0F6]' : 'text-[#737373]'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

