'use client';

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface LinkItem {
  title?: string;
  name?: string;
  path: string;
  description?: string;
}

interface RelatedLinksSectionProps {
  heading: string;
  description?: string;
  items: LinkItem[];
  linkPrefix?: string;
  testIdPrefix?: string;
  className?: string;
}

export default function RelatedLinksSection({
  heading,
  description,
  items,
  linkPrefix = "",
  testIdPrefix = "link-related",
  className = "",
}: RelatedLinksSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 bg-muted/30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{heading}</h2>
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const displayTitle = item.title || item.name || "";
            const fullTitle = linkPrefix ? `${linkPrefix} ${displayTitle}` : displayTitle;
            const slug = item.path.split('/').pop() || item.path.slice(1);

            return (
              <Link
                key={item.path}
                href={item.path}
                className="group"
                data-testid={`${testIdPrefix}-${slug}`}
              >
                <Card className="p-6 h-full hover-elevate active-elevate-2 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {fullTitle}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
