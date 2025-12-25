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
    // Preload sounds
    Object.entries(SOUNDS).forEach(([name, url]) => {
      soundsRef.current[name] = new Howl({
        src: [url],
        preload: true,
        volume: 0.5,
      });
    });

    return () => {
      // Cleanup
      Object.values(soundsRef.current).forEach((sound) => sound.unload());
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (enabledRef.current && soundsRef.current[name]) {
      soundsRef.current[name].play();
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { play, setEnabled };
};

