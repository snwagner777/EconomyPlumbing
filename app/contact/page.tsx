/**
 * Contact Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Economy Plumbing | Austin TX Plumber',
  description: 'Contact Economy Plumbing Services for plumbing service in Austin. Call (512) 368-9159 or request a free quote online. Fast, reliable service.',
  openGraph: {
    title: 'Contact Economy Plumbing Services',
    description: 'Get in touch for plumbing service in Austin. Call or request a quote online.',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Get in touch for fast, reliable plumbing service
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Get In Touch</h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <a href="tel:512-368-9159" className="text-lg text-primary hover:underline">
                    (512) 368-9159
                  </a>
                  <p className="text-sm text-muted-foreground">Available 24/7 for emergencies</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Service Areas</h3>
                  <p className="text-muted-foreground">
                    Austin, Cedar Park, Round Rock, Georgetown, Pflugerville, 
                    Leander, Liberty Hill, Marble Falls, and surrounding areas
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <p className="text-muted-foreground">
                    Monday-Friday: 8:00 AM - 6:00 PM<br />
                    Saturday: 9:00 AM - 4:00 PM<br />
                    Sunday: Emergency Service Only<br />
                    <span className="text-primary">24/7 Emergency Service</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card p-8 rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">Request a Quote</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Service Needed</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Water Heater</option>
                    <option>Drain Cleaning</option>
                    <option>Leak Repair</option>
                    <option>Emergency Service</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={4}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
