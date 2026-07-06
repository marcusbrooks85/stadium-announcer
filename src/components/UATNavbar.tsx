
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, BarChart3, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUATGame } from "@/app/context/uat-game-context";

/**
 * A shared navigation bar for the UAT environment.
 * Utilizes tenant-specific branding variables.
 */
export function UATNavbar() {
  const pathname = usePathname();
  const { userRole } = useUATGame();

  const isAdmin = userRole === "super_admin" || userRole === "league_admin";

  const navItems = [
    { label: "Home", href: "/uat", icon: Home },
    { label: "Booth", href: "/booth-uat", icon: Zap },
    { label: "Stats", href: "/stats-uat", icon: BarChart3 },
    { label: "Schedule", href: "/schedule-uat", icon: Calendar },
  ];

  // System analytics link for administrators
  const adminItems = isAdmin ? [
    { label: "Analytics", href: "/analytics-uat", icon: Activity }
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5 mr-1 md:mr-2">
      {allItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-[var(--tenant-primary)] text-white shadow-lg" 
                  : "text-muted-foreground hover:text-[var(--tenant-primary)] hover:bg-[var(--tenant-primary)]/5"
              )}
            >
              <Icon 
                className={cn(
                  "h-3.5 w-3.5 md:h-4 md:w-4 transition-transform",
                  isActive ? "scale-110" : "scale-100"
                )} 
              />
              <span className={cn(
                "text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
