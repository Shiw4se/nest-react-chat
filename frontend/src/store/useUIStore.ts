import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  hasSeenTour: Record<string, boolean>;
  setHasSeenTour: (userId: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  /** User whose profile panel is open, or null when closed. Not persisted. */
  profileUserId: string | null;
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      hasSeenTour: {},
      setHasSeenTour: (userId) =>
        set((state) => ({
          hasSeenTour: { ...state.hasSeenTour, [userId]: true },
        })),

      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      profileUserId: null,
      openProfile: (userId) => set({ profileUserId: userId }),
      closeProfile: () => set({ profileUserId: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        hasSeenTour: state.hasSeenTour,
        isSidebarOpen: state.isSidebarOpen,
      }),
    },
  ),
);
