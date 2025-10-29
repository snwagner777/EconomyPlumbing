'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { LogOut, Mail, Phone, User, MessageSquare, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'contacted' | 'resolved' | 'spam';
  notes: string | null;
  submittedAt: string;
  updatedAt: string | null;
}

export default function ContactsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ContactSubmission['status']>('new');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: authData } = useQuery({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (authData && !authData.isAdmin) {
      router.push('/admin/login');
    }
  }, [authData, router]);

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['/api/admin/contact-submissions', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      const response = await fetch(`/api/admin/contact-submissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { status?: string; notes?: string } }) => {
      return await apiRequest('PATCH', '/api/admin/contact-submissions', { id, ...updates });
    },
    onSuccess: () => {
      toast({
        title: 'Submission Updated',
        description: 'The contact submission has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-submissions'] });
      setIsDialogOpen(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleView = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.notes || '');
    setStatus(submission.status);
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSubmission) return;
    updateMutation.mutate({
      id: selectedSubmission.id,
      updates: { status, notes },
    });
  };

  const handleLogout = async () => {
    await apiRequest('POST', '/api/admin/logout');
    router.push('/admin/login');
  };

  if (!authData?.isAdmin) {
    return null;
  }

  const submissions = submissionsData?.submissions || [];
  const statusCounts = {
    new: submissions.filter((s: ContactSubmission) => s.status === 'new').length,
    contacted: submissions.filter((s: ContactSubmission) => s.status === 'contacted').length,
    resolved: submissions.filter((s: ContactSubmission) => s.status === 'resolved').length,
    spam: submissions.filter((s: ContactSubmission) => s.status === 'spam').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-contacts-admin">Contact Submissions</h1>
            <p className="text-muted-foreground mt-1">Manage and respond to contact form submissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin')} data-testid="button-back">
              Back to Admin
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Badge variant="destructive">{statusCounts.new}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.new}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Badge variant="secondary">{statusCounts.contacted}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.contacted}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <Badge variant="default">{statusCounts.resolved}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.resolved}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Spam</CardTitle>
              <Badge variant="outline">{statusCounts.spam}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.spam}</div>
              <p className="text-xs text-muted-foreground">Filtered</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="select-filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No submissions found</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission: ContactSubmission) => (
              <Card key={submission.id} className="hover-elevate cursor-pointer" onClick={() => handleView(submission)} data-testid={`submission-${submission.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4" />
                        {submission.name}
                        <Badge variant={
                          submission.status === 'new' ? 'destructive' :
                          submission.status === 'contacted' ? 'secondary' :
                          submission.status === 'resolved' ? 'default' : 'outline'
                        }>
                          {submission.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-2 items-center">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {submission.email}
                        </span>
                        {submission.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {submission.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm line-clamp-2">{submission.message}</p>
                    </div>
                    {submission.notes && (
                      <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                        <strong>Notes:</strong> {submission.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-submission-details">
            <DialogHeader>
              <DialogTitle>Contact Submission Details</DialogTitle>
              <DialogDescription>
                View and update the submission status and notes
              </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.email}</p>
                  </div>
                  {selectedSubmission.phone && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{selectedSubmission.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedSubmission.submittedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Message</p>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedSubmission.message}</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select value={status} onValueChange={(value) => setStatus(value as ContactSubmission['status'])}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-save">
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
