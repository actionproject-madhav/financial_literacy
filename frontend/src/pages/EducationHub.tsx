// pages/EducationHub.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import confetti from 'canvas-confetti'
import Layout from '../components/Layout'
import { allUnits, Unit, Lesson } from './Curriculumdata'
import LessonGame from '../components/education/LessonGame'
import QuizBattle from '../components/education/QuizBattle'
import useGameSound from '../hooks/useGameSound'
import useXPSystem from '../hooks/useXPSystem'
import { Lock, BookOpen, ChevronLeft, Star, Trophy, Map, Target, TrendingUp, Coins, Snowflake, Cloud } from 'lucide-react'
import IslandModelViewer from '../components/education/IslandModelViewer'
import { useUser } from '../context/UserContext'
import { useNavbar } from '../context/NavbarContext'
import educationService from '../services/educationService'



// Import Lottie animations
import streakFireAnimation from '../assets/animations/streak-fire.json'
import moneyAnimation from '../assets/animations/Money.json'
import financeAnimation from '../assets/animations/Finance.json'
import investingAnimation from '../assets/animations/investing.json'
import stocksAnimation from '../assets/animations/stocks.json'
import elephantAnimation from '../assets/animations/elephant.json'



interface Island {
  id: string
  name: string
  color: string
  model: string
  theme: 'tropical' | 'volcanic' | 'arctic' | 'sky'
  bgMusic: string
  unit: Unit
  locked: boolean
  unlockRequirement?: {
    completeLessons?: number
    level?: number
    badges?: string[]
    fromIsland?: string
  }
}

const EducationHub = () => {
  // Game State - simplified to: 'islands', 'island-map', 'lesson', 'quiz'
  const [currentIsland, setCurrentIsland] = useState<Island | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [gameMode, setGameMode] = useState<'islands' | 'island-map' | 'lesson' | 'quiz'>('islands')
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<{island: Island, type: 'island' | 'lesson'} | null>(null)
  const [showIslandIntro, setShowIslandIntro] = useState<Island | null>(null)
  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  const { setHideNavbar } = useNavbar()
  
  const [playerStats, setPlayerStats] = useState<{
    level: number
    xp: number
    streak: number
    hearts: number
    coins: number
    badges: string[]
    unlockedIslands: string[]
    completedLessons: (string | number)[]
    powerups: {
      xpBoost: number
      streakFreeze: number
      heartRefill: number
    }
  }>({
    level: 1,
    xp: 0,
    streak: 0,
    hearts: 5,
    coins: 100,
    badges: [],
    unlockedIslands: ['unit-1'],
    completedLessons: [],
    powerups: {
      xpBoost: 0,
      streakFreeze: 0,
      heartRefill: 0
    }
  })

  // Hooks
  const { playSound, startBgMusic, stopBgMusic } = useGameSound()
  const { calculateLevel } = useXPSystem()
  const { user } = useUser()

  // Island Configuration - map curriculum units to islands
  const islands: Island[] = [
    {
      id: 'unit-1',
      name: 'Fundamentals Island',
      color: '#4ECDC4',
      model: '/3d-models/island-tropical.glb',
      theme: 'tropical',
      bgMusic: 'island-tropical.mp3',
      unit: allUnits[0],
      locked: false
    },
    {
      id: 'unit-2',
      name: 'Stock Market Volcano',
      color: '#FF6B6B',
      model: '/3d-models/island-volcano.glb',
      theme: 'volcanic',
      bgMusic: 'island-volcano.mp3',
      unit: allUnits[1],
      locked: true,
      unlockRequirement: { completeLessons: 3, fromIsland: 'unit-1' }
    },
    {
      id: 'unit-3',
      name: 'Bond Glacier',
      color: '#A8E6CF',
      model: '/3d-models/island-ice.glb',
      theme: 'arctic',
      bgMusic: 'island-ice.mp3',
      unit: allUnits[2],
      locked: true,
      unlockRequirement: { completeLessons: 5 }
    },
    {
      id: 'unit-4',
      name: 'ETF Sky Kingdom',
      color: '#FFD93D',
      model: '/3d-models/island-sky.glb',
      theme: 'sky',
      bgMusic: 'island-sky.mp3',
      unit: allUnits[3],
      locked: true,
      unlockRequirement: { badges: ['fundamentals-master', 'stocks-master'] }
    }
  ]

  // Helper function to check island unlocks - Fixed logic
  const checkIslandUnlocks = useCallback((stats: typeof playerStats): string[] => {
    const newUnlockedIslands: string[] = []
    const completedCount = stats.completedLessons.length
    
    islands.forEach(island => {
      // Only check locked islands that aren't already unlocked
      if (island.locked && !stats.unlockedIslands.includes(island.id)) {
        const req = island.unlockRequirement
        if (!req) return // No requirement means it stays locked
        
        let shouldUnlock = false
        
        // Check lesson completion requirement
        if ('completeLessons' in req && req.completeLessons !== undefined) {
          if (completedCount >= req.completeLessons) {
            // If fromIsland is specified, check lessons from that island
            if (req.fromIsland) {
              const fromIslandLessons = islands.find(i => i.id === req.fromIsland)?.unit.lessons || []
              const completedFromIsland = fromIslandLessons.filter(lesson => 
                stats.completedLessons.includes(lesson.id)
              ).length
              if (completedFromIsland >= req.completeLessons) {
                shouldUnlock = true
              }
            } else {
              // Total completed lessons
              if (completedCount >= req.completeLessons) {
                shouldUnlock = true
              }
            }
          }
        }
        
        // Check level requirement
        if ('level' in req && typeof req.level === 'number') {
          if (stats.level >= req.level) {
            shouldUnlock = true
          }
        }
        
        // Check badge requirements (all must be present)
        if (req.badges && Array.isArray(req.badges) && req.badges.length > 0) {
          const hasAllBadges = req.badges.every((badge: string) => stats.badges.includes(badge))
          if (hasAllBadges) {
            shouldUnlock = true
          }
        }
        
        if (shouldUnlock) {
          newUnlockedIslands.push(island.id)
        }
      }
    })
    
    return newUnlockedIslands
  }, [])
  
  // Load progress from backend (or localStorage as fallback) on mount
  useEffect(() => {
    const loadProgress = async () => {
      const userId = user?.email || user?.id
      
      if (userId) {
        try {
          const backendProgress = await educationService.getProgress(userId)
          if (backendProgress) {
            setPlayerStats(prev => {
              const loadedStats = { ...prev, ...backendProgress }
              const newUnlocks = checkIslandUnlocks(loadedStats)
              if (newUnlocks.length > 0) {
                return {
                  ...loadedStats,
                  unlockedIslands: [...loadedStats.unlockedIslands, ...newUnlocks]
                }
              }
              return loadedStats
            })
            localStorage.setItem('educationProgress', JSON.stringify(backendProgress))
            return
          }
        } catch (error) {
          console.warn('⚠️ Failed to load progress from backend, trying localStorage:', error)
        }
      }
      
      // Fallback to localStorage
      const savedProgress = localStorage.getItem('educationProgress')
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress)
          setPlayerStats(prev => {
            const loadedStats = { ...prev, ...progress }
            const newUnlocks = checkIslandUnlocks(loadedStats)
            if (newUnlocks.length > 0) {
              return {
                ...loadedStats,
                unlockedIslands: [...loadedStats.unlockedIslands, ...newUnlocks]
              }
            }
            return loadedStats
          })
        } catch (e) {
          console.warn('Failed to load progress from localStorage:', e)
        }
      }
    }
    
    loadProgress()
  }, [user?.email, user?.id, checkIslandUnlocks])

  // Save progress to localStorage and backend whenever it changes
  useEffect(() => {
    const progressData = {
      level: playerStats.level,
      xp: playerStats.xp,
      streak: playerStats.streak,
      hearts: playerStats.hearts,
      coins: playerStats.coins,
      badges: playerStats.badges,
      unlockedIslands: playerStats.unlockedIslands,
      completedLessons: playerStats.completedLessons,
      powerups: playerStats.powerups
    }
    
    localStorage.setItem('educationProgress', JSON.stringify(progressData))
    
    const userId = user?.email || user?.id
    if (userId) {
      const timeoutId = setTimeout(() => {
        educationService.saveProgress(userId, progressData).catch(() => {})
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [playerStats, user?.email, user?.id])

  // Start theme music on initial load
  useEffect(() => {
    startBgMusic('theme.mp3')
    return () => {
      stopBgMusic()
    }
  }, [startBgMusic, stopBgMusic])

  // Handle Island Selection
  const selectIsland = (island: Island) => {
    // Re-check unlocks before selection
    const currentUnlocks = checkIslandUnlocks(playerStats)
    if (currentUnlocks.length > 0) {
      setPlayerStats(prev => ({
        ...prev,
        unlockedIslands: [...prev.unlockedIslands, ...currentUnlocks]
      }))
    }
    
    const isUnlocked = playerStats.unlockedIslands.includes(island.id) || currentUnlocks.includes(island.id)
    const isLocked = island.locked && !isUnlocked
    
    if (isLocked) {
      playSound('locked')
      // Show unlock requirements
      const req = island.unlockRequirement
      let message = 'This island is locked. '
      if (req?.completeLessons) {
        message += `Complete ${req.completeLessons} lesson${req.completeLessons > 1 ? 's' : ''} to unlock.`
      } else if (req?.level) {
        message += `Reach level ${req.level} to unlock.`
      } else if (req?.badges) {
        message += `Earn required badges to unlock.`
      }
      alert(message)
      return
    }

    playSound('islandSelect')
    
    // Show island intro transition
    setShowIslandIntro(island)
    setTimeout(() => {
      setShowIslandIntro(null)
      setCurrentIsland(island)
      setGameMode('island-map')
    }, 1500) // 1.5s intro animation
    
    if (island.bgMusic) {
      try {
        startBgMusic(island.bgMusic)
      } catch (e) {
        console.warn('Failed to play island music:', island.bgMusic, e)
        startBgMusic('theme.mp3')
      }
    } else {
      startBgMusic('theme.mp3')
    }
  }

  // Handle Lesson Selection from Island Map
  const selectLesson = (lesson: Lesson) => {
    if (!currentIsland) return
    
    // Check if lesson is locked (based on prerequisites)
    const isLocked = lesson.locked || 
      (lesson.prerequisites.length > 0 && 
       !lesson.prerequisites.every(prereq => playerStats.completedLessons.includes(prereq)))
    
    if (isLocked) {
      // Lesson is locked - no sound needed
      return
    }

    // Lesson started - play click sound
    playSound('click')
    setCurrentLesson(lesson)
    setGameMode('lesson')
    setHideNavbar(true) // Hide navbar during lesson
  }

  // Handle Lesson Completion
  const completeLesson = async (lessonId: string | number, score: number) => {
    const xpEarned = Math.max(100, Math.floor(score * 20))
    const coinsEarned = Math.floor(score * 2)
    
    const newXP = playerStats.xp + xpEarned
    const newStats = {
      ...playerStats,
      xp: newXP,
      coins: playerStats.coins + coinsEarned,
      completedLessons: [...playerStats.completedLessons, lessonId],
      streak: playerStats.streak + 1
    }
    
    const newLevel = calculateLevel(newXP)
    if (newLevel > playerStats.level) {
      newStats.level = newLevel
    }

    const newUnlockedIslands = checkIslandUnlocks(newStats)
    if (newUnlockedIslands.length > 0) {
      newStats.unlockedIslands = [...newStats.unlockedIslands, ...newUnlockedIslands]
    }
    
    // Update state immediately
    setPlayerStats(newStats)
    
    // Save to backend immediately (don't wait for debounce)
    const userId = user?.email || user?.id
    if (userId) {
      const progressData = {
        level: newStats.level,
        xp: newStats.xp,
        streak: newStats.streak,
        hearts: newStats.hearts,
        coins: newStats.coins,
        badges: newStats.badges,
        unlockedIslands: newStats.unlockedIslands,
        completedLessons: newStats.completedLessons,
        powerups: newStats.powerups
      }
      
      // Save immediately to backend
      try {
        await educationService.saveProgress(userId, progressData)
        console.log('✅ Progress saved immediately after lesson completion')
      } catch (error) {
        console.warn('⚠️ Failed to save progress immediately:', error)
      }
      
      // Also save to localStorage
      localStorage.setItem('educationProgress', JSON.stringify(progressData))
    }

    playSound('levelUp')
    startBgMusic('theme.mp3')
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    if (newLevel > playerStats.level) {
      levelUp(newLevel)
    }

    if (newUnlockedIslands.length > 0) {
      // Show unlock animation for the first unlocked island
      const firstUnlockedId = newUnlockedIslands[0]
      const unlockedIsland = islands.find(i => i.id === firstUnlockedId)
      if (unlockedIsland) {
        try {
          playSound('unlock')
        } catch (e) {
          console.warn('Failed to play unlock sound:', e)
        }
        setShowUnlockAnimation({ island: unlockedIsland, type: 'island' })
      }
    }
  }

  // Level Up Celebration
  const levelUp = (newLevel: number) => {
    playSound('levelUp')
    
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      })
    }, 250)

    setPlayerStats(prev => ({ ...prev, level: newLevel }))
  }

  // Get island icon based on theme
  const getIslandIcon = (theme: string) => {
    switch(theme) {
      case 'tropical': return <Map className="w-16 h-16 text-green-500" />
      case 'volcanic': return <Target className="w-16 h-16 text-red-500" />
      case 'arctic': return <Snowflake className="w-16 h-16 text-blue-400" />
      case 'sky': return <Cloud className="w-16 h-16 text-purple-400" />
      default: return <Map className="w-16 h-16" />
    }
  }

  // Calculate lesson progress for an island
  const getIslandProgress = (island: Island) => {
    const totalLessons = island.unit.lessons.length
    const completedLessons = island.unit.lessons.filter(
      lesson => playerStats.completedLessons.includes(lesson.id)
    ).length
    return { completed: completedLessons, total: totalLessons }
  }

  return (
    <Layout>
      <div className="h-screen overflow-hidden relative z-10">
        {/* Unlock Animation Modal */}
        <AnimatePresence>
          {showUnlockAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setShowUnlockAnimation(null)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  className="mb-6"
                >
                  <Lottie 
                    animationData={elephantAnimation}
                    loop={false}
                    className="w-32 h-32 mx-auto"
                  />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🎉 {showUnlockAnimation.type === 'island' ? 'New Island Unlocked!' : 'New Feature Unlocked!'}
                </h2>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {showUnlockAnimation.island.name}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUnlockAnimation(null)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  Continue
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Island Intro Transition */}
        <AnimatePresence>
          {showIslandIntro && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-md"
            >
              <div className="text-center">
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  {getIslandIcon(showIslandIntro.theme)}
                </motion.div>
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-bold text-white mb-4"
                >
                  {showIslandIntro.name}
                </motion.h1>
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-white/80"
                >
                  Welcome to your learning journey!
                </motion.p>
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz Prompt Modal */}
        <AnimatePresence>
          {showQuizPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowQuizPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl border-4"
                style={{ borderColor: '#58CC02' }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  🎉 Great job!
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Would you like to take a quiz to test your knowledge?
                </p>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowQuizPrompt(false)
                      setGameMode('island-map')
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700"
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowQuizPrompt(false)
                      setGameMode('quiz')
                      setHideNavbar(true) // Hide navbar during quiz
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg"
                    style={{ background: '#58CC02' }}
                  >
                    Take Quiz
                  </motion.button>
          </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ISLANDS VIEW - Show island selection cards */}
          {gameMode === 'islands' && (
            <motion.div
              key="islands"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
            >
              {/* HUD Overlay */}
              <div className="absolute top-0 left-0 right-0 p-4 z-20">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Player Stats */}
                      <motion.div
                      className="bg-white/90 dark:bg-black/90 backdrop-blur rounded-2xl p-4 shadow-lg"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{playerStats.level}</span>
                        </div>
                          <div className="absolute -bottom-1 left-0 right-0 bg-black/80 text-white text-xs text-center rounded-full px-2 py-0.5">
                            Level
                        </div>
                          </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(playerStats.xp % 1000) / 10}%` }}
                            />
                          </div>
                            <span className="text-xs font-medium whitespace-nowrap">{playerStats.xp % 1000}/1000 XP</span>
                        </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: i < playerStats.hearts ? 1 : 0.5 }}
                                className={`w-5 h-5 ${i < playerStats.hearts ? 'text-red-500' : 'text-gray-300'}`}
                              >
                                <div className="w-full h-full rounded-full bg-red-500" />
                              </motion.div>
                            ))}
                            </div>
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-yellow-900">$</span>
                          </div>
                            <span className="font-semibold text-sm">{playerStats.coins}</span>
                        </div>
                </div>
              </div>
                    </motion.div>

                    {/* Streak Counter */}
                    <motion.div
                      className="bg-white/90 dark:bg-black/90 backdrop-blur rounded-2xl p-4 shadow-lg"
                      initial={{ y: -100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                            <div className="flex items-center gap-3">
                        <Lottie 
                          animationData={streakFireAnimation}
                          loop={true}
                          className="w-12 h-12 flex-shrink-0"
                        />
                        <div>
                          <div className="text-2xl font-bold text-orange-500">{playerStats.streak}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
                              </div>
                            </div>
                    </motion.div>
                    </div>
                  </div>
                </div>

              {/* Islands Grid */}
              <div className="pt-32 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                    Choose Your Learning Island
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {islands.map((island, index) => {
                      const isUnlocked = playerStats.unlockedIslands.includes(island.id)
                      const isLocked = island.locked && !isUnlocked
                      const progress = getIslandProgress(island)
                      
                      return (
            <motion.div
                          key={island.id}
                          className={`island-card bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl p-6 shadow-xl border-2 ${
                            isLocked ? 'border-gray-300 dark:border-gray-600 opacity-60' : 'border-transparent hover:border-blue-400'
                          } transition-all cursor-pointer`}
                          whileHover={!isLocked ? { scale: 1.02, y: -5 } : {}}
                          whileTap={!isLocked ? { scale: 0.98 } : {}}
                          onClick={() => selectIsland(island)}
                          style={{
                            background: isLocked 
                              ? undefined 
                              : `linear-gradient(135deg, ${island.color}22 0%, ${island.color}44 100%)`
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {isLocked ? (
                                <Lock className="w-16 h-16 text-gray-400" />
                              ) : (
                                getIslandIcon(island.theme)
                              )}
                      </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {island.name}
                              </h2>
                              {!isLocked && (
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {progress.total} Lessons
                      </div>
                                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {progress.completed} / {progress.total} completed
                      </div>
                                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ background: island.color }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                    />
                    </div>
                  </div>
                              )}
                              {isLocked && island.unlockRequirement && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                  {island.unlockRequirement.completeLessons && (
                                    <div>Complete {island.unlockRequirement.completeLessons} lessons</div>
                                  )}
                                  {island.unlockRequirement.level && (
                                    <div>Reach Level {island.unlockRequirement.level}</div>
                                  )}
                                  {island.unlockRequirement.badges && (
                                    <div>Earn required badges</div>
                                  )}
                </div>
                              )}
                      </div>
                      </div>
                    </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ISLAND MAP VIEW - Show Duolingo-style lesson path for selected island */}
          {gameMode === 'island-map' && currentIsland && (
            <IslandMapView
              island={currentIsland}
              playerStats={playerStats}
              onBack={() => {
                setGameMode('islands')
                setCurrentIsland(null)
                startBgMusic('theme.mp3')
              }}
              onLessonSelect={selectLesson}
            />
          )}

          {/* LESSON VIEW */}
          {gameMode === 'lesson' && currentLesson && (
            <LessonGame
              lesson={currentLesson}
              hearts={playerStats.hearts}
              onComplete={(score: number) => {
                completeLesson(currentLesson.id, score)
                if (currentLesson.content?.practiceQuestions && currentLesson.content.practiceQuestions.length > 0) {
                  setTimeout(() => {
                    setShowQuizPrompt(true)
                  }, 1000)
                } else {
                  setGameMode('island-map')
                  setHideNavbar(false) // Show navbar when returning to map
                }
              }}
              onExit={() => {
                setGameMode('island-map')
                setHideNavbar(false) // Show navbar when exiting
              }}
            />
          )}

          {/* QUIZ VIEW */}
          {gameMode === 'quiz' && currentLesson && (
            <QuizBattle
              questions={currentLesson?.content?.practiceQuestions || []}
              onComplete={async (score: number) => {
                await completeLesson(`quiz-${currentLesson.id}`, score)
                setGameMode('island-map')
                setHideNavbar(false) // Show navbar when returning to map
              }}
              playerStats={playerStats}
              islandModel={currentIsland?.model}
            />
          )}
        </AnimatePresence>
    </div>
    </Layout>
  )
}

// Island Map View Component - Duolingo-style lesson path
interface PlayerStats {
  level: number
  xp: number
  streak: number
  hearts: number
  coins: number
  badges: string[]
  unlockedIslands: string[]
  completedLessons: (string | number)[]
  powerups: {
    xpBoost: number
    streakFreeze: number
    heartRefill: number
  }
}

interface IslandMapViewProps {
  island: Island
  playerStats: PlayerStats
  onBack: () => void
  onLessonSelect: (lesson: Lesson) => void
}

const IslandMapView = ({ island, playerStats, onLessonSelect, onBack }: IslandMapViewProps) => {
  const getIslandIcon = (theme: string) => {
    switch(theme) {
      case 'tropical': return <Map className="w-8 h-8 text-green-500" />
      case 'volcanic': return <Target className="w-8 h-8 text-red-500" />
      case 'arctic': return <Snowflake className="w-8 h-8 text-blue-400" />
      case 'sky': return <Cloud className="w-8 h-8 text-purple-400" />
      default: return <Map className="w-8 h-8" />
    }
  }

  const calculatePosition = (lessonIndex: number) => {
    const verticalSpacing = 120
    const horizontalOffset = 150
    const zigzag = lessonIndex % 2 === 0 ? -1 : 1
    
    // Center the map better - start from center and zigzag
    const centerX = 400 // More centered
    return {
      x: centerX + (zigzag * horizontalOffset * (lessonIndex % 3)),
      y: 100 + lessonIndex * verticalSpacing
    }
  }

  const isLessonUnlocked = (lesson: Lesson, index: number): boolean => {
    if (index === 0) return true // First lesson always unlocked
    if (lesson.locked) return false
    if (lesson.prerequisites.length === 0) return true
    return lesson.prerequisites.every(prereq => playerStats.completedLessons.includes(prereq))
  }

  const getLessonStars = (lesson: Lesson): number => {
    // Return 3 stars if completed, 0 if not
    return playerStats.completedLessons.includes(lesson.id) ? 3 : 0
  }

  const getNodeColor = (lesson: Lesson, isUnlocked: boolean): string => {
    if (!isUnlocked) return '#777777'
    const stars = getLessonStars(lesson)
    if (stars === 0) return '#58CC02' // Green for available
    if (stars < 3) return '#FFC800' // Gold for in-progress
    return '#FFD700' // Full gold for completed
  }

  return (
    <motion.div
      key="island-map"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="h-full overflow-y-auto relative"
    >
      {/* Duolingo-style Sky Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Sky Gradient - Duolingo blue to light blue */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #E0F6FF 60%, #F0F8FF 100%)'
          }}
        />
        
        {/* Animated Clouds */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`cloud-${i}`}
              className="absolute rounded-full bg-white/40 dark:bg-white/20"
              style={{
                width: `${100 + Math.random() * 150}px`,
                height: `${60 + Math.random() * 80}px`,
                left: `${Math.random() * 100}%`,
                top: `${10 + Math.random() * 40}%`,
                filter: 'blur(20px)',
              }}
              animate={{
                x: [0, 50, -50, 0],
                y: [0, 20, -20, 0],
                opacity: [0.3, 0.5, 0.4, 0.3],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* 3D Island Model - Subtle in background */}
        <div className="absolute inset-0 opacity-5 dark:opacity-3 pointer-events-none">
          <IslandModelViewer
            modelPath={island.model}
            autoRotate={true}
            scale={2}
            className="w-full h-full"
          />
        </div>

        {/* Additional gradient overlay for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${island.color}08 50%, transparent 100%)`
          }}
        />
      </div>

      {/* Header - Fixed Alignment */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-300/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Islands
            </button>
            <div className="flex items-center gap-3 flex-1 justify-center">
              {/* Island Icon/Logo */}
              {getIslandIcon(island.theme)}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{island.name}</h1>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {island.unit.lessons.length} Lessons
                </div>
              </div>
            </div>
            <div className="w-32 flex-shrink-0" /> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Lesson Path - Centered */}
      <div className="relative py-8 px-4 min-h-full">
        <div className="max-w-5xl mx-auto relative" style={{ minHeight: '600px' }}>
          {/* Connecting Lines - Centered */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, overflow: 'visible' }}>
            {island.unit.lessons.slice(0, -1).map((_, index) => {
              const current = calculatePosition(index)
              const next = calculatePosition(index + 1)
              return (
                <motion.path
                  key={`line-${index}`}
                  d={`M ${current.x} ${current.y} Q ${
                    (current.x + next.x) / 2
                  } ${
                    (current.y + next.y) / 2 + 30
                  } ${next.x} ${next.y}`}
                  stroke={playerStats.completedLessons.includes(island.unit.lessons[index].id) ? '#FFC800' : '#E5E5E5'}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              )
            })}
          </svg>

          {/* Lesson Nodes */}
          <div className="relative" style={{ zIndex: 1 }}>
            {island.unit.lessons.map((lesson, index) => {
              const isUnlocked = isLessonUnlocked(lesson, index)
              const stars = getLessonStars(lesson)
              const position = calculatePosition(index)
              const nodeColor = getNodeColor(lesson, isUnlocked)

              return (
                <motion.div
                  key={lesson.id}
                  className="absolute"
                  style={{
                    left: position.x - 40,
                    top: position.y - 40
                  }}
                  whileHover={isUnlocked ? { scale: 1.1 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                >
                  <button
                    onClick={() => isUnlocked && onLessonSelect(lesson)}
                    disabled={!isUnlocked}
                    className="relative group"
                  >
                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke={nodeColor}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(stars / 3) * 283} 283`}
                        opacity={isUnlocked ? 1 : 0.3}
                      />
                    </svg>

                    {/* Lesson Button */}
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all"
                      style={{
                        background: isUnlocked
                          ? `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`
                          : '#777777',
                        border: `4px solid ${nodeColor}`
                      }}
                    >
                      {!isUnlocked ? (
                        <Lock className="w-8 h-8" />
                      ) : (
                        <BookOpen className="w-8 h-8" />
                      )}
                    </div>

                    {/* Stars Display */}
                    {isUnlocked && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < stars ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        {lesson.title}
                        <div className="text-yellow-400 mt-1">+{lesson.estimatedMinutes * 10} XP</div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EducationHub




