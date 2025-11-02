import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createBreadcrumbListSchema } from './SEO/JsonLd';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation with JSON-LD schema markup for SEO
 * 
 * Example:
 * <Breadcrumb items={[
 *   { name: 'Home', url: '/' },
 *   { name: 'Services', url: '/services' },
 *   { name: 'Water Heater Repair' }
 * ]} />
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  // Create schema for SEO
  const schema = createBreadcrumbListSchema(
    items.map(item => ({
      name: item.name,
      url: item.url ? `https://plumbersthatcare.com${item.url}` : undefined
    }))
  );

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      {/* Visual Breadcrumb */}
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center flex-wrap gap-2 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
                
                {isLast || !item.url ? (
                  <span 
                    className="text-foreground font-medium"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    href={item.url}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
