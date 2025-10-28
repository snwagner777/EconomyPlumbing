/**
 * Reputation Management - Admin Page
 * 
 * AI-powered review request automation and template management
 */

import type { Metadata } from 'next';
import ReputationDashboard from './reputation-dashboard';

export const metadata: Metadata = {
  title: 'Reputation Management | Admin',
  robots: 'noindex',
};

export default function ReputationPage() {
  return <ReputationDashboard />;
}
