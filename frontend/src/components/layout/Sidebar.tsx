import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  GraduationCap,
  Trophy,
  User,
  TrendingUp,
  Settings,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { path: '/learn', label: 'Learn', icon: <Home className="w-5 h-5" /> },
  { path: '/practice', label: 'Practice', icon: <GraduationCap className="w-5 h-5" /> },
  { path: '/invest', label: 'Invest', icon: <TrendingUp className="w-5 h-5" /> },
  { path: '/leaderboard', label: 'Leaderboards', icon: <Trophy className="w-5 h-5" /> },
  { path: '/shop', label: 'Shop', icon: <ShoppingBag className="w-5 h-5" />, badge: 'NEW' },
];

const secondaryNavItems: NavItem[] = [
  { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  { path: '/help', label: 'Help', icon: <HelpCircle className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.path);

    return (
      <NavLink
        to={item.path}
        onClick={onClose}
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-[12px]', // Duolingo uses 12px for nav items
          'font-bold text-[15px] transition-colors', // Duolingo exact font
          isActive
            ? 'text-[#1CB0F6] bg-[#DDF4FF]' // Duolingo exact colors
            : 'text-[#737373] hover:bg-[#F7F7F7]'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebarIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1CB0F6] rounded-r-full" // Duolingo exact blue
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        
        <span className={isActive ? 'text-[#1CB0F6]' : ''}>{item.icon}</span>
        <span>{item.label}</span>
        
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-[13px] font-bold bg-[#58CC02] text-white rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'w-[256px] h-screen sticky top-0', // Duolingo exact width
        'bg-white border-r-2 border-[#E5E5E5]', // Duolingo exact border
        'py-6 px-5' // Duolingo exact padding
      )}
      style={{ 
        background: 'rgb(255, 255, 255)',
        borderRight: '2px solid rgb(229, 229, 229)'
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-[42px] h-[42px] bg-[#58CC02] rounded-[16px] flex items-center justify-center shadow-[0_4px_0_#46A302]">
          <span className="text-white font-bold text-2xl">$</span>
        </div>
        <span className="text-[23px] font-bold text-[#4B4B4B]">FinLit</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {mainNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-[#E5E5E5] my-4" /> {/* Duolingo exact border */}

      {/* Secondary Nav */}
      <nav className="space-y-1">
        {secondaryNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  );
};

