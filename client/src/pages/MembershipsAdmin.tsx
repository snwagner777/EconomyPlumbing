import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  Filter,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  Download,
  RefreshCw
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Membership {
  id: number;
  customerId: number;
  customerName: string;
  membershipId: number;
  membershipName: string;
  status: string;
  startDate: string;
  expirationDate: string | null;
  renewalDate: string | null;
  balance: number;
  totalValue: number;
  description: string;
  createdOn: string;
  modifiedOn: string;
}

export default function MembershipsAdmin() {
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    status: "",
    membershipType: "",
    year: "",
    search: ""
  });
  
  const [selectedMemberships, setSelectedMemberships] = useState<Set<number>>(new Set());
  const [showBulkExpireDialog, setShowBulkExpireDialog] = useState(false);

  const { data: memberships, isLoading, isError, refetch } = useQuery<Membership[]>({
    queryKey: ['/api/admin/memberships', filters.status, filters.membershipType, filters.year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.membershipType) params.set('membershipType', filters.membershipType);
      if (filters.year) params.set('year', filters.year);
      
      const url = `/api/admin/memberships${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch memberships');
      }
      
      return response.json();
    },
  });

  const bulkExpireMutation = useMutation({
    mutationFn: async (membershipIds: number[]) => {
      const updates = membershipIds.map(id => ({
        membershipId: id,
        status: "Expired",
        expirationDate: new Date().toISOString()
      }));

      return apiRequest('/api/admin/memberships/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ updates }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Memberships Updated",
        description: `Successfully expired ${data.success} memberships. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
        variant: data.failed > 0 ? "destructive" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/memberships'] });
      setSelectedMemberships(new Set());
      setShowBulkExpireDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update memberships",
        variant: "destructive"
      });
    }
  });

  const filteredMemberships = useMemo(() => {
    if (!memberships) return [];
    
    return memberships.filter(m => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          m.customerName.toLowerCase().includes(searchLower) ||
          m.membershipName.toLowerCase().includes(searchLower) ||
          m.id.toString().includes(searchLower)
        );
      }
      return true;
    });
  }, [memberships, filters.search]);

  const uniqueMembershipTypes = useMemo(() => {
    if (!memberships) return [];
    const types = new Set(memberships.map(m => m.membershipName));
    return Array.from(types).sort();
  }, [memberships]);

  const uniqueYears = useMemo(() => {
    if (!memberships) return [];
    const years = new Set(
      memberships
        .filter(m => m.createdOn)
        .map(m => new Date(m.createdOn).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [memberships]);

  const stats = useMemo(() => {
    if (!filteredMemberships) return { total: 0, active: 0, expired: 0, suspended: 0 };
    
    return {
      total: filteredMemberships.length,
      active: filteredMemberships.filter(m => m.status.toLowerCase() === 'won' || m.status.toLowerCase() === 'active').length,
      expired: filteredMemberships.filter(m => m.status.toLowerCase() === 'expired').length,
      suspended: filteredMemberships.filter(m => m.status.toLowerCase() === 'suspended' || m.status.toLowerCase() === 'canceled').length
    };
  }, [filteredMemberships]);

  const toggleSelectAll = () => {
    if (selectedMemberships.size === filteredMemberships.length) {
      setSelectedMemberships(new Set());
    } else {
      setSelectedMemberships(new Set(filteredMemberships.map(m => m.id)));
    }
  };

  const toggleSelectMembership = (id: number) => {
    const newSelected = new Set(selectedMemberships);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMemberships(newSelected);
  };

  const handleBulkExpire = () => {
    if (selectedMemberships.size === 0) {
      toast({
        title: "No memberships selected",
        description: "Please select memberships to expire",
        variant: "destructive"
      });
      return;
    }
    setShowBulkExpireDialog(true);
  };

  const confirmBulkExpire = () => {
    bulkExpireMutation.mutate(Array.from(selectedMemberships));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'won' || statusLower === 'active') {
      return <Badge variant="default" className="bg-green-600" data-testid={`badge-status-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
    if (statusLower === 'expired') {
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    if (statusLower === 'suspended' || statusLower === 'canceled') {
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
    }
    return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Memberships</CardTitle>
            <CardDescription>Failed to fetch membership data from ServiceTitan</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Membership Management - Economy Plumbing Services Admin"
        description="Manage customer memberships, filter by type and year, and bulk expire memberships"
      />
      
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-primary" />
              Membership Management
            </h1>
            <p className="text-muted-foreground">
              View, filter, and manage customer memberships from ServiceTitan
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Memberships</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-active">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-expired">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-suspended">{stats.suspended}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Customer or membership..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-8"
                      data-testid="input-search"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="won">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="membershipType">Membership Type</Label>
                  <Select value={filters.membershipType} onValueChange={(v) => setFilters({ ...filters, membershipType: v })}>
                    <SelectTrigger id="membershipType" data-testid="select-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {uniqueMembershipTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">Year Purchased</Label>
                  <Select value={filters.year} onValueChange={(v) => setFilters({ ...filters, year: v })}>
                    <SelectTrigger id="year" data-testid="select-year">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {uniqueYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Memberships ({filteredMemberships.length})</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkExpire}
                    disabled={selectedMemberships.size === 0 || bulkExpireMutation.isPending}
                    data-testid="button-bulk-expire"
                  >
                    {bulkExpireMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Expire Selected ({selectedMemberships.size})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 px-2">
                          <Checkbox
                            checked={selectedMemberships.size === filteredMemberships.length && filteredMemberships.length > 0}
                            onCheckedChange={toggleSelectAll}
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th className="pb-3 px-2">ID</th>
                        <th className="pb-3 px-2">Customer</th>
                        <th className="pb-3 px-2">Membership Type</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Start Date</th>
                        <th className="pb-3 px-2">Expiration</th>
                        <th className="pb-3 px-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMemberships.map((membership) => (
                        <tr key={membership.id} className="border-b hover-elevate" data-testid={`row-membership-${membership.id}`}>
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedMemberships.has(membership.id)}
                              onCheckedChange={() => toggleSelectMembership(membership.id)}
                              data-testid={`checkbox-membership-${membership.id}`}
                            />
                          </td>
                          <td className="py-3 px-2 font-mono text-sm" data-testid={`text-id-${membership.id}`}>{membership.id}</td>
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium" data-testid={`text-customer-${membership.id}`}>{membership.customerName}</div>
                              <div className="text-xs text-muted-foreground">Customer ID: {membership.customerId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2" data-testid={`text-type-${membership.id}`}>{membership.membershipName}</td>
                          <td className="py-3 px-2">{getStatusBadge(membership.status)}</td>
                          <td className="py-3 px-2 text-sm" data-testid={`text-start-${membership.id}`}>
                            {membership.startDate ? format(new Date(membership.startDate), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="py-3 px-2 text-sm" data-testid={`text-expiration-${membership.id}`}>
                            {membership.expirationDate ? format(new Date(membership.expirationDate), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="py-3 px-2 font-medium" data-testid={`text-value-${membership.id}`}>
                            ${membership.totalValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredMemberships.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No memberships found matching your filters
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showBulkExpireDialog} onOpenChange={setShowBulkExpireDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expire {selectedMemberships.size} Memberships?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the status to "Expired" and set the expiration date to today for the selected memberships in ServiceTitan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-expire">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkExpire} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-expire">
              Expire Memberships
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
