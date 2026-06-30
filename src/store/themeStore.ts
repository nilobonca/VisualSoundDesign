import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  theme: 'default' | 'ethereal';
  isSettingsOpen: boolean;
  audioVizEnabled: boolean;
  audioVizColor: string;
  audioVizIntensity: number; // 0.0 to 2.0, default 1.0
  areaRippleEnabled: boolean;
  setTheme: (theme: 'default' | 'ethereal') => void;
  toggleTheme: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setAudioVizEnabled: (enabled: boolean) => void;
  setAudioVizColor: (color: string) => void;
  setAudioVizIntensity: (intensity: number) => void;
  setAreaRippleEnabled: (enabled: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      isSettingsOpen: false,
      audioVizEnabled: true,
      audioVizColor: '#818cf8', // indigo-400
      audioVizIntensity: 1.0,
      areaRippleEnabled: true,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'default' ? 'ethereal' : 'default' })),
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      setAudioVizEnabled: (enabled) => set({ audioVizEnabled: enabled }),
      setAudioVizColor: (color) => set({ audioVizColor: color }),
      setAudioVizIntensity: (intensity) => set({ audioVizIntensity: intensity }),
      setAreaRippleEnabled: (enabled) => set({ areaRippleEnabled: enabled }),
    }),
    {
      name: 'vsd-theme-storage',
    }
  )
);
