import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { authApi, learnerApi } from '../services/api';
import { useUserStore } from '../stores/userStore';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, setLearnerId, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionUser = await authApi.getCurrentUser();
        if (sessionUser && sessionUser.learner_id) {
          setLearnerId(sessionUser.learner_id);
          
          // Load full learner profile
          try {
            const learner = await learnerApi.getProfile(sessionUser.learner_id);
            setUser({
              name: learner.display_name || sessionUser.name || 'User',
              email: sessionUser.email || learner.email || '',
              country: learner.country_of_origin || 'US',
              visaType: learner.visa_type || 'Other',
              streak: learner.streak_count || 0,
              totalXp: learner.total_xp || 0,
              hearts: 5,
              gems: 0,
            });
            
            // Redirect based on onboarding status
            if (!learner.onboarding_completed || sessionUser.is_new_user) {
              navigate('/onboarding');
            } else {
              navigate('/learn');
            }
          } catch (error) {
            // Fallback to session data
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
            navigate('/learn');
          }
        }
      } catch (error) {
        // Not authenticated, show login page
        console.log('Not authenticated, showing login page');
      }
    };

    checkAuth();
  }, [navigate, setLearnerId, setUser]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Redirect to backend OAuth endpoint via proxy
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-duo-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-duo-green rounded-duo-2xl flex items-center justify-center mx-auto mb-4 shadow-duo-green"
          >
            <span className="text-white font-extrabold text-4xl">$</span>
          </motion.div>
          <h1 className="text-4xl font-extrabold text-duo-text mb-2">
            FinLit
          </h1>
          <p className="text-lg text-duo-text-muted">
            Master US Financial Literacy
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-duo-text mb-2">
              Welcome!
            </h2>
            <p className="text-duo-text-muted">
              Sign in to start your financial literacy journey
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            leftIcon={
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-duo-border"></div>
            <span className="px-4 text-sm text-duo-text-muted font-medium">
              or
            </span>
            <div className="flex-1 border-t border-duo-border"></div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-duo-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-duo-text">Learn at your own pace</p>
                <p className="text-sm text-duo-text-muted">Adaptive lessons tailored to you</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-duo-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-duo-text">Cultural context included</p>
                <p className="text-sm text-duo-text-muted">Understand US finance from your background</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-duo-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-duo-text">Track your progress</p>
                <p className="text-sm text-duo-text-muted">Earn XP, maintain streaks, unlock achievements</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-duo-text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
