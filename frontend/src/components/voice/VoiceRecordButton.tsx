import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Play, RotateCcw } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface VoiceRecordButtonProps {
  onSubmit: (audioBase64: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onSubmit,
  disabled = false,
  className,
}) => {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    getBase64,
  } = useVoiceRecorder();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsSubmitting(true);
    try {
      const base64 = await getBase64();
      await onSubmit(base64);
      resetRecording();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (error) {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-duo-red text-sm mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={startRecording}>
          Try Again
        </Button>
      </div>
    );
  }

  // Not recording, no audio
  if (!isRecording && !audioBlob) {
    return (
      <motion.button
        onClick={startRecording}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center gap-3 px-6 py-4',
          'bg-gradient-to-r from-[#8549BA] to-[#CE82FF]',
          'text-white font-bold rounded-duo-xl',
          'shadow-[0_4px_0_#6B3FA0]',
          'active:shadow-none active:translate-y-1',
          'transition-all duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Mic className="w-6 h-6" />
        <span className="text-lg">Speak Your Answer</span>
      </motion.button>
    );
  }

  // Currently recording
  if (isRecording) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        {/* Recording indicator */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 bg-duo-red rounded-full"
          />
          <span className="font-mono text-xl font-bold text-duo-text">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Waveform visualization */}
        <div className="flex items-center gap-1 h-12">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: [8, Math.random() * 40 + 8, 8],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                delay: i * 0.05,
              }}
              className="w-1 bg-duo-purple rounded-full"
            />
          ))}
        </div>

        {/* Stop button */}
        <motion.button
          onClick={stopRecording}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-2 px-6 py-3',
            'bg-duo-red text-white font-bold rounded-duo-xl',
            'shadow-duo-red',
            'active:shadow-none active:translate-y-1',
            'transition-all duration-100'
          )}
        >
          <Square className="w-5 h-5 fill-current" />
          <span>Stop Recording</span>
        </motion.button>
      </div>
    );
  }

  // Has recorded audio
  if (audioBlob && audioUrl) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        {/* Playback */}
        <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-duo-lg">
          <button
            onClick={togglePlayback}
            className="p-2 bg-duo-purple text-white rounded-full"
          >
            <Play className="w-5 h-5" />
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
          <span className="font-mono text-duo-text">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={resetRecording}
          >
            Re-record
          </Button>
          
          <Button
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit Answer
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

