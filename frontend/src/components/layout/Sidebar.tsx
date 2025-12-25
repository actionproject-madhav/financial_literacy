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
          'relative flex items-center gap-3 px-4 py-3 rounded-duo-lg',
          'font-semibold transition-colors',
          isActive
            ? 'text-duo-blue bg-duo-blue-tint'
            : 'text-duo-text-muted hover:bg-gray-100'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebarIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-duo-blue rounded-r-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        
        <span className={isActive ? 'text-duo-blue' : ''}>{item.icon}</span>
        <span>{item.label}</span>
        
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-duo-green text-white rounded-full">
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
        'w-64 h-screen sticky top-0',
        'bg-white border-r border-duo-border',
        'py-6 px-4'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-12 h-12 bg-duo-green rounded-duo-xl flex items-center justify-center">
          <span className="text-white font-extrabold text-2xl">$</span>
        </div>
        <span className="text-2xl font-extrabold text-duo-green">FinLit</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {mainNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-duo-border my-4" />

      {/* Secondary Nav */}
      <nav className="space-y-1">
        {secondaryNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  );
};

