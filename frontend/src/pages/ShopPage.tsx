import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { GemDisplay } from '../components/gamification/GemDisplay';
import { useUserStore } from '../stores/userStore';
import { ShoppingBag, Zap, Heart, Flame, Crown, Star, Shield, Filter, Search, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { TranslatedText } from '../components/TranslatedText';

// --- Types & Data ---

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  currency: 'gems' | 'hearts' | 'xp';
  category: 'powerups' | 'appearance' | 'streak';
  bgColor?: string;
  image?: string;
}

const shopItems: ShopItem[] = [
  {
    id: 'streak-freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day if you miss a day',
    icon: <Flame className="w-8 h-8 text-white drop-shadow-sm" />,
    price: 10,
    currency: 'gems',
    category: 'streak',
    bgColor: 'bg-[#FF9600]'
  },
  {
    id: 'double-xp',
    name: 'Double XP',
    description: 'Earn 2x XP for 15 minutes',
    icon: <Zap className="w-8 h-8 text-white drop-shadow-sm" />,
    price: 50,
    currency: 'gems',
    category: 'powerups',
    bgColor: 'bg-[#8549BA]'
  },
  {
    id: 'refill-hearts',
    name: 'Refill Hearts',
    description: 'Restore all hearts instantly',
    icon: <Heart className="w-8 h-8 text-white drop-shadow-sm" />,
    price: 100,
    currency: 'gems',
    category: 'powerups',
    bgColor: 'bg-[#FF4B4B]'
  },
  {
    id: 'premium-monthly',
    name: 'Premium Plus',
    description: 'Unlimited hearts, no ads, progress tracking',
    icon: <Crown className="w-8 h-8 text-white drop-shadow-sm" />,
    price: 499,
    currency: 'gems',
    category: 'appearance',
    bgColor: 'bg-[#FFC800]'
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: Star },
  { id: 'powerups', label: 'Power-ups', icon: Zap },
  { id: 'appearance', label: 'Appearance', icon: Crown },
  { id: 'streak', label: 'Streak', icon: Flame },
];

export const ShopPage: React.FC = () => {
  const { user } = useUserStore();
  const gems = user?.gems || 350;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = selectedCategory === 'all'
    ? shopItems
    : shopItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto flex items-start min-h-screen">

        {/* === Left Sidebar: Filters === */}
        <div className="w-64 sticky top-0 h-screen p-6 border-r border-gray-100 hidden lg:flex flex-col gap-6 pt-24 lg:pt-8 bg-white z-40">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#1CB0F6]" />
              Shop Categories
            </h2>

            <div className="flex flex-col gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm",
                      isActive
                        ? "bg-sky-50 text-[#1CB0F6] ring-1 ring-[#1CB0F6] shadow-sm transform scale-[1.02]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-5 h-5", isActive ? "text-[#1CB0F6]" : "text-gray-400")} />
                      <span className="capitalize">{cat.label}</span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[#1CB0F6]" />
                    )}
                    {!isActive && cat.id === 'all' && (
                      <span className="text-xs font-bold text-gray-300">{shopItems.length}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-auto p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <h3 className="font-extrabold text-[#1CB0F6] mb-1">Need more Gems?</h3>
            <p className="text-xs text-sky-600/80 mb-3">Complete daily quests to earn bonus gems!</p>
            <Button size="sm" fullWidth variant="primary">View Quests</Button>
          </div>
        </div>

        {/* === Main Content === */}
        <div className="flex-1 min-h-screen flex flex-col">

          {/* Scrollable Content */}
          <div className="flex-1 p-6 lg:p-10">

            {/* Header / Search (Mobile mostly) */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-extrabold text-gray-800 lg:hidden">Shop</h1>

              <div className="flex items-center gap-4 ml-auto w-full lg:w-auto justify-end">
                {/* Search Input Fake */}
                <div className="relative hidden md:block group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1CB0F6] transition-colors" />
                  <input
                    type="text"
                    placeholder="Look up any item you desire..."
                    className="pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent text-sm font-bold text-gray-600 focus:bg-white focus:border-[#1CB0F6] w-80 placeholder:text-gray-400 transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl border-2 border-gray-100 hover:bg-gray-50 cursor-pointer hidden sm:block">
                    <Filter className="w-5 h-5 text-gray-400" />
                  </div>
                  {/* Gem Display */}
                  <GemDisplay amount={gems} size="lg" />
                </div>
              </div>
            </div>

            {/* Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-auto min-h-[220px] rounded-[32px] bg-[#FFF5E5] relative overflow-hidden mb-10 flex flex-col justify-center px-8 lg:px-12 py-8 border-2 border-[#FFE0B2]"
            >
              <div className="relative z-10 max-w-xl">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-3 py-1 bg-[#FF9600] text-white text-xs font-extrabold rounded-lg mb-3 uppercase tracking-wider"
                >
                  Managed Inventory
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl lg:text-4xl font-extrabold text-[#5B3E2B] mb-3 leading-tight"
                >
                  <TranslatedText>Effortlessly Manage Your Power-ups!</TranslatedText>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[#8D6E58] font-medium text-sm lg:text-base max-w-md leading-relaxed"
                >
                  <TranslatedText>Quick access to every power-up—add, update, and organize your inventory with ease.</TranslatedText>
                </motion.p>
              </div>

              {/* Decorative Illustration */}
              <div className="absolute right-0 bottom-0 w-80 h-full opacity-100 hidden lg:block pointer-events-none">
                {/* Abstract placeholder for the 'chef' character in reference */}
                <div className="absolute right-10 bottom-[-20px] w-64 h-64">
                  <ShoppingBag className="w-full h-full text-[#FFC107] opacity-20 rotate-12" />
                </div>
                <div className="absolute right-[120px] top-[40px] w-16 h-16 bg-orange-400 rounded-full opacity-20 blur-xl animate-pulse" />
                <div className="absolute right-[40px] bottom-[80px] w-12 h-12 bg-yellow-400 rounded-full opacity-30 blur-lg" />
              </div>
            </motion.div>


            {/* Items Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                {/* Mobile Search - Visible only on small screens */}
                <div className="relative md:hidden w-full mr-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 w-full text-sm font-bold"
                  />
                </div>

                <div className="hidden md:flex items-center gap-3">
                  {/* Just a spacer or secondary filter logic could go here */}
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-xl bg-white border-2 border-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                    Filter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Add New Item Placeholder */}
                {selectedCategory === 'all' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full min-h-[240px] border-2 border-dashed border-[#1CB0F6]/30 bg-sky-50/30 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-[#1CB0F6] hover:bg-sky-50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-[#1CB0F6] rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 group-hover:scale-110 transition-transform">
                      <Plus className="text-white w-8 h-8" strokeWidth={3} />
                    </div>
                    <div className="text-center">
                      <span className="block font-extrabold text-gray-700 text-lg group-hover:text-[#1CB0F6] transition-colors">Suggest Item</span>
                      <span className="text-xs font-bold text-gray-400">Request new power-ups</span>
                    </div>
                  </motion.button>
                )}

                {filteredItems.map((item, index) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border-2 border-gray-100 rounded-[32px] p-6 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all group flex flex-col relative"
                  >
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-300 hover:text-gray-500">
                        <div className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center font-bold pb-2">...</div>
                      </button>
                    </div>

                    <div className="flex flex-col items-center mb-6 mt-2">
                      <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center shadow-sm mb-4 transition-transform group-hover:scale-105",
                        item.bgColor
                      )}>
                        {item.icon}
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-800 text-center leading-tight mb-1">{item.name}</h4>
                    </div>

                    <div className="flex-1 mb-6">
                      <p className="text-sm text-gray-500 font-medium leading-relaxed text-center line-clamp-2 px-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price</span>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#1CB0F6]" />
                          <span className="text-lg font-extrabold text-gray-800">{item.price}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        className="rounded-xl border-gray-200 hover:border-[#1CB0F6] hover:text-[#1CB0F6] hover:bg-sky-50 font-extrabold"
                        onClick={() => console.log('Buy', item.id)}
                      >
                        Purchase
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
