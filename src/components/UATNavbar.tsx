
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Zap, 
  BarChart3, 
  Calendar, 
  Activity, 
  Menu, 
  ChevronRight,
  Lock,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUATGame } from "@/app/context/uat-game-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * A shared navigation bar for the UAT environment.
 * Consolidates all links into a slide-out hamburger menu.
 */
export function UATNavbar() {
  const pathname = usePathname();
  const { userRole, isOnline } = useUATGame();

  const isAdmin = userRole === "super_admin" || userRole === "league_admin";

  const navItems = [
    { label: "Home", href: "/uat", icon: Home },
    { label: "Booth", href: "/booth-uat", icon: Zap },
    { label: "Stats", href: "/stats-uat", icon: BarChart3 },
    { label: "Schedule", href: "/schedule-uat", icon: Calendar },
  ];

  if (isAdmin) {
    navItems.push({ label: "Analytics", href: "/analytics-uat", icon: Activity });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 text-muted-foreground hover:text-[var(--tenant-primary)] hover:bg-[var(--tenant-primary)]/10 transition-all rounded-full"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-card/95 backdrop-blur-xl border-l border-white/10 p-0 w-[280px] md:w-[320px] flex flex-col shadow-2xl">
        <SheetHeader className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left text-[10px] font-black uppercase tracking-[0.3em] text-[var(--tenant-primary)] flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-[var(--tenant-primary)] animate-pulse" />
               Navigation Menu
            </SheetTitle>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter",
              isOnline ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
            )}>
              {isOnline ? <Wifi className="h-2 w-2" /> : <WifiOff className="h-2 w-2" />}
              {isOnline ? "Live" : "Offline"}
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <SheetClose key={item.href} asChild>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-[var(--tenant-primary)] text-white shadow-xl shadow-[var(--tenant-primary)]/20" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive ? "bg-white/20" : "bg-black/20"
                      )}>
                        <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 relative z-10 transition-all duration-300", isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50")} />
                  </div>
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/40">
          <SheetClose asChild>
            <Link href="/admin-uat">
              <div className={cn(
                "flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 group",
                pathname === "/admin-uat" 
                  ? "bg-[var(--tenant-secondary)] text-white shadow-lg" 
                  : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
              )}>
                <div className="h-10 w-10 rounded-full bg-black/20 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin Workspace</span>
                  <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter mt-1">Configure Team Profile</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
