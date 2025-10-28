"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Phone, Menu } from "lucide-react";
import { usePhoneConfig } from "@/contexts/PhoneConfigProvider";

export default function Header() {
  const phoneConfig = usePhoneConfig();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Economy Plumbing</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/services" className="text-sm font-medium hover:text-primary">
            Services
          </Link>
          <Link href="/service-areas" className="text-sm font-medium hover:text-primary">
            Areas Served
          </Link>
          <Link href="/blog" className="text-sm font-medium hover:text-primary">
            Blog
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button asChild size="sm" data-testid="button-call-header">
            <a href={phoneConfig.tel}>
              <Phone className="w-4 h-4 mr-2" />
              {phoneConfig.display}
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
