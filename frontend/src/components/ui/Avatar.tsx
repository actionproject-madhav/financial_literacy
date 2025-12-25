import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs', // 32px
    md: 'w-10 h-10 text-sm', // 40px - Duolingo standard
    lg: 'w-12 h-12 text-base', // 48px
    xl: 'w-16 h-16 text-lg', // 64px
  };

  const showFallback = !src || imgError;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-[#DDF4FF]', // Duolingo exact blue tint
        'flex items-center justify-center font-bold text-[#1CB0F6]', // Duolingo exact blue
        'border-2 border-white shadow-sm',
        sizeStyles[size],
        className
      )}
    >
      {showFallback ? (
        <span>{fallback || alt.charAt(0).toUpperCase()}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

