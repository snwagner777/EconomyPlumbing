import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Professional plumbing services in Austin, TX. 24/7 emergency service, water heaters, drain cleaning, leak repair, and more.',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Economy Plumbing Services</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Austin's Trusted Plumbing Experts
        </p>
        <p className="text-lg">
          Next.js 15 Migration In Progress...
        </p>
      </div>
    </main>
  );
}
