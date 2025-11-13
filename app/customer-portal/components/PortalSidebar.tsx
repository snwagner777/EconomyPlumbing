/**
 * Portal Sidebar Navigation
 * Main navigation for customer portal sections
 */

'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Wrench, DollarSign, Gift, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PortalSection = 'overview' | 'services' | 'billing' | 'rewards' | 'settings';

interface NavItem {
  id: PortalSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface PortalSidebarProps {
  currentSection: PortalSection;
  onSectionChange: (section: PortalSection) => void;
  className?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'billing', label: 'Billing', icon: DollarSign },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function PortalSidebar({
  currentSection,
  onSectionChange,
  className,
}: PortalSidebarProps) {
  return (
    <div className={cn("pb-12 border-r bg-card", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">
            Customer Portal
          </h2>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant={currentSection === item.id ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  currentSection === item.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onSectionChange(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
