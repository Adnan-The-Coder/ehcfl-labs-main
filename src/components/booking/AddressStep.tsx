import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Address } from '@/pages/Booking';
import { checkServiceability } from '@/services/healthiansApi';

interface Props {
  address: Address | null;
  onUpdate: (address: Address) => void;
  onNext: () => void;
  onBack: () => void;
}

const STATES = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
  'Maharashtra', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Gujarat'
];

const AddressStep = ({ address, onUpdate, onNext, onBack }: Props) => {
  const [localAddress, setLocalAddress] = useState<Address>(
    address || { line1: '', line2: '', locality: '', landmark: '', city: '', state: '', pinCode: '' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);

  const updateField = (field: keyof Address, value: string) => {
    setLocalAddress({ ...localAddress, [field]: value });
    setErrors({ ...errors, [field]: '' });
    if (field === 'pinCode') {
      setPinVerified(null);
    }
  };

  const verifyPinCode = async () => {
    const pin = localAddress.pinCode;
    
    try {
      const { isServiceable, message } = await checkServiceability(pin);

      setPinVerified(isServiceable);
      
      if (!isServiceable) {
        setErrors({ ...errors, pinCode: message || 'Service not available in this area' });
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      setPinVerified(false);
      setErrors({ ...errors, pinCode: 'Failed to verify PIN. Please try again.' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!localAddress.line1.trim()) newErrors.line1 = 'Address is required';
    if (!localAddress.locality.trim()) newErrors.locality = 'Locality is required';
    if (!localAddress.city) newErrors.city = 'City is required';
    if (!localAddress.state) newErrors.state = 'State is required';
    if (!/^\d{6}$/.test(localAddress.pinCode)) {
      newErrors.pinCode = 'Valid 6-digit PIN code required';
    } else if (pinVerified !== true) {
      newErrors.pinCode = 'Please verify PIN code serviceability';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(localAddress);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sample Collection Address</h2>
        <p className="text-muted-foreground">Where should we collect the sample?</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="line1">Home Address *</Label>
          <Input
            id="line1"
            value={localAddress.line1}
            onChange={(e) => updateField('line1', e.target.value)}
            placeholder="House/Flat No, Building Name"
            className={errors.line1 ? 'border-destructive' : ''}
          />
          {errors.line1 && <p className="text-xs text-destructive mt-1">{errors.line1}</p>}
        </div>

        <div>
          <Label htmlFor="line2">Address Line 2</Label>
          <Input
            id="line2"
            value={localAddress.line2}
            onChange={(e) => updateField('line2', e.target.value)}
            placeholder="Street, Area"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="locality">Locality *</Label>
            <Input
              id="locality"
              value={localAddress.locality}
              onChange={(e) => updateField('locality', e.target.value)}
              placeholder="Enter locality"
              className={errors.locality ? 'border-destructive' : ''}
            />
            {errors.locality && <p className="text-xs text-destructive mt-1">{errors.locality}</p>}
          </div>

          <div>
            <Label htmlFor="landmark">Landmark</Label>
            <Input
              id="landmark"
              value={localAddress.landmark}
              onChange={(e) => updateField('landmark', e.target.value)}
              placeholder="Nearby landmark"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={localAddress.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Enter city"
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Select value={localAddress.state} onValueChange={(value) => updateField('state', value)}>
              <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="pinCode">PIN Code *</Label>
          <div className="flex gap-2">
            <Input
              id="pinCode"
              value={localAddress.pinCode}
              onChange={(e) => updateField('pinCode', e.target.value)}
              placeholder="6-digit PIN code"
              maxLength={6}
              className={errors.pinCode ? 'border-destructive' : ''}
            />
            <Button
              variant="outline"
              onClick={verifyPinCode}
              disabled={localAddress.pinCode.length !== 6}
            >
              Verify
            </Button>
          </div>
          {pinVerified === true && (
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" />
              Home collection available in this area
            </p>
          )}
          {pinVerified === false && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <XCircle className="w-4 h-4" />
              Service not available in this area
            </p>
          )}
          {errors.pinCode && <p className="text-xs text-destructive mt-1">{errors.pinCode}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AddressStep;
