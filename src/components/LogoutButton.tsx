'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out',
        });
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleLogout}
      data-testid="button-logout"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  );
}
