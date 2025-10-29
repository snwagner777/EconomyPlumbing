/**
 * Blog Admin Page
 * 
 * Manage blog posts, AI generation, and SEO optimization
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { BlogDashboard } from './blog-dashboard';

export const metadata: Metadata = {
  title: 'Blog Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function BlogAdminPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin-login');
  }

  return <BlogDashboard />;
}
