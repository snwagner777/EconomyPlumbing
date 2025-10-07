import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulerModal from "@/components/SchedulerModal";
import ContactFormSection from "@/components/ContactFormSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { createFAQSchema } from "@/components/SEO/JsonLd";

const faqCategories = [
  {
    category: "General Plumbing",
    faqs: [
      {
        question: "What areas do you serve?",
        answer: "We serve Austin and the surrounding areas including Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Liberty Hill, Buda, and Kyle. We also serve the Marble Falls area including Burnet, Horseshoe Bay, Kingsland, and surrounding Highland Lakes communities."
      },
      {
        question: "Are you licensed and insured?",
        answer: "Yes, we are fully licensed and insured. Our plumbers hold all required certifications including Master Plumber licenses, gas fitting certifications, and backflow tester certifications."
      },
      {
        question: "Do you offer emergency services?",
        answer: "Yes, we provide 24/7 emergency plumbing service throughout our service area. Call (512) 368-9159 for Austin area or (830) 460-3565 for Marble Falls area for immediate assistance."
      },
      {
        question: "How quickly can you respond to an emergency?",
        answer: "Our goal is to respond to emergency calls within 60-90 minutes. Response times may vary based on location and current demand, but we prioritize emergencies and dispatch the nearest available technician."
      },
      {
        question: "Do you provide free estimates?",
        answer: "Yes, we provide free estimates for most plumbing projects. For service calls and repairs, there's a diagnostic fee that's applied toward the repair if you proceed with our recommended service."
      }
    ]
  },
  {
    category: "Water Heaters",
    faqs: [
      {
        question: "How long do water heaters typically last?",
        answer: "Traditional tank water heaters last 10-15 years on average, while tankless water heaters can last 20+ years. Lifespan depends on water quality, maintenance, and usage patterns."
      },
      {
        question: "Should I choose a tank or tankless water heater?",
        answer: "Tank water heaters cost less upfront and provide large volumes of hot water. Tankless heaters save energy, last longer, and provide endless hot water but have higher upfront costs. We'll help you choose based on your needs, budget, and usage."
      },
      {
        question: "How often should I maintain my water heater?",
        answer: "We recommend annual maintenance for all water heaters. This includes flushing sediment, checking the anode rod, testing pressure relief valves, and inspecting connections. Regular maintenance extends heater life and improves efficiency."
      },
      {
        question: "What size water heater do I need?",
        answer: "For tank heaters: 30-40 gallons for 1-2 people, 50 gallons for 2-3 people, 75+ gallons for 4+ people. For tankless heaters, we calculate based on simultaneous hot water demand. We'll assess your specific needs during the consultation."
      }
    ]
  },
  {
    category: "Drains & Clogs",
    faqs: [
      {
        question: "Why do my drains keep clogging?",
        answer: "Recurring clogs usually indicate buildup in pipes (grease, soap scum, hair), tree root intrusion in sewer lines, or pipe problems like sagging or bellies. Video inspection can identify the root cause for permanent solutions."
      },
      {
        question: "Are chemical drain cleaners safe to use?",
        answer: "We don't recommend chemical drain cleaners. They can damage pipes, especially older ones, and are harmful to the environment. They often provide only temporary relief. Professional drain cleaning is safer and more effective."
      },
      {
        question: "What's the difference between snaking and hydro jetting?",
        answer: "Snaking uses a cable to punch through clogs, providing quick relief. Hydro jetting uses high-pressure water to completely clean pipe walls, removing all buildup. Hydro jetting is more thorough and provides longer-lasting results."
      },
      {
        question: "Can tree roots damage my sewer line?",
        answer: "Yes, tree roots seek water and can penetrate sewer lines through tiny cracks or joints. Once inside, they grow and can completely block the line. We can clear roots with hydro jetting and recommend solutions to prevent recurrence."
      }
    ]
  },
  {
    category: "Leaks & Repairs",
    faqs: [
      {
        question: "How do I know if I have a hidden water leak?",
        answer: "Signs include unexplained water bill increases, water meter running when no water is being used, damp spots on floors/walls/ceilings, musty odors, or the sound of running water when fixtures are off. We offer leak detection services to locate hidden leaks."
      },
      {
        question: "Should I repair or replace a leaking faucet?",
        answer: "For faucets less than 10 years old, repair is usually cost-effective. For older faucets or when repair costs exceed 50% of replacement, we recommend replacement with a new, more efficient model."
      },
      {
        question: "What causes pipes to burst?",
        answer: "Common causes include freezing temperatures, corrosion, excessive water pressure, physical damage, and age. Regular maintenance, proper insulation, and pressure regulation can prevent most burst pipes."
      },
      {
        question: "Does homeowners insurance cover plumbing leaks?",
        answer: "Most policies cover sudden, accidental damage from burst pipes but may not cover gradual leaks or poor maintenance. Check your specific policy. We can provide detailed documentation for insurance claims."
      }
    ]
  },
  {
    category: "Gas Services",
    faqs: [
      {
        question: "How do I know if I have a gas leak?",
        answer: "Signs include the smell of rotten eggs (added to gas for detection), hissing sounds near gas lines, dead vegetation near lines, and physical symptoms like dizziness or nausea. If you suspect a leak, evacuate immediately, call 911, then contact us."
      },
      {
        question: "Can I install a gas line myself?",
        answer: "No. Gas line work must be performed by licensed professionals for safety and code compliance. Improper installation can cause leaks, fires, explosions, and carbon monoxide poisoning. Our certified technicians ensure safe, code-compliant installations."
      },
      {
        question: "Do you work with both natural gas and propane?",
        answer: "Yes, we service both natural gas and propane (LP) systems. Our technicians are trained on both fuel types and understand the specific requirements and safety considerations for each."
      }
    ]
  },
  {
    category: "Pricing & Payment",
    faqs: [
      {
        question: "How much do plumbing services cost?",
        answer: "Costs vary widely based on the service needed. Simple repairs may cost $150-300, while major installations can run several thousand. We provide upfront pricing before starting work so there are no surprises."
      },
      {
        question: "Do you offer financing?",
        answer: "Yes, we offer financing options for larger projects. Contact us for details on current financing programs and to see if you qualify."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept cash, checks, and all major credit cards. Payment is due upon completion of service unless other arrangements have been made in advance."
      },
      {
        question: "Do you offer service agreements or maintenance plans?",
        answer: "Yes, we offer VIP membership plans with priority scheduling, discounted rates, and regular maintenance visits. These plans help prevent problems and save money over time."
      }
    ]
  }
];

export default function FAQ() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  // Flatten all FAQs for schema
  const allFAQs = faqCategories.flatMap(category => category.faqs);
  const faqSchema = createFAQSchema(allFAQs);

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Frequently Asked Questions | Economy Plumbing Services TX"
        description="Plumbing FAQs answered: services, pricing, water heaters, drain cleaning, gas lines. Expert advice for Austin & Marble Falls homeowners. Call us today!"
        canonical="https://economyplumbingservices.com/faq"
        schema={faqSchema}
      />

      <SchedulerModal open={schedulerOpen} onOpenChange={setSchedulerOpen} />
      <Header onScheduleClick={() => setSchedulerOpen(true)} />

      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Find answers to common plumbing questions. Don't see your question? Give us a call!
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqCategories.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.faqs.map((faq, faqIdx) => (
                  <AccordionItem 
                    key={faqIdx} 
                    value={`${idx}-${faqIdx}`}
                    className="border rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our friendly team is here to help. Contact us for personalized assistance with your plumbing needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => setSchedulerOpen(true)}
              size="lg"
              data-testid="button-schedule"
            >
              Schedule Service
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              data-testid="button-call"
            >
              <a href="tel:5123689159" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                (512) 368-9159
              </a>
            </Button>
          </div>
        </div>
      </section>

      <ContactFormSection />

      <Footer />
    </div>
  );
}
