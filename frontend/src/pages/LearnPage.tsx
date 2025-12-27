import { motion } from 'framer-motion'
import { Trophy, Zap, Heart, Star, Lock, Flame, Gem, ArrowLeft, Sparkles, Brain, Target, CheckCircle2, Circle, MessageSquare, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { COMPREHENSIVE_COURSES } from '../data/courses'

export const LearnPage = () => {
    const { user } = useUserStore()
    const navigate = useNavigate()
    const completedLessons = [1];

    if (!user) return null;

    return (
        <div className="flex flex-col w-full min-h-screen bg-white">
            {/* Back Header - Sticky */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 xl:pr-96">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:bg-gray-100 rounded-full transition-colors" strokeWidth={3} />
                    <span className="font-bold uppercase tracking-widest text-sm">Back</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex justify-center xl:pr-96">
                <div className="w-full max-w-[720px] py-8 px-5">
                    {/* Daily AI Insight Banner */}
                    <div className="mb-8">
                        <div className="bg-[#ddf4ff] border-2 border-[#ddf4ff] rounded-2xl p-0.5 relative overflow-hidden group hover:bg-[#cbeaff] transition-colors">
                            <div className="p-5 flex items-start gap-4">
                                <div className="p-2 rounded-xl">
                                    <img src="/fire.svg" alt="Fire" className="w-8 h-8 object-contain" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-extrabold text-orange-500 uppercase tracking-widest">
                                            AI Insight of the Day
                                        </span>
                                    </div>
                                    <h3 className="text-gray-800 font-extrabold text-lg mb-1">Credit Score Boost</h3>
                                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                        Paying your rent online can now boost your credit score. Experian Boost™ averages a 13pt increase for new users.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {COMPREHENSIVE_COURSES.map((course, index) => {
                            const isUnlocked = index === 0;
                            const totalModules = course.modules.length;
                            const completedInCourse = course.modules.filter(m => completedLessons.includes(m.id)).length;
                            const progress = totalModules > 0 ? (completedInCourse / totalModules) * 100 : 0;

                            return (
                                <div
                                    key={course.id}
                                    className={`rounded-2xl p-0 relative overflow-hidden border-2 transition-transform hover:translate-y-[-2px] ${isUnlocked
                                        ? 'bg-[#dcfce7] border-[#dcfce7]' // Green theme
                                        : 'bg-white border-gray-200'
                                        } ${isUnlocked ? '' : 'opacity-100'}`}
                                >
                                    <div className={`p-4 pb-2 border-b-0 ${isUnlocked ? 'bg-[#dcfce7]' : 'bg-white'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-extrabold tracking-widest uppercase ${isUnlocked ? 'text-green-600' : 'text-cyan-500'}`}>
                                                    {isUnlocked ? 'SECTION 1, UNIT 1' : `SECTION ${index + 1}, UNIT 1`}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none mb-2">{course.title}</h3>
                                    </div>

                                    <div className="px-4 pb-6 flex justify-between items-end relative z-10">
                                        <div className="flex-1 max-w-[60%] space-y-4">
                                            {isUnlocked ? (
                                                <>
                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="flex-1 h-4 bg-white rounded-full overflow-hidden shadow-inner">
                                                            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(progress, 15)}%` }} />
                                                        </div>
                                                        <img src="/trophy.svg" alt="Trophy" className="w-12 h-12 drop-shadow-sm" />
                                                    </div>

                                                    <button
                                                        onClick={() => navigate(`/section/${course.id}`)}
                                                        className="w-full py-3.5 bg-green-500 text-white font-bold text-sm rounded-xl border-b-4 border-green-600 hover:bg-green-400 hover:border-green-500 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-sm"
                                                    >
                                                        Continue
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-gray-400 font-bold bg-gray-100 px-4 py-3 rounded-xl mb-4 w-fit border-2 border-gray-100">
                                                        <Lock className="w-5 h-5" />
                                                        <span className="tracking-widest text-xs">LOCKED</span>
                                                    </div>
                                                    <button disabled className="w-full py-3.5 bg-gray-200 text-gray-400 font-bold text-sm rounded-xl border-b-4 border-gray-300 cursor-not-allowed uppercase tracking-widest">
                                                        Jump to Section {index + 1}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Mascot Area */}
                                        <div className="flex flex-col items-center justify-end w-32 md:w-40 relative -mb-2">
                                            {/* Speech Bubble */}
                                            {isUnlocked && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className="absolute -top-16 -left-4 z-20"
                                                >
                                                    <div className="relative bg-white border-2 border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
                                                        <p className="text-sm font-bold text-gray-700 whitespace-nowrap">Let's go!</p>
                                                        {/* Tail */}
                                                        <div className="absolute -bottom-[9px] right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-gray-200 transform rotate-45"></div>
                                                        {/* Cover border for tail intersection */}
                                                        <div className="absolute -bottom-[2px] right-6 w-4 h-2 bg-white transform"></div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Subtitle bubble for locked, if desired, otherwise standard mascot */}
                                            {!isUnlocked && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute -top-16 -left-8 z-20"
                                                >
                                                    <div className="relative bg-white border-2 border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
                                                        <p className="text-xs font-bold text-gray-500 whitespace-nowrap">Complete Section {index}</p>
                                                        <div className="absolute -bottom-[9px] right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-gray-200 transform rotate-45"></div>
                                                        <div className="absolute -bottom-[2px] right-6 w-4 h-2 bg-white transform"></div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            <img
                                                src={index === 0 ? "/man.gif" : `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.title}&backgroundColor=transparent`}
                                                alt="Mascot"
                                                className={`w-28 h-28 md:w-32 md:h-32 object-contain ${!isUnlocked && 'grayscale opacity-60'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Fixed Position */}
            <div className="hidden xl:flex fixed right-0 top-0 w-96 h-screen flex-col border-l-2 border-gray-200 bg-white overflow-y-auto z-40">
                <div className="p-8 space-y-8">
                    {/* Stats Header */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="https://flagcdn.com/w40/us.png" alt="US" className="w-8 h-6 rounded-md object-cover shadow-sm" />
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/fire.svg" alt="Streak" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-gray-500">{user.streak}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <img src="/coin.svg" alt="Coins" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-gray-500">{user.gems}</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                            <span className="font-bold text-gray-400 hover:text-red-500 transition-colors">{user.hearts}</span>
                        </div>
                    </div>

                    {/* Widgets */}
                    <div className="space-y-6">

                        {/* AI Financial Coach Widget */}
                        <div className="border-2 border-indigo-50 rounded-2xl p-0 overflow-hidden bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer group shadow-sm">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-extrabold text-indigo-950 flex items-center gap-2">
                                        <img src="/profile.svg" alt="Coach" className="w-6 h-6 object-contain" />
                                        FinAI Coach
                                    </h3>
                                    <div className="px-2 py-1 bg-indigo-100 rounded-lg text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                                        BETA
                                    </div>
                                </div>
                                <p className="text-sm text-indigo-900/70 font-medium leading-relaxed mb-4">
                                    Confused about taxes or 401(k)? tailored advice for your situation.
                                </p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 px-3 bg-white border-2 border-indigo-100 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-wide hover:bg-indigo-50 transition-colors text-center">
                                        Ask Question
                                    </button>
                                    <button className="flex-1 py-2 px-3 bg-indigo-600 border-b-4 border-indigo-700 rounded-xl text-white text-xs font-bold uppercase tracking-wide hover:bg-indigo-500 active:border-b-0 active:translate-y-0.5 transition-all text-center">
                                        Start Chat
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Immigrant Journey Tracker */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">My American Journey</h3>
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />
                                    <span className="text-sm font-bold text-gray-400 line-through">Visa Approved</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />
                                    <span className="text-sm font-bold text-gray-400 line-through">SSN Obtained</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-50">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Open Bank Account</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Circle className="w-5 h-5 text-gray-300" />
                                    <span className="text-sm font-bold text-gray-400">Build Credit Score</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t-2 border-gray-100">
                                <button className="w-full text-center text-gray-400 text-xs font-extrabold uppercase tracking-widest hover:text-gray-600">
                                    View Full Roadmap
                                </button>
                            </div>
                        </div>

                        {/* Try Super */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 leading-tight">Try Super for free</h3>
                                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg uppercase tracking-wide">NEW</div>
                                </div>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">No ads, personalized practice, and unlimited Legendary!</p>
                                <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl border-b-4 border-blue-600 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm shadow-sm">
                                    TRY 1 WEEK FREE
                                </button>
                            </div>
                        </div>

                        {/* League */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Gold League</h3>
                                <button onClick={() => navigate('/leaderboard')} className="text-cyan-500 font-bold text-xs uppercase tracking-widest hover:text-cyan-400">VIEW LEAGUE</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/trophy.svg" alt="Trophy" className="w-12 h-12 object-contain" />
                                <p className="text-gray-400 text-sm font-medium">Complete a lesson to join this week's leaderboard</p>
                            </div>
                        </div>

                        {/* Daily Quests */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Daily Quests</h3>
                                <button onClick={() => navigate('/quests')} className="text-cyan-500 font-bold text-xs uppercase tracking-widest hover:text-cyan-400">VIEW ALL</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/fire.svg" alt="Fire" className="w-10 h-10 object-contain" />
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm font-bold mb-1">
                                        <span className="text-gray-700">Earn 50 XP</span>
                                        <span className="text-gray-400">35 / 50</span>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full shadow-inner" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
