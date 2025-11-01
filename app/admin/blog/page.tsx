/**
 * Blog Admin Page
 * 
 * Manage blog posts, AI generation, and SEO optimization
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { BlogDashboard } from './blog-dashboard';

export const metadata: Metadata = {
  title: 'Blog Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function BlogAdminPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <BlogDashboard />;
}
