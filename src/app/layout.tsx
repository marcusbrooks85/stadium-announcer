import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from './context/game-context';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { SplashScreen } from '@/components/SplashScreen';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/InstallPrompt';
import { HelpOverlay } from '@/components/HelpOverlay';

export const metadata: Metadata = {
  title: 'On Deck: Baseball Schedule & Announcer',
  description: 'Professional-grade Baseball Schedule, Stats, and Stadium Announcer Dashboard',
  appleWebApp: {
    title: 'On Deck',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  icons: {
    icon: [
      { url: '/audio/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/audio/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Deployment Verification Logic
  const BUILD_STAMP = "V-2025-02-18-006";

  return (
    <html lang="en" className="dark border-none">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="font-body antialiased min-h-screen">
        <ServiceWorkerRegistration />
        <SplashScreen />
        <FirebaseClientProvider>
          <InstallPrompt />
          <GameProvider>
            {children}
            <HelpOverlay />
            <Toaster />
          </GameProvider>
        </FirebaseClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const currentBuild = "${BUILD_STAMP}";
                const storedBuild = localStorage.getItem("on-deck-build-v");
                console.log("ON DECK DEPLOYMENT LOADED: " + currentBuild + " - " + new Date().toISOString());
                
                if (storedBuild && storedBuild !== currentBuild) {
                  console.warn("New build detected. Purging cache and refreshing...");
                  localStorage.setItem("on-deck-build-v", currentBuild);
                  
                  // Unregister any active service workers to ensure the new version is fetched
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                      // Hard reload once the workers are gone
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                } else {
                  localStorage.setItem("on-deck-build-v", currentBuild);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}