import React from 'react';

interface ProfileAvatarProps {
  profilePictureUrl?: string;
  avatarUrl?: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profilePictureUrl,
  avatarUrl,
  displayName,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const imageUrl = avatarUrl || profilePictureUrl;
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
  };

  if (!imageUrl || imgError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[#1cb0f6] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm border-2 border-white ${className}`}>
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={displayName}
      className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

