import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {

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
