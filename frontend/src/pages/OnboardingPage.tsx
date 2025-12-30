import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { learnerApi, authApi } from '../services/api';
import { useUserStore } from '../stores/userStore';
import { ChevronLeft, ChevronRight, Check, Globe, Briefcase, Target, Clock, Sparkles } from 'lucide-react';
import { LottieAnimation } from '../components/LottieAnimation';

// Step types
type OnboardingStep =
  | 'welcome'
  | 'language'
  | 'country'
  | 'visa'
  | 'experience'
  | 'goals'
  | 'daily_goal'
  | 'complete';

// Onboarding data
interface OnboardingData {
  native_language: string;
  english_proficiency: string;
  country_of_origin: string;
  immigration_status: string;
  visa_type: string;
  has_ssn: boolean;
  sends_remittances: boolean;
  financial_goals: string[];
  financial_experience_level: string;
  daily_goal_minutes: number;
}

// Option card component for selections
interface OptionCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  emoji?: string;  // For country flags (keep these)
  lottieFile?: string;  // For Lottie animations
}

const OptionCard: React.FC<OptionCardProps> = ({ icon, title, description, selected, onClick, emoji, lottieFile }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      w-full p-4 rounded-[16px] border-2 text-left transition-all duration-200
      ${selected
        ? 'border-[#1CB0F6] bg-[#DDF4FF] shadow-[0_4px_0_#1899D6]'
        : 'border-[#E5E5E5] bg-white hover:border-[#AFAFAF] shadow-[0_4px_0_#E5E5E5]'
      }
      active:shadow-none active:translate-y-[4px]
    `}
  >
    <div className="flex items-center gap-3">
      {/* Country flags use emoji, experience levels use Lottie */}
      {emoji && <span className="text-2xl">{emoji}</span>}
      {lottieFile && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${selected ? 'bg-[#1CB0F6]' : 'bg-[#E5E5E5]'}`}>
          <LottieAnimation
            src={lottieFile}
            className="w-full h-full"
            loop={true}
            autoplay={true}
            fallback={
              <div className={`w-4 h-4 rounded-full ${selected ? 'bg-white' : 'bg-[#AFAFAF]'}`} />
            }
          />
        </div>
      )}
      {icon && <span className={`${selected ? 'text-[#1CB0F6]' : 'text-[#737373]'}`}>{icon}</span>}
      <div className="flex-1">
        <p className={`font-bold text-[15px] ${selected ? 'text-[#1899D6]' : 'text-[#4B4B4B]'}`}>
          {title}
        </p>
        {description && (
          <p className="text-[13px] text-[#737373] mt-0.5">{description}</p>
        )}
      </div>
      {selected && (
        <div className="w-6 h-6 bg-[#1CB0F6] rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  </motion.button>
);

// Multi-select option for goals
interface GoalOptionProps {
  title: string;
  lottieFile?: string;
  selected: boolean;
  onClick: () => void;
}

const GoalOption: React.FC<GoalOptionProps> = ({ title, lottieFile, selected, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      px-4 py-3 rounded-[16px] border-2 transition-all duration-200 flex items-center gap-2
      ${selected
        ? 'border-[#58CC02] bg-[#D7FFB8] shadow-[0_3px_0_#46A302]'
        : 'border-[#E5E5E5] bg-white hover:border-[#AFAFAF] shadow-[0_3px_0_#E5E5E5]'
      }
      active:shadow-none active:translate-y-[3px]
    `}
  >
    {/* Lottie animation for goal icons */}
    {lottieFile ? (
      <div className={`w-6 h-6 rounded-md flex items-center justify-center overflow-hidden ${selected ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
        <LottieAnimation
          src={lottieFile}
          className="w-full h-full"
          loop={true}
          autoplay={true}
          fallback={
            <div className={`w-3 h-3 rounded-full ${selected ? 'bg-white' : 'bg-[#AFAFAF]'}`} />
          }
        />
      </div>
    ) : (
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selected ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
        <div className={`w-3 h-3 rounded-full ${selected ? 'bg-white' : 'bg-[#AFAFAF]'}`} />
      </div>
    )}
    <span className={`font-bold text-[14px] ${selected ? 'text-[#46A302]' : 'text-[#4B4B4B]'}`}>
      {title}
    </span>
    {selected && <Check className="w-4 h-4 text-[#58CC02]" />}
  </motion.button>
);

// Daily goal option
interface DailyGoalOptionProps {
  minutes: number;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const DailyGoalOption: React.FC<DailyGoalOptionProps> = ({ minutes, label, description, selected, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      w-full p-5 rounded-[16px] border-2 text-left transition-all duration-200
      ${selected
        ? 'border-[#58CC02] bg-[#D7FFB8] shadow-[0_4px_0_#46A302]'
        : 'border-[#E5E5E5] bg-white hover:border-[#AFAFAF] shadow-[0_4px_0_#E5E5E5]'
      }
      active:shadow-none active:translate-y-[4px]
    `}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`font-bold text-[17px] ${selected ? 'text-[#46A302]' : 'text-[#4B4B4B]'}`}>
          {label}
        </p>
        <p className="text-[13px] text-[#737373] mt-1">{description}</p>
      </div>
      <div className={`text-[32px] font-bold ${selected ? 'text-[#58CC02]' : 'text-[#AFAFAF]'}`}>
        {minutes}
        <span className="text-[15px] font-normal ml-1">min</span>
      </div>
    </div>
  </motion.button>
);

// Progress bar
interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => (
  <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
    <motion.div
      className="h-full bg-[#58CC02] rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
);

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', emoji: '🇺🇸' },
  { code: 'es', name: 'Spanish', emoji: '🇪🇸' },
  { code: 'zh', name: 'Chinese', emoji: '🇨🇳' },
  { code: 'hi', name: 'Hindi', emoji: '🇮🇳' },
  { code: 'ne', name: 'Nepali', emoji: '🇳🇵' },
  { code: 'tl', name: 'Tagalog', emoji: '🇵🇭' },
  { code: 'vi', name: 'Vietnamese', emoji: '🇻🇳' },
  { code: 'ko', name: 'Korean', emoji: '🇰🇷' },
];

// Country options (common immigrant countries to US)
const COUNTRIES = [
  { code: 'MEX', name: 'Mexico', emoji: '🇲🇽' },
  { code: 'IND', name: 'India', emoji: '🇮🇳' },
  { code: 'CHN', name: 'China', emoji: '🇨🇳' },
  { code: 'PHL', name: 'Philippines', emoji: '🇵🇭' },
  { code: 'VNM', name: 'Vietnam', emoji: '🇻🇳' },
  { code: 'NPL', name: 'Nepal', emoji: '🇳🇵' },
  { code: 'KOR', name: 'South Korea', emoji: '🇰🇷' },
  { code: 'BRA', name: 'Brazil', emoji: '🇧🇷' },
  { code: 'COL', name: 'Colombia', emoji: '🇨🇴' },
  { code: 'GTM', name: 'Guatemala', emoji: '🇬🇹' },
  { code: 'USA', name: 'United States', emoji: '🇺🇸' },
  { code: 'OTHER', name: 'Other', emoji: '🌍' },
];

// Visa types
const VISA_TYPES = [
  { code: 'F1', name: 'F-1 Student', description: 'International student visa' },
  { code: 'H1B', name: 'H-1B Work Visa', description: 'Specialty occupation worker' },
  { code: 'L1', name: 'L-1 Transfer', description: 'Intracompany transferee' },
  { code: 'J1', name: 'J-1 Exchange', description: 'Exchange visitor' },
  { code: 'O1', name: 'O-1 Talent', description: 'Extraordinary ability' },
  { code: 'GREEN_CARD', name: 'Green Card', description: 'Permanent resident' },
  { code: 'CITIZEN', name: 'US Citizen', description: 'Naturalized or born' },
  { code: 'OTHER', name: 'Other', description: 'Different visa type' },
];

// Experience levels with Lottie animations
const EXPERIENCE_LEVELS = [
  { code: 'novice', name: 'Just Starting', description: 'New to US financial system', lottieFile: 'seedling.json' },
  { code: 'beginner', name: 'Beginner', description: 'Know some basics', lottieFile: 'book.json' },
  { code: 'intermediate', name: 'Intermediate', description: 'Have some experience', lottieFile: 'chart.json' },
  { code: 'advanced', name: 'Advanced', description: 'Comfortable with finances', lottieFile: 'target.json' },
];

// Financial goals with Lottie animations
const FINANCIAL_GOALS = [
  { code: 'emergency_fund', name: 'Emergency Fund', lottieFile: 'shield.json' },
  { code: 'credit_score', name: 'Build Credit', lottieFile: 'growth.json' },
  { code: 'retirement', name: 'Retirement', lottieFile: 'beach.json' },
  { code: 'home_purchase', name: 'Buy a Home', lottieFile: 'house.json' },
  { code: 'investing', name: 'Start Investing', lottieFile: 'stocks.json' },
  { code: 'debt_payoff', name: 'Pay Off Debt', lottieFile: 'card.json' },
  { code: 'tax_planning', name: 'Tax Planning', lottieFile: 'document.json' },
  { code: 'remittances', name: 'Send Money Home', lottieFile: 'transfer.json' },
];

// Daily goal options
const DAILY_GOALS = [
  { minutes: 5, label: 'Casual', description: '5 minutes a day' },
  { minutes: 10, label: 'Regular', description: '10 minutes a day' },
  { minutes: 15, label: 'Serious', description: '15 minutes a day' },
  { minutes: 20, label: 'Intense', description: '20 minutes a day' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, setLearnerId, setUser } = useUserStore();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elephantAnimation, setElephantAnimation] = useState<any>(null);

  // Onboarding data state
  const [data, setData] = useState<OnboardingData>({
    native_language: '',
    english_proficiency: 'intermediate',
    country_of_origin: '',
    immigration_status: '',
    visa_type: '',
    has_ssn: false,
    sends_remittances: false,
    financial_goals: [],
    financial_experience_level: 'novice',
    daily_goal_minutes: 10,
  });

  // Step order for navigation
  const stepOrder: OnboardingStep[] = [
    'welcome', 'language', 'country', 'visa', 'experience', 'goals', 'daily_goal', 'complete'
  ];

  const currentStepIndex = stepOrder.indexOf(currentStep);
  const totalSteps = stepOrder.length - 2; // Exclude welcome and complete from progress

  // Load elephant animation from public folder
  useEffect(() => {
    fetch('/elephant.json')
      .then(res => res.json())
      .then(data => setElephantAnimation(data))
      .catch(err => console.error('Failed to load elephant animation:', err));
  }, []);

  // Check if user is already onboarded on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // First check if user is authenticated
        const sessionUser = await authApi.getCurrentUser();

        if (!sessionUser || !sessionUser.learner_id) {
          // Not authenticated, redirect to auth
          navigate('/auth');
          return;
        }

        // Store learner ID
        setLearnerId(sessionUser.learner_id);

        // Check if already onboarded
        const learner = await learnerApi.getProfile(sessionUser.learner_id);

        if (learner.onboarding_completed) {
          // Already onboarded, go to learn page
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
          navigate('/learn');
          return;
        }

        // Not onboarded, show onboarding
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        // If error, redirect to auth
        navigate('/auth');
      }
    };

    checkOnboardingStatus();
  }, [navigate, setLearnerId, setUser]);

  // Navigation functions
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  // Check if current step is valid to proceed
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'language':
        return data.native_language !== '';
      case 'country':
        return data.country_of_origin !== '';
      case 'visa':
        return data.visa_type !== '';
      case 'experience':
        return data.financial_experience_level !== '';
      case 'goals':
        return data.financial_goals.length > 0;
      case 'daily_goal':
        return data.daily_goal_minutes > 0;
      default:
        return true;
    }
  };

  // Submit onboarding
  const submitOnboarding = async () => {
    if (!learnerId) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check for remittances goal
      const sendsRemittances = data.financial_goals.includes('remittances');

      await learnerApi.completeOnboarding({
        learner_id: learnerId,
        native_language: data.native_language,
        english_proficiency: data.english_proficiency,
        country_of_origin: data.country_of_origin,
        immigration_status: data.visa_type, // Using visa_type as immigration_status
        visa_type: data.visa_type,
        has_ssn: data.visa_type === 'GREEN_CARD' || data.visa_type === 'CITIZEN',
        sends_remittances: sendsRemittances,
        financial_goals: data.financial_goals,
        financial_experience_level: data.financial_experience_level,
        daily_goal_minutes: data.daily_goal_minutes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Update user store
      const countryName = COUNTRIES.find(c => c.code === data.country_of_origin)?.name || data.country_of_origin;
      const visaName = VISA_TYPES.find(v => v.code === data.visa_type)?.name || data.visa_type;

      setUser({
        name: 'User', // Will be updated from profile
        email: '',
        country: countryName,
        visaType: visaName,
        streak: 0,
        totalXp: 0,
        hearts: 5,
        gems: 0,
      });

      // Move to complete step
      setCurrentStep('complete');
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle goal selection
  const toggleGoal = (goalCode: string) => {
    setData(prev => ({
      ...prev,
      financial_goals: prev.financial_goals.includes(goalCode)
        ? prev.financial_goals.filter(g => g !== goalCode)
        : [...prev.financial_goals, goalCode],
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#E5E5E5] border-t-[#58CC02] rounded-full"
        />
      </div>
    );
  }

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F0F0' }}>
      {/* Header with progress */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="sticky top-0 z-10 bg-white border-b-2 border-[#E5E5E5] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#AFAFAF]" />
            </button>
            <div className="flex-1">
              <ProgressBar current={currentStepIndex - 1} total={totalSteps} />
            </div>
            <span className="text-[13px] font-bold text-[#AFAFAF]">
              {currentStepIndex}/{totalSteps}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Welcome Step */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Elephant Mascot */}
                <div className="w-48 h-48 mx-auto mb-6">
                  {elephantAnimation ? (
                    <Lottie
                      animationData={elephantAnimation}
                      loop={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-20 h-20 bg-[#58CC02] rounded-[24px] flex items-center justify-center shadow-[0_4px_0_#46A302]">
                        <span className="text-white font-bold text-4xl">$</span>
                      </div>
                    </div>
                  )}
                </div>

                <h1 className="text-[32px] font-bold text-[#4B4B4B] mb-3" style={{ lineHeight: '40px' }}>
                  Welcome to FinLit!
                </h1>
                <p className="text-[17px] text-[#737373] mb-8" style={{ lineHeight: '24px' }}>
                  Let's personalize your learning experience to help you master US finances
                </p>

                <Button
                  variant="primary"
                  size="xl"
                  fullWidth
                  onClick={goNext}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Get Started
                </Button>

                <p className="text-[13px] text-[#AFAFAF] mt-4">
                  Takes about 2 minutes
                </p>
              </motion.div>
            )}

            {/* Language Step */}
            {currentStep === 'language' && (
              <motion.div
                key="language"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#DDF4FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-7 h-7 text-[#1CB0F6]" />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    What's your native language?
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    We'll provide explanations in your language when helpful
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {LANGUAGES.map((lang) => (
                    <OptionCard
                      key={lang.code}
                      emoji={lang.emoji}
                      title={lang.name}
                      selected={data.native_language === lang.code}
                      onClick={() => setData(prev => ({ ...prev, native_language: lang.code }))}
                    />
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goNext}
                  isDisabled={!canProceed()}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Country Step */}
            {currentStep === 'country' && (
              <motion.div
                key="country"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  {/* LOTTIE PLACEHOLDER: Need globe/world animation */}
                  <div className="w-14 h-14 bg-[#D7FFB8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-7 h-7 text-[#58CC02]" />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    Where are you from?
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    We'll tailor content to your cultural background
                  </p>
                </div>

                <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                  {COUNTRIES.map((country) => (
                    <OptionCard
                      key={country.code}
                      emoji={country.emoji}
                      title={country.name}
                      selected={data.country_of_origin === country.code}
                      onClick={() => setData(prev => ({ ...prev, country_of_origin: country.code }))}
                    />
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goNext}
                  isDisabled={!canProceed()}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Visa Step */}
            {currentStep === 'visa' && (
              <motion.div
                key="visa"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#F3E5FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-7 h-7 text-[#8549BA]" />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    What's your immigration status?
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    This helps us show relevant financial options for you
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {VISA_TYPES.map((visa) => (
                    <OptionCard
                      key={visa.code}
                      title={visa.name}
                      description={visa.description}
                      selected={data.visa_type === visa.code}
                      onClick={() => setData(prev => ({ ...prev, visa_type: visa.code }))}
                    />
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goNext}
                  isDisabled={!canProceed()}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Experience Step */}
            {currentStep === 'experience' && (
              <motion.div
                key="experience"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  {/* Lottie animation for experience level */}
                  <div className="w-14 h-14 bg-[#FFF0D5] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <LottieAnimation
                      src="chart.json"
                      className="w-full h-full"
                      loop={true}
                      autoplay={true}
                      fallback={
                        <div className="w-7 h-7 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      }
                    />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    How familiar are you with US finances?
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    We'll start at the right level for you
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <OptionCard
                      key={level.code}
                      lottieFile={level.lottieFile}
                      title={level.name}
                      description={level.description}
                      selected={data.financial_experience_level === level.code}
                      onClick={() => setData(prev => ({ ...prev, financial_experience_level: level.code }))}
                    />
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goNext}
                  isDisabled={!canProceed()}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Goals Step */}
            {currentStep === 'goals' && (
              <motion.div
                key="goals"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#DDF4FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-7 h-7 text-[#1CB0F6]" />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    What are your financial goals?
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    Select all that apply - you can change these later
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-8 justify-center">
                  {FINANCIAL_GOALS.map((goal) => (
                    <GoalOption
                      key={goal.code}
                      lottieFile={goal.lottieFile}
                      title={goal.name}
                      selected={data.financial_goals.includes(goal.code)}
                      onClick={() => toggleGoal(goal.code)}
                    />
                  ))}
                </div>

                {data.financial_goals.length > 0 && (
                  <p className="text-center text-[13px] text-[#58CC02] font-bold mb-4">
                    {data.financial_goals.length} goal{data.financial_goals.length > 1 ? 's' : ''} selected
                  </p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goNext}
                  isDisabled={!canProceed()}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Daily Goal Step */}
            {currentStep === 'daily_goal' && (
              <motion.div
                key="daily_goal"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#D7FFB8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-[#58CC02]" />
                  </div>
                  <h2 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
                    Set your daily goal
                  </h2>
                  <p className="text-[15px] text-[#737373] mt-2">
                    How much time can you commit each day?
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {DAILY_GOALS.map((goal) => (
                    <DailyGoalOption
                      key={goal.minutes}
                      minutes={goal.minutes}
                      label={goal.label}
                      description={goal.description}
                      selected={data.daily_goal_minutes === goal.minutes}
                      onClick={() => setData(prev => ({ ...prev, daily_goal_minutes: goal.minutes }))}
                    />
                  ))}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-[#FFDFE0] border-2 border-[#FF4B4B] rounded-[12px]">
                    <p className="text-[13px] text-[#FF4B4B] font-bold">{error}</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={submitOnboarding}
                  isLoading={isSubmitting}
                  isDisabled={!canProceed()}
                >
                  Complete Setup
                </Button>
              </motion.div>
            )}

            {/* Complete Step */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 bg-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_6px_0_#46A302]"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[32px] font-bold text-[#4B4B4B] mb-3"
                  style={{ lineHeight: '40px' }}
                >
                  You're all set!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[17px] text-[#737373] mb-8"
                  style={{ lineHeight: '24px' }}
                >
                  Take a quick assessment so we can personalize your learning path based on what you already know!
                </motion.p>

                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card variant="bordered" padding="md" className="mb-8 text-left">
                    <h3 className="font-bold text-[15px] text-[#4B4B4B] mb-3">Your Profile</h3>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Language</span>
                        <span className="font-bold text-[#4B4B4B]">
                          {LANGUAGES.find(l => l.code === data.native_language)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">From</span>
                        <span className="font-bold text-[#4B4B4B]">
                          {COUNTRIES.find(c => c.code === data.country_of_origin)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Daily Goal</span>
                        <span className="font-bold text-[#58CC02]">{data.daily_goal_minutes} min/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Goals</span>
                        <span className="font-bold text-[#4B4B4B]">{data.financial_goals.length} selected</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    onClick={() => navigate('/diagnostic')}
                    rightIcon={<ChevronRight className="w-5 h-5" />}
                  >
                    Take Quick Assessment
                  </Button>

                  <button
                    onClick={() => navigate('/learn')}
                    className="mt-3 text-[15px] font-bold text-[#AFAFAF] hover:text-[#737373] transition-colors"
                  >
                    Skip and start learning
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
