import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import Lottie from 'lottie-react'

// Import your animations (from src/assets/animations folder)
import financeAnimation from '../assets/animations/Finance.json'
import investingAnimation from '../assets/animations/investing.json'
import stocksAnimation from '../assets/animations/stocks.json'

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, isLoading } = useUser()
  const { toggleTheme, isDark } = useTheme()
  const { scrollYProgress } = useScroll()

  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 50])

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/learn')
    }
  }, [user, isLoading, navigate])

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 transition-colors duration-700 relative overflow-hidden">
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-40 -right-40 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 dark:from-emerald-500/10 dark:to-teal-700/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-40 -left-40 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 dark:from-purple-500/10 dark:to-pink-700/10 rounded-full blur-3xl"
          />
        </div>

        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-sm">F</span>
              </div>
              <span className="text-black dark:text-white font-bold text-xl">FinLit</span>
            </div>

            {/* Center Links */}
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">About</a>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative z-10 pt-12 md:pt-20 pb-10 md:pb-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Hero Text */}
            <motion.div className="text-center mb-12 md:mb-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-block mb-4 md:mb-6"
              >
                <span className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs md:text-sm font-semibold">
                  Built for International Students
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8 leading-tight px-4"
              >
                Investing,
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Simplified
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
              >
                Start your investment journey with real-time market data, AI-powered insights, and educational resources designed for you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold shadow-2xl hover:shadow-emerald-500/50 transition-all"
                >
                  Start Investing
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto backdrop-blur-xl bg-white/50 dark:bg-black/50 text-gray-900 dark:text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                >
                  Watch Demo
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Floating Dashboard Preview with Parallax */}
            <div className="relative max-w-6xl mx-auto px-4">
              
              {/* Main Dashboard Screenshot - CENTER */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{ y: y1 }}
                className="relative z-20"
              >
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 p-1.5 md:p-2">
                  <div className="aspect-video rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                    <img src="/dashboard.png" alt="Dashboard Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              </motion.div>

              {/* Finance Animation - TOP LEFT */}
              <motion.div
                initial={{ opacity: 0, x: -100, rotate: -10 }}
                animate={{ opacity: 1, x: 0, rotate: -6 }}
                transition={{ duration: 1, delay: 0.6 }}
                style={{ y: y2 }}
                className="absolute -top-10 md:-top-20 -left-2 md:-left-10 lg:-left-20 w-40 sm:w-48 md:w-64 lg:w-80 z-30"
              >
                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 hover:scale-105 transition-transform duration-500">
                  <div className="aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center overflow-hidden">
                    <Lottie animationData={financeAnimation} loop={true} className="w-full h-full" />
                  </div>
                </div>
              </motion.div>

              {/* Investing Animation - TOP RIGHT */}
              <motion.div
                initial={{ opacity: 0, x: 100, rotate: 10 }}
                animate={{ opacity: 1, x: 0, rotate: 6 }}
                transition={{ duration: 1, delay: 0.8 }}
                style={{ y: y3 }}
                className="absolute -top-6 md:-top-10 -right-2 md:-right-10 lg:-right-20 w-48 sm:w-56 md:w-72 lg:w-96 z-30"
              >
                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 hover:scale-105 transition-transform duration-500">
                  <div className="aspect-video rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden">
                    <Lottie animationData={investingAnimation} loop={true} className="w-full h-full" />
                  </div>
                </div>
              </motion.div>

              {/* Learning Animation - BOTTOM LEFT */}
              <motion.div
                initial={{ opacity: 0, x: -100, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 4 }}
                transition={{ duration: 1, delay: 1 }}
                style={{ y: y1 }}
                className="absolute -bottom-8 md:-bottom-16 -left-2 md:-left-10 lg:-left-16 w-36 sm:w-44 md:w-56 lg:w-72 z-10"
              >
                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 hover:scale-105 transition-transform duration-500">
                  <div className="aspect-[4/5] rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden">
                    <Lottie animationData={stocksAnimation} loop={true} className="w-full h-full" />
                  </div>
                </div>
              </motion.div>

              {/* Investing Animation (Repeat) - BOTTOM RIGHT */}
              <motion.div
                initial={{ opacity: 0, x: 100, rotate: -8 }}
                animate={{ opacity: 1, x: 0, rotate: -4 }}
                transition={{ duration: 1, delay: 1.2 }}
                style={{ y: y2 }}
                className="absolute -bottom-6 md:-bottom-12 -right-2 md:-right-10 lg:-right-16 w-40 sm:w-52 md:w-64 lg:w-80 z-10"
              >
                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 hover:scale-105 transition-transform duration-500">
                  <div className="aspect-[3/4] rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center overflow-hidden">
                    <Lottie animationData={investingAnimation} loop={true} className="w-full h-full" />
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-transparent to-white/50 dark:to-black/50 mt-20 md:mt-32">
          <div className="max-w-7xl mx-auto">
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 md:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                Everything you need to
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  start investing
                </span>
              </h2>
              <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
                Powerful tools and resources designed specifically for international students
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg overflow-hidden">
                  <div className="w-8 h-8 md:w-10 md:h-10">
                    <Lottie animationData={financeAnimation} loop={true} />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Real-Time Data</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Access live market prices, charts, and financial data powered by Yahoo Finance. No delays, no mock data.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg overflow-hidden">
                  <div className="w-8 h-8 md:w-10 md:h-10">
                    <Lottie animationData={investingAnimation} loop={true} />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">AI-Powered Insights</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get personalized investment recommendations and portfolio analysis from our intelligent AI advisor.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all sm:col-span-2 lg:col-span-1"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg overflow-hidden">
                  <div className="w-8 h-8 md:w-10 md:h-10">
                    <Lottie animationData={stocksAnimation} loop={true} />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Learn & Grow</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Master investing with interactive courses, video tutorials, and resources tailored for international students.
                </p>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative z-10 py-12 md:py-20 px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 dark:from-emerald-500/5 dark:to-teal-600/5 rounded-2xl md:rounded-3xl p-8 md:p-12 border border-emerald-500/20 dark:border-emerald-500/10"
          >
            <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">10K+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">Active Students</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">$50M+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">Assets Managed</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">98%</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">Satisfaction</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="relative z-10 py-16 md:py-32 px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
              Ready to start your
              <br />
              investment journey?
            </h2>
            <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              Join thousands of international students already building their financial future with FinLit.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-full text-lg md:text-xl font-semibold shadow-2xl hover:shadow-emerald-500/50 transition-all"
            >
              Get Started for Free
            </motion.button>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 py-8 md:py-12 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xs md:text-sm">F</span>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold text-base md:text-lg">FinLit</span>
              </div>
              
              <div className="flex items-center gap-6 md:gap-8 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
              </div>

              <p className="text-xs md:text-sm text-gray-500 text-center md:text-left">
                © 2024 FinLit. Real-time data
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default LandingPage