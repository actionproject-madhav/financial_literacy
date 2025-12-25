import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GemDisplay } from '../components/gamification/GemDisplay';
import { useUserStore } from '../stores/userStore';
import { ShoppingBag, Zap, Heart, Flame, Crown } from 'lucide-react';
import { cn } from '../utils/cn';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  currency: 'gems' | 'hearts' | 'xp';
  category: 'powerups' | 'appearance' | 'streak';
  purchased?: boolean;
}

const shopItems: ShopItem[] = [
  {
    id: 'streak-freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day if you miss a day',
    icon: <Flame className="w-8 h-8 text-[#FF9600]" />,
    price: 10,
    currency: 'gems',
    category: 'powerups',
  },
  {
    id: 'double-xp',
    name: 'Double XP',
    description: 'Earn 2x XP for 15 minutes',
    icon: <Zap className="w-8 h-8 text-[#8549BA]" />,
    price: 50,
    currency: 'gems',
    category: 'powerups',
  },
  {
    id: 'refill-hearts',
    name: 'Refill Hearts',
    description: 'Restore all hearts instantly',
    icon: <Heart className="w-8 h-8 text-[#FF4B4B]" />,
    price: 100,
    currency: 'gems',
    category: 'powerups',
  },
  {
    id: 'premium-monthly',
    name: 'Premium Plus',
    description: 'Unlimited hearts, no ads, progress tracking',
    icon: <Crown className="w-8 h-8 text-[#FFC800]" />,
    price: 499,
    currency: 'gems',
    category: 'appearance',
  },
];

export const ShopPage: React.FC = () => {
  const { user } = useUserStore();
  const gems = user?.gems || 350; // Default mock gems
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'powerups' | 'appearance' | 'streak'>('all');

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'powerups', label: 'Power-ups' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'streak', label: 'Streak' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? shopItems
    : shopItems.filter(item => item.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    // TODO: Implement purchase logic
    console.log('Purchasing:', item.name);
  };

  const canAfford = (item: ShopItem) => {
    if (item.currency === 'gems') {
      return gems >= item.price;
    }
    return true;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[23px] font-bold text-[#4B4B4B]" style={{ lineHeight: '32px' }}>
            Shop
          </h1>
          <p className="text-[15px] text-[#737373] mt-1" style={{ lineHeight: '24px' }}>
            Spend your gems wisely
          </p>
        </div>
        <GemDisplay amount={gems} size="lg" />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-custom">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as any)}
            className={cn(
              'px-5 py-2 rounded-[12px] font-bold text-[15px] transition-colors whitespace-nowrap',
              selectedCategory === category.id
                ? 'bg-[#1CB0F6] text-white' // Duolingo exact blue
                : 'bg-white text-[#737373] border-2 border-[#E5E5E5] hover:bg-[#F7F7F7]'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item, index) => {
          const affordable = canAfford(item);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="elevated" padding="lg" className="h-full flex flex-col">
                {/* Item Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-[#F7F7F7] rounded-[16px] mb-4 mx-auto">
                  {item.icon}
                </div>

                {/* Item Info */}
                <div className="flex-1 text-center mb-4">
                  <h3 className="text-[17px] font-bold text-[#4B4B4B] mb-2" style={{ lineHeight: '24px' }}>
                    {item.name}
                  </h3>
                  <p className="text-[15px] text-[#737373]" style={{ lineHeight: '24px' }}>
                    {item.description}
                  </p>
                </div>

                {/* Price & Purchase */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {item.currency === 'gems' && (
                      <>
                        <ShoppingBag className="w-5 h-5 text-[#1CB0F6]" />
                        <span className="text-[19px] font-bold text-[#1CB0F6]">
                          {item.price}
                        </span>
                      </>
                    )}
                  </div>

                  <Button
                    variant={affordable ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                    onClick={() => handlePurchase(item)}
                    isDisabled={!affordable}
                  >
                    {affordable ? 'Purchase' : 'Not Enough Gems'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card variant="elevated" padding="lg" className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-[#737373] mx-auto mb-4 opacity-50" />
          <p className="text-[17px] font-bold text-[#4B4B4B] mb-2">No items available</p>
          <p className="text-[15px] text-[#737373]">Check back later for new items!</p>
        </Card>
      )}
    </div>
  );
};

