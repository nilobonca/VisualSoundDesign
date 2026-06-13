import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  theme: 'default' | 'ethereal';
  isSettingsOpen: boolean;
  setTheme: (theme: 'default' | 'ethereal') => void;
  toggleTheme: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      isSettingsOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'default' ? 'ethereal' : 'default' })),
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    }),
    {
      name: 'vsd-theme-storage',
    }
  )
);
