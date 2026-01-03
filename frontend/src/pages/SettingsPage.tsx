import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui';
import { cn } from '../utils/cn';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { authApi, learnerApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import { useToast } from '../components/ui/Toast';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: 'link' | 'toggle' | 'button' | 'dropdown';
  value?: boolean;
  onClick?: () => void;
  danger?: boolean;
  options?: { label: string; value: string }[];
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, learnerId, user } = useUserStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State - loaded from backend
  const [soundEffects, setSoundEffects] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [motivationalMessages, setMotivationalMessages] = useState(true);
  const [listeningExercises, setListeningExercises] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [learningLanguage, setLearningLanguage] = useState('en');

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (!learnerId) return;
      
      try {
        setLoading(true);
        const prefs = await learnerApi.getPreferences(learnerId);
        setSoundEffects(prefs.sound_effects);
        setAnimations(prefs.animations);
        setMotivationalMessages(prefs.motivational_messages);
        setListeningExercises(prefs.listening_exercises);
        setDarkMode(prefs.dark_mode);
        setPushNotifications(prefs.push_notifications);
        setPracticeReminders(prefs.practice_reminders);
        setLearningLanguage(prefs.learning_language);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Keep defaults if loading fails
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [learnerId]);

  // Save preferences to backend
  const savePreferences = async (updates: Record<string, any>) => {
    if (!learnerId) return;
    
    try {
      setSaving(true);
      await learnerApi.updatePreferences(learnerId, updates);
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error: any) {
      console.error('Logout API error:', error);
    }
    logout();
    navigate('/auth');
  };

  const handleToggle = async (
    key: string,
    currentValue: boolean,
    setter: (value: boolean) => void
  ) => {
    const newValue = !currentValue;
    setter(newValue);
    await savePreferences({ [key]: newValue });
  };

  const handleExportData = async () => {
    if (!learnerId) return;
    
    try {
      await learnerApi.exportData(learnerId);
      toast.success('Your data has been exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!learnerId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = window.confirm(
      'This is your last chance. Are you absolutely sure? All your progress, achievements, and data will be lost forever.'
    );
    
    if (!doubleConfirm) return;
    
    try {
      await learnerApi.deleteAccount(learnerId);
      toast.success('Your account has been deleted. You will be logged out.');
      setTimeout(() => {
        logout();
        navigate('/auth');
      }, 2000);
    } catch (error) {
      console.error('Delete account failed:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  const sections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Edit Profile',
          type: 'button',
          onClick: () => navigate('/profile'),
        },
        {
          id: 'password',
          label: 'Change Password',
          type: 'button',
          onClick: () => {
            toast.info('Password changes are managed through your Google account. Please visit your Google Account settings to change your password.');
          },
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Lesson experience',
      items: [
        {
          id: 'sound',
          label: 'Sound effects',
          type: 'toggle',
          value: soundEffects,
          onClick: () => handleToggle('sound_effects', soundEffects, setSoundEffects),
        },
        {
          id: 'animations',
          label: 'Animations',
          type: 'toggle',
          value: animations,
          onClick: () => handleToggle('animations', animations, setAnimations),
        },
        {
          id: 'motivation',
          label: 'Motivational messages',
          type: 'toggle',
          value: motivationalMessages,
          onClick: () => handleToggle('motivational_messages', motivationalMessages, setMotivationalMessages),
        },
        {
          id: 'listening',
          label: 'Listening exercises',
          type: 'toggle',
          value: listeningExercises,
          onClick: () => handleToggle('listening_exercises', listeningExercises, setListeningExercises),
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      items: [
        {
          id: 'dark_mode',
          label: 'Dark mode',
          type: 'toggle',
          value: darkMode,
          onClick: () => handleToggle('dark_mode', darkMode, setDarkMode),
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        {
          id: 'push',
          label: 'Push notifications',
          type: 'toggle',
          value: pushNotifications,
          onClick: () => handleToggle('push_notifications', pushNotifications, setPushNotifications),
        },
        {
          id: 'reminders',
          label: 'Practice reminders',
          type: 'toggle',
          value: practiceReminders,
          onClick: () => handleToggle('practice_reminders', practiceReminders, setPracticeReminders),
        },
      ],
    },
    {
      id: 'courses',
      title: 'Courses',
      items: [
        {
          id: 'language',
          label: 'Learning Language',
          type: 'button',
          onClick: () => {}, // Handled by inline component
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy settings',
      items: [
        {
          id: 'export',
          label: 'Export Data',
          type: 'button',
          onClick: handleExportData,
        },
        {
          id: 'delete',
          label: 'Delete Account',
          type: 'button',
          danger: true,
          onClick: handleDeleteAccount,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="flex w-full max-w-[1100px] p-6 pt-10 gap-12">
        {/* === Left: Main Content === */}
        <div className="flex-1 max-w-[700px]">
          <h1 className="text-3xl font-extrabold text-[#3c3c3c] mb-8">Preferences</h1>
          {saving && (
            <div className="mb-4 text-sm text-[#1cb0f6]">Saving preferences...</div>
          )}

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.id} ref={(el) => { sectionRefs.current[section.id] = el; }}>
                <h2 className="text-xl font-bold text-[#3c3c3c] border-b-2 border-gray-200 pb-4 mb-4">
                  {section.title}
                </h2>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex-1">
                        <span className={cn(
                          "font-bold text-[17px]",
                          item.danger ? "text-red-500" : "text-[#4b4b4b]"
                        )}>
                          {item.label}
                        </span>
                        {item.id === 'language' && (
                          <div className="mt-2">
                            <LanguageSelector />
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      {item.type === 'toggle' && (
                        <button
                          onClick={item.onClick}
                          disabled={saving}
                          className={cn(
                            "w-12 h-7 rounded-full relative transition-colors duration-200",
                            item.value ? "bg-[#1cb0f6]" : "bg-[#e5e5e5]",
                            saving && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                              item.value ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      )}

                      {(item.type === 'button' || item.type === 'link') && item.id !== 'language' && !item.danger && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={item.onClick} 
                          disabled={saving}
                          className="text-[#1cb0f6] font-bold uppercase"
                        >
                          Edit
                        </Button>
                      )}

                      {item.type === 'button' && item.danger && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={item.onClick}
                          disabled={saving}
                        >
                          Delete
                        </Button>
                      )}

                      {item.type === 'dropdown' && (
                        <div className="relative">
                          <button
                            onClick={item.onClick}
                            disabled={saving}
                            className={cn(
                              "px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-600 min-w-[120px] text-left flex justify-between items-center",
                              saving && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span>{item.description}</span>
                            <span className="text-gray-400">▼</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === Right: Sidebar Navigation === */}
        <div className="hidden lg:block w-[320px] flex-shrink-0">
          <div className="sticky top-10 space-y-6">
            <div className="border-[2px] border-gray-200 rounded-2xl p-4 bg-white">
              <div className="flex flex-col gap-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="text-left px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {section.title === 'Lesson experience' ? 'Preferences' : section.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-[2px] border-gray-200 rounded-2xl p-4 bg-white">
              <h3 className="px-4 font-bold text-gray-800 text-lg mb-2">Support</h3>
              <button 
                onClick={() => navigate('/help')}
                className="w-full text-left px-4 py-2 font-bold text-[#1cb0f6] hover:bg-gray-50 rounded-xl transition-colors"
              >
                Help Center
              </button>
              <div className="my-2 border-t border-gray-100 mx-4" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 font-extrabold text-[#ff4b4b] hover:bg-red-50 rounded-xl transition-colors uppercase text-sm tracking-widest"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
