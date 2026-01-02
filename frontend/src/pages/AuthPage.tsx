import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui';
import { Card } from '../components/ui';
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

          // Load full learner stats (includes XP, gems, hearts from database)
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

            // Redirect based on onboarding status
            if (sessionUser.is_new_user) {
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
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'rgb(240, 240, 240)' }}>
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
            className="w-20 h-20 bg-[#58CC02] rounded-[16px] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_#46A302]"
          >
            <span className="text-white font-bold text-4xl">$</span>
          </motion.div>
          <h1 className="text-[32px] font-bold text-[#4B4B4B] mb-2" style={{ lineHeight: '40px' }}>
            FinLit
          </h1>
          <p className="text-[17px] text-[#737373]" style={{ lineHeight: '24px' }}>
            Master US Financial Literacy
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="text-center mb-6">
            <h2 className="text-[23px] font-bold text-[#4B4B4B] mb-2" style={{ lineHeight: '32px' }}>
              Welcome!
            </h2>
            <p className="text-[15px] text-[#737373]" style={{ lineHeight: '24px' }}>
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
            <div className="flex-1 border-t-2 border-[#E5E5E5]"></div>
            <span className="px-4 text-[13px] text-[#737373] font-bold uppercase tracking-[0.04em]">
              or
            </span>
            <div className="flex-1 border-t-2 border-[#E5E5E5]"></div>
          </div>

          {/* Benefits */}
          <div className="space-y-4"> {/* Duolingo uses 16px spacing */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#58CC02] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#4B4B4B] text-[15px]" style={{ lineHeight: '24px' }}>Learn at your own pace</p>
                <p className="text-[13px] text-[#737373] mt-1" style={{ lineHeight: '20px' }}>Adaptive lessons tailored to you</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#58CC02] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#4B4B4B] text-[15px]" style={{ lineHeight: '24px' }}>Cultural context included</p>
                <p className="text-[13px] text-[#737373] mt-1" style={{ lineHeight: '20px' }}>Understand US finance from your background</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#58CC02] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#4B4B4B] text-[15px]" style={{ lineHeight: '24px' }}>Track your progress</p>
                <p className="text-[13px] text-[#737373] mt-1" style={{ lineHeight: '20px' }}>Earn XP, maintain streaks, unlock achievements</p>
              </div>
            </div>
          </div>

          {/* Skip for now - DEV ONLY */}
          <div className="mt-6 pt-6 border-t-2 border-[#E5E5E5]">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => {
                // Set up demo user for testing
                setLearnerId('demo-user-123');
                setUser({
                  name: 'Demo User',
                  email: 'demo@test.com',
                  country: 'US',
                  visaType: 'F-1',
                  streak: 0,
                  totalXp: 0,
                  hearts: 5,
                  gems: 0,
                });
                navigate('/learn');
              }}
            >
              Skip for now (Testing)
            </Button>
            <p className="text-[11px] text-[#AFAFAF] text-center mt-2">
              ⚠️ Development mode only
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-[13px] text-[#737373] mt-6" style={{ lineHeight: '20px' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
