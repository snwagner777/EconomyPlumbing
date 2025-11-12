'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';
import catFaucet from '@assets/generated_images/Orange_tabby_cat_fixing_faucet_fb7ef999.png';
import catTools from '@assets/generated_images/Maine_Coon_cat_with_tools_1fca7db7.png';
import catPipes from '@assets/generated_images/Siamese_cat_inspecting_pipes_ace92494.png';
import catToolbox from '@assets/generated_images/British_Shorthair_cat_with_toolbox_ae5feec4.png';

interface CatsPlumbingClientProps {
  phoneConfig: PhoneConfig;
}

export default function CatsPlumbingClient({ phoneConfig }: CatsPlumbingClientProps) {
  const cats = [
    {
      name: 'Whiskers the Tabby',
      title: 'Faucet Repair Specialist',
      image: catFaucet,
      specialty: 'Precision work on all fixtures',
    },
    {
      name: 'Fluffy the Maine Coon',
      title: 'Heavy Equipment Operator',
      image: catTools,
      specialty: 'Tackles the big jobs with ease',
    },
    {
      name: 'Shadow the Siamese',
      title: 'Pipe Inspector Extraordinaire',
      image: catPipes,
      specialty: 'Meticulous attention to detail',
    },
    {
      name: 'Mittens the British Shorthair',
      title: 'Emergency Service Technician',
      image: catToolbox,
      specialty: 'Always prepared and professional',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header phoneConfig={phoneConfig} />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Meet Our Feline Plumbing Experts!
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Just for fun - if cats could do plumbing, these would be our top performers! 
              For real plumbing needs, our expert human team is standing by 24/7.
            </p>
            <p className="text-lg text-muted-foreground">
              Call us at <a href={`tel:${phoneConfig.phoneNumber}`} className="text-primary font-semibold hover:underline">{phoneConfig.displayNumber}</a> for professional service
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {cats.map((cat, index) => (
                <Card key={index} className="overflow-hidden hover-elevate" data-testid={`card-cat-${index}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={cat.image}
                      alt={`${cat.name} - ${cat.title}`}
                      className="w-full h-full object-cover"
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                    <p className="text-primary font-semibold mb-2">{cat.title}</p>
                    <p className="text-muted-foreground">{cat.specialty}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Need Real Plumbing Service?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              While our feline friends are incredibly talented, our professional human plumbers are who you really want on the job! 
              We provide expert plumbing services throughout the Austin area with purr-fect precision and care.
            </p>
            <a
              href={`tel:${phoneConfig.phoneNumber}`}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover-elevate active-elevate-2"
              data-testid="button-call-now"
            >
              Call Now: {phoneConfig.displayNumber}
            </a>
          </div>
        </section>
      </main>

      <Footer phoneConfig={phoneConfig} />
    </div>
  );
}
