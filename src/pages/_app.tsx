import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppProps } from "next/app";

import { useEffect } from "react";
import { FeedbackWidget } from "@/components/Feedback/FeedbackWidget";
import { PollsProvider } from "@/contexts/PollsContext";
import { TrackingProvider } from "@/contexts/TrackingContext";

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <LogSystemProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <PollsProvider>
          <PollsProvider>
            <TrackingProvider>
              <IDBProvider>
                <Component {...pageProps} />
                <FeedbackWidget />
              </IDBProvider>
            </TrackingProvider>
          </PollsProvider>
        </PollsProvider>
      </ThemeProvider>
    </LogSystemProvider>
  );
}
