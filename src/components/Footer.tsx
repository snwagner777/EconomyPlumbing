"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Economy Plumbing</h3>
            <p className="text-sm text-muted-foreground">
              Professional plumbing services in Austin, Marble Falls, and surrounding areas.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/water-heater-services" className="hover:text-primary">Water Heaters</Link></li>
              <li><Link href="/drain-cleaning" className="hover:text-primary">Drain Cleaning</Link></li>
              <li><Link href="/leak-repair" className="hover:text-primary">Leak Repair</Link></li>
              <li><Link href="/toilet-faucet" className="hover:text-primary">Toilets & Faucets</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/service-areas" className="hover:text-primary">Service Areas</Link></li>
              <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Economy Plumbing Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
