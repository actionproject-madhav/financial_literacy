import React from 'react';

// Map icon names to actual Duolingo SVG files
const ICON_MAP: Record<string, string> = {
  // Navigation
  'home': '/duolingo/duolingo landing/784035717e2ff1d448c0f6cc4efc89fb.svg', // Trophy/home icon
  'learn': '/duolingo/duolingo landing/784035717e2ff1d448c0f6cc4efc89fb.svg',
  'leaderboard': '/duolingo/duolingo landing/784035717e2ff1d448c0f6cc4efc89fb.svg',
  'shop': '/duolingo/shop_files/59a90a2cedd48b751a8fd22014768fd7.svg',
  'profile': '/duolingo/profile_files/d4280fdf64d66de7390fe84802432a53.svg',
  'settings': '/duolingo/profile_files/d4280fdf64d66de7390fe84802432a53.svg',
  
  // Gamification
  'gem': '/duolingo/shop_files/45c14e05be9c1af1d7d0b54c6eed7eee.svg',
  'heart': '/duolingo/shop_files/547ffcf0e6256af421ad1a32c26b8f1a.svg',
  'streak': '/duolingo/shop_files/59a90a2cedd48b751a8fd22014768fd7.svg',
  'crown': '/duolingo/shop_files/784035717e2ff1d448c0f6cc4efc89fb.svg',
  'trophy': '/duolingo/shop_files/784035717e2ff1d448c0f6cc4efc89fb.svg',
  'xp': '/duolingo/shop_files/2b5a211d830a24fab92e291d50f65d1d.svg',
  
  // Actions
  'check': '/duolingo/duolingo landing/39f13d2de304cad2ac2f88b31a7e2ff4.svg',
  'close': '/duolingo/duolingo landing/65b8a029d7a148218f1ac98a198f8b42.svg',
  'volume': '/duolingo/duolingo landing/45c14e05be9c1af1d7d0b54c6eed7eee.svg',
  'menu': '/duolingo/duolingo landing/65b8a029d7a148218f1ac98a198f8b42.svg',
  'bell': '/duolingo/duolingo landing/45c14e05be9c1af1d7d0b54c6eed7eee.svg',
  'chevron-right': '/duolingo/duolingo landing/65b8a029d7a148218f1ac98a198f8b42.svg',
  
  // Shop items
  'streak-freeze': '/duolingo/shop_files/59a90a2cedd48b751a8fd22014768fd7.svg',
  'double-xp': '/duolingo/shop_files/2b5a211d830a24fab92e291d50f65d1d.svg',
  'refill-hearts': '/duolingo/shop_files/547ffcf0e6256af421ad1a32c26b8f1a.svg',
  'premium': '/duolingo/shop_files/784035717e2ff1d448c0f6cc4efc89fb.svg',
};

interface DuolingoIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export const DuolingoIcon: React.FC<DuolingoIconProps> = ({
  name,
  size = 24,
  className = '',
  color,
}) => {
  const iconPath = ICON_MAP[name] || ICON_MAP['close']; // Fallback to close icon

  return (
    <img
      src={iconPath}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={color ? { filter: `brightness(0) saturate(100%) ${color ? `invert(${color})` : ''}` } : undefined}
    />
  );
};

