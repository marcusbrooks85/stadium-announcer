'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Enhanced SplashScreen with Build ID for production verification.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  
  // Updated version string to force a visual change and bypass potential CDN/Browser caching
  const BUILD_VERSION = "2024-03-21-002"; 

  useEffect(() => {
    // Hold for 2.2 seconds, then start fading
    const holdTimer = setTimeout(() => {
      setIsFading(true);
    }, 2200);

    // After fade animation (500ms), remove from DOM
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2700);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A2233] transition-opacity duration-700 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
        {/* Central Graphic (Tall Splash Asset) */}
        <div className="relative w-72 h-72 md:w-[600px] md:h-[600px]">
          <Image
            src="/audio/splash.png"
            alt="On Deck"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Tagline */}
        <div className="mt-2 flex flex-col items-center gap-3">
          <p className="text-[10px] md:text-xs font-medium text-white/40 tracking-[0.5em] uppercase">
            Schedule • Stats • Announcer
          </p>
          <div className="h-[1px] w-16 bg-primary/20 rounded-full" />
          
          {/* Build Version Tag - Visible for verification */}
          <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            Build: {BUILD_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
