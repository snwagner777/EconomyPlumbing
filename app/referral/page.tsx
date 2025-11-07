/**
 * Referral Program Page
 */

import type { Metadata } from 'next';
import { ReferralForm } from './referral-form';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';

export const metadata: Metadata = {
  title: 'Refer a Friend | Economy Plumbing Referral Program',
  description: 'Refer friends and family to Economy Plumbing Services and earn rewards. Both you and your referral save! Easy online referral submission.',
  openGraph: {
    title: 'Referral Program - Economy Plumbing',
    description: 'Refer friends and earn rewards. Both you and your referral save!',
  },
};

interface ReferralPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReferralPage({ searchParams }: ReferralPageProps) {
  await searchParams;
  const phoneNumbers = await getPhoneNumbers();

  return (
    <>
      <Header />
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center" data-testid="heading-referral">
            Refer a Friend
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Share the love and earn rewards when you refer friends and family
          </p>

          <section className="bg-primary text-primary-foreground p-12 rounded-lg mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              {[
                { step: '1', title: 'Refer', desc: 'Submit your referral using the form below' },
                { step: '2', title: 'They Save', desc: 'Your friend gets a special discount' },
                { step: '3', title: 'You Earn', desc: 'Get a credit when they book service' },
              ].map((item) => (
                <div key={item.step} data-testid={`step-${item.step}`}>
                  <div className="bg-background text-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-primary-foreground/90">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">Submit a Referral</h2>
            <ReferralForm />
          </section>

          <section className="bg-muted/30 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Program Details</h2>
            <ul className="space-y-2">
              <li data-testid="detail-new-customer">• Your referral must be a new customer</li>
              <li data-testid="detail-credit-timing">• Referral credit applied after their first completed service</li>
              <li data-testid="detail-no-limit">• No limit on how many referrals you can submit</li>
              <li data-testid="detail-credit-usage">• Credits can be used toward future services</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
