'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Plus } from 'lucide-react';
import { SchedulerData } from './SchedulerFlow';
import { useToast } from '@/hooks/use-toast';

interface LocationStepProps {
  data: SchedulerData;
  updateData: (updates: Partial<SchedulerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LocationStep({ data, updateData, onNext, onBack }: LocationStepProps) {
  const [existingLocations, setExistingLocations] = useState<any[]>([]);
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Austin');
  const [state, setState] = useState('TX');
  const [zipCode, setZipCode] = useState('');
  const [gateCode, setGateCode] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (data.customer?.isExisting && data.customer?.id) {
      fetchExistingLocations();
    } else {
      setShowNewLocationForm(true);
    }
  }, [data.customer]);

  const fetchExistingLocations = async () => {
    if (!data.customer?.phone && !data.customer?.email) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/lookup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.customer.phone,
          email: data.customer.email,
        }),
      });

      const result = await response.json();
      if (result.success && result.locations) {
        setExistingLocations(result.locations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (location: any) => {
    updateData({
      location: {
        id: location.id,
        address: location.address.street,
        city: location.address.city,
        state: location.address.state,
        zipCode: location.address.zip,
        isNew: false,
      },
    });
    onNext();
  };

  const handleCreateLocation = async () => {
    if (!address || !zipCode) {
      toast({
        title: 'Missing Information',
        description: 'Please provide the service address and ZIP code.',
        variant: 'destructive',
      });
      return;
    }

    // For existing customers, create location in ServiceTitan first
    if (data.customer?.id) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/scheduler/create-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: data.customer.id,
            address,
            city,
            state,
            zipCode,
            gateCode: gateCode || undefined,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to create location');
        }

        updateData({
          location: {
            id: result.location.id,
            address,
            city,
            state,
            zipCode,
            gateCode: gateCode || undefined,
            isNew: false, // Location now exists in ServiceTitan
          },
        });
        onNext();
      } catch (error: any) {
        toast({
          title: 'Location Creation Failed',
          description: error.message || 'Unable to create location. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // New customer - save location data, will be created during booking
      updateData({
        location: {
          address,
          city,
          state,
          zipCode,
          gateCode: gateCode || undefined,
          isNew: true,
        },
      });
      onNext();
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-location-title">
          Service Location
        </h2>
        <p className="text-muted-foreground" data-testid="text-location-subtitle">
          Where should we come to help you?
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Existing Locations */}
        {!showNewLocationForm && existingLocations.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Saved Locations</h3>
            {existingLocations.map((location) => (
              <Card
                key={location.id}
                className="cursor-pointer hover-elevate"
                onClick={() => handleSelectLocation(location)}
                data-testid={`card-location-${location.id}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-base">
                        {location.address.street}
                      </CardTitle>
                      <CardDescription>
                        {location.address.city}, {location.address.state} {location.address.zip}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={() => setShowNewLocationForm(true)}
              className="w-full"
              data-testid="button-add-new-location"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Location
            </Button>
          </div>
        )}

        {/* New Location Form */}
        {showNewLocationForm && (
          <Card>
            <CardHeader>
              <CardTitle>Service Address</CardTitle>
              <CardDescription>
                Enter the address where you need plumbing service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-address"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    data-testid="input-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="78701"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    data-testid="input-zip"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateCode">Gate Code (Optional)</Label>
                <Input
                  id="gateCode"
                  placeholder="e.g., #1234"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)}
                  data-testid="input-gate-code"
                />
                <p className="text-xs text-muted-foreground">
                  If you have a gated community or access code, we'll save it for future visits
                </p>
              </div>

              {existingLocations.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowNewLocationForm(false)}
                  className="w-full"
                  data-testid="button-back-to-locations"
                >
                  ← Back to Saved Locations
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {showNewLocationForm && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              data-testid="button-back"
            >
              Back
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={isLoading}
              className="flex-1"
              size="lg"
              data-testid="button-continue-location"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Location...
                </>
              ) : (
                'Continue to Schedule'
              )}
            </Button>
          </div>
        )}

        {!showNewLocationForm && existingLocations.length > 0 && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
            data-testid="button-back"
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
