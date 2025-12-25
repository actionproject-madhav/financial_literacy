import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell } from 'lucide-react';
import { StreakCounter } from '../gamification/StreakCounter';
import { GemDisplay } from '../gamification/GemDisplay';
import { HeartsDisplay } from '../gamification/HeartsDisplay';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';

interface TopNavProps {
  user?: {
    name: string;
    avatar?: string;
    streak: number;
    gems: number;
    hearts: number;
  };
  onMenuClick?: () => void;
  className?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  onMenuClick,
  className,
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'bg-white border-b border-duo-border',
        'px-4 py-3',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo/Menu */}
        <div className="flex items-center gap-4">
          <IconButton
            aria-label="Menu"
            variant="ghost"
            size="md"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </IconButton>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-duo-green rounded-duo-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">$</span>
            </div>
            <span className="hidden sm:block text-xl font-extrabold text-duo-green">
              FinLit
            </span>
          </Link>
        </div>

        {/* Right: Stats & Profile */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <StreakCounter days={user.streak} size="sm" />
            
            <div className="hidden sm:block">
              <GemDisplay amount={user.gems} size="sm" />
            </div>
            
            <HeartsDisplay hearts={user.hearts} size="sm" />

            <IconButton
              aria-label="Notifications"
              variant="ghost"
              size="md"
              className="hidden sm:flex"
            >
              <Bell className="w-5 h-5" />
            </IconButton>

            <Avatar
              src={user.avatar}
              alt={user.name}
              fallback={user.name.charAt(0)}
              size="md"
            />
          </div>
        )}
      </div>
    </header>
  );
};

