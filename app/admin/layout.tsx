/**
 * Admin Layout with Sidebar Navigation
 * 
 * Wraps all admin pages with unified sidebar navigation
 * Uses Clerk for authentication - middleware handles redirect if not authenticated
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserButton } from '@clerk/nextjs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get auth state from Clerk
  const { userId } = await auth();
  
  // This shouldn't happen due to middleware protection, but safety check
  if (!userId) {
    redirect('/sign-in');
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
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-8 h-8',
                }
              }}
              afterSignOutUrl="/"
            />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
