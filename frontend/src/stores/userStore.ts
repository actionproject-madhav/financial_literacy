import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  learnerId: string | null;
  user: {
    name: string;
    email: string;
    country: string;
    visaType: string;
    streak: number;
    totalXp: number;
    hearts: number;
    gems: number;
  } | null;
  setUser: (user: UserState['user']) => void;
  setLearnerId: (id: string) => void;
  updateStreak: (streak: number) => void;
  addXP: (amount: number) => void;
  loseHeart: () => void;
  resetHearts: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      learnerId: null,
      user: null,
      
      setUser: (user) => set({ user }),
      
      setLearnerId: (learnerId) => set({ learnerId }),
      
      updateStreak: (streak) =>
        set((state) => ({
          user: state.user ? { ...state.user, streak } : null,
        })),
      
      addXP: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, totalXp: state.user.totalXp + amount }
            : null,
        })),
      
      loseHeart: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, hearts: Math.max(0, state.user.hearts - 1) }
            : null,
        })),
      
      resetHearts: () =>
        set((state) => ({
          user: state.user ? { ...state.user, hearts: 5 } : null,
        })),
      
      logout: () => set({ learnerId: null, user: null }),
    }),
    {
      name: 'finlit-user',
    }
  )
);

