/**
 * AI Chatbot - Admin Page
 * 
 * Chatbot conversation monitoring
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chatbot | Admin',
  robots: 'noindex',
};

export default function ChatbotPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-chatbot">
          AI Chatbot
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Monitor conversations and chatbot engagement
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - AI chatbot conversation monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
