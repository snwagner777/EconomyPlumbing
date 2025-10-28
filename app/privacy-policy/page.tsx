/**
 * Privacy Policy Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Economy Plumbing Services',
  description: 'Economy Plumbing Services privacy policy. Learn how we collect, use & protect your personal information.',
  robots: 'noindex',
  openGraph: {
    title: 'Privacy Policy - Economy Plumbing Services',
    description: 'Learn how we collect, use & protect your personal information.',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: October 28, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p>
                Economy Plumbing Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="mb-4">We may collect personal information that you voluntarily provide when you:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Schedule a service appointment</li>
                <li>Contact us for information</li>
                <li>Sign up for our newsletter or VIP membership</li>
                <li>Make a purchase through our online store</li>
              </ul>
              <p className="mt-4">
                This information may include your name, email address, phone number, physical address, and payment information.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-6">Automatically Collected Information</h3>
              <p>
                We may automatically collect certain information about your device and how you interact with our website, including IP address, browser type, pages visited, and time spent on pages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you appointment reminders and service updates</li>
                <li>Respond to your inquiries and requests</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p className="mb-2">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Service providers who assist us in operating our business</li>
                <li>Professional advisors when necessary</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain processing of your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                Phone: (512) 368-9159<br />
                Email: info@plumbersthatcare.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
