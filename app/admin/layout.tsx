/**
 * Admin Layout with Sidebar Navigation
 * 
 * Wraps all admin pages with unified sidebar navigation
 * Implements authentication check and redirects to OAuth login if not authenticated
 */

import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin-login');
  }

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
            <a 
              href="/api/auth/logout" 
              className="text-sm text-muted-foreground hover:text-foreground transition"
              data-testid="link-logout"
            >
              Logout
            </a>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
