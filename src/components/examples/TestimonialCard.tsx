import TestimonialCard from '../TestimonialCard';
import testimonialImage from "@assets/optimized/Customer_testimonial_portrait_f033b456.webp";

export default function TestimonialCardExample() {
  return (
    <div className="p-8 max-w-md">
      <TestimonialCard
        name="Sean McCorkle"
        location="Austin, TX"
        service="Water Heater Repair"
        rating={5}
        testimonial="Sean was honest, communicated well and helped me understand the problem and solutions. Thanks Sean."
        image={testimonialImage}
      />
    </div>
  );
}
