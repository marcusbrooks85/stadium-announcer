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
  Settings,
  Wifi,
  WifiOff,
  ShieldCheck,
  MessageSquare,
  LayoutDashboard
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

  const hasManagementAccess = ["super_admin", "league_admin", "booth_admin"].includes(userRole || "");

  // Base navigation items for all team members
  const navItems = [
    { label: "Home", href: "/uat", icon: Home },
    { label: "Booth", href: "/booth-uat", icon: Zap },
    { label: "Stats", href: "/stats-uat", icon: BarChart3 },
    { label: "Schedule", href: "/schedule-uat", icon: Calendar },
    { label: "Team Chat", href: "/messages-uat", icon: MessageSquare },
  ];

  // Additional tools for verified administrators
  if (hasManagementAccess) {
    navItems.push({ label: "Analytics", href: "/analytics-uat", icon: Activity });
    navItems.push({ label: "Admin Portal", href: "/admin-uat", icon: LayoutDashboard });
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
               UAT Workspace
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

        {hasManagementAccess && (
          <div className="p-6 border-t border-white/5 bg-black/40">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-[8px] font-black uppercase text-primary tracking-widest">Operator Controls</span>
              <div className="flex items-center gap-2">
                 <ShieldCheck className="h-3 w-3 text-primary" />
                 <span className="text-[10px] font-bold text-white uppercase">{userRole?.replace('_', ' ')} Verified</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}