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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-duo-border lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-duo-blue-tint rounded-duo-lg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <span
                className={cn(
                  'relative z-10 transition-colors',
                  isActive ? 'text-duo-blue' : 'text-duo-text-muted'
                )}
              >
                {item.icon}
              </span>
              
              <span
                className={cn(
                  'relative z-10 text-xs font-bold transition-colors',
                  isActive ? 'text-duo-blue' : 'text-duo-text-muted'
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

