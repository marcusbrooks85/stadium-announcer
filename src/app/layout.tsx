import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from './context/game-context';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { SplashScreen } from '@/components/SplashScreen';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/InstallPrompt';

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
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen">
        <ServiceWorkerRegistration />
        <SplashScreen />
        <FirebaseClientProvider>
          <InstallPrompt />
          <GameProvider>
            {children}
            <Toaster />
          </GameProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
