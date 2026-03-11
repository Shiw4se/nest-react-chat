import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  hasSeenTour: Record<string, boolean>;
  setHasSeenTour: (userId: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      hasSeenTour: {},
      setHasSeenTour: (userId) =>
        set((state) => ({
          hasSeenTour: { ...state.hasSeenTour, [userId]: true },
        })),
    }),
    {
      name: 'ui-storage', 
    }
  )
);