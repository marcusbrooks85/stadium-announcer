'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A PWA Install Prompt component that appears as a dismissible header.
 * Only visible on mobile devices (phones/tablets) when the app is installable.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile or tablet device
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Regular expression to catch phones and tablets
      return /android|ipad|iphone|ipod/i.test(userAgent.toLowerCase());
    };
    
    setIsMobile(checkMobile());

    // Check if the user has already dismissed the prompt in this session or historically
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the browser's default mini-infobar from appearing
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Only show the custom UI if on mobile and not previously dismissed
      if (checkMobile() && localStorage.getItem('pwa-install-dismissed') !== 'true') {
        setIsPromptVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsPromptVisible(false);
      console.log('PWA: App was successfully installed.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger the native install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      setIsPromptVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsPromptVisible(false);
    setIsDismissed(true);
    // Persist dismissal so we don't annoy the user
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Do not render if not mobile, dismissed, or prompt not ready
  if (!isPromptVisible || isDismissed || !isMobile) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-500">
      <div className="bg-primary px-4 py-3 shadow-2xl flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black uppercase tracking-widest text-[10px] md:text-xs">
              Install Web App?
            </span>
            <span className="text-white/70 text-[8px] md:text-[9px] font-bold uppercase tracking-tighter">
              Add On Deck to your home screen
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleInstallClick}
            className="h-8 px-4 font-black uppercase text-[10px] shadow-sm"
          >
            Yes
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleDismiss}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
