'use client';

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  link: string;
  image?: string;
}

const ServiceCard = memo(({ icon: Icon, title, description, features, link, image }: ServiceCardProps) => {
  return (
    <Card className="p-6 hover:shadow-xl transition-shadow border border-card-border">
      {image && (
        <div className="mb-4 rounded-md overflow-hidden relative h-48">
          <Image 
            src={image} 
            alt={`Economy Plumbing ${title} - professional plumbing service in Austin & Central Texas`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2 mb-4">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link 
        href={link} 
        className="inline-flex items-center gap-2 text-foreground font-medium hover-elevate px-2 py-1 rounded-md"
        data-testid={`link-learn-more-${link.slice(1)}`}
      >
        Learn more about {title}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </Card>
  );
});

ServiceCard.displayName = "ServiceCard";

export default ServiceCard;
