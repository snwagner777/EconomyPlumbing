"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import testimonial1 from "@assets/optimized/Customer_testimonial_portrait_f033b456.webp";
import testimonial2 from "@assets/optimized/Female_customer_testimonial_f29d918d.webp";
import testimonial3 from "@assets/optimized/Senior_customer_testimonial_027f5302.webp";

export default function ReviewsSection() {
  const reviews = [
    {
      name: "Sean McCorkle",
      location: "Austin, TX",
      rating: 5,
      testimonial: "Sean was honest, communicated well and helped me understand the problem and solutions. Thanks Sean.",
      image: testimonial1,
    },
    {
      name: "Jen Wall",
      location: "Austin, TX",
      rating: 5,
      testimonial: "Sean from Economy Plumbing was quick, efficient, and very helpful. He serviced my tankless water heater and did a routine checkup, found a small issue and was able to repair it same day.",
      image: testimonial2,
    },
    {
      name: "Glenn Prescott",
      location: "Austin, TX",
      rating: 5,
      testimonial: "Stayed very late in order to Finish Job which helped my wife out big time! She needed to leave next morning. Just a fantastic job!!",
      image: testimonial3,
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground">
            Real reviews from real customers in Central Texas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="p-6 border border-card-border bg-card rounded-md">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={review.image}
                  alt={review.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">{review.name}</h4>
                  <p className="text-sm text-muted-foreground">{review.location}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground italic">"{review.testimonial}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
