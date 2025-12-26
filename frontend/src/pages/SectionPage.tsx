import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, BookOpen, Trophy, Check, Flame, Heart, Lock, Gem, Archive } from 'lucide-react'
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
                    <div className="bg-[#58cc02] rounded-2xl p-4 sm:p-6 mb-10 relative overflow-hidden text-white shadow-sm flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-start justify-between z-10">
                            <button
                                onClick={() => navigate('/learn')}
                                className="group hover:bg-black/10 p-1.5 -ml-1.5 rounded-xl transition-colors mb-2"
                            >
                                <ArrowLeft className="w-6 h-6 stroke-[3] text-white/90 group-hover:text-white" />
                            </button>

                            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 px-4 py-2.5 rounded-xl font-bold transition-all uppercase tracking-widest text-xs sm:text-sm border-2 border-transparent">
                                <BookOpen className="w-5 h-5 mr-1" strokeWidth={2.5} />
                                Guidebook
                            </button>
                        </div>

                        <div className="z-10">
                            <h3 className="text-white/80 font-extrabold text-sm uppercase tracking-widest mb-1">
                                Section {course.id}, Unit 1
                            </h3>
                            <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {course.title}
                            </h1>
                        </div>
                    </div>

                    {/* Path with Lesson Nodes */}
                    <div className="flex flex-col items-center gap-4 relative pb-32 w-full max-w-[400px] mx-auto">
                        {course.modules.map((module, index) => {
                            const isCompleted = completedLessons.includes(module.id)
                            const isNext = !isCompleted && (index === 0 || completedLessons.includes(course.modules[index - 1]?.id))
                            const isLocked = !isCompleted && !isNext

                            // Sine wave path logic
                            const xOffset = Math.sin(index * Math.PI / 2) * 60; // Slightly tighter wave

                            // Determine Icon
                            let Icon = Star;
                            if ((index + 1) % 4 === 0) Icon = Archive; // Chest
                            if (index === course.modules.length - 1) Icon = Trophy;

                            return (
                                <div
                                    key={module.id}
                                    className="relative flex items-center justify-center h-24 w-full"
                                >
                                    <div
                                        className="relative z-10 flex justify-center"
                                        style={{ transform: `translateX(${xOffset}px)` }}
                                    >
                                        {/* "START" Bubble */}
                                        {isNext && (
                                            <motion.div
                                                initial={{ y: -10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="absolute -top-[52px] md:-top-[58px] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                                            >
                                                <div className="bg-white text-[#58cc02] font-extrabold text-sm py-2 px-3 rounded-xl shadow-lg border-2 border-gray-100 whitespace-nowrap animate-bounce uppercase tracking-widest">
                                                    Start
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-gray-100 transform rotate-45"></div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Node Button */}
                                        <div className="relative group">
                                            {/* Pulse effect for next lesson */}
                                            {isNext && (
                                                <div className="absolute -inset-3 bg-[#58cc02]/30 rounded-full blur-md animate-pulse"></div>
                                            )}

                                            <button
                                                disabled={isLocked}
                                                onClick={() => {
                                                    if (!isLocked) {
                                                        navigate(`/lesson/${module.id}`)
                                                    }
                                                }}
                                                className={cn(
                                                    "relative w-[70px] h-[70px] rounded-full flex items-center justify-center transition-transform duration-100 shadow-sm",
                                                    isNext ? "bg-[#58cc02] border-b-[6px] border-[#46a302] active:border-b-0 active:translate-y-[6px]" :
                                                        isCompleted ? "bg-[#ffc800] border-b-[6px] border-[#e5b400] active:border-b-0 active:translate-y-[6px]" :
                                                            "bg-[#e5e5e5] border-b-[6px] border-[#cecece]"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="w-8 h-8 text-white stroke-[4]" />
                                                ) : (
                                                    <Icon className={cn(
                                                        "w-8 h-8 stroke-[3]",
                                                        isNext ? "fill-white text-white" :
                                                            isCompleted ? "fill-white/40 text-white" :
                                                                "fill-[#afafaf] text-[#afafaf]"
                                                    )} />
                                                )}
                                            </button>

                                            {/* Mascot next to active node */}
                                            {isNext && (
                                                <motion.img
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    src="/man.gif"
                                                    alt="Mascot"
                                                    className="absolute top-2 -right-[100px] w-24 h-24 object-contain pointer-events-none z-0"
                                                />
                                            )}
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
                    <div className="space-y-6">
                        <div className="border-2 border-gray-200 rounded-2xl p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Gold League</h3>
                                <button className="text-cyan-500 font-bold text-xs uppercase tracking-widest hover:text-cyan-400">View League</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <Trophy className="w-12 h-12 text-yellow-400" />
                                <p className="text-gray-400 text-sm font-medium">Top 10 advance to the next league</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
