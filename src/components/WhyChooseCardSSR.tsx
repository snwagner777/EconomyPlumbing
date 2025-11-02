import type { LucideIcon } from "lucide-react";

interface WhyChooseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Server-side rendered "Why Choose Us" card for SEO
 */
export function WhyChooseCardSSR({
  icon: Icon,
  title,
  description,
}: WhyChooseCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
