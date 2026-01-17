import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  ArrowUpRight,
  Star,
  Sparkles,
  Zap,
  Target,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Shield,
  BookOpen,
  Users
} from 'lucide-react'

// Scrolling avatars for the community section
const communityAvatars = [
  { id: 1, shape: 'rounded-full', img: 12 },
  { id: 2, shape: 'rounded-[2rem]', img: 32 },
  { id: 3, shape: 'rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-lg rounded-bl-lg', img: 45 },
  { id: 4, shape: 'rounded-full', img: 65 },
  { id: 5, shape: 'rounded-[3rem] rounded-tr-none', img: 21 },
  { id: 6, shape: 'rounded-[20px] rotate-2', img: 11 },
  { id: 7, shape: 'rounded-t-[4rem] rounded-b-lg', img: 8 },
  { id: 8, shape: 'rounded-full border-4 border-brand-mint', img: 5 },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, isLoading } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/learn')
    }
  }, [user, isLoading, navigate])

  return (
    <div className="min-h-screen bg-white font-sans text-brand-dark selection:bg-black selection:text-white overflow-x-hidden">

      {/* Neo-Brutalist Floating Navbar */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-white border-2 border-black rounded-full px-2 py-2 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer pl-4"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 flex items-center justify-center bg-black rounded-full text-white font-bold text-lg">F</div>
            <span className="font-bold text-xl tracking-tight uppercase">FinLit</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-1">
            {['Mission', 'Curriculum', 'Community', 'Reviews'].map((item) => (
              <button
                key={item}
                className="px-5 py-2 rounded-full hover:bg-black hover:text-white transition-all font-medium text-sm border border-transparent hover:border-black"
                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2.5 rounded-full font-bold text-sm hidden sm:block hover:bg-white/50 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="bg-[#EFF09E] border-2 border-black hover:bg-[#E3E480] text-black px-6 py-2.5 rounded-full font-bold transition-all text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Sign up
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-black/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-8 lg:pt-36 lg:pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch gap-8">

            {/* Left Content (MUSEMENTOR Style Card) */}
            <div className="lg:w-1/2 flex flex-col gap-6">

              {/* Main Headline Card */}
              <div className="bg-white border-2 border-black rounded-[2rem] p-6 lg:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-12 h-12 bg-[#EFF09E] rounded-full border-2 border-black flex items-center justify-center animate-spin-slow">
                    <Star className="w-6 h-6 fill-black" />
                  </div>
                </div>

                <div className="inline-block bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  Version 2.0 Live
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold leading-[0.9] mb-4 tracking-tighter">
                  Finance <br />
                  that doesn't <br />
                  <span className="italic font-serif text-[#FF9600]">bore you.</span>
                </h1>

                <p className="text-lg font-medium text-brand-dark mb-6 max-w-md leading-relaxed">
                  Gamified lessons, real-time simulations, and a community of 10k+ international students mastering their money.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/auth')}
                    className="bg-black text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-gray-800 transition-all flex items-center gap-2 group"
                  >
                    Start Learning
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-6 py-3 rounded-full font-bold text-lg border-2 border-black hover:bg-gray-50 transition-all flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Watch Demo
                  </button>
                </div>
              </div>

              {/* Stat Card */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#FF9600] border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-2xl">174+</span>
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg leading-5">Countries<br />Represented</span>
                </div>
                <div className="bg-[#CE82FF] border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-2xl">4.9/5</span>
                    <Star className="w-6 h-6 fill-black" />
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Content (Bento Grid) */}
            <div className="lg:w-1/2 flex flex-col gap-6">

              {/* Hero GIF Card */}
              <div className="h-full min-h-[300px] relative group flex items-center justify-center">
                <img src="/main-landing.gif" className="w-full h-auto object-contain scale-110" />

                {/* Floating Action Button Style Element */}
                <div className="absolute bottom-4 right-4 bg-black text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-3 gap-6">
                {/* Small fun card */}
                <div className="col-span-1 bg-white border-2 border-black rounded-[2rem] flex items-center justify-center p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px] opacity-20"></div>
                  <Globe className="w-10 h-10 animate-spin-slow" />
                </div>

                {/* Wide card */}
                <div className="col-span-2 bg-[#58CC02] border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-white relative overflow-hidden group cursor-pointer hover:bg-[#4ab802] transition-colors">
                  <div>
                    <div className="font-bold text-xl">Daily Streak</div>
                    <div className="text-sm opacity-90">Keep it going!</div>
                  </div>
                  <div className="text-4xl font-black italic">12</div>
                  <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/20 group-hover:rotate-12 transition-transform" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section (Musmentor Style Barcode/Labels) */}
      <div className="border-y-2 border-black bg-white overflow-hidden py-6 relative">
        <div className="flex animate-scroll whitespace-nowrap items-center gap-12">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 font-bold text-2xl uppercase tracking-tighter">
                <Star className="w-6 h-6 fill-black" />
                Financial Literacy
              </div>
              <div className="w-32 h-8 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMWEQo32j5yJgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXYvj//z8DAwMTAwMDw38GAAuUAwX9m2L8AAAAAElFTkSuQmCC')] opacity-50"></div>
              <div className="font-mono text-xl border border-black px-2 rounded">
                INVESTING 101
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-4 bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#FF9600] border-2 border-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Why We Exist
          </div>
          <h2 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
            Financial freedom shouldn't have <span className="text-[#58CC02] underline decoration-4 underline-offset-8">borders</span>.
          </h2>
          <p className="text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed max-w-3xl mx-auto">
            Moving to a new country is hard enough. Understanding credit scores, taxes, and investing shouldn't be.
            We simplify the financial complexities for the immigrant community, stripping away the jargon to empower you with the tools you need.
            <br /><br />
            We believe your ambition deserves a foundation <span className="bg-[#EFF09E] px-2 py-0.5 border-2 border-black rounded-lg inline-block transform -rotate-1">as strong as your dreams</span>.
          </p>
        </div>
      </section>

      {/* Feature Bento Grid (Using requested GIFs) */}
      <section id="curriculum" className="py-24 px-4 bg-[#F2F0E4]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-5xl lg:text-7xl font-bold leading-none mb-4">
                Your Path <br />
                <span className="text-[#58CC02]">To Wealth</span>
              </h2>
              <p className="text-xl font-medium text-gray-600 max-w-lg">
                Choose your focused track. Each module is designed to solve a specific financial challenge.
              </p>
            </div>
            <button className="bg-transparent border-2 border-black px-8 py-4 rounded-full font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              View Full Curriculum
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-[#C4F9E2] border-2 border-black rounded-[2.5rem] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group"
            >
              <div className="h-64 bg-white rounded-[2rem] overflow-hidden mb-6 relative flex items-center justify-center p-6">
                <div className="absolute top-4 left-4 bg-[#58CC02] border border-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase z-10">Beginner</div>
                <img src="/save-money.gif" className="w-full h-full object-contain" />
              </div>
              <div className="px-4 pb-4">
                <h3 className="text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">Smart Saving</h3>
                <p className="text-gray-600 font-medium mb-6">Build your emergency fund and stop living paycheck to paycheck.</p>
                <div className="flex justify-between items-center border-t-2 border-black/10 pt-4">
                  <span className="font-bold">12 Lessons</span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-[#EFF09E] border-2 border-black rounded-[2.5rem] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group"
            >
              <div className="h-64 bg-white rounded-[2rem] overflow-hidden mb-6 relative flex items-center justify-center p-6">
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase z-10">Advanced</div>
                <img src="/side-hustle.gif" className="w-full h-full object-contain" />
              </div>
              <div className="px-4 pb-4">
                <h3 className="text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">Side Hustles</h3>
                <p className="text-gray-800 font-medium mb-6">Learn how to monetize your skills and generate passive income streams.</p>
                <div className="flex justify-between items-center border-t-2 border-black/10 pt-4">
                  <span className="font-bold">8 Modules</span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-[#E7C6FF] border-2 border-black rounded-[2.5rem] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group"
            >
              <div className="h-64 bg-white rounded-[2rem] overflow-hidden mb-6 relative flex items-center justify-center p-6">
                <div className="absolute top-4 left-4 bg-[#CE82FF] border border-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase z-10">Essential</div>
                <img src="/debt-free.gif" className="w-full h-full object-contain" />
              </div>
              <div className="px-4 pb-4">
                <h3 className="text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">Debt Crusher</h3>
                <p className="text-gray-600 font-medium mb-6">Strategies to pay off student loans and high-interest debt fast.</p>
                <div className="flex justify-between items-center border-t-2 border-black/10 pt-4">
                  <span className="font-bold">5 Steps</span>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community "Funvera" Style Blocks */}
      <section id="community" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl lg:text-6xl font-bold text-center mb-16">
            What <span className="inline-block bg-[#EFF09E] px-4 -rotate-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Students</span> Love
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[600px]">
            {/* Block 1 */}
            <div className="bg-[#FF4B4B] rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-white lg:col-span-1 lg:row-span-2 hover:scale-[1.02] transition-transform">
              <div>
                <h3 className="text-3xl font-bold leading-tight mb-4">"Learning here feels like playing!"</h3>
                <p className="opacity-90 font-medium">I used to be scared of investing. Now I check my portfolio every morning like it's a game.</p>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <img src="https://i.pravatar.cc/100?img=5" className="w-12 h-12 rounded-full border-2 border-white" />
                <div className="font-bold text-sm">Adil B.<br /><span className="font-normal opacity-75">Student, UK</span></div>
              </div>
            </div>

            {/* Block 2 */}
            <div className="bg-[#CE82FF] rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center text-white lg:col-span-2 hover:scale-[1.02] transition-transform">
              <h3 className="text-3xl md:text-4xl font-bold leading-tight mb-6">The interactive lessons make complex finance super fun.</h3>
              <div className="flex gap-2">
                <div className="bg-black/20 px-4 py-2 rounded-full font-bold text-sm">#DebtFree</div>
                <div className="bg-black/20 px-4 py-2 rounded-full font-bold text-sm">#Investing</div>
              </div>
            </div>

            {/* Block 3 */}
            <div className="bg-[#58CC02] rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-white lg:col-span-1 lg:row-span-2 hover:scale-[1.02] transition-transform">
              <div className="w-full h-32 bg-black/10 rounded-xl mb-6 flex items-center justify-center">
                <span className="text-6xl font-black text-white text-shadow-sm">$5K</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold leading-tight mb-4">Real Results</h3>
                <p className="opacity-90 font-medium">Saved my first $5,000 in just 3 months using the budgeting tool.</p>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <img src="https://i.pravatar.cc/100?img=12" className="w-12 h-12 rounded-full border-2 border-white" />
                <div className="font-bold text-sm">Sarah K.<br /><span className="font-normal opacity-75">Student, Canada</span></div>
              </div>
            </div>

            {/* Block 4 */}
            <div className="bg-[#FF9600] rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-white lg:col-span-2 hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <h3 className="text-3xl font-bold">I love the drawing... wait, I mean the dashboards!</h3>
                <Star className="w-8 h-8 fill-white" />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <img src="https://i.pravatar.cc/100?img=8" className="w-12 h-12 rounded-full border-2 border-white" />
                <div className="font-bold text-sm">Maria L.<br /><span className="font-normal opacity-75">Student, USA</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto bg-white text-black rounded-[3rem] p-12 lg:p-24 relative overflow-hidden border-2 border-black shadow-[12px_12px_0px_0px_rgba(88,204,2,1)]">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-5xl lg:text-7xl font-bold mb-8 text-black">
              Start <br />
              <div className="bg-black text-white inline-block px-4 mt-2 rotate-2">Learning</div>
            </h2>
            <p className="text-xl text-gray-800 mb-12 font-medium">
              Give your wallet a joyful learning experience filled with growth, confidence, and endless discovery.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-[#58CC02] text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-[#4ab802] transition-all border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
            >
              Get Started For Free
            </button>
          </div>

          {/* Decor GIF */}
          <div className="absolute top-12 right-0 hidden lg:block h-[400px] w-[400px] pointer-events-none mr-12">
            <img src="/happy-women.gif" className="w-full h-full object-contain" />
          </div>

          {/* Footer Links Grid */}
          <div className="relative z-10 mt-24 border-t border-black/20 pt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-gray-500 mb-4 text-sm uppercase tracking-wider">Programs</h4>
              <ul className="space-y-2 font-medium text-gray-600">
                <li><a href="#" className="hover:text-[#58CC02]">Budgeting</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Investing</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Early Retirement</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-500 mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 font-medium text-gray-600">
                <li><a href="#" className="hover:text-[#58CC02]">Calculators</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Blog</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-500 mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 font-medium text-gray-600">
                <li><a href="#" className="hover:text-[#58CC02]">About Us</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Careers</a></li>
                <li><a href="#" className="hover:text-[#58CC02]">Contact</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 font-bold text-2xl flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">F</div>
                FinLit
              </div>
              <p className="text-sm text-gray-500">
                © 2025 FinLit Inc.<br />All rights reserved.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

export default LandingPage