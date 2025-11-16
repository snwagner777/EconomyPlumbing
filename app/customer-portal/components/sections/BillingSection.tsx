/**
 * Billing Section - Invoices and Payment History
 * Split view with Open Balance cards and Paid history list
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, CreditCard, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { formatCurrency } from "../../utils/currency";

interface BillingSectionProps {
  customerData?: any;
  formatDate?: (date: string) => string;
}

export function BillingSection({
  customerData,
  formatDate,
}: BillingSectionProps) {
  const [paidHistoryOpen, setPaidHistoryOpen] = useState(false);

  // Extract invoices from customer data with null safety
  const invoices = (customerData?.invoices || []).filter((inv: any) => inv && inv.id);
  const openInvoices = invoices.filter((inv: any) => 
    inv && (inv.status === 'Open' || (typeof inv.balance === 'number' && inv.balance > 0))
  );
  const paidInvoices = invoices.filter((inv: any) => 
    inv && (inv.status === 'Paid' || inv.balance === 0)
  );

  // Calculate total balance - only sum actual balance due
  const totalBalance = openInvoices.reduce((sum: number, inv: any) => {
    const balance = typeof inv.balance === 'number' ? inv.balance : (inv.total || 0);
    return sum + balance;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Payments</h2>
          <p className="text-muted-foreground">
            Manage your invoices and payment history
          </p>
        </div>
        {totalBalance > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
              {formatCurrency(totalBalance)}
            </p>
          </div>
        )}
      </div>

      {/* Open Invoices Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Open Balance</h3>
        
        {openInvoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  You don't have any outstanding invoices.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openInvoices.map((invoice: any) => (
              <Card key={invoice.id} data-testid={`card-open-invoice-${invoice.id}`} className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Invoice #{invoice.id || invoice.number}</CardTitle>
                      <CardDescription>
                        {formatDate && invoice.date && formatDate(invoice.date)}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Due
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice.summary && (
                      <p className="text-sm text-muted-foreground">{invoice.summary}</p>
                    )}
                    
                    <div className="flex items-baseline justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Balance Due:</span>
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                        {formatCurrency(
                          typeof invoice.balance === 'number' ? invoice.balance : (invoice.total || 0)
                        )}
                      </span>
                    </div>

                    {invoice.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate && formatDate(invoice.dueDate)}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        To pay this invoice, please call us or use your preferred payment method
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Paid Invoices Section - Collapsible */}
      {paidInvoices.length > 0 && (
        <Collapsible
          open={paidHistoryOpen}
          onOpenChange={(open) => setPaidHistoryOpen(open)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-toggle-paid-history">
                {paidHistoryOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show {paidInvoices.length} Paid Invoice{paidInvoices.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-3 mt-4">
            {paidInvoices.map((invoice: any) => (
              <Card key={invoice.id} data-testid={`card-paid-invoice-${invoice.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-950">
                        <Receipt className="w-4 h-4 text-green-700 dark:text-green-300" />
                      </div>
                      <div>
                        <p className="font-medium">Invoice #{invoice.id || invoice.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate && invoice.paidDate && formatDate(invoice.paidDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total || 0)}</p>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Empty State - No Invoices at All */}
      {invoices.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Billing History</h3>
              <p className="text-muted-foreground">
                Your invoices and payment history will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
