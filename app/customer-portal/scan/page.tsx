import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScanRedemptionClient } from './ScanRedemptionClient';

export const metadata: Metadata = {
  title: 'Redeem Voucher | Economy Plumbing Services',
  description: 'Scan and redeem customer vouchers',
};

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ScanRedemptionClient />
    </Suspense>
  );
}
