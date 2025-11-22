'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

export interface ContactMethodFormData {
  type: 'MobilePhone' | 'Phone' | 'Email';
  value: string;
  memo?: string;
}

interface ContactMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContactMethodFormData) => Promise<void>;
  initialData?: ContactMethodFormData;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function ContactMethodFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
  isSubmitting = false,
}: ContactMethodFormDialogProps) {
  const [type, setType] = useState<ContactMethodFormData['type']>(initialData?.type || 'MobilePhone');
  const [value, setValue] = useState(initialData?.value || '');
  const [memo, setMemo] = useState(initialData?.memo || '');

  useEffect(() => {
    if (open) {
      setType(initialData?.type || 'MobilePhone');
      setValue(initialData?.value || '');
      setMemo(initialData?.memo || '');
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) {
      return;
    }

    await onSubmit({
      type,
      value: value.trim(),
      memo: memo.trim() || undefined,
    });

    onOpenChange(false);
  };

  const isEmail = type === 'Email';
  const inputType = isEmail ? 'email' : 'tel';
  const placeholder = isEmail ? 'email@example.com' : '(512) 555-1234';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-contact-method-form">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ContactMethodFormData['type'])}>
                <SelectTrigger id="contact-type" data-testid="select-contact-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MobilePhone">Mobile Phone</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-value">
                {isEmail ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                id="contact-value"
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required
                data-testid="input-contact-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-memo">Note (Optional)</Label>
              <Input
                id="contact-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="e.g., Work, Home, Assistant"
                data-testid="input-contact-memo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !value.trim()}
              data-testid="button-submit"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
