import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AudioPlayButtonProps {
  audioUrl?: string;
  onFetch?: () => Promise<string>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
  autoPlay?: boolean;
  className?: string;
}

export const AudioPlayButton: React.FC<AudioPlayButtonProps> = ({
  audioUrl: initialUrl,
  onFetch,
  size = 'md',
  variant = 'default',
  autoPlay = false,
  className,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(initialUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (initialUrl) {
      setAudioUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (autoPlay && audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  }, [autoPlay, audioUrl]);

  const loadAudio = async () => {
    if (!onFetch) return;
    
    setIsLoading(true);
    setError(false);
    
    try {
      const url = await onFetch();
      setAudioUrl(url);
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (isLoading) return;

    if (!audioUrl && onFetch) {
      await loadAudio();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26,
  };

  const variantClasses = {
    default: cn(
      'bg-duo-blue-tint text-duo-blue',
      'hover:bg-duo-blue hover:text-white',
      'border-2 border-transparent hover:border-duo-blue'
    ),
    ghost: cn(
      'bg-transparent text-duo-blue',
      'hover:bg-duo-blue-tint'
    ),
  };

  return (
    <>
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'rounded-full transition-colors duration-200',
          sizeClasses[size],
          error ? 'bg-duo-red-tint text-duo-red' : variantClasses[variant],
          className
        )}
        aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
      >
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin" />
        ) : error ? (
          <VolumeX size={iconSizes[size]} />
        ) : (
          <Volume2
            size={iconSizes[size]}
            className={cn(isPlaying && 'animate-pulse')}
          />
        )}
      </motion.button>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError(true)}
        />
      )}
    </>
  );
};

