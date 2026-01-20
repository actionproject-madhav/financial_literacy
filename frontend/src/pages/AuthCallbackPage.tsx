import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi, learnerApi } from '../services/api';
import { useUserStore } from '../stores/userStore';

/**
 * AuthCallbackPage handles the OAuth callback redirect.
 *
 * After OAuth completes, the backend redirects to this page with:
 * - token: A signed auth token containing user session data
 * - redirect: The intended destination (/onboarding or /learn)
 *
 * This page exchanges the token for a proper session and redirects
 * the user to their destination.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLearnerId, setUser } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Completing sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters
        // With HashRouter, query params come after the hash route: /#/auth-callback?token=xxx
        // We need to parse them from the full hash or from location.search
        let searchParams: URLSearchParams;

        // Method 1: Try location.search (works with some HashRouter configs)
        if (location.search) {
          searchParams = new URLSearchParams(location.search);
        } else {
          // Method 2: Parse from the full URL hash (/#/auth-callback?token=xxx)
          const fullHash = window.location.hash;
          const queryIndex = fullHash.indexOf('?');
          if (queryIndex !== -1) {
            searchParams = new URLSearchParams(fullHash.substring(queryIndex));
          } else {
            searchParams = new URLSearchParams();
          }
        }

        const token = searchParams.get('token');
        const redirectPath = searchParams.get('redirect') || '/learn';

        console.log('Auth callback received, token present:', !!token, 'redirect:', redirectPath);

        if (!token) {
          // No token - try to check if we have a valid session already (cookie worked)
          setStatus('Checking session...');
          const sessionUser = await authApi.getCurrentUser();

          if (sessionUser && sessionUser.learner_id) {
            console.log('Session cookie worked, user authenticated');
            await setupUserSession(sessionUser, redirectPath);
            return;
          }

          setError('No authentication token received. Please try signing in again.');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        // Exchange the token for a session
        setStatus('Establishing session...');
        console.log('Exchanging auth token for session...');

        const result = await authApi.exchangeToken(token);

        if (result && result.success && result.user) {
          console.log('Token exchange successful');
          await setupUserSession(result.user, redirectPath);
        } else {
          // Token exchange failed - try checking session directly (maybe cookie worked)
          setStatus('Verifying authentication...');
          const sessionUser = await authApi.getCurrentUser();

          if (sessionUser && sessionUser.learner_id) {
            console.log('Fallback: Session cookie worked');
            await setupUserSession(sessionUser, redirectPath);
            return;
          }

          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during sign in. Please try again.');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    const setupUserSession = async (sessionUser: any, redirectPath: string) => {
      try {
        setStatus('Loading your profile...');

        // Set learner ID
        setLearnerId(sessionUser.learner_id);

        // Try to load full user stats
        try {
          const stats = await learnerApi.getStats(sessionUser.learner_id);
          setUser({
            name: stats.display_name || sessionUser.name || 'User',
            email: sessionUser.email || stats.email || '',
            country: stats.country_of_origin || 'US',
            visaType: stats.visa_type || 'Other',
            streak: stats.streak_count || 0,
            totalXp: stats.total_xp || 0,
            hearts: stats.hearts || 5,
            gems: stats.gems || 0,
          });
        } catch (statsError) {
          // Fallback to session data
          console.warn('Could not load stats, using session data:', statsError);
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

        // Determine redirect based on is_new_user flag
        const finalPath = sessionUser.is_new_user ? '/onboarding' : (redirectPath || '/learn');

        setStatus('Redirecting...');
        console.log('Navigating to:', finalPath);

        // Small delay for UX
        setTimeout(() => {
          navigate(finalPath);
        }, 300);
      } catch (err) {
        console.error('Error setting up user session:', err);
        setError('Failed to load your profile. Please try again.');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    handleCallback();
  }, [location, navigate, setLearnerId, setUser]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Failed</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            {/* Loading spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 border-t-black rounded-full"
            />
            <h2 className="text-xl font-bold text-gray-800 mb-2">{status}</h2>
            <p className="text-gray-600">Please wait a moment...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallbackPage;
