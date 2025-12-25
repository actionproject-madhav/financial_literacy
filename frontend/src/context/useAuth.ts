import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, learnerApi } from '../services/api';
import { useUserStore } from '../stores/userStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { learnerId, user, setLearnerId, setUser, logout: storeLogout } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionUser = await authApi.getCurrentUser();
        
        if (sessionUser && sessionUser.learner_id) {
          setLearnerId(sessionUser.learner_id);
          
          // Load full user profile
          try {
            const profile = await learnerApi.getProfile(sessionUser.learner_id);
            setUser({
              name: profile.display_name || sessionUser.name || 'User',
              email: sessionUser.email || profile.email || '',
              country: profile.country_of_origin || 'US',
              visaType: profile.visa_type || 'Other',
              streak: profile.current_streak || 0,
              totalXp: profile.total_xp || 0,
              hearts: 5, // Default
              gems: profile.gems || 0,
            });
          } catch (error) {
            console.warn('Could not load full profile:', error);
            // Use session data as fallback
            setUser({
              name: sessionUser.name || 'User',
              email: sessionUser.email || '',
              country: 'US',
              visaType: 'Other',
              streak: 0,
              totalXp: 0,
              hearts: 5,
              gems: 0,
            });
          }
          
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLearnerId, setUser]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    storeLogout();
    setIsAuthenticated(false);
    navigate('/auth');
  };

  return {
    isAuthenticated,
    isLoading,
    learnerId,
    user,
    logout: handleLogout,
  };
};

