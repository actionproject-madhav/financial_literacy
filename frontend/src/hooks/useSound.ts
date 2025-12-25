import { useCallback, useRef, useEffect } from 'react';
import { Howl } from 'howler';

// Sound URLs (you'll need to add actual sound files)
const SOUNDS = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  click: '/sounds/click.mp3',
  levelUp: '/sounds/level-up.mp3',
  streak: '/sounds/streak.mp3',
  xp: '/sounds/xp.mp3',
};

type SoundName = keyof typeof SOUNDS;

export const useSound = () => {
  const soundsRef = useRef<Record<string, Howl>>({});
  const enabledRef = useRef(true);

  useEffect(() => {
    // Preload sounds (silently fail if files don't exist)
    Object.entries(SOUNDS).forEach(([name, url]) => {
      try {
        const howl = new Howl({
          src: [url],
          preload: true,
          volume: 0.5,
        });
        
        // Only add if sound loads successfully
        howl.on('loaderror', () => {
          // Silently ignore missing sound files
          console.debug(`Sound file not found: ${url}`);
        });
        
        soundsRef.current[name] = howl;
      } catch (error) {
        // Silently ignore sound loading errors
        console.debug(`Failed to load sound: ${name}`, error);
      }
    });

    return () => {
      // Cleanup
      Object.values(soundsRef.current).forEach((sound) => {
        try {
          sound.unload();
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (enabledRef.current && soundsRef.current[name]) {
      try {
        soundsRef.current[name].play();
      } catch (error) {
        // Silently ignore sound play errors
        console.debug(`Failed to play sound: ${name}`, error);
      }
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { play, setEnabled };
};

