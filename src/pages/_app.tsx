import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {

  return (
    <LogSystemProvider>
      <IDBProvider>
        <Component {...pageProps} />
      </IDBProvider>
    </LogSystemProvider>
  );
}
