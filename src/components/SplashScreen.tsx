'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Hold for 2 seconds, then start fading
    const holdTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // After fade animation (500ms), remove from DOM
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A2233] transition-opacity duration-500 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative flex flex-col items-center animate-in zoom-in-75 duration-700 ease-out">
        {/* Central Logo */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
          <Image
            src="/audio/splash.png"
            alt="On Deck Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Title - Bold Athletic Style */}
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] font-headline">
          ON DECK
        </h1>

        {/* Tagline */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-[10px] md:text-xs font-black text-primary tracking-[0.4em] uppercase opacity-90">
            Schedule • Stats • Announcer
          </p>
          <div className="h-1 w-12 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
