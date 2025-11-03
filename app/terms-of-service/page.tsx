/**
 * Terms of Service Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Website & Service Agreement | Economy Plumbing Services',
  description: 'Economy Plumbing Services terms of service. Read our terms and conditions for using our website and services.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Service - Economy Plumbing Services',
    description: 'Read our terms and conditions for using our website and services.',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6" data-testid="heading-main-tos">Terms of Service</h1>
          <p className="text-muted-foreground mb-8" data-testid="text-last-updated">
            Last Updated: October 28, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-agreement">Agreement to Terms</h2>
              <p data-testid="text-agreement-desc">
                By accessing and using the Economy Plumbing Services website and services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-services">Services Description</h2>
              <p className="mb-4" data-testid="text-services-desc">
                Economy Plumbing Services provides residential and commercial plumbing services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1" data-testid="list-services">
                <li>Emergency plumbing repairs</li>
                <li>Water heater installation and repair</li>
                <li>Drain cleaning and hydro jetting</li>
                <li>Leak detection and repair</li>
                <li>Gas line services</li>
                <li>Sewer line repair and replacement</li>
                <li>Repiping and fixture installation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-scheduling">Service Appointments & Scheduling</h2>
              <h3 className="text-xl font-semibold mb-2" data-testid="heading-scheduling-sub">Scheduling</h3>
              <p className="mb-4" data-testid="text-scheduling-desc">
                Service appointments can be scheduled through our website, by phone, or through our customer portal. We will make reasonable efforts to accommodate your preferred appointment time, but cannot guarantee specific time slots.
              </p>
              
              <h3 className="text-xl font-semibold mb-2" data-testid="heading-cancellation">Cancellation Policy</h3>
              <p className="mb-4" data-testid="text-cancellation-desc">
                If you need to cancel or reschedule an appointment, please notify us at least 24 hours in advance. Late cancellations or no-shows may be subject to a cancellation fee.
              </p>

              <h3 className="text-xl font-semibold mb-2" data-testid="heading-access">Access to Property</h3>
              <p data-testid="text-access-desc">
                You agree to provide safe and reasonable access to the areas requiring service. If our technicians cannot access the work area, additional trip charges may apply.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-pricing">Pricing & Payment</h2>
              <h3 className="text-xl font-semibold mb-2" data-testid="heading-estimates">Estimates</h3>
              <p className="mb-4" data-testid="text-estimates-desc">
                Estimates provided are approximations based on the information available. Final costs may vary depending on the actual work required and materials used. We will inform you of any significant changes before proceeding with the work.
              </p>

              <h3 className="text-xl font-semibold mb-2" data-testid="heading-payment-terms">Payment Terms</h3>
              <ul className="list-disc pl-6 space-y-1 mb-4" data-testid="list-payment-terms">
                <li>Payment is due upon completion of services unless other arrangements are made</li>
                <li>We accept cash, checks, and major credit cards</li>
                <li>Past-due accounts may be subject to late fees and interest charges</li>
                <li>Returned checks will incur a fee as permitted by law</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2" data-testid="heading-emergency">Emergency Services</h3>
              <p data-testid="text-emergency-desc">
                Emergency service calls may be subject to additional charges for after-hours, weekend, or holiday service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-warranties">Warranties & Guarantees</h2>
              <h3 className="text-xl font-semibold mb-2" data-testid="heading-workmanship">Workmanship Warranty</h3>
              <p className="mb-4" data-testid="text-workmanship-desc">
                We stand behind our work. Labor performed by Economy Plumbing Services is warranted against defects in workmanship for a period specified in your service agreement or invoice.
              </p>

              <h3 className="text-xl font-semibold mb-2" data-testid="heading-parts-warranty">Parts Warranty</h3>
              <p className="mb-4" data-testid="text-parts-desc">
                Parts and materials are covered by the manufacturer's warranty. We will assist in facilitating warranty claims when applicable.
              </p>

              <h3 className="text-xl font-semibold mb-2" data-testid="heading-warranty-exclusions">Warranty Exclusions</h3>
              <p className="mb-2" data-testid="text-exclusions-intro">Warranties do not cover:</p>
              <ul className="list-disc pl-6 space-y-1" data-testid="list-warranty-exclusions">
                <li>Damage caused by misuse, abuse, or neglect</li>
                <li>Normal wear and tear</li>
                <li>Issues caused by improper maintenance</li>
                <li>Work performed by other contractors</li>
                <li>Acts of nature or events beyond our control</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-membership">VIP Membership Program</h2>
              <p className="mb-4" data-testid="text-membership-desc">
                Our VIP Membership program offers various benefits including priority scheduling, discounts, and annual maintenance services. Membership terms, fees, and benefits are subject to change with notice to members.
              </p>
              <p data-testid="text-membership-refund">
                Membership fees are non-refundable except as required by law. Members may cancel at any time but will not receive a refund for the unused portion of their membership period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-liability">Limitation of Liability</h2>
              <p className="mb-4" data-testid="text-liability-desc">
                Economy Plumbing Services shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to our services. Our total liability shall not exceed the amount paid for the specific service giving rise to the claim.
              </p>
              <p data-testid="text-liability-insurance">
                We carry appropriate insurance and licensing as required by law. In the event of damage caused by our negligence, we will work with you and our insurance provider to resolve the issue fairly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-referral">Referral Program</h2>
              <p className="mb-4" data-testid="text-referral-desc">
                Our referral program allows customers to earn credits by referring new customers. Referral credits are subject to program terms and conditions:
              </p>
              <ul className="list-disc pl-6 space-y-1" data-testid="list-referral-terms">
                <li>Credits are issued after the referred customer's job is completed</li>
                <li>Credits expire one year from the date of issuance</li>
                <li>Credits are non-transferable and have no cash value</li>
                <li>We reserve the right to modify or discontinue the referral program at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-ip">Intellectual Property</h2>
              <p data-testid="text-ip-desc">
                All content on our website, including text, graphics, logos, images, and software, is the property of Economy Plumbing Services or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-privacy">Privacy</h2>
              <p data-testid="text-privacy-desc">
                Your use of our Services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-disputes">Dispute Resolution</h2>
              <p className="mb-4" data-testid="text-disputes-approach">
                We value our customers and will make every effort to resolve any disputes amicably. If you have a concern, please contact us first to discuss a resolution.
              </p>
              <p data-testid="text-disputes-arbitration">
                Any disputes that cannot be resolved through negotiation shall be subject to binding arbitration in accordance with the rules of the American Arbitration Association, with proceedings held in Travis County, Texas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-changes">Changes to Terms</h2>
              <p data-testid="text-changes-desc">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our Services after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-law">Governing Law</h2>
              <p data-testid="text-law-desc">
                These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-contact">
                Contact Information
              </h2>
              <p data-testid="text-contact-intro">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <p className="mt-2" data-testid="text-contact-details">
                <strong>Economy Plumbing Services</strong><br />
                Phone: <a href="tel:512-368-9159" data-testid="link-phone-tos" className="hover:underline">(512) 368-9159</a><br />
                Email: <a href="mailto:info@plumbersthatcare.com" data-testid="link-email-tos" className="hover:underline">info@plumbersthatcare.com</a><br />
                Website: <a href="https://www.plumbersthatcare.com" data-testid="link-website-tos" className="hover:underline">www.plumbersthatcare.com</a>
              </p>
            </section>

            <section className="bg-muted/30 p-6 rounded-lg" data-testid="section-acknowledgement">
              <p className="text-sm text-muted-foreground" data-testid="text-acknowledgement">
                By using Economy Plumbing Services' website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
