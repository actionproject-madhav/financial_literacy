import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  fallback?: React.ReactNode;
}

// File mapping: maps requested files to actual files (case-insensitive)
// Also handles missing files with fallbacks
const FILE_MAPPING: Record<string, string> = {
  // Experience levels
  'seedling.json': 'Seedling.json',
  'book.json': 'chart.json', // Fallback: use chart for book
  'chart.json': 'chart.json',
  'target.json': 'Target.json',
  
  // Financial goals
  'shield.json': 'shield.json',
  'growth.json': 'growth.json',
  'beach.json': 'Beach.json',
  'house.json': 'house.json',
  'stocks.json': 'growth.json', // Fallback: use growth for stocks
  'card.json': 'card.json',
  'document.json': 'document.json',
  'transfer.json': 'transfer.json',
  
  // Domain icons
  'banking.json': 'shield.json', // Fallback: use shield for banking
  'credit.json': 'card.json', // Fallback: use card for credit
  'taxes.json': 'document.json', // Fallback: use document for taxes
  'investing.json': 'growth.json', // Fallback: use growth for investing
  'budgeting.json': 'card.json', // Fallback: use card for budgeting
  'retirement.json': 'retirement.json',
  'insurance.json': 'insurance.json',
  'crypto.json': 'crypto.json',
  'default.json': 'shield.json', // Fallback: use shield as default
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  className = '',
  loop = true,
  autoplay = true,
  fallback,
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Get the actual file path (with fallback mapping)
    const fileName = src.toLowerCase();
    const actualFile = FILE_MAPPING[fileName] || FILE_MAPPING['default.json'] || 'shield.json';
    const filePath = `/lottie/${actualFile}`;

    // Load the Lottie animation
    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load animation');
        return res.json();
      })
      .then(data => {
        setAnimationData(data);
        setError(false);
      })
      .catch(err => {
        console.warn(`Failed to load Lottie animation: ${filePath}`, err);
        setError(true);
      });
  }, [src]);

  if (error) {
    return fallback || (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-gray-300 rounded-full" />
        </div>
      </div>
    );
  }

  if (!animationData) {
    return fallback || (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
};

