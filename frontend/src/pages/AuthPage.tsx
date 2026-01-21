import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui';
import { Card } from '../components/ui';
import { authApi, learnerApi, OAUTH_BASE_URL } from '../services/api';
import { useUserStore } from '../stores/userStore';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, setLearnerId, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // Extract and store referral code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Store referral code in localStorage for later use during signup
      localStorage.setItem('referral_code', refCode);
      console.log('Referral code stored:', refCode);
    }
  }, []);

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
    // Redirect to backend OAuth endpoint (must go to backend directly, not through proxy)
    // The OAUTH_BASE_URL is the full backend URL for OAuth flows
    window.location.href = `${OAUTH_BASE_URL}/auth/google`;
  };

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-white font-sans text-brand-dark selection:bg-black selection:text-white flex items-center justify-center p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border-2 border-black rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 p-4">
          <div className="w-8 h-8 bg-[#FF9600] rounded-full border-2 border-black flex items-center justify-center">
            <span className="text-black font-bold">★</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Join the Movement
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">
            {activeTab === 'signin' ? 'Welcome Back' : 'Join FinLit'}
          </h1>
          <p className="text-gray-600 font-medium">Master your money, level up your life.</p>
        </div>

        {/* Custom Tabs Implementation (Neo-Brutalist Style) */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl border-2 border-black">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'signin'
                ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'text-gray-500 hover:text-black'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'signup'
                ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'text-gray-500 hover:text-black'
              }`}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-black text-black font-bold hover:bg-gray-50 flex items-center justify-center gap-3 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t-2 border-black/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or demo access</span>
            <div className="flex-grow border-t-2 border-black/10"></div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="bg-[#EFF09E] border-2 border-black text-black font-bold py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#E3E480] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            onClick={() => {
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
            Enter as Guest
          </Button>
        </div>

        <p className="text-center text-xs font-medium text-gray-500 mt-8 leading-relaxed px-4">
          By jumping in, you agree to our <a href="#" className="underline text-black decoration-2">Terms</a> and <a href="#" className="underline text-black decoration-2">Privacy Policy</a>. No borders, just knowledge.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
