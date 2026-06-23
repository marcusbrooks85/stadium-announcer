'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A floating PWA install button designed specifically for mobile.
 * Replaces the old stats button with a direct action to add the app to home screen.
 */
export function FloatingInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iphone|ipad|ipod/i.test(ua.toLowerCase());
    };

    const checkIOS = () => {
      if (typeof window === 'undefined') return false;
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    };

    const checkStandalone = () => {
      if (typeof window === 'undefined') return false;
      return (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone;
    };

    setIsMobile(checkMobile());
    setIsIOS(checkIOS());
    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA: Ready to install (Android/Chrome)');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(!showIOSInstructions);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Only show for mobile and if not already installed
  if (!isMobile || isStandalone) return null;
  
  // For non-iOS, only show if the browser is ready to prompt
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[120] md:hidden">
      <div className="relative">
        {/* iOS Specific Instructions Tooltip */}
        {showIOSInstructions && (
          <div className="absolute bottom-20 right-0 w-64 bg-card border-2 border-primary/40 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Apple className="h-3 w-3" /> iOS Installation
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={() => setShowIOSInstructions(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-white/90 uppercase leading-relaxed">
                1. Tap the <span className="text-primary inline-flex items-center gap-0.5"><Share className="h-2.5 w-2.5" /> Share</span> icon at the bottom.
              </p>
              <p className="text-[9px] font-bold text-white/90 uppercase leading-relaxed">
                2. Scroll down and tap <span className="text-primary">"Add to Home Screen"</span>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-center">
               <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Run as Standalone App</span>
            </div>
          </div>
        )}

        {/* Main Install Action Button */}
        <Button 
          onClick={handleInstallClick}
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95",
            isIOS 
              ? "bg-white text-black hover:bg-gray-100 border-2 border-black/10" 
              : "bg-primary text-white hover:bg-primary/90 border-2 border-white/10 shadow-primary/30",
            !showIOSInstructions && "animate-pulse"
          )}
        >
          {/* Dual Platform Icon Container */}
          <div className="flex items-center gap-1 opacity-60">
            <Apple className={cn("h-2.5 w-2.5", isIOS ? "fill-current" : "")} />
            <Smartphone className={cn("h-2.5 w-2.5", !isIOS ? "fill-current" : "")} />
          </div>
          <Download className="h-7 w-7" />
          <span className="text-[7px] font-black uppercase tracking-tighter leading-none mt-0.5">
            Install
          </span>
        </Button>
      </div>
    </div>
  );
}
