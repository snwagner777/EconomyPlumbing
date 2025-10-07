import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialCardProps {
  name: string;
  location: string;
  service: string;
  rating: number;
  testimonial: string;
  image?: string;
}

export default function TestimonialCard({ name, location, service, rating, testimonial, image }: TestimonialCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('');
  
  return (
    <Card className="p-6 border border-card-border">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <p className="text-foreground mb-6 italic">"{testimonial}"</p>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={image} alt={`${name} - Economy Plumbing customer testimonial`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{location}</p>
          <p className="text-sm text-primary">{service}</p>
        </div>
      </div>
    </Card>
  );
}
