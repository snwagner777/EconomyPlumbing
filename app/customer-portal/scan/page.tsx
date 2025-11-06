import type { Metadata } from 'next';
import { ScanRedemptionClient } from './ScanRedemptionClient';

export const metadata: Metadata = {
  title: 'Redeem Voucher | Economy Plumbing Services',
  description: 'Scan and redeem customer vouchers',
};

export default function ScanPage() {
  return <ScanRedemptionClient />;
}
