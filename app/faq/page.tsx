/**
 * FAQ Page
 * 
 * Frequently asked questions about plumbing services
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Economy Plumbing Services',
  description: 'Common questions about our plumbing services, pricing, emergency service, and more.',
};

const faqs = [
  {
    category: 'Services',
    questions: [
      {
        q: 'Do you offer 24/7 emergency plumbing service?',
        a: 'Yes, we provide 24/7 emergency plumbing services for urgent issues like burst pipes, major leaks, and sewer backups. Call our emergency line anytime.',
      },
      {
        q: 'What services do you provide?',
        a: 'We offer comprehensive plumbing services including repairs, installations, drain cleaning, water heater service, leak detection, sewer line work, and preventive maintenance.',
      },
      {
        q: 'Are you licensed and insured?',
        a: 'Yes, all our plumbers are fully licensed, insured, and background-checked. We carry comprehensive liability insurance for your protection.',
      },
    ],
  },
  {
    category: 'Pricing & Payment',
    questions: [
      {
        q: 'Do you charge for estimates?',
        a: 'We provide free estimates for most services. For complex projects, we may charge a diagnostic fee that will be credited toward the repair if you choose to proceed.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept cash, checks, all major credit cards, and digital payments. Financing options are available for larger projects.',
      },
      {
        q: 'Do you offer senior or military discounts?',
        a: 'Yes, we offer special discounts for seniors and active/retired military personnel. Ask about current promotions when you call.',
      },
    ],
  },
  {
    category: 'Scheduling',
    questions: [
      {
        q: 'How quickly can you get here?',
        a: 'For emergencies, we typically arrive within 1-2 hours. For scheduled appointments, we offer same-day or next-day service in most cases.',
      },
      {
        q: 'Do I need to be home for the service?',
        a: 'Yes, someone 18 or older should be present during service. If you cannot be home, we can arrange special accommodations.',
      },
      {
        q: 'What are your business hours?',
        a: 'Our office is open Monday-Friday 8am-6pm, Saturday 9am-4pm. Emergency service is available 24/7 including holidays.',
      },
    ],
  },
  {
    category: 'Warranties & Guarantees',
    questions: [
      {
        q: 'Do you warranty your work?',
        a: 'Yes, we provide a 1-year warranty on all labor and use manufacturer warranties for parts. VIP members receive extended 2-year warranties.',
      },
      {
        q: 'What if I\'m not satisfied with the service?',
        a: 'Your satisfaction is guaranteed. If you\'re not completely satisfied with our work, we\'ll make it right at no additional charge.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Find answers to common questions about our plumbing services
          </p>

          {faqs.map((category, i) => (
            <div key={i} className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-primary">
                {category.category}
              </h2>
              <div className="space-y-8">
                {category.questions.map((faq, j) => (
                  <div key={j} className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="font-semibold text-lg mb-3">{faq.q}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions CTA */}
          <div className="mt-16 bg-muted/30 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              We're here to help! Contact us anytime for answers to your plumbing questions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/contact"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Contact Us
              </a>
              <a 
                href="tel:555-555-5555"
                className="bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (555) 555-5555
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
