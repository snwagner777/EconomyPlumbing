import { Link } from "wouter";
import logoImage from "@assets/Economy Plumbing Services logo_1759801055079.jpg";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <img 
              src={logoImage} 
              alt="Economy Plumbing Services" 
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-sm mb-4">
              Central Texas' Best Little Plumbing Company Since 2012
            </p>
            <p className="text-sm">
              Texas Master Plumber License #M-41147
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/water-heater-services" className="hover:text-primary" data-testid="footer-link-water-heater">Water Heater Services</Link></li>
              <li><Link href="/drain-cleaning" className="hover:text-primary" data-testid="footer-link-drain">Drain Cleaning</Link></li>
              <li><Link href="/leak-repair" className="hover:text-primary" data-testid="footer-link-leak">Leak Repair</Link></li>
              <li><Link href="/toilet-faucet" className="hover:text-primary" data-testid="footer-link-toilet">Toilet & Faucet</Link></li>
              <li><Link href="/gas-services" className="hover:text-primary" data-testid="footer-link-gas">Gas Services</Link></li>
              <li><Link href="/backflow" className="hover:text-primary" data-testid="footer-link-backflow">Backflow Services</Link></li>
              <li><Link href="/commercial-plumbing" className="hover:text-primary" data-testid="footer-link-commercial">Commercial Plumbing</Link></li>
              <li><Link href="/emergency" className="hover:text-primary" data-testid="footer-link-emergency">Emergency Services</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Service Areas</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/plumber-austin" className="hover:text-primary" data-testid="footer-link-austin">Austin</Link></li>
              <li><Link href="/plumber-in-cedar-park–tx" className="hover:text-primary" data-testid="footer-link-cedar-park">Cedar Park</Link></li>
              <li><Link href="/plumber-marble-falls" className="hover:text-primary" data-testid="footer-link-marble-falls">Marble Falls</Link></li>
              <li><Link href="/round-rock-plumber" className="hover:text-primary" data-testid="footer-link-round-rock">Round Rock</Link></li>
              <li><Link href="/service-area" className="hover:text-primary" data-testid="footer-link-view-all-areas">View All Areas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary" data-testid="footer-link-about">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-primary" data-testid="footer-link-blog">Blog</Link></li>
              <li><Link href="/store" className="hover:text-primary" data-testid="footer-link-store">Store</Link></li>
              <li><Link href="/contact" className="hover:text-primary" data-testid="footer-link-contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} Economy Plumbing Services. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
