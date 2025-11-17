/**
 * Bottom Navigation
 * Mobile-only bottom tab navigation (≤768px)
 */

'use client';

import { Home, Wrench, CreditCard, Gift, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalSection } from './PortalSidebar';

interface BottomNavProps {
  currentSection: PortalSection;
  onSectionChange: (section: PortalSection) => void;
  className?: string;
}

const NAV_ITEMS = [
  { id: 'overview' as PortalSection, label: 'Overview', icon: Home },
  { id: 'services' as PortalSection, label: 'Services', icon: Wrench },
  // TODO: Uncomment when billing section is ready
  // { id: 'billing' as PortalSection, label: 'Billing', icon: CreditCard },
  { id: 'rewards' as PortalSection, label: 'Rewards', icon: Gift },
  { id: 'settings' as PortalSection, label: 'Menu', icon: Grid3x3 },
];

export function BottomNav({
  currentSection,
  onSectionChange,
  className,
}: BottomNavProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-card border-t border-border",
        "safe-area-inset-bottom",
        className
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <nav className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover-elevate"
              )}
              data-testid={`bottom-nav-${item.id}`}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive && "stroke-[2.5]"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
