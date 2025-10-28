/**
 * Refund & Returns Policy Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy | Economy Plumbing Services',
  description: 'Refund and returns policy for Economy Plumbing Services. Learn about our satisfaction guarantee and refund procedures.',
  robots: 'noindex',
};

export default function RefundReturnsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Refund & Returns Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: October 28, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Satisfaction Guarantee</h2>
              <p>
                At Economy Plumbing Services, your satisfaction is our top priority. We stand behind our work with a 100% satisfaction guarantee. If you're not completely satisfied with our service, we'll make it right.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Plumbing Services</h2>
              <p className="mb-4">
                All plumbing services come with our workmanship warranty. If you experience any issues with our work, contact us immediately and we'll return to resolve the problem at no additional charge.
              </p>
              <p>
                Service calls and labor are non-refundable once work has been completed to your satisfaction and approval.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Parts & Materials</h2>
              <p className="mb-4">
                Parts and materials installed during service are covered by manufacturer warranties. We'll assist you with any warranty claims for defective parts.
              </p>
              <p>
                Installation labor for warranty part replacements may be charged separately unless covered under our service warranty.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">VIP Membership</h2>
              <p className="mb-4">
                VIP memberships are billed annually and are non-refundable. You may cancel your membership at any time with 30 days notice, and your membership will remain active until the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Store Products</h2>
              <p className="mb-4">
                Products purchased through our online store may be returned within 30 days of purchase in new, unused condition for a full refund.
              </p>
              <p>
                Return shipping costs are the responsibility of the customer unless the product is defective or we shipped the wrong item.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
              <p>
                To request a refund or report an issue with our service, please contact us:
              </p>
              <p className="mt-2">
                Phone: (512) 368-9159<br />
                Email: info@plumbersthatcare.com
              </p>
              <p className="mt-4">
                We'll work with you to resolve any concerns quickly and fairly.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
