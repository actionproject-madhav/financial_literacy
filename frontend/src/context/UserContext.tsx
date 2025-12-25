import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { authApi, learnerApi } from '../services/api';
import { useUserStore } from '../stores/userStore';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  onboarding_completed?: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { learnerId, user: storeUser, setUser: setStoreUser, setLearnerId } = useUserStore();
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with user store
  useEffect(() => {
    if (storeUser) {
      setUserState({
        id: learnerId || '',
        email: storeUser.email,
        name: storeUser.name,
        onboarding_completed: undefined, // Will be loaded from learner profile
      });
    } else {
      setUserState(null);
    }
  }, [storeUser, learnerId]);

  const refreshUserData = useCallback(async () => {
    if (!learnerId) {
      // Try to get user from session
      try {
        const sessionUser = await authApi.getCurrentUser();
        if (sessionUser && sessionUser.learner_id) {
          setLearnerId(sessionUser.learner_id);
          
          // Load full learner profile
          const learner = await learnerApi.getProfile(sessionUser.learner_id);
          setStoreUser({
            name: learner.display_name || sessionUser.name || 'User',
            email: sessionUser.email || learner.email || '',
            country: learner.country_of_origin || 'US',
            visaType: learner.visa_type || 'Other',
            streak: learner.streak_count || 0,
            totalXp: learner.total_xp || 0,
            hearts: 5,
            gems: 0,
          });
        }
      } catch (error) {
        // Not authenticated
        setUserState(null);
        setStoreUser(null);
      }
      return;
    }

    try {
      // Load learner profile
      const learner = await learnerApi.getProfile(learnerId);
      setStoreUser({
        name: learner.display_name || storeUser?.name || 'User',
        email: learner.email || storeUser?.email || '',
        country: learner.country_of_origin || storeUser?.country || 'US',
        visaType: learner.visa_type || storeUser?.visaType || 'Other',
        streak: learner.streak_count || storeUser?.streak || 0,
        totalXp: learner.total_xp || storeUser?.totalXp || 0,
        hearts: storeUser?.hearts || 5,
        gems: storeUser?.gems || 0,
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [learnerId, storeUser, setStoreUser, setLearnerId]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const sessionUser = await authApi.getCurrentUser();
        if (sessionUser && sessionUser.learner_id) {
          setLearnerId(sessionUser.learner_id);
          
          // Load full learner profile
          const learner = await learnerApi.getProfile(sessionUser.learner_id);
          setStoreUser({
            name: learner.display_name || sessionUser.name || 'User',
            email: sessionUser.email || learner.email || '',
            country: learner.country_of_origin || 'US',
            visaType: learner.visa_type || 'Other',
            streak: learner.streak_count || 0,
            totalXp: learner.total_xp || 0,
            hearts: 5,
            gems: 0,
          });
        } else {
          setUserState(null);
          setStoreUser(null);
        }
      } catch (error) {
        // Not authenticated
        setUserState(null);
        setStoreUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLearnerId, setStoreUser]);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // Sync to store if needed
      setStoreUser({
        name: newUser.name,
        email: newUser.email,
        country: 'US',
        visaType: 'Other',
        streak: 0,
        totalXp: 0,
        hearts: 5,
        gems: 0,
      });
    } else {
      setStoreUser(null);
    }
  }, [setStoreUser]);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      setUserState(null);
      setStoreUser(null);
    };

    window.addEventListener('user-logout', handleLogout);
    return () => window.removeEventListener('user-logout', handleLogout);
  }, [setStoreUser]);

  const value = {
    user,
    setUser,
    refreshUserData,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
