import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlumbingCostEstimatorClient from '@/components/PlumbingCostEstimatorClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumbing-cost-estimator', {
    title: 'Plumbing Cost Estimator | Free Price Calculator Austin TX',
    description: 'Get instant plumbing cost estimates for Austin & Marble Falls. Free price calculator for water heaters, drains, leaks, and repairs. Request exact quote today.',
    ogType: 'website',
  });
}

export default async function PlumbingCostEstimator({ searchParams }: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  
  const phoneNumbers = await getPhoneNumbers(urlParams);

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Tools", url: "https://www.plumbersthatcare.com/tools" },
    { name: "Cost Estimator", url: "https://www.plumbersthatcare.com/plumbing-cost-estimator" }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Header phoneConfig={phoneNumbers.austin} />
      <PlumbingCostEstimatorClient phoneConfig={phoneNumbers.austin} />
      <Footer />
    </>
  );
}
