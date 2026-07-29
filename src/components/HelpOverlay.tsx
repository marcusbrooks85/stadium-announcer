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
  Smartphone,
  Apple,
  Lock,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * A global context-aware help system that explains Admin operations, Installation, and Legal Terms.
 */
export function HelpOverlay() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const getHelpContent = () => {
    // Shared installation item for all pages
    const installItem = {
      icon: <Smartphone className="h-4 w-4 text-primary" />,
      heading: "Install Web App",
      text: (
        <div className="flex flex-col gap-2 normal-case">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-white/10">
              <Apple className="h-3.5 w-3.5 text-white shrink-0 fill-current" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-tighter text-white">iOS:</span>
            <span>tap 'Share' then 'Add to Home Screen'.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-white/10">
              <Smartphone className="h-3.5 w-3.5 text-white shrink-0 fill-current" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-tighter text-white">Android:</span>
            <span>tap the 'Install' button in the header or your browser menu.</span>
          </div>
          <div className="mt-1 font-black text-primary tracking-widest uppercase text-[9px]">
            This app is NOT available in App Stores
          </div>
        </div>
      )
    };

    let pageSpecific = { title: "", sections: [] as any[] };

    switch (pathname) {
      case "/booth":
        pageSpecific = {
          title: "Announcer Booth Guide",
          sections: [
            {
              icon: <ShieldCheck className="h-4 w-4 text-primary" />,
              heading: "ADMIN ENABLED",
              text: "Click the 'ADMIN' button to enable admin changes and management tools."
            },
            {
              icon: <Music className="h-4 w-4 text-secondary" />,
              heading: "Audio Management",
              text: "Upload MP3 announcement audio directly via the Settings Wheel. You can also link YouTube crowd songs, update and remove player info."
            },
            {
              icon: <HelpCircle className="h-4 w-4 text-accent" />,
              heading: "Song Categories",
              text: "Use the Management Panel dropdown to toggle between 'Players', 'Organ Master', and 'Crowd Pump-Up' song lists."
            }
          ]
        };
        break;
      case "/stats":
        pageSpecific = {
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
              text: "Game outcome metrics and standing records are calculated on a 2-hour offset window from the scheduled game start time."
            }
          ]
        };
        break;
      case "/":
      default:
        pageSpecific = {
          title: "Schedule & Logistics Guide",
          sections: [
            {
              icon: <Shirt className="h-4 w-4 text-primary" />,
              heading: "Jersey Indicators",
              text: "The BLUE jersey indicates a HOME game. The GREY jersey indicates an AWAY game."
            },
            {
              icon: <Utensils className="h-4 w-4 text-secondary" />,
              heading: (
                <span className="flex items-center gap-1.5">
                  Snack Duty (ADMIN <Lock className="h-3 w-3 inline" />)
                </span>
              ),
              text: "Admins can use the live dropdown on each game card to assign a specific player for snack duty."
            },
            {
              icon: <Trophy className="h-4 w-4 text-accent" />,
              heading: (
                <span className="flex items-center gap-1.5">
                  Game Status (ADMIN <Lock className="h-3 w-3 inline" />)
                </span>
              ),
              text: "Access the Admin to track game results. Click to toggle on an off W (Win), L (Loss), or C (Canceled) buttons."
            }
          ]
        };
        break;
    }

    return {
      title: pageSpecific.title,
      sections: [installItem, ...pageSpecific.sections]
    };
  };

  const content = getHelpContent();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-24 left-4 z-[100] h-8 w-8 rounded-full border border-white bg-black text-white shadow-2xl hover:bg-white hover:text-black transition-all transform hover:scale-110 active:scale-95 md:bottom-28 md:left-8"
        >
          <span className="text-sm font-black">?</span>
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
                <div className="text-[11px] font-bold text-muted-foreground leading-relaxed pl-10 border-l-2 border-primary/20 ml-4">
                  {section.text}
                </div>
              </div>
            ))}
          </div>

          {/* Legal Disclaimer & Terms Section */}
          <div className="mt-12 pt-8 border-t border-white/5 text-[9px] leading-relaxed text-muted-foreground/50 space-y-4 pb-8">
            <div className="space-y-1">
              <p className="font-black uppercase tracking-[0.1em] text-white/40">Disclaimer & Terms of Use</p>
              <p>This application is intended strictly for recreational, stadium-entertainment, and personal organization purposes.</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-white/30 uppercase tracking-tighter text-[8px]">Media Integration Disclaimer:</p>
              <p>
                This platform utilizes content streaming links and video player embed elements provided by third-party services, including YouTube. This application does not download, host, modify, or distribute copyrighted digital audio or video files on its servers. All media content remains the exclusive property of its respective copyright owners, publishers, and creators. Content playback is subject to the terms, licensing agreements, and regional availability set by the original hosting platform.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-white/30 uppercase tracking-tighter text-[8px]">Limitation of Liability:</p>
              <p>
                The developers and operators of this app assume no liability for any temporary service interruptions, network connectivity issues, third-party content removal, or automated account sign-outs resulting from inactivity timers. Use of this application constitutes acceptance of these terms.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-white/30 uppercase tracking-tighter text-[8px]">Indemnification:</p>
              <p>
                By utilizing this application, the user agrees to indemnify, defend, and hold harmless the creators, developers, and publishers of this application from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from your use of the platform, playback of media in public settings, or violation of any third-party copyright or privacy rights.
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center pb-6">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 font-black uppercase tracking-[0.2em] border-primary/30 text-primary hover:bg-primary/10"
              >
                Dismiss Guide
              </Button>
            </DialogClose>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
