/**
 * Admin Layout with Sidebar Navigation
 * 
 * Wraps all admin pages with unified sidebar navigation
 * Uses session-based authentication - middleware handles redirect if not authenticated
 */

import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LogoutButton } from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Economy Plumbing Services',
  description: 'Admin panel for Economy Plumbing Services',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <LogoutButton />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
