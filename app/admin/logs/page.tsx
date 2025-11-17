/**
 * Admin Logs Page
 * 
 * Real-time log viewer for debugging and monitoring
 */

import { LogsClient } from './LogsClient';

export const metadata = {
  title: 'System Logs | Admin',
  description: 'View and search system logs for debugging',
};

export default function LogsPage() {
  return <LogsClient />;
}
