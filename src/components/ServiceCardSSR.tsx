import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  link: string;
  image: string;
}

/**
 * Server-side rendered service card for SEO
 */
export function ServiceCardSSR({
  icon: Icon,
  title,
  description,
  features,
  link,
  image,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-card-border">
      <Link href={link} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold">{title}</h3>
          </div>
          <p className="text-muted-foreground mb-4">{description}</p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </Card>
  );
}
