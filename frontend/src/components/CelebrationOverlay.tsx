import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Zap } from 'lucide-react'

interface CelebrationOverlayProps {
    isVisible: boolean
    onComplete: () => void
    xpEarned?: number
    gemsEarned?: number
    accuracy?: number
    title?: string
    subtitle?: string
    variant?: 'lesson' | 'purchase' | 'streak_freeze'
    nextRecommendation?: {
        kc_name: string
        domain: string
        reason: string
    } | null
}

export const CelebrationOverlay = ({
    isVisible,
    onComplete,
    xpEarned = 20,
    gemsEarned = 5,
    accuracy = 100,
    title,
    subtitle,
    variant = 'lesson',
    nextRecommendation = null,
}: CelebrationOverlayProps) => {
    const [showStats, setShowStats] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Determine content based on variant
    const isPurchase = variant === 'purchase';
    const isStreakFreeze = variant === 'streak_freeze';
    const isLesson = variant === 'lesson';

    const defaultTitle = isLesson ? "Lesson Complete!" :
        isStreakFreeze ? "Streak Freeze Activated!" :
            "Purchase Successful!";

    const displayTitle = title || defaultTitle;

    const animationSrc = isStreakFreeze ? "/streak-nice.gif" : "/happy-women.gif";
    const soundSrc = isPurchase ? '/assets/sounds/effects/coin-collect.mp3' : '/assets/sounds/effects/correct.mp3';

    useEffect(() => {
        if (isVisible) {
            // Play celebration sound
            try {
                audioRef.current = new Audio(soundSrc)
                audioRef.current.volume = 0.5
                audioRef.current.play().catch(() => { })
            } catch (e) {
                // Fallback - no sound
            }

            // Show stats after animation plays a bit
            const timer = setTimeout(() => setShowStats(true), 800)
            return () => {
                clearTimeout(timer)
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            }
        } else {
            setShowStats(false)
        }
    }, [isVisible, soundSrc])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
                >
                    {/* Main Content Container */}
                    <div className="flex flex-col items-center justify-center flex-1 px-6 pt-16">
                        {/* Celebration Animation */}
                        <motion.div
                            initial={{ y: -30, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative z-10 mb-6"
                        >
                            <div className="w-48 h-48 md:w-56 md:h-56">
                                <img
                                    src={animationSrc}
                                    alt="Celebration"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl md:text-3xl font-extrabold text-[#ffc840] text-center mb-4"
                        >
                            {displayTitle}
                        </motion.h1>

                        {/* Subtitle */}
                        {subtitle && (
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-gray-500 font-bold text-center mb-8 max-w-sm"
                            >
                                {subtitle}
                            </motion.p>
                        )}

                        {/* Stats Cards */}
                        <AnimatePresence>
                            {showStats && !isStreakFreeze && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
                                    className="flex gap-6 justify-center"
                                >
                                    {/* XP Card - Only show if XP > 0 and it's a lesson */}
                                    {isLesson && xpEarned > 0 && (
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="flex flex-col bg-white border-2 border-[#ffc840] rounded-2xl overflow-hidden min-w-[150px] shadow-sm"
                                        >
                                            <div className="bg-[#ffc840] py-2 px-4 text-center">
                                                <span className="text-xs font-black text-white uppercase tracking-wider">
                                                    Total XP
                                                </span>
                                            </div>
                                            <div className="py-6 px-4 flex items-center justify-center gap-3">
                                                <Zap className="w-8 h-8 text-[#ffc840] fill-[#ffc840]" />
                                                <span className="text-3xl font-black text-[#ffc840]">
                                                    {xpEarned}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Gems/Coins Card */}
                                    {(gemsEarned > 0 || isPurchase) && (
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="flex flex-col bg-white border-2 border-amber-400 rounded-2xl overflow-hidden min-w-[150px] shadow-sm"
                                        >
                                            <div className="bg-amber-400 py-2 px-4 text-center">
                                                <span className="text-xs font-black text-white uppercase tracking-wider">
                                                    {isPurchase ? 'Coins Added' : 'Gems'}
                                                </span>
                                            </div>
                                            <div className="py-6 px-4 flex items-center justify-center gap-3">
                                                <img
                                                    src="/coin.svg"
                                                    alt="Gems"
                                                    className="w-8 h-8 object-contain"
                                                />
                                                <span className="text-3xl font-black text-amber-500">
                                                    {gemsEarned}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Next Recommendation */}
                    {isLesson && nextRecommendation && showStats && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="mt-8 px-6 max-w-md"
                        >
                            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-lg">✨</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Up Next</p>
                                        <p className="text-sm font-extrabold text-gray-800 mb-1">{nextRecommendation.kc_name}</p>
                                        <p className="text-xs text-gray-600">{nextRecommendation.reason}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Footer with Buttons */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className={`w-full p-8 border-t-2 border-gray-100 flex items-center max-w-4xl mx-auto bg-white mb-4 ${!isLesson ? 'justify-center' : 'justify-between'
                            }`}
                    >
                        {/* Review Lesson Button */}
                        {isLesson && (
                            <button
                                onClick={onComplete}
                                className="px-8 py-3 rounded-2xl text-gray-400 font-extrabold text-sm uppercase tracking-widest hover:text-black transition-colors"
                            >
                                Review Lesson
                            </button>
                        )}

                        {/* Continue/Awesome Button */}
                        <button
                            onClick={onComplete}
                            className="px-16 py-4 bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-extrabold text-base rounded-2xl border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-sm"
                        >
                            {!isLesson ? 'Awesome!' : 'Continue'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default CelebrationOverlay
