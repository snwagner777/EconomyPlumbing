/**
 * CustomerInfoStep - Collect customer information for public scheduler flow
 */

'use client';

import { PublicCustomerStrategy } from '../../strategies/CustomerDataStrategy';

interface CustomerInfoStepProps {
  strategy: PublicCustomerStrategy;
  onComplete: (customerId: number, locationId: number) => void;
  onBack: () => void;
}

export function CustomerInfoStep({ strategy, onComplete, onBack }: CustomerInfoStepProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Information</h2>
      <p className="text-muted-foreground mb-6">
        Please provide your contact information to continue.
      </p>
      {/* TODO: Implement customer info form */}
      <div className="text-center text-muted-foreground">
        Customer info form coming soon...
      </div>
    </div>
  );
}
