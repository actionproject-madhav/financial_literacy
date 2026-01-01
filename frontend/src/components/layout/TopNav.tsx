import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell } from 'lucide-react';
import { StreakCounter } from '../gamification/StreakCounter';
import { GemDisplay } from '../gamification/GemDisplay';
import { HeartsDisplay } from '../gamification/HeartsDisplay';
import { IconButton } from '../ui';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { useHeartRecharge } from '../../hooks/useHeartRecharge';

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
  const { hearts, countdown } = useHeartRecharge();

  return (
    <header
      className={cn(
        'sticky top-0 z-[2]', // Duolingo exact z-index
        'bg-white border-b-2 border-[#E5E5E5]', // Duolingo exact border
        'h-[70px]', // Duolingo exact height
        'px-4 sm:px-5', // Duolingo padding
        className
      )}
      style={{
        background: 'rgb(255, 255, 255)',
        borderBottom: '2px solid rgb(229, 229, 229)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Left: Logo/Menu */}
        <div className="flex items-center gap-4">
          <IconButton
            aria-label="Menu"
            variant="ghost"
            size="md"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" /> {/* Duolingo uses 20px icons in nav */}
          </IconButton>

          <Link to="/" className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] bg-[#58CC02] rounded-[16px] flex items-center justify-center shadow-[0_4px_0_#46A302]">
              <span className="text-white font-bold text-2xl">$</span>
            </div>
            <span className="hidden sm:block text-[23px] font-bold text-[#4B4B4B]" style={{ fontFamily: 'var(--font-primary)' }}>
              FinLit
            </span>
          </Link>
        </div>

        {/* Right: Stats & Profile */}
        {user && (
          <div className="flex items-center gap-4"> {/* Duolingo uses 16px gap consistently */}
            <StreakCounter days={user.streak} size="sm" />

            <div className="hidden sm:block">
              <GemDisplay amount={user.gems} size="sm" />
            </div>

            <HeartsDisplay hearts={hearts} size="sm" countdown={countdown} />

            <IconButton
              aria-label="Notifications"
              variant="ghost"
              size="sm" // Duolingo uses smaller icon buttons in nav
              className="hidden sm:flex"
            >
              <Bell className="w-5 h-5" /> {/* Duolingo uses 20px icons */}
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

