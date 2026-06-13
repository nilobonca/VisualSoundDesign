import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppProps } from "next/app";

import { useEffect, useState } from "react";
import { FeedbackWidget } from "@/components/Feedback/FeedbackWidget";
import { PollsProvider } from "@/contexts/PollsContext";
import { TrackingProvider } from "@/contexts/TrackingContext";
import { useThemeStore } from "@/store/themeStore";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { Settings } from "lucide-react";
import clsx from "clsx";

export default function App({ Component, pageProps }: AppProps) {
  const { theme, isSettingsOpen, setIsSettingsOpen } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const activeTheme = mounted ? theme : 'default';

  return (
    <LogSystemProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <PollsProvider>
          <TrackingProvider>
            <IDBProvider>
              <div className={clsx("min-h-screen transition-colors duration-500", activeTheme === 'ethereal' ? 'ethereal bg-[#050505]' : 'bg-neutral-950')}>
                <Component {...pageProps} />
                <FeedbackWidget />
                
                {mounted && (
                  <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                  />
                )}
              </div>
            </IDBProvider>
          </TrackingProvider>
        </PollsProvider>
      </ThemeProvider>
    </LogSystemProvider>
  );
}
