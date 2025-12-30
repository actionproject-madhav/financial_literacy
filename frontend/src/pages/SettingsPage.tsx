import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, IconButton } from '../components/ui';
import {
  ChevronRight,
  Bell,
  Volume2,
  Globe,
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  User,
  Trash2,
  Download,
  Target,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useUserStore } from '../stores/userStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  type: 'link' | 'toggle' | 'button';
  value?: boolean;
  onClick?: () => void;
  danger?: boolean;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, user } = useUserStore();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to section if specified in URL
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      // Map profile page section names to settings section IDs
      const sectionMap: Record<string, string> = {
        'notifications': 'notifications',
        'voice': 'audio',
        'goal': 'goals',
        'language': 'account',
      };
      const targetSection = sectionMap[section] || section;
      setTimeout(() => {
        sectionRefs.current[targetSection]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error: any) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
      // The error might be "URL not found" if backend is down, but we still want to clear local state
    }
    // Clear local state (always do this, even if API call failed)
    logout();
    // Navigate to auth page using hash router
    navigate('/auth');
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          description: 'Edit your profile information',
          icon: <User className="w-5 h-5" />,
          type: 'link',
          onClick: () => navigate('/profile'),
        },
        {
          id: 'language',
          label: 'Language',
          description: 'Change app language',
          icon: <Globe className="w-5 h-5" />,
          type: 'link',
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        {
          id: 'push-notifications',
          label: 'Push Notifications',
          description: 'Get reminders to practice',
          icon: <Bell className="w-5 h-5" />,
          type: 'toggle',
          value: notifications,
          onClick: () => setNotifications(!notifications),
        },
      ],
    },
    {
      id: 'audio',
      title: 'Audio',
      items: [
        {
          id: 'sound-effects',
          label: 'Sound Effects',
          description: 'Play sounds for correct answers',
          icon: <Volume2 className="w-5 h-5" />,
          type: 'toggle',
          value: soundEffects,
          onClick: () => setSoundEffects(!soundEffects),
        },
      ],
    },
    {
      id: 'goals',
      title: 'Daily Goal',
      items: [
        {
          id: 'daily-goal',
          label: 'Daily Practice Goal',
          description: `${dailyGoal} minutes per day`,
          icon: <Target className="w-5 h-5" />,
          type: 'link',
          onClick: () => {
            const newGoal = prompt('Set your daily goal (minutes):', String(dailyGoal));
            if (newGoal && !isNaN(Number(newGoal))) {
              setDailyGoal(Number(newGoal));
            }
          },
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      items: [
        {
          id: 'dark-mode',
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          icon: <Moon className="w-5 h-5" />,
          type: 'toggle',
          value: darkMode,
          onClick: () => setDarkMode(!darkMode),
        },
      ],
    },
    {
      id: 'data',
      title: 'Data',
      items: [
        {
          id: 'export',
          label: 'Export Data',
          description: 'Download your learning data',
          icon: <Download className="w-5 h-5" />,
          type: 'button',
          onClick: () => console.log('Export data'),
        },
        {
          id: 'delete',
          label: 'Delete Account',
          description: 'Permanently delete your account',
          icon: <Trash2 className="w-5 h-5" />,
          type: 'button',
          danger: true,
          onClick: () => {
            if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
              console.log('Delete account');
            }
          },
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help Center',
          description: 'Get help and support',
          icon: <HelpCircle className="w-5 h-5" />,
          type: 'link',
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          description: 'How we protect your data',
          icon: <Shield className="w-5 h-5" />,
          type: 'link',
        },
      ],
    },
  ];

  const SettingItemComponent: React.FC<{ item: SettingsItem }> = ({ item }) => {
    return (
      <button
        onClick={item.onClick}
        className={cn(
          'w-full flex items-center gap-4 p-5 transition-colors',
          'hover:bg-[#F7F7F7]',
          item.danger && 'hover:bg-[#FFDFE0]'
        )}
      >
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-[12px]',
          item.danger ? 'bg-[#FFDFE0] text-[#FF4B4B]' : 'bg-[#F7F7F7] text-[#4B4B4B]'
        )}>
          {item.icon}
        </div>

        <div className="flex-1 text-left">
          <p className={cn(
            'text-[15px] font-bold',
            item.danger ? 'text-[#FF4B4B]' : 'text-[#4B4B4B]'
          )} style={{ lineHeight: '24px' }}>
            {item.label}
          </p>
          {item.description && (
            <p className="text-[13px] text-[#737373] mt-1" style={{ lineHeight: '20px' }}>
              {item.description}
            </p>
          )}
        </div>

        {item.type === 'toggle' && (
          <div className={cn(
            'w-12 h-7 rounded-full transition-colors relative',
            item.value ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'
          )}>
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: item.value ? 20 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>
        )}

        {item.type === 'link' && item.id === 'language' && (
          <LanguageSelector />
        )}
        
        {(item.type === 'link' || item.type === 'button') && !item.danger && item.id !== 'language' && (
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
          Settings
        </h1>
        <p className="text-[15px] text-[#737373] mt-1" style={{ lineHeight: '24px' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.id}
          ref={(el) => { sectionRefs.current[section.id] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
        >
          <Card variant="bordered" padding="none">
            <div className="px-5 py-4 border-b-2 border-[#E5E5E5]">
              <h2 className="text-[17px] font-bold text-[#4B4B4B]" style={{ lineHeight: '24px' }}>
                {section.title}
              </h2>
            </div>

            <div>
              {section.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className={cn(
                    itemIndex !== section.items.length - 1 && 'border-b-2 border-[#E5E5E5]'
                  )}
                >
                  <SettingItemComponent item={item} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Logout Button */}
      <Card variant="bordered" padding="none">
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={handleLogout}
          leftIcon={<LogOut className="w-5 h-5" />}
        >
          Log Out
        </Button>
      </Card>

      {/* App Version */}
      <div className="text-center py-4">
        <p className="text-[13px] text-[#737373]">
          FinLit v1.0.0
        </p>
        <p className="text-[13px] text-[#737373] mt-1">
          © 2024 FinLit. All rights reserved.
        </p>
      </div>
    </div>
  );
};

