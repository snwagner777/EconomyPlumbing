/**
 * Customers Dashboard Client Component
 * 
 * Manage ServiceTitan customer data via XLSX-based imports (replacing API sync)
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Upload, Search, RefreshCw } from 'lucide-react';

export function CustomersDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['/api/admin/customers'],
  });

  const customers = customersData?.customers || [];
  const filteredCustomers = customers.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link 
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
                data-testid="link-back-admin"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold mb-2">Customer Management</h1>
              <p className="text-muted-foreground">
                ServiceTitan customer data via XLSX imports and sync monitoring
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" data-testid="button-refresh-customers">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button data-testid="button-import-customers">
                <Upload className="w-4 h-4 mr-2" />
                Import XLSX
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6" data-testid="stat-total-customers">
              <div className="text-sm text-muted-foreground mb-1">Total Customers</div>
              <div className="text-3xl font-bold" data-testid="text-total-customers-count">{customers.length}</div>
            </Card>
            <Card className="p-6" data-testid="stat-active-campaigns">
              <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
              <div className="text-3xl font-bold" data-testid="text-active-campaigns-count">
                {customers.filter((c: any) => c.hasActiveReviewRequest || c.hasReferralCampaign).length}
              </div>
            </Card>
            <Card className="p-6" data-testid="stat-referral-credits">
              <div className="text-sm text-muted-foreground mb-1">Referral Credits</div>
              <div className="text-3xl font-bold" data-testid="text-referral-credits-count">
                {customers.filter((c: any) => c.referralCredit > 0).length}
              </div>
            </Card>
            <Card className="p-6" data-testid="stat-last-sync">
              <div className="text-sm text-muted-foreground mb-1">Last Sync</div>
              <div className="text-sm font-medium" data-testid="text-last-sync-date">
                {customersData?.lastSync ? new Date(customersData.lastSync).toLocaleDateString() : 'Never'}
              </div>
            </Card>
          </div>

          {/* XLSX Import Info */}
          <Card className="p-6 mb-8 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-4">
              <Upload className="w-6 h-6 text-blue-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">XLSX-Based Customer Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Customer data managed via ServiceTitan XLSX exports (replacing API-based sync). 
                  Automated Resend webhook imports with data safety measures and search/login security fixes.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Import Methods:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Email XLSX to Resend (automated import)</li>
                      <li>• Manual upload via admin panel</li>
                      <li>• Automatic duplicate detection</li>
                      <li>• Customer upsert (create/update)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Data Safety:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Search query security (SQL injection prevention)</li>
                      <li>• Login rate limiting</li>
                      <li>• Phone/email normalization</li>
                      <li>• Transaction-safe imports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Search and Filter */}
          <Card className="p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
          </Card>

          {/* Customers List */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Customers</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
                </p>
                {!searchQuery && (
                  <Button data-testid="button-import-first-customers">
                    Import Customer Data
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.slice(0, 50).map((customer: any) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                    data-testid={`customer-item-${customer.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{customer.name}</h3>
                        {customer.referralCredit > 0 && (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                            ${customer.referralCredit} credit
                          </span>
                        )}
                        {customer.hasActiveReviewRequest && (
                          <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                            Review campaign
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-x-3">
                        {customer.email && <span>{customer.email}</span>}
                        {customer.phone && <span>{customer.phone}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-view-${customer.id}`}
                    >
                      View
                    </Button>
                  </div>
                ))}
                {filteredCustomers.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground pt-4">
                    Showing 50 of {filteredCustomers.length} customers
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
