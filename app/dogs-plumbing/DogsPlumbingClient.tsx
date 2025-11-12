'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';
import dogSink from '@assets/generated_images/Golden_retriever_plumber_fixing_sink_10973b29.png';
import dogWrench from '@assets/generated_images/German_Shepherd_with_wrench_f3e434e5.png';
import dogUnder from '@assets/generated_images/Labrador_under_sink_working_7425342c.png';
import dogPlunger from '@assets/generated_images/Husky_with_plunger_in_bathroom_d2f3985b.png';

interface DogsPlumbingClientProps {
  phoneConfig: PhoneConfig;
}

export default function DogsPlumbingClient({ phoneConfig }: DogsPlumbingClientProps) {
  const dogs = [
    {
      name: 'Max the Golden Retriever',
      title: 'Master Sink Specialist',
      image: dogSink,
      specialty: 'Fixing kitchen sinks with a smile',
    },
    {
      name: 'Rex the German Shepherd',
      title: 'Pipe Installation Expert',
      image: dogWrench,
      specialty: 'Handles the toughest pipe jobs',
    },
    {
      name: 'Buddy the Labrador',
      title: 'Under-Sink Technician',
      image: dogUnder,
      specialty: 'Gets into those tight spaces',
    },
    {
      name: 'Luna the Husky',
      title: 'Emergency Response Specialist',
      image: dogPlunger,
      specialty: 'Always ready to help',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header phoneConfig={phoneConfig} />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Meet Our Canine Plumbing Crew!
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Just for fun - if dogs could do plumbing, these would be our star employees! 
              For real plumbing needs, our expert human team is ready to help 24/7.
            </p>
            <p className="text-lg text-muted-foreground">
              Call us at <a href={`tel:${phoneConfig.phoneNumber}`} className="text-primary font-semibold hover:underline">{phoneConfig.displayNumber}</a> for professional service
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {dogs.map((dog, index) => (
                <Card key={index} className="overflow-hidden hover-elevate" data-testid={`card-dog-${index}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={dog.image}
                      alt={`${dog.name} - ${dog.title}`}
                      className="w-full h-full object-cover"
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{dog.name}</h3>
                    <p className="text-primary font-semibold mb-2">{dog.title}</p>
                    <p className="text-muted-foreground">{dog.specialty}</p>
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
              While our furry friends are adorable, our professional human plumbers are who you really want on the job! 
              We provide expert plumbing services throughout the Austin area with the same dedication and care these pups would give.
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
