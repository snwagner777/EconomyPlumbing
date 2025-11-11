/**
 * ConfirmationStep - Booking confirmation
 */

'use client';

interface ConfirmationStepProps {
  onClose: () => void;
}

export function ConfirmationStep({ onClose }: ConfirmationStepProps) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Appointment Confirmed!</h2>
      <p className="text-muted-foreground mb-6">
        Your appointment has been successfully booked.
      </p>
      {/* TODO: Implement confirmation details */}
      <div className="text-center text-muted-foreground">
        Confirmation details coming soon...
      </div>
    </div>
  );
}
