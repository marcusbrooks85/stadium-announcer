
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  Music, 
  Utensils, 
  Trophy, 
  Shirt,
  Info,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * A global context-aware help system that explains Admin operations.
 */
export function HelpOverlay() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const getHelpContent = () => {
    switch (pathname) {
      case "/booth":
        return {
          title: "Announcer Booth Guide",
          sections: [
            {
              icon: <ShieldCheck className="h-4 w-4 text-primary" />,
              heading: "Unlocking Admin Access",
              text: "Click the 'ADMIN' button in the header and enter 'Chewy2026' to enable playback controls and management tools."
            },
            {
              icon: <Music className="h-4 w-4 text-secondary" />,
              heading: "Player Walk-Ons",
              text: "Upload MP3 announcement audio directly to Firebase via the Settings Wheel. You can also link YouTube tracks for background music."
            },
            {
              icon: <HelpCircle className="h-4 w-4 text-accent" />,
              heading: "Song Categories",
              text: "Use the Management Panel dropdown to toggle between 'Players', 'Organ Master', and 'Crowd Pump-Up' song lists."
            }
          ]
        };
      case "/stats":
        return {
          title: "Stats Center Guide",
          sections: [
            {
              icon: <Info className="h-4 w-4 text-primary" />,
              heading: "Live Tracking",
              text: "The tables monitor player At-Bats, Hits, Runs, and RBIs. Admins can edit these in real-time using the Live Stats Editor."
            },
            {
              icon: <Trophy className="h-4 w-4 text-secondary" />,
              heading: "Outcome Calculation",
              text: "Game outcome metrics and standing records are calculated on a 2-hour offset window from the scheduled start time."
            }
          ]
        };
      case "/":
      default:
        return {
          title: "Schedule & Logistics Guide",
          sections: [
            {
              icon: <Utensils className="h-4 w-4 text-secondary" />,
              heading: "Snack Duty Management",
              text: "Admins can use the live dropdown on each game card to assign a specific player for snack duty."
            },
            {
              icon: <Shirt className="h-4 w-4 text-primary" />,
              heading: "Jersey Indicators",
              text: "The BLUE jersey indicates a HOME game. The GREY jersey indicates an AWAY game."
            },
            {
              icon: <Trophy className="h-4 w-4 text-accent" />,
              heading: "Manual Game Status",
              text: "Use W (Win), L (Loss), or C (Canceled) buttons to log game results. These toggle on and off when clicked."
            }
          ]
        };
    }
  };

  const content = getHelpContent();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-4 left-4 z-[100] h-12 w-12 rounded-full border-2 border-white bg-black text-white shadow-2xl hover:bg-white hover:text-black transition-all transform hover:scale-110 active:scale-95 md:bottom-8 md:left-8"
        >
          <span className="text-xl font-black">?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader className="p-6 bg-white/5 border-b border-white/5">
          <DialogTitle className="text-primary font-black uppercase tracking-[0.2em] text-sm flex items-center gap-3">
            <HelpCircle className="h-5 w-5" /> {content.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-6">
          <div className="space-y-8 pb-4">
            {content.sections.map((section, idx) => (
              <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    {section.icon}
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/90">
                    {section.heading}
                  </h3>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase pl-10 border-l-2 border-primary/20 ml-4">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-[9px] font-black uppercase tracking-tighter text-primary text-center">
              Tap outside or use 'X' to dismiss the guide
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
