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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const showFallback = !src || imgError;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-duo-blue-tint',
        'flex items-center justify-center font-bold text-duo-blue',
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

