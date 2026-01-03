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
}

export const CelebrationOverlay = ({
    isVisible,
    onComplete,
    xpEarned = 20,
    gemsEarned = 5,
    accuracy = 100,
    title = "Lesson Complete!",
}: CelebrationOverlayProps) => {
    const [showStats, setShowStats] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (isVisible) {
            // Play celebration sound
            try {
                audioRef.current = new Audio('/assets/sounds/effects/coin-collect.mp3')
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
    }, [isVisible])

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
                        {/* Celebration Animation - Happy Women GIF */}
                        <motion.div
                            initial={{ y: -30, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative z-10 mb-6"
                        >
                            <div className="w-48 h-48 md:w-56 md:h-56">
                                <img
                                    src="/happy-women.gif"
                                    alt="Celebration"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </motion.div>

                        {/* Title - Yellow and smaller as requested */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl md:text-3xl font-extrabold text-[#ffc840] text-center mb-10"
                        >
                            {title}
                        </motion.h1>

                        {/* Stats Cards - New Layout based on image */}
                        <AnimatePresence>
                            {showStats && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
                                    className={`flex gap-6 ${xpEarned === 0 ? 'justify-center' : ''}`}
                                >
                                    {/* XP Card - Only show if XP > 0 */}
                                    {xpEarned > 0 && (
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

                                    {/* Gems Card - Amber Header style to match coin theme */}
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="flex flex-col bg-white border-2 border-amber-400 rounded-2xl overflow-hidden min-w-[150px] shadow-sm"
                                    >
                                        <div className="bg-amber-400 py-2 px-4 text-center">
                                            <span className="text-xs font-black text-white uppercase tracking-wider">
                                                {title?.includes('Payment') ? 'Coins Added' : 'Gems'}
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer with Buttons */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className={`w-full p-8 border-t-2 border-gray-100 flex items-center max-w-4xl mx-auto bg-white mb-4 ${
                            title?.includes('Payment') ? 'justify-center' : 'justify-between'
                        }`}
                    >
                        {/* Review Lesson Button - Only show for lesson completion */}
                        {!title?.includes('Payment') && (
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
                            {title?.includes('Payment') ? 'Awesome!' : 'Continue'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default CelebrationOverlay
