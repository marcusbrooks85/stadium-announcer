import type {Metadata} from 'next';
import './globals.css';
import { GameProvider } from './context/game-context';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'On Deck: Baseball Schedule & Announcer',
  description: 'Professional-grade Baseball Schedule, Stats, and Stadium Announcer Dashboard',
  appleWebApp: {
    title: 'OnDeck',
    statusBarStyle: 'black-translucent',
    capable: true,
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
        <link rel="apple-touch-icon" href="/audio/splash.png" />
      </head>
      <body className="font-body antialiased min-h-screen">
        <SplashScreen />
        <FirebaseClientProvider>
          <GameProvider>
            {children}
            <Toaster />
          </GameProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
