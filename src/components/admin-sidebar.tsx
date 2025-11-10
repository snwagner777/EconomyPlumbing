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
  MessageSquare,
  Send,
  UserPlus,
  DollarSign,
  MessageCircle,
  FileEdit,
  Package,
  BarChart3,
  Sparkles,
  TrendingUp,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  description: string;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin',
        description: 'Overview & stats',
      },
    ],
  },
  {
    label: 'AI Marketing',
    items: [
      {
        title: 'AI Campaigns',
        icon: Sparkles,
        href: '/admin/ai-campaigns',
        description: 'GPT-4o generator',
      },
    ],
  },
  {
    label: 'Communications',
    items: [
      {
        title: 'SMS',
        icon: MessageSquare,
        href: '/admin/sms',
        description: '2-way messaging',
      },
      {
        title: 'Email Marketing',
        icon: Mail,
        href: '/admin/email-marketing',
        description: 'Campaigns & templates',
      },
      {
        title: 'Referrals',
        icon: UserPlus,
        href: '/admin/referrals',
        description: 'Nurture campaigns',
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        title: 'Photos',
        icon: ImageIcon,
        href: '/admin/photos',
        description: 'Photo management',
      },
      {
        title: 'Blog',
        icon: FileText,
        href: '/admin/blog',
        description: 'Blog CMS',
      },
      {
        title: 'Success Stories',
        icon: Trophy,
        href: '/admin/success-stories',
        description: 'Testimonials',
      },
      {
        title: 'Reputation',
        icon: Star,
        href: '/admin/reputation',
        description: 'Review automation',
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      {
        title: 'Customers',
        icon: Users,
        href: '/admin/customers',
        description: 'Customer data',
      },
      {
        title: 'Contacts',
        icon: Mail,
        href: '/admin/contacts',
        description: 'Form submissions',
      },
      {
        title: 'Commercial',
        icon: Building2,
        href: '/admin/commercial',
        description: 'Business clients',
      },
      {
        title: 'Customer Data',
        icon: Database,
        href: '/admin/customer-data',
        description: 'Import history',
      },
      {
        title: 'Portal Analytics',
        icon: TrendingUp,
        href: '/admin/portal-analytics',
        description: 'Usage tracking',
      },
    ],
  },
  {
    label: 'Site Configuration',
    items: [
      {
        title: 'Tracking Numbers',
        icon: Phone,
        href: '/admin/tracking-numbers',
        description: 'Campaign phones',
      },
      {
        title: 'Page Metadata',
        icon: FileEdit,
        href: '/admin/page-metadata',
        description: 'SEO settings',
      },
      {
        title: 'Products',
        icon: Package,
        href: '/admin/products',
        description: 'SKUs & pricing',
      },
      {
        title: 'ServiceTitan',
        icon: BarChart3,
        href: '/admin/servicetitan',
        description: 'Sync monitoring',
      },
      {
        title: 'Webhook Logs',
        icon: Webhook,
        href: '/admin/webhook-logs',
        description: 'Import monitoring',
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
        description: 'Site config',
      },
    ],
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
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link 
                          href={item.href}
                          data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
