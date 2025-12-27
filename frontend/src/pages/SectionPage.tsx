import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Trophy, Flame, Heart, Gem } from 'lucide-react'
import { COMPREHENSIVE_COURSES } from '../data/courses'
import { useUserStore } from '../stores/userStore'
import { cn } from '../utils/cn'

export const SectionPage = () => {
    const navigate = useNavigate()
    const { sectionId } = useParams()
    const { user } = useUserStore()

    const courseId = Number(sectionId) || 1;
    const course = COMPREHENSIVE_COURSES.find(c => c.id === courseId)

    // TODO: Add completedLessons to user store
    const completedLessons: number[] = [1];

    if (!course || !user) return null;

    return (
        <div className="flex flex-col w-full min-h-screen bg-white">
            <div className="flex-1 flex justify-center xl:pr-96">
                <div className="w-full max-w-[600px] py-6 px-4">

                    {/* Header Banner - Duolingo Style */}
                    {/* Header Banner - Duolingo Style */}
                    <div className="bg-[#58cc02] rounded-2xl px-5 py-4 mb-8 text-white shadow-sm flex items-center justify-between border-b-[6px] border-[#46a302]">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3 text-[#b8f28b] font-extrabold text-xs uppercase tracking-widest">
                                <button
                                    onClick={() => navigate('/learn')}
                                    className="hover:bg-black/10 p-1 rounded-lg transition-colors -ml-2"
                                >
                                    <ArrowLeft className="w-5 h-5 stroke-[3] text-[#b8f28b] hover:text-white" />
                                </button>
                                Section {course.id}, Unit 1
                            </div>
                            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-none pl-6">
                                {course.title}
                            </h1>
                        </div>

                        <button className="hidden sm:flex items-center gap-2 bg-[#58cc02] border-2 border-[#79d635] hover:bg-[#61d90b] active:border-b-2 px-4 py-2.5 rounded-xl font-extrabold transition-all uppercase tracking-widest text-xs shadow-sm hover:brightness-105">
                            <BookOpen className="w-5 h-5" strokeWidth={2.5} />
                            Guidebook
                        </button>
                    </div>

                    {/* Vertical Module List - Card Style */}
                    <div className="flex flex-col gap-0 w-full max-w-[600px] mx-auto pb-32">
                        {course.modules.map((module, index) => {
                            const isCompleted = completedLessons.includes(module.id)
                            const isNext = !isCompleted && (index === 0 || completedLessons.includes(course.modules[index - 1]?.id))
                            const isLocked = !isCompleted && !isNext

                            // Mock data for UI alignment with reference
                            const points = 500 + (index * 150)
                            const progress = isCompleted ? 100 : (isNext ? 0 : 0)

                            return (
                                <div key={module.id} className="flex gap-4 sm:gap-6 relative">
                                    {/* Connecting Line */}
                                    {index !== course.modules.length - 1 && (
                                        <div className="absolute left-[20px] sm:left-[24px] top-[60px] bottom-[-24px] w-[3px] bg-[#58cc02]/20 z-0 rounded-full" />
                                    )}

                                    {/* Number Indicator */}
                                    <div className="relative z-10 pt-2 flex-shrink-0">
                                        <div className={cn(
                                            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-sm border-[4px] transition-colors duration-200",
                                            isLocked
                                                ? "bg-gray-100 text-gray-400 border-white"
                                                : "bg-[#58cc02] text-white border-white ring-4 ring-[#58cc02]/20"
                                        )}>
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className={cn(
                                        "flex-1 bg-white border-2 rounded-3xl p-5 mb-8 transition-all duration-200 relative overflow-hidden group",
                                        isLocked ? "border-gray-100" : "border-gray-100 shadow-sm hover:shadow-md hover:border-[#58cc02]/30"
                                    )}>
                                        {/* locked overlay */}
                                        {isLocked && <div className="absolute inset-0 bg-white/50 z-10" />}

                                        <div className="relative z-0">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col">
                                                    <h3 className={cn(
                                                        "font-extrabold text-xl mb-1",
                                                        isLocked ? "text-gray-400" : "text-gray-900"
                                                    )}>
                                                        {module.title}
                                                    </h3>
                                                    <span className="text-gray-400 text-xs font-bold tracking-wider uppercase">
                                                        Module {index + 1} of {course.modules.length}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                                    <span className="font-extrabold text-amber-500 text-sm">{points}+</span>
                                                    <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center border-2 border-amber-300 text-[10px]">🪙</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-100 h-2.5 rounded-full mb-2 overflow-hidden">
                                                <div
                                                    className="bg-[#58cc02] h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-end mb-6">
                                                <span className="text-xs font-bold text-gray-400">{progress}%</span>
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => !isLocked && navigate(`/lesson/${module.id}`)} // Just for viewing mostly
                                                    disabled={isLocked}
                                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold py-3 rounded-2xl transition-colors border-2 border-transparent hover:border-gray-200 text-sm uppercase tracking-wider"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => !isLocked && navigate(`/lesson/${module.id}`)}
                                                    disabled={isLocked}
                                                    className={cn(
                                                        "flex-[2] font-extrabold py-3 rounded-2xl transition-all shadow-sm border-b-[4px] active:border-b-0 active:translate-y-[4px] text-sm uppercase tracking-wider flex items-center justify-center gap-2",
                                                        isLocked
                                                            ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                                                            : "bg-[#58cc02] text-white border-[#46a302] hover:bg-[#61d90b] hover:brightness-105"
                                                    )}
                                                >
                                                    {isCompleted ? 'Review' : (isNext ? 'Start' : 'Locked')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Start Button Fixed at Bottom for Mobile (optional, but nice UX) */}
                    <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-50">
                        {/* Could add a 'Continue' FAB here if user scrolled away */}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Exactly matching LearnPage */}
            <div className="hidden xl:flex fixed right-0 top-0 w-96 h-screen flex-col border-l-2 border-gray-200 bg-white overflow-y-auto z-40">
                <div className="p-8 space-y-8">
                    {/* Stats */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors cursor-pointer">
                            <img src="https://flagcdn.com/w40/us.png" alt="US" className="w-8 h-6 rounded-md object-cover shadow-sm" />
                        </div>
                        <div className="flex items-center gap-2 hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors cursor-pointer">
                            <Flame className="w-5 h-5 text-orange-500 fill-current" />
                            <span className="font-bold text-gray-400 hover:text-orange-500">{user.streak}</span>
                        </div>
                        <div className="flex items-center gap-2 hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors cursor-pointer">
                            <Gem className="w-5 h-5 text-blue-400 fill-current" />
                            <span className="font-bold text-gray-400 hover:text-blue-400">{user.gems}</span>
                        </div>
                        <div className="flex items-center gap-2 hover:bg-gray-100 p-2 px-3 rounded-xl transition-colors cursor-pointer">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                            <span className="font-bold text-gray-400 hover:text-red-500">{user.hearts}</span>
                        </div>
                    </div>

                    {/* Simple Widgets */}
                    {/* Widgets container */}
                    <div className="space-y-6">
                        {/* Daily Quests Widget */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <img src="/quest.svg" className="w-6 h-6" alt="" />
                                    Daily Quests
                                </h3>
                                <button className="text-blue-400 font-bold text-xs uppercase tracking-widest hover:text-blue-500">View All</button>
                            </div>
                            <div className="space-y-4">
                                {/* Quest 1: XP */}
                                <div className="flex items-center gap-3">
                                    <img src="/generated_icons/xp_bolt.png" className="w-10 h-10 object-contain" alt="XP" />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-700 text-sm mb-1">Earn 10 XP</div>
                                        <div className="relative w-full bg-gray-100 h-6 rounded-full overflow-hidden border border-gray-200">
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tighter">0 / 10</span>
                                            </div>
                                            <div className="bg-yellow-400 h-full rounded-full transition-all border-r-2 border-yellow-500/20" style={{ width: '0%' }}></div>
                                        </div>
                                    </div>
                                    <img src="/quest.svg" className="w-12 h-12 object-contain cursor-pointer transition-transform hover:scale-110 -ml-1 pt-4" alt="Reward" />
                                </div>

                                {/* Quest 2: Time */}
                                <div className="flex items-center gap-3">
                                    <img src="/generated_icons/timer_clock.png" className="w-10 h-10 object-contain" alt="Time" />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-700 text-sm mb-1">Spend 5 minutes learning</div>
                                        <div className="relative w-full bg-gray-100 h-6 rounded-full overflow-hidden border border-gray-200">
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tighter">0 / 5</span>
                                            </div>
                                            <div className="bg-blue-400 h-full rounded-full transition-all border-r-2 border-blue-500/20" style={{ width: '0%' }}></div>
                                        </div>
                                    </div>
                                    <img src="/quest.svg" className="w-12 h-12 object-contain cursor-pointer transition-transform hover:scale-110 -ml-1 pt-4" alt="Reward" />
                                </div>

                                {/* Quest 3: Score */}
                                <div className="flex items-center gap-3">
                                    <img src="/generated_icons/target_icon.png" className="w-10 h-10 object-contain" alt="Score" />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-700 text-sm mb-1">Score 80% or higher</div>
                                        <div className="relative w-full bg-gray-100 h-6 rounded-full overflow-hidden border border-gray-200">
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tighter">0 / 3</span>
                                            </div>
                                            <div className="bg-green-500 h-full rounded-full transition-all border-r-2 border-green-600/20" style={{ width: '0%' }}></div>
                                        </div>
                                    </div>
                                    <img src="/quest.svg" className="w-12 h-12 object-contain cursor-pointer transition-transform hover:scale-110 -ml-1 pt-4" alt="Reward" />
                                </div>
                            </div>
                        </div>

                        {/* Course Progress Widget */}
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">My Progress</h3>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full border-[3px] border-gray-100 relative flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#58cc02"
                                            strokeWidth="3"
                                            strokeDasharray="12, 100"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="font-extrabold text-[#58cc02] text-sm">12%</span>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm mb-0.5">{course.title}</div>
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total XP: 450</div>
                                </div>
                            </div>
                            <button className="w-full py-3 rounded-xl border-2 border-gray-200 font-extrabold text-gray-400 uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors">
                                View Certificate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
