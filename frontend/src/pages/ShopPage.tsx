import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { GemDisplay } from '../components/gamification/GemDisplay';
import { useUserStore } from '../stores/userStore';
import { learnerApi } from '../services/api';
import { ShoppingBag, Zap, Heart, Flame, Crown, Star, Shield, Filter, Search, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TranslatedText } from '../components/TranslatedText';
import { useToast } from '../components/ui/Toast';
import { PaymentModal } from '../components/payment/PaymentModal';
import { paymentApi } from '../services/api';

// --- Types & Data ---

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  currency: 'gems' | 'hearts' | 'xp' | 'usd';
  category: 'powerups' | 'appearance' | 'streak' | 'coins';
  bgColor?: string;
  image?: string;
  priceCents?: number; // For USD purchases
  packageType?: 'coins' | 'powerup';
}

const shopItems: ShopItem[] = [
  {
    id: 'streak-freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day if you miss a day',
    icon: <img src="/assets/ice-streak.png" className="w-16 h-16 object-contain" alt="Streak Freeze" />,
    price: 10,
    currency: 'gems',
    category: 'streak',
    bgColor: 'bg-[#E0F7FA]'
  },
  {
    id: 'double-xp',
    name: 'Double XP',
    description: 'Earn 2x XP for 15 minutes',
    icon: <img src="/assets/xp-icon.png" className="w-16 h-16 object-contain" alt="Double XP" />,
    price: 50,
    currency: 'gems',
    category: 'powerups',
    bgColor: 'bg-white border-2 border-gray-100'
  },
  {
    id: 'refill-hearts',
    name: 'Refill Hearts',
    description: 'Restore all hearts instantly',
    icon: <img src="/assets/hearts.png" className="w-16 h-16 object-contain" alt="Refill Hearts" />,
    price: 100,
    currency: 'gems',
    category: 'powerups',
    bgColor: 'bg-[#FFEBEE]'
  },
  {
    id: 'premium-monthly',
    name: 'Premium Plus',
    description: 'Unlimited hearts, no ads, progress tracking',
    icon: <img src="/3d-models/monster-5.png" className="w-20 h-20 object-contain" alt="Premium Plus" />,
    price: 499,
    currency: 'gems',
    category: 'appearance',
    bgColor: 'bg-[#FFF9C4]'
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: Star },
  { id: 'coins', label: 'Buy Coins', icon: Star },
  { id: 'powerups', label: 'Power-ups', icon: Zap },
  { id: 'appearance', label: 'Appearance', icon: Crown },
  { id: 'streak', label: 'Streak', icon: Flame },
];

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, learnerId, setUser } = useUserStore();
  const toast = useToast();
  const gems = user?.gems || 0;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    packageId: string;
    packageName: string;
    coins: number;
    priceCents: number;
    type: 'coins' | 'powerup';
  } | null>(null);
  const [coinPackages, setCoinPackages] = useState<any[]>([]);

  // Combine shop items with coin packages
  const allItems: ShopItem[] = [
    ...shopItems,
    ...coinPackages.map((pkg): ShopItem => ({
      id: pkg.id,
      name: pkg.name,
      description: `Get ${pkg.coins} coins instantly`,
      icon: <img src="/coin.svg" className="w-16 h-16 object-contain" alt="Coins" />,
      price: pkg.coins,
      currency: 'usd',
      category: 'coins',
      bgColor: 'bg-[#FFF9C4]',
      priceCents: pkg.price_cents,
      packageType: 'coins',
    })),
  ];

  const filteredItems = selectedCategory === 'all'
    ? allItems
    : allItems.filter(item => item.category === selectedCategory);

  // Sync gems from backend on mount
  useEffect(() => {
    const syncGems = async () => {
      if (learnerId) {
        try {
          const gemsData = await learnerApi.getGems(learnerId);
          if (gemsData && user) {
            setUser({
              ...user,
              gems: gemsData.gems
            });
          }
        } catch (err) {
          console.error('Failed to sync gems:', err);
        }
      }
    };
    syncGems();
  }, [learnerId]); // Only sync when learnerId changes

  // Load payment packages
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const packages = await paymentApi.getPackages();
        setCoinPackages(packages.coin_packages || []);
      } catch (err) {
        console.error('Failed to load packages:', err);
      }
    };
    loadPackages();
  }, []);

  const handlePurchase = async (item: ShopItem) => {
    if (!learnerId || !user) {
      toast.error('Please log in to make purchases');
      return;
    }

    // Handle USD purchases (coin packages)
    if (item.currency === 'usd' && item.priceCents) {
      setPaymentModal({
        isOpen: true,
        packageId: item.id,
        packageName: item.name,
        coins: item.price,
        priceCents: item.priceCents,
        type: item.packageType || 'coins'
      });
      return;
    }

    if (gems < item.price) {
      // Show coin purchase option instead of error
      if (coinPackages.length > 0) {
        const smallestPackage = coinPackages[0];
        setPaymentModal({
          isOpen: true,
          packageId: smallestPackage.id,
          packageName: smallestPackage.name,
          coins: smallestPackage.coins,
          priceCents: smallestPackage.price_cents,
          type: 'coins'
        });
      } else {
        toast.error(`Not enough gems! You need ${item.price} gems.`);
      }
      return;
    }

    setPurchasing(item.id);
    setError(null);

    try {
      const result = await learnerApi.purchaseItem(
        learnerId,
        item.id,
        item.name,
        item.price,
        item.currency
      );

      if (result.success) {
        // Mark as purchased for visual feedback
        setPurchasedItems(prev => new Set(prev).add(item.id));
        
        // Update user store with new gems and apply effects
        const updatedUser = {
          ...user,
          gems: result.gems_remaining
        };

        // Apply item effects
        if (result.effect.type === 'refill_hearts') {
          updatedUser.hearts = result.effect.hearts;
          // Also sync hearts from backend to ensure accuracy
          try {
            const heartsData = await learnerApi.getHearts(learnerId);
            if (heartsData) {
              updatedUser.hearts = heartsData.hearts;
            }
          } catch (err) {
            console.error('Failed to sync hearts:', err);
          }
        }

        setUser(updatedUser);
        
        // Sync gems from backend one more time to ensure accuracy
        try {
          const gemsData = await learnerApi.getGems(learnerId);
          if (gemsData && gemsData.gems !== result.gems_remaining) {
            // If there's a mismatch, use the backend value
            setUser({
              ...updatedUser,
              gems: gemsData.gems
            });
          }
        } catch (err) {
          console.error('Failed to sync gems after purchase:', err);
        }

        // Show success toast with item-specific message
        let successMessage = `${item.name} purchased successfully!`;
        if (result.effect.type === 'refill_hearts') {
          successMessage = `Hearts refilled! You now have ${result.effect.hearts} hearts.`;
        } else if (result.effect.type === 'double_xp') {
          successMessage = `Double XP activated! Earn 2x XP for the next ${result.effect.duration_minutes} minutes.`;
        } else if (result.effect.type === 'streak_freeze') {
          successMessage = `Streak freeze activated! Your streak is protected for ${result.effect.days} day.`;
        }
        
        toast.success(successMessage);
        
        // Clear purchased state after 3 seconds (for visual feedback)
        setTimeout(() => {
          setPurchasedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }, 3000);
        
        // Clear any previous errors
        setError(null);
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to purchase item';
      toast.error(errorMessage);
      console.error('Purchase error:', err);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <>
      {paymentModal && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(null)}
          packageId={paymentModal.packageId}
          packageName={paymentModal.packageName}
          coins={paymentModal.coins}
          priceCents={paymentModal.priceCents}
          packageType={paymentModal.type}
        />
      )}
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
                        ? "bg-orange-50 text-[#FF9600] ring-1 ring-[#FF9600] shadow-sm transform scale-[1.02]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-5 h-5", isActive ? "text-[#FF9600]" : "text-gray-400")} />
                      <span className="capitalize">{cat.label}</span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[#FF9600]" />
                    )}
                    {!isActive && cat.id === 'all' && (
                      <span className="text-xs font-bold text-gray-300">{shopItems.length}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="font-extrabold text-[#1CB0F6] mb-1">Earn Free Gems</h3>
            <p className="text-xs text-blue-600/80 mb-3">Complete daily quests!</p>
            <Button 
              size="sm" 
              fullWidth 
              variant="primary"
              onClick={() => navigate('/quests')}
            >
              View Quests
            </Button>
          </div>
        </div>

        {/* === Main Content === */}
        <div className="flex-1 min-h-screen flex flex-col">

          {/* Hero Video Banner - Full Width, No Padding, No Border Radius */}
          <div className="w-full" style={{ height: '400px' }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover' }}
            >
              <source src="/3d-models/new-shop.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-6 lg:p-10">

            {/* Search + Filter + Gems Row - Below Video */}
            <div className="flex items-center justify-between mb-8">
              {/* Search Input */}
              <div className="relative flex-1 max-w-xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF9600] transition-colors" />
                <input
                  type="text"
                  placeholder="Look up any item you desire..."
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-50 border-2 border-transparent text-sm font-bold text-gray-600 focus:bg-white focus:border-[#FF9600] placeholder:text-gray-400 transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-3 ml-4">
                {/* Filter Button */}
                <div className="p-3 rounded-xl border-2 border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <Filter className="w-5 h-5 text-gray-400" />
                </div>
                {/* Gem Display */}
                <GemDisplay amount={gems} size="lg" />
              </div>
            </div>

            {/* Filter Button Row */}
            <div className="flex items-center justify-end mb-6">
              <button className="px-4 py-2 rounded-xl bg-white border-2 border-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                Filter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Add New Item Placeholder */}


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

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs tracking-wider">PRICE</span>
                    <div className="flex items-center gap-1.5">
                      {item.currency === 'usd' ? (
                        <span className="text-lg font-extrabold text-gray-800">
                          ${((item.priceCents || 0) / 100).toFixed(2)}
                        </span>
                      ) : (
                        <>
                          <img src="/coin.svg" className="w-5 h-5 object-contain" alt="Coins" />
                          <span className="text-lg font-extrabold text-gray-800">{item.price}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      className={cn(
                        "w-full py-3 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all relative",
                        item.currency === 'usd'
                          ? "bg-[#1cb0f6] hover:bg-[#1899d6] text-white border-2 border-transparent"
                          : gems < item.price
                          ? "bg-[#1cb0f6] hover:bg-[#1899d6] text-white border-2 border-transparent"
                          : purchasing === item.id
                          ? "bg-orange-200 text-orange-600 cursor-wait"
                          : purchasedItems.has(item.id)
                          ? "bg-green-100 text-green-600 border-2 border-green-300"
                          : "text-[#FF9600] hover:bg-orange-50 border-2 border-transparent hover:border-orange-200"
                      )}
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id || purchasedItems.has(item.id)}
                    >
                      {purchasing === item.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          PURCHASING...
                        </span>
                      ) : purchasedItems.has(item.id) ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          PURCHASED
                        </span>
                      ) : item.currency === 'usd' ? (
                        'BUY NOW'
                      ) : gems < item.price ? (
                        'BUY COINS'
                      ) : (
                        'PURCHASE'
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
};
