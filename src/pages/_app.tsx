import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppProps } from "next/app";

import { useEffect } from "react";

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
        <IDBProvider>
          <Component {...pageProps} />
        </IDBProvider>
      </ThemeProvider>
    </LogSystemProvider>
  );
}
