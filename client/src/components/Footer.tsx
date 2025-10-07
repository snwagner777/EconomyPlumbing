import { Link } from "wouter";
import { Facebook, Instagram, MapPin } from "lucide-react";
import { SiYelp, SiNextdoor, SiGooglemaps } from "react-icons/si";
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
              className="h-12 w-auto mb-4 opacity-70"
            />
            <p className="text-sm mb-4">
              Central Texas' Best Little Plumbing Company Since 2012
            </p>
            <p className="text-sm mb-4">
              Texas Master Plumber License #M-41147
            </p>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com/econoplumbing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors"
                aria-label="Visit our Facebook page"
                data-testid="link-facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://instagram.com/plumbersthatcare_atx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors"
                aria-label="Visit our Instagram page"
                data-testid="link-instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://yelp.com/biz/economy-plumbing-services-austin-3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors"
                aria-label="Visit our Yelp page"
                data-testid="link-yelp"
              >
                <SiYelp className="w-6 h-6" />
              </a>
              <a 
                href="https://nextdoor.com/page/economy-plumbing-services-austin-tx-1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors"
                aria-label="Visit our Nextdoor page"
                data-testid="link-nextdoor"
              >
                <SiNextdoor className="w-6 h-6" />
              </a>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <a 
                href="https://www.google.com/maps/place/701+Tillery+St+%2312,+Austin,+TX+78702" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 text-sm"
                aria-label="View Austin location on Google Maps"
                data-testid="link-google-maps-austin"
              >
                <SiGooglemaps className="w-5 h-5" />
                <span>Austin Office</span>
              </a>
              <a 
                href="https://www.google.com/maps/place/2409+Commerce+Street,+Marble+Falls,+TX+78654" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 text-sm"
                aria-label="View Marble Falls location on Google Maps"
                data-testid="link-google-maps-marble-falls"
              >
                <SiGooglemaps className="w-5 h-5" />
                <span>Marble Falls Office</span>
              </a>
            </div>
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
              <li><Link href="/services" className="hover:text-primary" data-testid="footer-link-all-services">View All Services</Link></li>
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
              <li><Link href="/contact" className="hover:text-primary" data-testid="footer-link-contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} Economy Plumbing Services. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
