/**
 * Admin Sidebar Navigation
 * 
 * Comprehensive navigation for all admin sections
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Mail,
  Star,
  FileText,
  Phone,
  Building2,
  ImageIcon,
  Trophy,
  Settings,
  Bot,
  Database,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    description: 'Overview & stats',
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/admin/customers',
    description: 'Customer data',
  },
  {
    title: 'Marketing',
    icon: Mail,
    href: '/admin/marketing',
    description: 'Email campaigns',
  },
  {
    title: 'Reputation',
    icon: Star,
    href: '/admin/reputation',
    description: 'Review requests',
  },
  {
    title: 'Blog',
    icon: FileText,
    href: '/admin/blog',
    description: 'Blog CMS',
  },
  {
    title: 'Contacts',
    icon: Mail,
    href: '/admin/contacts',
    description: 'Form submissions',
  },
  {
    title: 'Photos',
    icon: ImageIcon,
    href: '/admin/photos',
    description: 'Photo management',
  },
  {
    title: 'Success Stories',
    icon: Trophy,
    href: '/admin/success-stories',
    description: 'Testimonials',
  },
  {
    title: 'Commercial',
    icon: Building2,
    href: '/admin/commercial',
    description: 'Commercial customers',
  },
  {
    title: 'Tracking',
    icon: Phone,
    href: '/admin/tracking',
    description: 'Phone numbers',
  },
  {
    title: 'ServiceTitan',
    icon: Database,
    href: '/admin/servicetitan',
    description: 'Sync monitoring',
  },
  {
    title: 'AI Chatbot',
    icon: Bot,
    href: '/admin/chatbot',
    description: 'Conversations',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    description: 'Site configuration',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link 
          href="/admin" 
          className="flex items-center gap-2"
          data-testid="link-admin-home"
        >
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Admin Portal</span>
            <span className="text-xs text-muted-foreground">Economy Plumbing</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        href={item.href}
                        data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
          data-testid="button-sidebar-logout"
        >
          <a href="/api/auth/logout">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
